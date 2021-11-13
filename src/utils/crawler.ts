import { fdir, PathsOutput } from 'fdir';
import { inject, injectable } from 'inversify';
import TYPES from '../types';
import { ISourceHelper } from './source-helper';
import { readFile } from 'fs-extra';

export interface ICrawler {
  getDockerfiles(): Promise<{ path: string; content: string }[]>;
}

@injectable()
export class Crawler implements ICrawler {
  private readonly sourceHelper: ISourceHelper;
  private static readonly dockerfileMatches = [
    '(^|/|\\.)Dockerfile$',
    '(^|/)Dockerfile\\.[^/]*$',
  ];

  constructor(@inject(TYPES.ISourceHelper) sourceHelper: ISourceHelper) {
    this.sourceHelper = sourceHelper;
  }

  async getDockerfiles(): Promise<{ path: string; content: string }[]> {
    const root = this.sourceHelper.getSourcePath();

    const files = (await new fdir()
      .withFullPaths()
      .crawl(root)
      .withPromise()) as PathsOutput;

    let dockerFilePaths: string[] = [];

    for (const match of Crawler.dockerfileMatches) {
      dockerFilePaths = dockerFilePaths.concat(
        files.filter((file) => new RegExp(match).test(file))
      );
    }

    return Promise.all(
      dockerFilePaths.map(async (dockerFilePath: string) => ({
        path: dockerFilePath,
        content: await readFile(dockerFilePath, { encoding: 'utf8' }),
      }))
    );
  }
}
