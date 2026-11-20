const { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } = require('fs');
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
  return existsSync(resultsDir) && readdirSync(resultsDir, { withFileTypes: true })
    .some(file => file.isFile() && file.name.endsWith('-result.json'));
}

function run(name, args) {
  const result = spawnSync(getBin(name), args, { encoding: 'utf8' });
  const diagnostics = [];

  if (result.error) {
    const code = result.error.code ? ` (${result.error.code})` : '';
    diagnostics.push(`${name} process error${code}: ${result.error.message}`);
  }
  if (result.signal) {
    diagnostics.push(`${name} was terminated by signal ${result.signal}.`);
  }
  if (result.status === null && !result.error && !result.signal) {
    diagnostics.push(`${name} ended without an exit status.`);
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (diagnostics.length) {
    process.stderr.write(`${diagnostics.join('\n')}\n`);
  }

  return {
    ...result,
    output: [result.stdout, result.stderr, ...diagnostics].filter(Boolean).join('\n'),
  };
}

function exitCode(result) {
  return result.error || result.signal || result.status === null ? 1 : result.status;
}

function writeFallbackReport(reportDir, title, output, reason) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    path.join(reportDir, 'index.html'),
    [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      `  <title>${escapeHtml(title)}</title>`,
      '  <style>',
      '    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; }',
      '    pre { white-space: pre-wrap; background: #f4f4f4; padding: 1rem; border-radius: 4px; }',
      '  </style>',
      '</head>',
      '<body>',
      `  <h1>${escapeHtml(title)}</h1>`,
      `  <p>${escapeHtml(reason)}</p>`,
      '  <pre>',
      escapeHtml(output || 'No output captured.'),
      '  </pre>',
      '</body>',
      '</html>',
    ].join('\n'),
  );
  writeFileSync(path.join(reportDir, 'startup-failure.txt'), output || 'No output captured.');
}

function main(args = process.argv.slice(2)) {
  const [configPath, resultsDir, reportDir, reportTitle] = args;

  if (!configPath || !resultsDir || !reportDir || !reportTitle) {
    throw new Error('Usage: node run-with-allure.js <configPath> <resultsDir> <reportDir> <reportTitle>');
  }

  const resolvedResultsDir = path.resolve(process.cwd(), resultsDir);
  const resolvedReportDir = path.resolve(process.cwd(), reportDir);

  rmSync(resolvedResultsDir, { recursive: true, force: true });
  rmSync(resolvedReportDir, { recursive: true, force: true });

  const playwright = run('playwright', ['test', '--config', configPath]);

  if (playwright.error || playwright.signal || playwright.status === null) {
    writeFallbackReport(
      resolvedReportDir,
      reportTitle,
      playwright.output,
      'Playwright did not finish. Results from this run may be incomplete. The captured process output is shown below.',
    );
    return exitCode(playwright);
  }

  if (!hasResultFiles(resolvedResultsDir)) {
    writeFallbackReport(
      resolvedReportDir,
      reportTitle,
      playwright.output,
      'Playwright produced no Allure test result files. This usually means suite startup or global setup failed before any tests began.',
    );
    return exitCode(playwright) || 1;
  }

  const allure = run('allure', ['generate', resultsDir, '-c', '-o', reportDir]);
  if (exitCode(allure) !== 0) {
    writeFallbackReport(
      resolvedReportDir,
      reportTitle,
      [playwright.output, allure.output].filter(Boolean).join('\n'),
      'Allure report generation failed. The captured Playwright and Allure output is shown below.',
    );
  }

  return exitCode(playwright) || exitCode(allure);
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main };
