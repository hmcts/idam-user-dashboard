import { Logger } from '@hmcts/nodejs-logging';

export const mockLogger = (): Logger => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return logger as any;
};
