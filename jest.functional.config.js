// TO BE REMOVED
module.exports = {
  roots: ['<rootDir>/src/test/functional'],
  "testRegex": "(/src/test/.*|\\.(test|spec))\\.(ts|js)$",
  "moduleFileExtensions": [
    "ts",
    "js"
  ],
  "testEnvironment": "node",
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
