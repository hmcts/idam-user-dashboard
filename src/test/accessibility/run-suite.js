const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const reportRoot = path.resolve(process.cwd(), 'functional-output/accessibility');
const resultsDir = path.join(reportRoot, 'axe-results');
const summaryPath = path.join(reportRoot, 'results.json');
const reportPath = path.join(reportRoot, 'index.html');

function resetArtifacts() {
  fs.rmSync(reportRoot, { recursive: true, force: true });
}

function run(command, args, extraEnv = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

function replayOutput(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hasAxeResults() {
  return fs.existsSync(resultsDir) && fs.readdirSync(resultsDir).some(file => file.endsWith('.json'));
}

function writeFallbackReport(output) {
  fs.mkdirSync(reportRoot, { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalPages: 0,
    totals: {
      violations: 0,
      incomplete: 0,
      passes: 0,
      inapplicable: 0,
    },
    pages: [],
    failure: 'Accessibility tests failed before Axe results were generated',
  }, null, 2));
  fs.writeFileSync(reportPath, [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <title>IDAM User Dashboard Accessibility</title>',
    '  <style>',
    '    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; }',
    '    pre { white-space: pre-wrap; background: #f4f4f4; padding: 1rem; border-radius: 4px; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>IDAM User Dashboard Accessibility</h1>',
    '  <p>The accessibility suite failed before Axe results were generated. The captured Playwright output is shown below.</p>',
    '  <pre>',
    escapeHtml(output || 'No output captured.'),
    '  </pre>',
    '</body>',
    '</html>',
  ].join('\n'));
}

function main() {
  resetArtifacts();

  const playwright = run(
    process.execPath,
    ['./node_modules/playwright/cli.js', 'test', '--config=playwright.accessibility.config.ts'],
    { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
  );
  replayOutput(playwright);

  if (!hasAxeResults()) {
    writeFallbackReport([playwright.stdout, playwright.stderr].filter(Boolean).join('\n'));
    process.exit(playwright.status === null ? 1 : playwright.status);
  }

  const report = run(process.execPath, ['./src/test/accessibility/generate-report.js']);
  replayOutput(report);
  if (report.status && report.status !== 0) {
    process.exit(report.status);
  }

  process.exit(playwright.status === null ? 1 : playwright.status);
}

main();
