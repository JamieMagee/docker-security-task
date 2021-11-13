import { inject, injectable, multiInject } from 'inversify';
import { IRule } from './rules/rule';
import TYPES from './types';
import { ICrawler } from './utils/crawler';
import log from './utils/logger';

export interface IRunner {
  run(): Promise<void>;
}

@injectable()
export class Runner implements IRunner {
  private readonly crawler: ICrawler;
  private readonly rules: IRule[];

  constructor(
    @inject(TYPES.ICrawler) crawler: ICrawler,
    @multiInject(TYPES.IRule) rules: IRule[]
  ) {
    this.crawler = crawler;
    this.rules = rules;
  }

  public async run(): Promise<void> {
    const dockerfiles = await this.crawler.getDockerfiles();
    for (const { content, path } of dockerfiles) {
      log.info(`scanning ${path}`);
      for (const rule of this.rules) {
        await rule.run(content);
      }
    }
  }
}
