import 'reflect-metadata';
import { Container } from 'inversify';
import TYPES from './types';
import { IRule } from './rules/rule';
import { RegistryRule } from './rules/registry';
import { Crawler, ICrawler } from './utils/crawler';
import { ISourceHelper, SourceHelper } from './utils/source-helper';
import { IRunner, Runner } from './runner';

const container = new Container();
container.bind<IRunner>(TYPES.IRunner).to(Runner);
container.bind<IRule>(TYPES.IRule).to(RegistryRule);
container.bind<ICrawler>(TYPES.ICrawler).to(Crawler);
container.bind<ISourceHelper>(TYPES.ISourceHelper).to(SourceHelper);

export { container };
