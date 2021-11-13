import * as tl from 'azure-pipelines-task-lib';
import { injectable } from 'inversify';

export interface ISourceHelper {
  getSourcePath(): string;
}

@injectable()
export class SourceHelper implements ISourceHelper {
  private readonly defaultWorkingDirectory = 'System.DefaultWorkingDirectory';

  constructor() {}

  public getSourcePath() {
    // let sourcePath = tl.getVariable(this.defaultWorkingDirectory);

    let sourcePath = '/home/jamie/work/docker-lint-task';
    return sourcePath;
  }
}
