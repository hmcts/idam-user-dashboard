'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')

const {
  affectedDirectDependencies,
  classifyKnownIssues,
  parseArguments,
  recommendationFor,
  resolutionKeysForPackage,
} = require('./check-vulnerabilities.cjs')

function finding(packageName, id, versions = ['1.0.0']) {
  return {
    value: packageName,
    children: {
      ID: id,
      Issue: `Issue ${id}`,
      Severity: 'high',
      'Tree Versions': versions,
    },
  }
}

test('parses focused and JSON command-line options', () => {
  assert.deepEqual(
    parseArguments(['--json', '--only', 'tar', '--explain', 'glob']),
    {
      explain: true,
      json: true,
      only: ['tar', 'glob'],
      production: true,
    }
  )
})

test('classifies current, known, new, and resolved findings', () => {
  const known = finding('glob', 1)
  const resolved = finding('old-package', 2)
  const added = finding('new-package', 3)
  const result = classifyKnownIssues(
    [known, added],
    [known, resolved]
  )

  assert.deepEqual(
    result.current.map(item => [item.finding.value, item.status]),
    [['glob', 'known'], ['new-package', 'new']]
  )
  assert.deepEqual(result.resolvedKnown, [resolved])
})

test('finds declared parents only for affected package versions', () => {
  const why = JSON.stringify({
    value: 'app@workspace:.',
    children: {
      'jest@npm:30.4.2': {
        value: {locator: 'jest@npm:30.4.2'},
        children: {
          'glob@npm:10.5.0': {
            value: {locator: 'glob@npm:10.5.0'},
            children: {},
          },
        },
      },
      'other@npm:1.0.0': {
        value: {locator: 'other@npm:1.0.0'},
        children: {
          'glob@npm:11.1.0': {
            value: {locator: 'glob@npm:11.1.0'},
            children: {},
          },
        },
      },
    },
  })

  assert.deepEqual(
    affectedDirectDependencies(
      why,
      {devDependencies: {jest: '^30.4.2', other: '^1.0.0'}},
      finding('glob', 1, ['10.5.0'])
    ),
    {
      direct: false,
      parents: ['jest'],
    }
  )
})

test('matches descriptor-qualified resolution keys', () => {
  assert.deepEqual(
    resolutionKeysForPackage({
      resolutions: {
        'picomatch@npm:^4.0.2': '4.0.4',
        tar: '7.5.22',
      },
    }, 'picomatch'),
    ['picomatch@npm:^4.0.2']
  )
})

test('prefers resolution recommendations over dependency guesses', () => {
  assert.deepEqual(
    recommendationFor({
      dependencyUpgrade: null,
      direct: false,
      parents: ['parent'],
      resolutionResults: [{classification: 'update-resolution'}],
    }),
    {
      action: 'update-resolution',
      source: 'resolution',
    }
  )
})

test('recommends a parent upgrade only when simulation fixes the issue', () => {
  assert.deepEqual(
    recommendationFor({
      dependencyUpgrade: {fixes: true},
      direct: false,
      parents: ['parent'],
      resolutionResults: [],
    }),
    {
      action: 'upgrade-parent',
      source: 'dependency',
    }
  )
})
