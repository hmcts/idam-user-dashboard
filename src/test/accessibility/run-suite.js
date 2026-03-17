const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const reportRoot = path.resolve(process.cwd(), 'functional-output/accessibility');
const resultsDir = path.join(reportRoot, 'axe-results');
const summaryPath = path.join(reportRoot, 'results.json');
const reportPath = path.join(reportRoot, 'index.html');

function resetArtifacts() {
  fs.rmSync(resultsDir, { recursive: true, force: true });
  fs.rmSync(summaryPath, { force: true });
  fs.rmSync(reportPath, { force: true });
}

function run(command, args, extraEnv = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
}

function main() {
  resetArtifacts();

  const playwright = run(
    process.execPath,
    ['./node_modules/playwright/cli.js', 'test', '--config=playwright.accessibility.config.ts'],
    { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
  );

  const report = run(process.execPath, ['./src/test/accessibility/generate-report.js']);

  if (report.status && report.status !== 0) {
    process.exit(report.status);
  }

  process.exit(playwright.status === null ? 1 : playwright.status);
}

main();
