const { existsSync, mkdirSync, readdirSync, writeFileSync } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getBin(name) {
  return path.resolve(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? `${name}.cmd` : name,
  );
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hasResultFiles(resultsDir) {
  return existsSync(resultsDir) && readdirSync(resultsDir).some(file => !file.startsWith('.'));
}

function writeFallbackReport(reportDir, title, output) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    path.join(reportDir, 'index.html'),
    [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      `  <title>${title}</title>`,
      '  <style>',
      '    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; }',
      '    pre { white-space: pre-wrap; background: #f4f4f4; padding: 1rem; border-radius: 4px; }',
      '  </style>',
      '</head>',
      '<body>',
      `  <h1>${title}</h1>`,
      '  <p>Playwright failed before Allure result files were produced. This usually means suite startup or global setup failed before any tests began.</p>',
      '  <pre>',
      escapeHtml(output || 'No output captured.'),
      '  </pre>',
      '</body>',
      '</html>',
    ].join('\n'),
  );
  writeFileSync(path.join(reportDir, 'startup-failure.txt'), output || 'No output captured.');
}

function main() {
  const [configPath, resultsDir, reportDir, reportTitle] = process.argv.slice(2);

  if (!configPath || !resultsDir || !reportDir || !reportTitle) {
    throw new Error('Usage: node run-with-allure.js <configPath> <resultsDir> <reportDir> <reportTitle>');
  }

  const playwright = spawnSync(
    getBin('playwright'),
    ['test', '--config', configPath],
    { encoding: 'utf8' },
  );

  if (playwright.stdout) {
    process.stdout.write(playwright.stdout);
  }
  if (playwright.stderr) {
    process.stderr.write(playwright.stderr);
  }

  const combinedOutput = [playwright.stdout, playwright.stderr].filter(Boolean).join('\n');
  const resolvedResultsDir = path.resolve(process.cwd(), resultsDir);
  const resolvedReportDir = path.resolve(process.cwd(), reportDir);

  if (hasResultFiles(resolvedResultsDir)) {
    const allure = spawnSync(
      getBin('allure'),
      ['generate', resultsDir, '-c', '-o', reportDir],
      { encoding: 'utf8' },
    );

    if (allure.stdout) {
      process.stdout.write(allure.stdout);
    }
    if (allure.stderr) {
      process.stderr.write(allure.stderr);
    }

    if (allure.status !== 0) {
      process.exit(allure.status || 1);
    }
  } else {
    writeFallbackReport(resolvedReportDir, reportTitle, combinedOutput);
  }

  process.exit(playwright.status || 0);
}

main();
