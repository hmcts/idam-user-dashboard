#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')

const {
  auditFindings,
  auditScenario,
  changedDeclaredDependencies,
  checkResolution,
  createScenario,
  findingIdentity,
  locateYarn,
  newFindings,
  packageNameFromLocator,
  packageNameFromResolutionKey,
  parseJsonLines,
  runYarn,
} = require('./check-resolutions.cjs')

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
]

function parseArguments(argv) {
  const options = {
    explain: false,
    json: false,
    only: [],
    production: true,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--json') {
      options.json = true
    } else if (argument === '--all-environments') {
      options.production = false
    } else if (argument === '--only' || argument === '--explain') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error(`${argument} requires a package name`)
      }
      options.only.push(value)
      options.explain ||= argument === '--explain'
      index += 1
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else {
      throw new Error(`Unknown option: ${argument}`)
    }
  }

  return options
}

function helpText() {
  return `Check dependency vulnerabilities and recommend the next action.

Usage:
  yarn check:vulnerabilities [options]

Options:
  --only <package>       Check one package (repeatable)
  --explain <package>    Check one package and show detailed paths
  --all-environments     Include development dependencies in the audit
  --json                 Print machine-readable JSON
  -h, --help             Show this help

The command is read-only. It compares the current audit with
yarn-audit-known-issues and runs resolution analysis only when relevant.`
}

function locatorVersion(locator) {
  const npmReference = locator.lastIndexOf('npm:')
  if (npmReference === -1) {
    return null
  }
  return locator.slice(npmReference + 4).split('#')[0]
}

function branchContainsAffectedPackage(
  node,
  packageName,
  affectedVersions
) {
  if (!node || typeof node !== 'object') {
    return false
  }

  const locator = node.value?.locator
  if (typeof locator === 'string'
    && packageNameFromLocator(locator) === packageName
    && (affectedVersions.size === 0
      || affectedVersions.has(locatorVersion(locator)))) {
    return true
  }

  return Object.values(node.children || {}).some(child =>
    branchContainsAffectedPackage(child, packageName, affectedVersions)
  )
}

function affectedDirectDependencies(whyOutput, manifest, finding) {
  const root = parseJsonLines(whyOutput).find(document =>
    document
      && document.children
      && !document.value?.locator
  )
  if (!root) {
    return {
      direct: false,
      parents: [],
    }
  }

  const packageName = finding.value
  const affectedVersions = new Set(finding.children['Tree Versions'] || [])
  const declared = new Set(
    DEPENDENCY_FIELDS.flatMap(field => Object.keys(manifest[field] || {}))
  )
  let direct = false
  const parents = new Set()

  for (const branch of Object.values(root.children)) {
    const locator = branch?.value?.locator
    if (typeof locator !== 'string'
      || !branchContainsAffectedPackage(
        branch,
        packageName,
        affectedVersions
      )) {
      continue
    }

    const directName = packageNameFromLocator(locator)
    if (!declared.has(directName)) {
      continue
    }

    if (directName === packageName
      && affectedVersions.has(locatorVersion(locator))) {
      direct = true
    } else {
      parents.add(directName)
    }
  }

  return {
    direct,
    parents: [...parents].sort(),
  }
}

function classifyKnownIssues(currentFindings, knownFindings) {
  const knownIdentities = new Set(knownFindings.map(findingIdentity))
  const currentIdentities = new Set(currentFindings.map(findingIdentity))

  return {
    current: currentFindings.map(finding => ({
      finding,
      status: knownIdentities.has(findingIdentity(finding))
        ? 'known'
        : 'new',
    })),
    resolvedKnown: knownFindings.filter(
      finding => !currentIdentities.has(findingIdentity(finding))
    ),
  }
}

function resolutionKeysForPackage(manifest, packageName) {
  return Object.keys(manifest.resolutions || {}).filter(
    key => packageNameFromResolutionKey(key) === packageName
  )
}

function tryDependencyUpgrades({
  baselineFindings,
  candidates,
  finding,
  manifest,
  production,
  projectRoot,
  yarn,
}) {
  if (candidates.length === 0) {
    return null
  }

  const scenario = createScenario(projectRoot, manifest, null)
  const packageJsonPath = path.join(scenario.directory, 'package.json')

  try {
    const before = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    runYarn(yarn, scenario.directory, [
      'up',
      ...candidates,
      '--mode=update-lockfile',
    ])
    const after = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const findings = auditScenario(yarn, scenario.directory, production)
    const stillPresent = findings.some(
      candidate => findingIdentity(candidate) === findingIdentity(finding)
    )

    return {
      candidates,
      changes: changedDeclaredDependencies(before, after),
      fixes: !stillPresent
        && newFindings(baselineFindings, findings).length === 0,
    }
  } catch (error) {
    return {
      candidates,
      error: error.message,
      fixes: false,
    }
  } finally {
    fs.rmSync(scenario.directory, {force: true, recursive: true})
  }
}

function recommendationFor({
  dependencyUpgrade,
  direct,
  parents,
  resolutionResults,
}) {
  const actionableResolution = resolutionResults.find(result =>
    ['removable', 'update-resolution', 'upgrade-parent']
      .includes(result.classification)
  )
  if (actionableResolution) {
    return {
      action: actionableResolution.classification,
      source: 'resolution',
    }
  }

  const reviewResolution = resolutionResults.find(result =>
    ['manual-review', 'still-required'].includes(result.classification)
  )
  if (reviewResolution) {
    return {
      action: reviewResolution.classification,
      source: 'resolution',
    }
  }

  if (dependencyUpgrade?.fixes) {
    return {
      action: direct && parents.length === 0
        ? 'upgrade-direct'
        : 'upgrade-parent',
      source: 'dependency',
    }
  }

  return {
    action: 'no-supported-upgrade',
    source: 'dependency',
  }
}

function formatResult(result, explain) {
  const finding = result.finding.children
  const heading =
    `${result.status.toUpperCase()} ${finding.Severity.toUpperCase()} ${result.packageName}`
  const lines = [
    heading,
    `  Issue: ${finding.Issue}`,
    `  Version(s): ${(finding['Tree Versions'] || []).join(', ')}`,
  ]

  if (result.parents.length > 0) {
    lines.push(`  Declared parent(s): ${result.parents.join(', ')}`)
  } else if (result.direct) {
    lines.push('  Dependency: direct')
  }

  if (result.resolutionResults.length > 0) {
    lines.push(
      `  Resolution: ${result.resolutionResults
        .map(item => `${item.resolutionKey} (${item.classification})`)
        .join(', ')}`
    )
  }

  lines.push(`  Recommendation: ${result.recommendation.action}`)

  if (explain && finding.Dependents) {
    lines.push(`  Immediate dependent(s): ${finding.Dependents.join(', ')}`)
  }

  return lines.join('\n')
}

function analyzeFinding({
  baselineFindings,
  finding,
  manifest,
  options,
  projectRoot,
  status,
  yarn,
}) {
  const packageName = finding.value
  const why = runYarn(
    yarn,
    projectRoot,
    ['why', '-R', packageName, '--json'],
    true
  )
  const dependencyPath = affectedDirectDependencies(
    why.output,
    manifest,
    finding
  )
  const resolutionResults = resolutionKeysForPackage(manifest, packageName)
    .map(resolutionKey => checkResolution({
      baselineFindings,
      manifest,
      options,
      projectRoot,
      resolutionKey,
      yarn,
    }))
  const upgradeCandidates = [
    ...(dependencyPath.direct ? [packageName] : []),
    ...dependencyPath.parents,
  ]
  const dependencyUpgrade = resolutionResults.length === 0
    ? tryDependencyUpgrades({
      baselineFindings,
      candidates: upgradeCandidates,
      finding,
      manifest,
      production: options.production,
      projectRoot,
      yarn,
    })
    : null
  const recommendation = recommendationFor({
    dependencyUpgrade,
    direct: dependencyPath.direct,
    parents: dependencyPath.parents,
    resolutionResults,
  })

  return {
    dependencyUpgrade,
    direct: dependencyPath.direct,
    finding,
    packageName,
    parents: dependencyPath.parents,
    recommendation,
    resolutionResults,
    status,
  }
}

function main() {
  let options
  try {
    options = parseArguments(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    console.error('Run with --help for usage.')
    process.exitCode = 2
    return
  }

  if (options.help) {
    console.log(helpText())
    return
  }

  const projectRoot = process.cwd()
  const manifest = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
  )
  const yarn = locateYarn(projectRoot, manifest)

  let baselineFindings
  try {
    baselineFindings = auditScenario(yarn, projectRoot, options.production)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
    return
  }

  const knownIssuesPath = path.join(
    projectRoot,
    'yarn-audit-known-issues'
  )
  const knownFindings = fs.existsSync(knownIssuesPath)
    ? auditFindings(fs.readFileSync(knownIssuesPath, 'utf8'))
    : []
  const classification = classifyKnownIssues(
    baselineFindings,
    knownFindings
  )
  const selected = classification.current.filter(({finding}) =>
    options.only.length === 0 || options.only.includes(finding.value)
  )
  const missing = options.only.filter(
    packageName => !selected.some(({finding}) => finding.value === packageName)
  )
  if (missing.length > 0) {
    console.error(`No current audit finding for: ${missing.join(', ')}`)
    process.exitCode = 2
    return
  }

  const results = selected.map(({finding, status}) => analyzeFinding({
    baselineFindings,
    finding,
    manifest,
    options,
    projectRoot,
    status,
    yarn,
  }))
  const summary = {
    known: results.filter(result => result.status === 'known').length,
    new: results.filter(result => result.status === 'new').length,
    resolvedKnown: classification.resolvedKnown.length,
    total: results.length,
  }

  if (options.json) {
    console.log(JSON.stringify({
      environment: options.production ? 'production' : 'all',
      resolvedKnown: classification.resolvedKnown,
      results,
      summary,
    }, null, 2))
  } else {
    console.log(
      `Vulnerability check: ${summary.total} current `
      + `(${summary.new} new, ${summary.known} known), `
      + `${summary.resolvedKnown} resolved known`
    )
    if (results.length > 0) {
      console.log('')
      console.log(
        results.map(result => formatResult(result, options.explain)).join('\n\n')
      )
    }
    if (classification.resolvedKnown.length > 0) {
      console.log('')
      console.log('Remove resolved entries from yarn-audit-known-issues:')
      for (const finding of classification.resolvedKnown) {
        console.log(`  - ${finding.value}: ${finding.children.Issue}`)
      }
    }
  }

  if (results.some(result => result.status === 'new')) {
    process.exitCode = 1
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  affectedDirectDependencies,
  branchContainsAffectedPackage,
  classifyKnownIssues,
  formatResult,
  locatorVersion,
  parseArguments,
  recommendationFor,
  resolutionKeysForPackage,
}
