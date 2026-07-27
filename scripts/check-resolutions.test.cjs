'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')

const {
  assessNaturalVersions,
  auditFindings,
  changedDeclaredDependencies,
  directParentsFromWhy,
  latestVersionFromInfo,
  newFindings,
  packageNameFromLocator,
  packageNameFromResolutionKey,
  parseComparableVersion,
  parseArguments,
  selectResolutionKeys,
  shouldTryResolutionUpdate,
  versionsFromWhy,
} = require('./check-resolutions.cjs')

test('extracts package names from Yarn resolution selectors', () => {
  assert.equal(packageNameFromResolutionKey('tar'), 'tar')
  assert.equal(packageNameFromResolutionKey('picomatch@npm:^4.0.2'), 'picomatch')
  assert.equal(packageNameFromResolutionKey('@types/express'), '@types/express')
  assert.equal(
    packageNameFromResolutionKey('@babel/core@npm:^7.0.0'),
    '@babel/core'
  )
  assert.equal(packageNameFromResolutionKey('webpack/memory-fs'), 'memory-fs')
})

test('extracts package names from regular and virtual locators', () => {
  assert.equal(packageNameFromLocator('tar@npm:7.5.19'), 'tar')
  assert.equal(
    packageNameFromLocator('@hmcts/info-provider@virtual:abc#npm:1.4.0'),
    '@hmcts/info-provider'
  )
})

test('parses command-line options', () => {
  assert.deepEqual(
    parseArguments([
      '--json',
      '--only',
      'tar',
      '--only',
      'js-yaml',
      '--all-environments',
      '--fail-on-changes',
    ]),
    {
      failOnChanges: true,
      json: true,
      only: ['tar', 'js-yaml'],
      production: false,
    }
  )
})

test('filters Yarn audit NDJSON to vulnerability findings', () => {
  const output = [
    JSON.stringify({
      value: 'tar',
      children: {
        Issue: 'A vulnerability',
        Severity: 'high',
      },
    }),
    JSON.stringify({
      type: 'info',
      data: 'unrelated output',
    }),
  ].join('\n')

  assert.deepEqual(auditFindings(output).map(finding => finding.value), ['tar'])
})

test('detects advisories introduced by a candidate graph', () => {
  const existing = {
    value: 'tar',
    children: {
      ID: 1,
      Issue: 'Existing vulnerability',
    },
  }
  const introduced = {
    value: 'other-package',
    children: {
      ID: 2,
      Issue: 'Introduced vulnerability',
    },
  }

  assert.deepEqual(newFindings([existing], [existing, introduced]), [introduced])
})

test('rechecks an override when its installed version is vulnerable', () => {
  const vulnerableOverride = {
    value: 'js-yaml',
    children: {
      ID: 1,
      Issue: 'Existing vulnerability',
    },
  }

  assert.equal(
    shouldTryResolutionUpdate('js-yaml', [vulnerableOverride], []),
    true
  )
  assert.equal(shouldTryResolutionUpdate('js-yaml', [], []), false)
})

test('finds direct declared parents and natural package versions', () => {
  const why = JSON.stringify({
    value: 'app@workspace:.',
    children: {
      'parent@npm:2.0.0': {
        value: {
          locator: 'parent@npm:2.0.0',
          descriptor: 'parent@npm:^1.0.0',
        },
        children: {
          'target@npm:3.1.0': {
            value: {
              locator: 'target@npm:3.1.0',
              descriptor: 'target@npm:^3.0.0',
            },
            children: {},
          },
        },
      },
      'undeclared@npm:1.0.0': {
        value: {
          locator: 'undeclared@npm:1.0.0',
        },
        children: {},
      },
    },
  })

  assert.deepEqual(
    directParentsFromWhy(why, {dependencies: {parent: '^1.0.0'}}),
    ['parent']
  )
  assert.deepEqual(versionsFromWhy(why, 'target'), ['3.1.0'])
})

test('extracts the latest version from Yarn npm info output', () => {
  assert.equal(
    latestVersionFromInfo(JSON.stringify({name: 'tar', version: '7.5.21'})),
    '7.5.21'
  )
})

test('extracts a comparable version floor from common resolution ranges', () => {
  assert.equal(parseComparableVersion('^5.2.3').version, '5.2.3')
  assert.equal(parseComparableVersion('>=2.2.11').version, '2.2.11')
  assert.equal(parseComparableVersion('npm:7.5.22').version, '7.5.22')
})

test('rejects major, minor, and patch downgrades', () => {
  for (const naturalVersion of ['4.12.5', '5.1.9', '5.2.2']) {
    const assessment = assessNaturalVersions('^5.2.3', [naturalVersion])
    assert.equal(assessment.acceptable, false)
    assert.deepEqual(assessment.lowerVersions, [naturalVersion])
  }
})

test('rejects removal when any natural version is below the floor', () => {
  assert.deepEqual(
    assessNaturalVersions('^5.2.3', ['5.2.3', '4.12.5']).lowerVersions,
    ['4.12.5']
  )
})

test('accepts equal, newer, or absent natural versions', () => {
  assert.equal(assessNaturalVersions('^5.2.3', ['5.2.3']).acceptable, true)
  assert.equal(assessNaturalVersions('^5.2.3', ['6.0.0']).acceptable, true)
  assert.equal(assessNaturalVersions('^5.2.3', []).acceptable, true)
})

test('handles unparseable versions conservatively', () => {
  assert.equal(
    assessNaturalVersions('workspace:*', ['5.2.3']).acceptable,
    false
  )
  assert.equal(
    assessNaturalVersions('^5.2.3', ['unknown']).acceptable,
    false
  )
})

test('reports changed direct dependency declarations', () => {
  assert.deepEqual(
    changedDeclaredDependencies(
      {dependencies: {parent: '^1.0.0'}},
      {dependencies: {parent: '^2.0.0'}}
    ),
    [{
      field: 'dependencies',
      from: '^1.0.0',
      name: 'parent',
      to: '^2.0.0',
    }]
  )
})

test('selects resolutions by key or resolved package name', () => {
  const resolutions = {
    'picomatch@npm:^4.0.2': '4.0.4',
    tar: '7.5.19',
  }

  assert.deepEqual(selectResolutionKeys(resolutions, ['tar']), ['tar'])
  assert.deepEqual(
    selectResolutionKeys(resolutions, ['picomatch']),
    ['picomatch@npm:^4.0.2']
  )
  assert.throws(
    () => selectResolutionKeys(resolutions, ['missing']),
    /Unknown resolution: missing/u
  )
})
