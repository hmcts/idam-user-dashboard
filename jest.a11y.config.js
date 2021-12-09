module.exports = {
  roots: ['<rootDir>/src/test/a11y'],
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
    ["./test-output/pa11y/reports", {
      "pageTitle": "Accessibility Test Report",
      "outputPath": "./test-output/functional/test-report.html",
      "includeFailureMsg": true
    }]
  ]
}

