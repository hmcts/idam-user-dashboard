const {Logger} = require('@hmcts/nodejs-logging');

export const mockLogger = () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return logger as typeof Logger;
};