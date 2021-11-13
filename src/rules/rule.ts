import { injectable } from 'inversify';

export interface IRule {
  run(content: string): Promise<void>;
}

@injectable()
export abstract class Rule implements IRule {
  protected static readonly variableMarker = '$';
  protected static readonly variableOpen = '${';
  protected static readonly variableClose = '}';
  protected static readonly variableDefaultValueSplit = ':-';
  constructor() {}

  abstract run(content: string): Promise<void>;
}
