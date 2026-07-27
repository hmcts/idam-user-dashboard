#!/usr/bin/env node

'use strict'

const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
]

function parseArguments(argv) {
  const options = {
    failOnChanges: false,
    json: false,
    only: [],
    production: true,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--json') {
      options.json = true
    } else if (argument === '--fail-on-changes') {
      options.failOnChanges = true
    } else if (argument === '--all-environments') {
      options.production = false
    } else if (argument === '--only') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('--only requires a resolution key or package name')
      }
      options.only.push(value)
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
  return `Check whether Yarn resolutions can be retired safely.

Usage:
  yarn check:resolutions [options]

Options:
  --only <name>         Check one resolution key or resolved package (repeatable)
  --all-environments    Include development dependencies in the audit
  --json                Print machine-readable JSON
  --fail-on-changes     Exit non-zero when an actionable change is found
  -h, --help            Show this help

The command works only in temporary directories. It never changes package.json
or yarn.lock in the project being checked.`
}

function packageNameFromResolutionKey(key) {
  let selector = key

  if (!selector.startsWith('@') && selector.includes('/')) {
    selector = selector.slice(selector.indexOf('/') + 1)
  }

  if (selector.startsWith('@')) {
    const slashIndex = selector.indexOf('/')
    if (slashIndex === -1) {
      return selector
    }
    const descriptorIndex = selector.indexOf('@', slashIndex)
    return descriptorIndex === -1
      ? selector
      : selector.slice(0, descriptorIndex)
  }

  const descriptorIndex = selector.indexOf('@')
  return descriptorIndex === -1
    ? selector
    : selector.slice(0, descriptorIndex)
}

function packageNameFromLocator(locator) {
  if (locator.startsWith('@')) {
    const slashIndex = locator.indexOf('/')
    const referenceIndex = locator.indexOf('@', slashIndex)
    return referenceIndex === -1
      ? locator
      : locator.slice(0, referenceIndex)
  }

  const referenceIndex = locator.indexOf('@')
  return referenceIndex === -1
    ? locator
    : locator.slice(0, referenceIndex)
}

function parseJsonLines(output) {
  return output
    .split(/\r?\n/u)
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap(line => {
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
}

function auditFindings(output) {
  return parseJsonLines(output).filter(item =>
    typeof item.value === 'string'
      && item.children
      && typeof item.children === 'object'
      && typeof item.children.Issue === 'string'
  )
}

function findingsForPackage(findings, packageName) {
  return findings.filter(finding => finding.value === packageName)
}

function shouldTryResolutionUpdate(
  packageName,
  baselineFindings,
  candidateFindings
) {
  return findingsForPackage(baselineFindings, packageName).length > 0
    || findingsForPackage(candidateFindings, packageName).length > 0
}

function findingIdentity(finding) {
  return [
    finding.value,
    finding.children.ID,
    finding.children.URL,
    finding.children.Issue,
  ].filter(Boolean).join('|')
}

function newFindings(baseline, candidate) {
  const existing = new Set(baseline.map(findingIdentity))
  return candidate.filter(finding => !existing.has(findingIdentity(finding)))
}

function directParentsFromWhy(output, manifest) {
  const documents = parseJsonLines(output)
  const root = documents.find(document =>
    document
      && document.children
      && !document.value?.locator
  )

  if (!root) {
    return []
  }

  const declared = new Set(
    DEPENDENCY_FIELDS.flatMap(field => Object.keys(manifest[field] || {}))
  )

  return [...new Set(
    Object.values(root.children)
      .map(child => child?.value?.locator)
      .filter(locator => typeof locator === 'string')
      .map(packageNameFromLocator)
      .filter(name => declared.has(name))
  )].sort()
}

function versionsFromWhy(output, packageName) {
  const versions = new Set()

  function visit(value) {
    if (!value || typeof value !== 'object') {
      return
    }

    if (typeof value.locator === 'string'
      && packageNameFromLocator(value.locator) === packageName) {
      const npmReference = value.locator.lastIndexOf('npm:')
      if (npmReference !== -1) {
        versions.add(value.locator.slice(npmReference + 4).split('#')[0])
      }
    }

    for (const child of Object.values(value.children || {})) {
      visit(child)
    }

    if (value.value && typeof value.value === 'object') {
      visit(value.value)
    }
  }

  for (const document of parseJsonLines(output)) {
    visit(document)
  }

  return [...versions].sort()
}

function parseComparableVersion(value) {
  const match = String(value).match(
    /(?:^|[^\d])v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/u
  )

  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
    version: `${match[1]}.${match[2]}.${match[3]}${match[4] ? `-${match[4]}` : ''}`,
  }
}

function compareVersions(left, right) {
  for (const part of ['major', 'minor', 'patch']) {
    if (left[part] !== right[part]) {
      return left[part] < right[part] ? -1 : 1
    }
  }

  if (left.prerelease === right.prerelease) {
    return 0
  }
  if (left.prerelease === null) {
    return 1
  }
  if (right.prerelease === null) {
    return -1
  }

  return left.prerelease.localeCompare(right.prerelease)
}

function assessNaturalVersions(resolutionValue, naturalVersions) {
  if (naturalVersions.length === 0) {
    return {
      acceptable: true,
      floor: null,
      lowerVersions: [],
    }
  }

  const floor = parseComparableVersion(resolutionValue)
  if (!floor) {
    return {
      acceptable: false,
      floor: null,
      lowerVersions: [],
      reason: `cannot establish a version floor from ${resolutionValue}`,
    }
  }

  const unparseableVersions = naturalVersions.filter(
    version => !parseComparableVersion(version)
  )
  if (unparseableVersions.length > 0) {
    return {
      acceptable: false,
      floor: floor.version,
      lowerVersions: [],
      reason: `cannot compare natural version(s): ${unparseableVersions.join(', ')}`,
    }
  }

  const lowerVersions = naturalVersions.filter(version =>
    compareVersions(parseComparableVersion(version), floor) < 0
  )

  return {
    acceptable: lowerVersions.length === 0,
    floor: floor.version,
    lowerVersions,
    reason: lowerVersions.length > 0
      ? `removal would downgrade ${floor.version} → ${lowerVersions.join(', ')}`
      : null,
  }
}

function latestVersionFromInfo(output) {
  const documents = parseJsonLines(output)
  for (let index = documents.length - 1; index >= 0; index -= 1) {
    if (typeof documents[index].version === 'string') {
      return documents[index].version
    }
  }
  return null
}

function changedDeclaredDependencies(before, after) {
  const changes = []

  for (const field of DEPENDENCY_FIELDS) {
    const previous = before[field] || {}
    const current = after[field] || {}

    for (const name of new Set([...Object.keys(previous), ...Object.keys(current)])) {
      if (previous[name] !== current[name]) {
        changes.push({
          field,
          from: previous[name] ?? null,
          name,
          to: current[name] ?? null,
        })
      }
    }
  }

  return changes
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function copyIfPresent(source, destination) {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination)
  }
}

function createScenario(projectRoot, manifest, resolutionKey) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'check-yarn-resolution-'))
  const scenarioManifest = structuredClone(manifest)
  delete scenarioManifest.resolutions[resolutionKey]

  writeJson(path.join(directory, 'package.json'), scenarioManifest)
  copyIfPresent(
    path.join(projectRoot, 'yarn.lock'),
    path.join(directory, 'yarn.lock')
  )
  copyIfPresent(
    path.join(projectRoot, '.npmrc'),
    path.join(directory, '.npmrc')
  )

  const yarnRcPath = path.join(projectRoot, '.yarnrc.yml')
  if (fs.existsSync(yarnRcPath)) {
    const yarnRc = fs.readFileSync(yarnRcPath, 'utf8')
      .split(/\r?\n/u)
      .filter(line => !/^\s*yarnPath\s*:/u.test(line))
      .join('\n')
    fs.writeFileSync(path.join(directory, '.yarnrc.yml'), yarnRc)
  }

  return {
    directory,
    manifest: scenarioManifest,
  }
}

function locateYarn(projectRoot, manifest) {
  const configuredPath = fs.existsSync(path.join(projectRoot, '.yarnrc.yml'))
    ? fs.readFileSync(path.join(projectRoot, '.yarnrc.yml'), 'utf8')
      .match(/^\s*yarnPath\s*:\s*(.+?)\s*$/mu)?.[1]
      ?.replace(/^['"]|['"]$/gu, '')
    : null

  if (configuredPath) {
    const yarnPath = path.resolve(projectRoot, configuredPath)
    if (fs.existsSync(yarnPath)) {
      return {
        args: [yarnPath],
        command: process.execPath,
      }
    }
  }

  const packageManagerVersion = manifest.packageManager?.match(/^yarn@(.+)$/u)?.[1]
  if (packageManagerVersion) {
    return {
      args: ['yarn'],
      command: 'corepack',
    }
  }

  return {
    args: [],
    command: 'yarn',
  }
}

function runYarn(yarn, cwd, args, allowFailure = false) {
  const result = childProcess.spawnSync(
    yarn.command,
    [...yarn.args, ...args],
    {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        YARN_ENABLE_PROGRESS_BARS: '0',
        YARN_IGNORE_PATH: '1',
      },
      maxBuffer: 50 * 1024 * 1024,
    }
  )

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')

  if (result.error) {
    throw result.error
  }

  if (!allowFailure && result.status !== 0) {
    throw new Error(
      `Yarn command failed (${args.join(' ')}):\n${output.trim()}`
    )
  }

  return {
    output,
    status: result.status,
  }
}

function installScenario(yarn, directory) {
  return runYarn(yarn, directory, [
    'install',
    '--mode=update-lockfile',
  ])
}

function auditScenario(yarn, directory, production) {
  const args = ['npm', 'audit', '--recursive', '--json']
  if (production) {
    args.splice(3, 0, '--environment', 'production')
  }

  const result = runYarn(yarn, directory, args, true)
  const findings = auditFindings(result.output)

  if (result.status !== 0 && findings.length === 0) {
    throw new Error(`Yarn audit failed:\n${result.output.trim()}`)
  }

  return findings
}

function inspectTree(yarn, directory, packageName) {
  const result = runYarn(
    yarn,
    directory,
    ['why', '-R', packageName, '--json'],
    true
  )

  return {
    directParents: directParentsFromWhy(
      result.output,
      JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
    ),
    versions: versionsFromWhy(result.output, packageName),
  }
}

function tryParentUpgrades({
  baselineFindings,
  currentValue,
  directory,
  packageName,
  parents,
  production,
  yarn,
}) {
  if (parents.length === 0) {
    return null
  }

  const packageJsonPath = path.join(directory, 'package.json')
  const lockfilePath = path.join(directory, 'yarn.lock')
  const packageJsonBefore = fs.readFileSync(packageJsonPath, 'utf8')
  const lockfileBefore = fs.existsSync(lockfilePath)
    ? fs.readFileSync(lockfilePath)
    : null
  const before = JSON.parse(packageJsonBefore)

  try {
    runYarn(yarn, directory, ['up', ...parents, '--mode=update-lockfile'])
    const findings = auditScenario(yarn, directory, production)
    const after = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
    )
    const tree = inspectTree(yarn, directory, packageName)
    const versionAssessment = assessNaturalVersions(currentValue, tree.versions)

    if (findingsForPackage(findings, packageName).length === 0
      && newFindings(baselineFindings, findings).length === 0
      && versionAssessment.acceptable) {
      return {
        changes: changedDeclaredDependencies(before, after),
        parents,
        versions: tree.versions,
      }
    }
  } catch {
    // A parent-upgrade failure is not fatal; the override may still be updatable.
  } finally {
    fs.writeFileSync(packageJsonPath, packageJsonBefore)
    if (lockfileBefore === null) {
      fs.rmSync(lockfilePath, {force: true})
    } else {
      fs.writeFileSync(lockfilePath, lockfileBefore)
    }
  }

  return null
}

function tryResolutionUpdate({
  baselineFindings,
  currentValue,
  directory,
  manifest,
  packageName,
  production,
  resolutionKey,
  yarn,
}) {
  const info = runYarn(
    yarn,
    directory,
    ['npm', 'info', packageName, '--fields', 'version', '--json'],
    true
  )
  const latestVersion = latestVersionFromInfo(info.output)

  if (!latestVersion || latestVersion === currentValue) {
    return null
  }

  const updateManifest = structuredClone(manifest)
  updateManifest.resolutions[resolutionKey] = latestVersion
  writeJson(path.join(directory, 'package.json'), updateManifest)

  try {
    installScenario(yarn, directory)
    const findings = auditScenario(yarn, directory, production)
    if (findingsForPackage(findings, packageName).length === 0
      && newFindings(baselineFindings, findings).length === 0) {
      return latestVersion
    }
  } catch {
    return null
  }

  return null
}

function checkResolution({
  baselineFindings,
  manifest,
  options,
  projectRoot,
  resolutionKey,
  yarn,
}) {
  const currentValue = manifest.resolutions[resolutionKey]
  const packageName = packageNameFromResolutionKey(resolutionKey)
  const scenario = createScenario(projectRoot, manifest, resolutionKey)

  try {
    installScenario(yarn, scenario.directory)
    const findings = auditScenario(yarn, scenario.directory, options.production)
    const packageFindings = findingsForPackage(findings, packageName)
    const introducedFindings = newFindings(baselineFindings, findings)
    const tree = inspectTree(yarn, scenario.directory, packageName)
    const versionAssessment = assessNaturalVersions(
      currentValue,
      tree.versions
    )

    if (packageFindings.length === 0
      && introducedFindings.length === 0
      && versionAssessment.acceptable) {
      return {
        classification: 'removable',
        currentValue,
        naturalVersions: tree.versions,
        packageName,
        resolutionKey,
      }
    }

    if (introducedFindings.length > 0) {
      return {
        classification: 'still-required',
        currentValue,
        introducedVulnerabilities: introducedFindings.map(
          finding => finding.children
        ),
        naturalVersions: tree.versions,
        packageName,
        parents: tree.directParents,
        reason: 'removal introduced a different advisory',
        resolutionKey,
      }
    }

    const parentUpgrade = tryParentUpgrades({
      baselineFindings,
      currentValue,
      directory: scenario.directory,
      packageName,
      parents: tree.directParents,
      production: options.production,
      yarn,
    })

    if (parentUpgrade) {
      return {
        classification: 'upgrade-parent',
        currentValue,
        naturalVersions: parentUpgrade.versions,
        packageName,
        parentChanges: parentUpgrade.changes,
        parents: parentUpgrade.parents,
        resolutionKey,
        vulnerabilities: packageFindings.map(finding => finding.children),
      }
    }

    const updatedResolution =
      shouldTryResolutionUpdate(packageName, baselineFindings, findings)
        ? tryResolutionUpdate({
          baselineFindings,
          currentValue,
          directory: scenario.directory,
          manifest,
          packageName,
          production: options.production,
          resolutionKey,
          yarn,
        })
        : null

    if (updatedResolution) {
      return {
        classification: 'update-resolution',
        currentValue,
        naturalVersions: tree.versions,
        packageName,
        resolutionKey,
        suggestedValue: updatedResolution,
        vulnerabilities: packageFindings.map(finding => finding.children),
      }
    }

    if (packageFindings.length === 0) {
      return {
        classification: 'still-required',
        currentValue,
        naturalVersions: tree.versions,
        packageName,
        parents: tree.directParents,
        reason: versionAssessment.reason,
        resolutionKey,
      }
    }

    return {
      classification: 'still-required',
      currentValue,
      naturalVersions: tree.versions,
      packageName,
      parents: tree.directParents,
      resolutionKey,
      vulnerabilities: packageFindings.map(finding => finding.children),
    }
  } catch (error) {
    return {
      classification: 'error',
      currentValue,
      error: error.message,
      packageName,
      resolutionKey,
    }
  } finally {
    fs.rmSync(scenario.directory, {force: true, recursive: true})
  }
}

function formatResult(result) {
  const identity = `${result.resolutionKey}: ${result.currentValue}`
  const versions = result.naturalVersions?.length
    ? result.naturalVersions.join(', ')
    : 'not present'

  switch (result.classification) {
    case 'removable':
      return `✓ ${identity}\n  removable; natural version(s): ${versions}`
    case 'upgrade-parent': {
      const changes = result.parentChanges.length
        ? result.parentChanges
          .map(change => `${change.name} ${change.from} → ${change.to}`)
          .join(', ')
        : result.parents.join(', ')
      return `↗ ${identity}\n  upgrade parent: ${changes}`
    }
    case 'update-resolution':
      return `↑ ${identity}\n  update resolution to ${result.suggestedValue}`
    case 'still-required':
      return `● ${identity}\n  still required${result.reason ? `; ${result.reason}` : ''}; parents: ${result.parents.join(', ') || 'unknown'}`
    case 'error':
      return `! ${identity}\n  error: ${result.error}`
    default:
      return `? ${identity}\n  unknown classification`
  }
}

function selectResolutionKeys(resolutions, only) {
  const keys = Object.keys(resolutions)
  if (only.length === 0) {
    return keys
  }

  const selected = keys.filter(key =>
    only.includes(key)
      || only.includes(packageNameFromResolutionKey(key))
  )
  const missing = only.filter(value =>
    !selected.some(key =>
      key === value || packageNameFromResolutionKey(key) === value
    )
  )

  if (missing.length > 0) {
    throw new Error(`Unknown resolution: ${missing.join(', ')}`)
  }

  return selected
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
  const packageJsonPath = path.join(projectRoot, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const resolutions = manifest.resolutions || {}
  const yarn = locateYarn(projectRoot, manifest)

  let resolutionKeys
  try {
    resolutionKeys = selectResolutionKeys(resolutions, options.only)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
    return
  }

  if (!options.json) {
    console.log(`Checking ${resolutionKeys.length} Yarn resolution(s)...`)
  }

  let baselineFindings
  try {
    baselineFindings = auditScenario(yarn, projectRoot, options.production)
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({error: error.message}, null, 2))
    } else {
      console.error(`Unable to establish the current audit baseline:\n${error.message}`)
    }
    process.exitCode = 1
    return
  }

  const results = resolutionKeys.map(resolutionKey => {
    if (!options.json) {
      console.error(`Checking ${resolutionKey}...`)
    }
    return checkResolution({
      baselineFindings,
      manifest,
      options,
      projectRoot,
      resolutionKey,
      yarn,
    })
  })

  if (options.json) {
    console.log(JSON.stringify({
      environment: options.production ? 'production' : 'all',
      results,
    }, null, 2))
  } else {
    console.log('')
    console.log(results.map(formatResult).join('\n\n'))
  }

  const hasErrors = results.some(result => result.classification === 'error')
  const hasChanges = results.some(result =>
    ['removable', 'upgrade-parent', 'update-resolution']
      .includes(result.classification)
  )

  if (hasErrors || (options.failOnChanges && hasChanges)) {
    process.exitCode = 1
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  assessNaturalVersions,
  auditFindings,
  changedDeclaredDependencies,
  compareVersions,
  directParentsFromWhy,
  findingIdentity,
  findingsForPackage,
  formatResult,
  latestVersionFromInfo,
  newFindings,
  packageNameFromLocator,
  packageNameFromResolutionKey,
  parseComparableVersion,
  parseArguments,
  selectResolutionKeys,
  shouldTryResolutionUpdate,
  versionsFromWhy,
}
