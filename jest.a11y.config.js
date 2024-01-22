module.exports = {
  roots: ['<rootDir>/src/test/a11y/'],
  testRegex: 'a11y.ts',
  testTimeout: 60000,
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
