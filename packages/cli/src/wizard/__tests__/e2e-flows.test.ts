/**
 * End-to-end functional tests for CLI install UX improvements.
 * Tests actual filesystem operations with real functions.
 * Vitest runs these in a sandbox with tmpdir support.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { writeInitTechStack } from '../../commands/init'
import { readDeepStormConfig, mergeDeepStormConfig } from '../../merger/settings'
import { loadExistingConfigKeys, getInstalledMcpServices, getInstalledTools } from '../wizard-flow'
import { isMcpFullyConfigured, parseEnvExampleFile } from '../mcp-env'
import { printMcpEnvStatus } from '../guide'

// Helper: create a temp directory for each test
function tmpDir(name: string): string {
  const dir = path.join(process.env.TMPDIR!, 'deepstorm-e2e', name)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true })
  return dir
}

describe('E2E: writeInitTechStack → readDeepStormConfig', () => {
  it('writes full tech stack (frontend+backend) and reads back correctly', () => {
    const dir = tmpDir('full-stack')

    // InitOptions.frontend is the framework name (string), not boolean
    writeInitTechStack(dir, {
      frontend: 'react',
      backend: 'python',
      projectName: 'test-proj',
    })

    const config = readDeepStormConfig(path.join(dir, '.claude/settings.json'))
    expect(config?.reef?.techs).toBe('frontend,backend')
    expect(config?.reef?.frontend?.framework).toBe('react')
    expect(config?.reef?.backend?.language).toBe('python')
  })

  it('writes frontend-only config and does not include backend fields', () => {
    const dir = tmpDir('frontend-only')

    writeInitTechStack(dir, {
      frontend: 'vue',
      projectName: 'test-proj',
    })

    const config = readDeepStormConfig(path.join(dir, '.claude/settings.json'))
    expect(config?.reef?.techs).toBe('frontend')
    expect(config?.reef?.frontend?.framework).toBe('vue')
    expect(config?.reef?.backend).toBeUndefined()
  })

  it('writes backend-only config and does not include frontend fields', () => {
    const dir = tmpDir('backend-only')

    writeInitTechStack(dir, {
      backend: 'java',
      projectName: 'test-proj',
    })

    const config = readDeepStormConfig(path.join(dir, '.claude/settings.json'))
    expect(config?.reef?.techs).toBe('backend')
    expect(config?.reef?.backend?.language).toBe('java')
    expect(config?.reef?.frontend).toBeUndefined()
  })

  it('does not overwrite unrelated fields in settings.json', () => {
    const dir = tmpDir('preserve')

    // Write an unrelated field first
    mergeDeepStormConfig(path.join(dir, '.claude/settings.json'), {
      tide: { issueTracker: 'jira' },
    })

    // Then call writeInitTechStack
    writeInitTechStack(dir, {
      frontend: 'angular',
      backend: 'java',
      projectName: 'test-proj',
    })

    // Read the full settings.json
    const settingsPath = path.join(dir, '.claude/settings.json')
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.deepstorm?.reef?.frontend?.framework).toBe('angular')
    expect(content.deepstorm?.tide?.issueTracker).toBe('jira')
  })

  it('partial write does not clobber existing unrelated settings', () => {
    const dir = tmpDir('partial-update')

    // First write full config
    writeInitTechStack(dir, {
      frontend: 'react',
      backend: 'java',
      projectName: 'test-proj',
    })

    // Then write frontend-only — backend opts not passed
    writeInitTechStack(dir, {
      frontend: 'vue',
      projectName: 'test-proj',
    })

    const config = readDeepStormConfig(path.join(dir, '.claude/settings.json'))
    // techs should reflect the latest write
    expect(config?.reef?.techs).toBe('frontend')
    expect(config?.reef?.frontend?.framework).toBe('vue')
    // backend from first call should still be there (mergeDeepStormConfig deep-merges)
    expect(config?.reef?.backend?.language).toBe('java')
  })
})

describe('E2E: loadExistingConfigKeys', () => {
  it('reads full config and returns all non-none keys', () => {
    const dir = tmpDir('config-keys-full')
    const settingsPath = path.join(dir, '.claude/settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify({
      deepstorm: {
        reef: {
          techs: 'frontend,backend',
          frontend: { framework: 'angular', uiLibrary: 'material' },
          backend: { language: 'java' },
        },
      },
    }, null, 2))

    const keys = loadExistingConfigKeys(dir)
    expect(keys.has('reef.techs')).toBe(true)
    expect(keys.has('reef.frontend.framework')).toBe(true)
    expect(keys.has('reef.frontend.uiLibrary')).toBe(true)
    expect(keys.has('reef.backend.language')).toBe(true)
  })

  it('excludes keys with value "none"', () => {
    const dir = tmpDir('config-keys-none')
    const settingsPath = path.join(dir, '.claude/settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify({
      deepstorm: {
        reef: {
          techs: 'frontend',
          frontend: { framework: 'none' },
        },
      },
    }, null, 2))

    const keys = loadExistingConfigKeys(dir)
    expect(keys.has('reef.techs')).toBe(true)
    expect(keys.has('reef.frontend.framework')).toBe(false)
  })

  it('returns empty set when no settings.json exists', () => {
    const dir = tmpDir('no-settings')
    const keys = loadExistingConfigKeys(dir)
    expect(keys.size).toBe(0)
  })

  it('returns empty set when deepstorm namespace is empty', () => {
    const dir = tmpDir('empty-deepstorm')
    const settingsPath = path.join(dir, '.claude/settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify({
      deepstorm: {},
    }, null, 2))

    const keys = loadExistingConfigKeys(dir)
    expect(keys.size).toBe(0)
  })
})

describe('E2E: getInstalledMcpServices', () => {
  it('reads installedMcpServers from settings.json', () => {
    const dir = tmpDir('installed-mcp')
    const settingsPath = path.join(dir, '.claude/settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify({
      deepstorm: {
        installedMcpServers: ['github', 'jira'],
      },
    }, null, 2))

    const services = getInstalledMcpServices(dir)
    expect(services).toEqual(['github', 'jira'])
  })

  it('returns empty array when no deepstorm namespace', () => {
    const dir = tmpDir('no-deepstorm')
    const settingsPath = path.join(dir, '.claude/settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify({ other: {} }, null, 2))

    expect(getInstalledMcpServices(dir)).toEqual([])
  })

  it('returns empty array when no settings.json', () => {
    const dir = tmpDir('no-settings-file')
    expect(getInstalledMcpServices(dir)).toEqual([])
  })
})

describe('E2E: isMcpFullyConfigured', () => {
  it('returns true when all env keys have non-default values', () => {
    const dir = tmpDir('mcp-fully-configured')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'github.env-example'), 'GH_TOKEN=your_github_token\nGH_HOST=github.com')
    // Both values differ from the defaults
    fs.writeFileSync(path.join(dir, '.env'), 'GH_TOKEN=ghp_real_token_123\nGH_HOST=my-enterprise.github.com')

    expect(isMcpFullyConfigured('github', examplesDir, path.join(dir, '.env'))).toBe(true)
  })

  it('returns false when a key is still the default placeholder', () => {
    const dir = tmpDir('mcp-default-value')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'github.env-example'), 'GH_TOKEN=your_github_token')
    fs.writeFileSync(path.join(dir, '.env'), 'GH_TOKEN=your_github_token')

    expect(isMcpFullyConfigured('github', examplesDir, path.join(dir, '.env'))).toBe(false)
  })

  it('returns false when a key is missing from .env', () => {
    const dir = tmpDir('mcp-missing-key')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'github.env-example'), 'GH_TOKEN=your_token\nGH_HOST=github.com')
    fs.writeFileSync(path.join(dir, '.env'), 'GH_TOKEN=actual_token')

    expect(isMcpFullyConfigured('github', examplesDir, path.join(dir, '.env'))).toBe(false)
  })

  it('returns true when env-example does not exist', () => {
    const dir = tmpDir('no-env-example')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })

    expect(isMcpFullyConfigured('nonexistent', examplesDir, path.join(dir, '.env'))).toBe(true)
  })

  it('returns false when .env does not exist but env-example has keys', () => {
    const dir = tmpDir('no-dotenv')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'github.env-example'), 'GH_TOKEN=token')

    expect(isMcpFullyConfigured('github', examplesDir, path.join(dir, '.env'))).toBe(false)
  })
})

describe('E2E: printMcpEnvStatus outputs', () => {
  it('shows ✅ for fully configured service', () => {
    const dir = tmpDir('print-ok')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'jira.env-example'), 'JIRA_TOKEN=your_token')
    fs.writeFileSync(path.join(dir, '.env'), 'JIRA_TOKEN=actual_token_123')

    const lines: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => { lines.push(msg) })

    printMcpEnvStatus(['jira'], [], examplesDir, dir)

    const hasOk = lines.some(l => l.includes('✅') && l.includes('jira'))
    expect(hasOk).toBe(true)

    spy.mockRestore()
  })

  it('shows ⚠️ for service with missing keys', () => {
    const dir = tmpDir('print-warn')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'github.env-example'), 'GH_TOKEN=your_token\nGH_HOST=github.com')
    fs.writeFileSync(path.join(dir, '.env'), 'GH_TOKEN=actual_token')

    const lines: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => { lines.push(msg) })

    printMcpEnvStatus(['github'], [], examplesDir, dir)

    const hasWarn = lines.some(l => l.includes('⚠') && l.includes('github') && l.includes('GH_HOST'))
    expect(hasWarn).toBe(true)

    spy.mockRestore()
  })

  it('shows ℹ for service without env-example', () => {
    const dir = tmpDir('print-info')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })

    const lines: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => { lines.push(msg) })

    printMcpEnvStatus(['context7'], [], examplesDir, dir)

    const hasInfo = lines.some(l => l.includes('ℹ') && l.includes('context7'))
    expect(hasInfo).toBe(true)

    spy.mockRestore()
  })

  it('includes both new and previously installed MCPs', () => {
    const dir = tmpDir('print-combined')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'jira.env-example'), 'JIRA_TOKEN=your_token')
    fs.writeFileSync(path.join(examplesDir, 'figma.env-example'), 'FIGMA_TOKEN=your_token')
    fs.writeFileSync(path.join(dir, '.env'), 'JIRA_TOKEN=real_jira\nFIGMA_TOKEN=real_figma')

    const lines: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => { lines.push(msg) })

    // jira = newly selected, figma = previously installed
    printMcpEnvStatus(['jira'], ['figma'], examplesDir, dir)

    const jiraOk = lines.some(l => l.includes('✅') && l.includes('jira'))
    const figmaOk = lines.some(l => l.includes('✅') && l.includes('figma'))
    expect(jiraOk).toBe(true)
    expect(figmaOk).toBe(true)

    spy.mockRestore()
  })

  it('outputs nothing when both lists are empty', () => {
    const dir = tmpDir('print-empty')
    const examplesDir = path.join(dir, 'env-examples')
    fs.mkdirSync(examplesDir, { recursive: true })

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    printMcpEnvStatus([], [], examplesDir, dir)

    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})
