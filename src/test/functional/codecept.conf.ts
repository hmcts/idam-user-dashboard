import { config as testConfig } from '../config';

export const config: CodeceptJS.Config = {
  name: 'functional',
  tests: './*-test.ts',
  output: '../../../functional-output/functional/reports', // Directory for reports
  helpers: testConfig.helpers,
  timeout: 59000,
  include: {
    I: './custom-steps.ts',
  },
  mocha: {
    reporterOptions: {
      'codeceptjs-cli-reporter': {
        stdout: '-',
        options: {
          verbose: true,
          steps: true, // Display step-by-step test execution in the console
        },
      },
      'mochawesome': {
        stdout: '../../../functional-output/functional/mochawesome.log', // Log file for Mochawesome
        options: {
          reportDir: '../../../functional-output/functional', // Directory for reports
          reportFilename: 'functional-test-results', // Report filename (without extension)
          inlineAssets: true, // Embed CSS/JS directly into the report for portability
          reportTitle: 'Functional Test Report', // Custom title for the report
        },
      },
    },
  },
  plugins: testConfig.plugins,
};
