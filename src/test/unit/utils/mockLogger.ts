export const mockLogger = (): any => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return logger as any;
};
