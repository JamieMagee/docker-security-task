import log from '../utils/logger';
import * as tl from 'azure-pipelines-task-lib';
import { Rule } from './rule';
import matchAll from 'string.prototype.matchall';
import { injectable } from 'inversify';
import { DockerImage, SkipReason } from './common';

const allowedRegistries = [/^mcr\.microsoft\.com/, /^\w+\.azurecr.io/];

@injectable()
export class RegistryRule extends Rule {
  private static readonly fromRegex =
    /^[ \t]*FROM(?:\\\r?\n| |\t|#.*?\r?\n|[ \t]--[a-z]+=\S+?)*[ \t](?<image>\S+)(?:(?:\\\r?\n| |\t|#.*\r?\n)+as[ \t]+(?<name>\S+))?/gim;
  private static readonly copyRegex =
    /^[ \t]*COPY(?:\\\r?\n| |\t|#.*\r?\n|[ \t]--[a-z]+=\w+?)*[ \t]--from=(?<image>\S+)/gim;

  constructor() {
    super();
  }

  async run(content: string): Promise<void> {
    const { images: fromImages, stageNames } = this.getFrom(content);
    const copyImages = this.getCopy(content, stageNames);

    for (const image of [...fromImages, ...copyImages]) {
      const match = allowedRegistries.find((registry: RegExp) =>
        registry.test(image.name)
      );

      if (match === undefined) {
        log.error(`unsupported registry: ${image.name}`);
        tl.setResult(tl.TaskResult.Failed, '');
      }
    }
  }

  private getFrom(content: string): {
    images: DockerImage[];
    stageNames: string[];
  } {
    const images: DockerImage[] = [];
    const stageNames: string[] = [];

    const fromMatches = matchAll(content, RegistryRule.fromRegex);

    for (const fromMatch of fromMatches) {
      if (fromMatch.groups.name) {
        log.debug('Found a multistage build stage name');
        stageNames.push(fromMatch.groups.name);
      }
      if (fromMatch.groups.image === 'scratch') {
        log.debug('Skipping scratch');
      } else if (stageNames.includes(fromMatch.groups.image)) {
        log.debug('Skipping alias FROM', { image: fromMatch.groups.image });
      } else {
        const image = this.splitImageParts(fromMatch.groups.image);
        log.debug(image);
        images.push(image);
      }
    }
    return {
      images,
      stageNames,
    };
  }

  private getCopy(content: string, stageNames: string[]): DockerImage[] {
    const images: DockerImage[] = [];

    const copyMatches = matchAll(content, RegistryRule.copyRegex);

    for (const copyFromMatch of copyMatches) {
      if (stageNames.includes(copyFromMatch.groups.image)) {
        log.debug(
          { image: copyFromMatch.groups.image },
          'Skipping alias COPY --from'
        );
      } else if (Number.isNaN(Number(copyFromMatch.groups.image))) {
        const image = this.splitImageParts(copyFromMatch.groups.image);
        log.debug('Dockerfile COPY --from', { dep: image });
        images.push(image);
      } else {
        log.debug('Skipping index reference COPY --from', {
          image: copyFromMatch.groups.image,
        });
      }
    }

    return images;
  }

  private splitImageParts(currentFrom: string): DockerImage {
    // Check if we have a variable in format of "${VARIABLE:-<image>:<defaultVal>@<digest>}"
    // If so, remove everything except the image, defaultVal and digest.
    let isVariable = false;
    let cleanedCurrentFrom: string = currentFrom;
    if (
      currentFrom.startsWith(Rule.variableOpen) &&
      currentFrom.endsWith(Rule.variableClose)
    ) {
      isVariable = true;

      // If the variable contains exactly one $ and has the default value, we consider it as a valid dependency;
      // otherwise skip it.
      if (
        currentFrom.split('$').length !== 2 ||
        currentFrom.indexOf(Rule.variableDefaultValueSplit) === -1
      ) {
        return {
          skipReason: SkipReason.ContainsVariable,
        };
        return;
      }

      cleanedCurrentFrom = currentFrom.substr(
        Rule.variableOpen.length,
        currentFrom.length - (Rule.variableClose.length + 2)
      );
      cleanedCurrentFrom = cleanedCurrentFrom.substr(
        cleanedCurrentFrom.indexOf(Rule.variableDefaultValueSplit) +
          Rule.variableDefaultValueSplit.length
      );
    }

    const [currentDepTag, digest] = cleanedCurrentFrom.split('@');
    const depTagSplit = currentDepTag.split(':');
    let name: string;
    let value: string;
    if (
      depTagSplit.length === 1 ||
      depTagSplit[depTagSplit.length - 1].includes('/')
    ) {
      name = currentDepTag;
    } else {
      value = depTagSplit.pop();
      name = depTagSplit.join(':');
    }

    if (value && value.indexOf(Rule.variableMarker) !== -1) {
      // If tag contains a variable, e.g. "5.0${VERSION_SUFFIX}", we do not support this.
      return {
        skipReason: SkipReason.ContainsVariable,
      };
    }

    if (isVariable) {
      // If we have the variable and it contains the default value, we need to return
      // it as a valid dependency.

      const dep = {
        name,
        currentValue: value,
        currentDigest: digest,
        replaceString: cleanedCurrentFrom,
      };

      if (!dep.currentValue) {
        delete dep.currentValue;
      }

      if (!dep.currentDigest) {
        delete dep.currentDigest;
      }

      return dep;
    }

    return {
      name,
      value,
      digest,
    };
  }
}
