module.exports = {
  roots: ['<rootDir>/src/test/unit/test'],
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
  "reporters": [
    "default",
    ["jest-html-reporter", {
      "pageTitle": "Unit Test Report",
      "outputPath": "./test-output/unit/test-report.html",
      "includeFailureMsg": true
    }]
  ]
}
