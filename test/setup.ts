import * as _tl from 'azure-pipelines-task-lib';
import { mocked } from './utils';

jest.mock('azure-pipelines-task-lib');
jest.mock('../src/utils/logger');

const tl = mocked(_tl);

beforeAll(() => {
  jest.spyOn(tl, 'error');
});

afterAll(() => {
  jest.clearAllMocks();
});
