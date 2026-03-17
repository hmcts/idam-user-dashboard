const fs = require('fs');
const path = require('path');
const { createHtmlReport } = require('axe-html-reporter');

const reportRoot = path.resolve(process.cwd(), 'functional-output/accessibility');
const resultsDir = path.join(reportRoot, 'axe-results');
const summaryPath = path.join(reportRoot, 'results.json');

const emptyResults = {
  violations: [],
  passes: [],
  incomplete: [],
  inapplicable: [],
  url: 'No accessibility results generated',
};

function readResults() {
  if (!fs.existsSync(resultsDir)) {
    return [];
  }

  return fs.readdirSync(resultsDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8')));
}

function mergeResults(entries) {
  return entries.reduce((combined, entry) => {
    const { results } = entry;
    combined.violations.push(...(results.violations || []));
    combined.passes.push(...(results.passes || []));
    combined.incomplete.push(...(results.incomplete || []));
    combined.inapplicable.push(...(results.inapplicable || []));
    return combined;
  }, {
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: [],
    url: 'Multiple accessibility test pages',
  });
}

function buildSummary(entries) {
  if (!entries.length) {
    return '<p>No axe results were captured for this run.</p>';
  }

  const rows = entries.map(entry => {
    const violations = entry.results?.violations?.length || 0;
    const incomplete = entry.results?.incomplete?.length || 0;
    const passes = entry.results?.passes?.length || 0;
    return `<tr><td>${entry.testName}</td><td>${entry.location}</td><td>${violations}</td><td>${incomplete}</td><td>${passes}</td></tr>`;
  }).join('');

  return [
    '<p>Aggregated axe report for the Playwright accessibility suite.</p>',
    '<table style="border-collapse: collapse; width: 100%;">',
    '<thead><tr><th style="text-align:left;">Test</th><th style="text-align:left;">Page</th><th>Violations</th><th>Incomplete</th><th>Passes</th></tr></thead>',
    `<tbody>${rows}</tbody>`,
    '</table>',
  ].join('');
}

function main() {
  fs.mkdirSync(reportRoot, { recursive: true });

  const entries = readResults();
  const mergedResults = entries.length ? mergeResults(entries) : emptyResults;
  const reportSummary = {
    generatedAt: new Date().toISOString(),
    totalPages: entries.length,
    totals: {
      violations: mergedResults.violations.length,
      incomplete: mergedResults.incomplete.length,
      passes: mergedResults.passes.length,
      inapplicable: mergedResults.inapplicable.length,
    },
    pages: entries,
  };

  fs.writeFileSync(summaryPath, JSON.stringify(reportSummary, null, 2));

  createHtmlReport({
    results: mergedResults,
    options: {
      outputDirPath: reportRoot,
      reportFileName: 'index.html',
      projectKey: 'IDAM User Dashboard Accessibility',
      customSummary: buildSummary(entries),
    },
  });
}

main();
