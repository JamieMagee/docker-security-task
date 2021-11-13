import * as tl from 'azure-pipelines-task-lib';
import { RegistryRule } from '../../src/rules/registry';

const rule = new RegistryRule();

describe('rules/registry', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('handles no FROM', async () => {
    await rule.run('');
    expect(tl.error).toBeCalledTimes(0);
  });
  it('handles Docker Hub', async () => {
    await rule.run('FROM node:latest');
    expect(tl.error).toBeCalledTimes(1);
  });
  it('handles mcr', async () => {
    await rule.run('FROM mcr.microsoft.com/dotnet/sdk:5.0');
    expect(tl.error).toBeCalledTimes(0);
  });
});
