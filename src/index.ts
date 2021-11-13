import { container } from './inversify.config';
import { IRunner } from './runner';
import TYPES from './types';

(async (): Promise<void> => {
  const runner = container.get<IRunner>(TYPES.IRunner);
  await runner.run();
})();
