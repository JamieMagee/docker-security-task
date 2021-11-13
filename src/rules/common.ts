export type DockerImage = {
  name?: string;
  value?: string;
  digest?: string;
  skipReason?: SkipReason;
};

export enum SkipReason {
  ContainsVariable = 'contains-variable',
}
