import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'
import { RegistryReader } from '../../engine/registry'
import { installMcpSkills, shouldInstallGlobalHooks, writeEnabledMcpJsonServers, mergeSettingsMcpServers, mergeSandboxDisabled, copyFragmentsForSkill, collectFragmentsFromQuestion, copyReferencesForSkill } from '../setup'
import type { Registry } from '../../types/registry'

describe('installMcpSkills', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-skills-test-'))

    // Create source mcp-skills directory with test skills
    const mcpSkillsDir = path.join(tmpDir, 'mcp-skills')
    fs.mkdirSync(path.join(mcpSkillsDir, 'deepstorm-mcp-jira-read'), { recursive: true })
    fs.writeFileSync(path.join(mcpSkillsDir, 'deepstorm-mcp-jira-read', 'SKILL.md'), '# Jira Read', 'utf-8')
    fs.mkdirSync(path.join(mcpSkillsDir, 'deepstorm-mcp-jira-write'), { recursive: true })
    fs.writeFileSync(path.join(mcpSkillsDir, 'deepstorm-mcp-jira-write', 'SKILL.md'), '# Jira Write', 'utf-8')
    fs.mkdirSync(path.join(mcpSkillsDir, 'deepstorm-mcp-feishu-wiki-read'), { recursive: true })
    fs.writeFileSync(path.join(mcpSkillsDir, 'deepstorm-mcp-feishu-wiki-read', 'SKILL.md'), '# Feishu Read', 'utf-8')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('installs unique mcpSkills from selected tools', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: 'Reef', description: '' },
        tide: { label: 'Tide', description: '' },
      },
      wizards: {
        reef: {
          tool: 'reef',
          label: 'Reef',
          description: '',
          mcpSkills: ['deepstorm-mcp-jira-read', 'deepstorm-mcp-feishu-wiki-read'],
          questions: [],
        },
        tide: {
          tool: 'tide',
          label: 'Tide',
          description: '',
          mcpSkills: ['deepstorm-mcp-jira-write'],
          questions: [],
        },
      },
      skills: {},
    }
    const reader = new RegistryReader(registry)
    const installedSkillIds: string[] = []

    installMcpSkills(['reef', 'tide'], reader, tmpDir, tmpDir, installedSkillIds, ['jira', 'feishu-wiki'])

    expect(installedSkillIds).toHaveLength(3)
    expect(installedSkillIds).toContain('deepstorm-mcp-jira-read')
    expect(installedSkillIds).toContain('deepstorm-mcp-jira-write')
    expect(installedSkillIds).toContain('deepstorm-mcp-feishu-wiki-read')

    // Verify directories were actually copied to target
    const targetSkillsDir = path.join(tmpDir, '.claude', 'skills')
    expect(fs.existsSync(path.join(targetSkillsDir, 'deepstorm-mcp-jira-read', 'SKILL.md'))).toBe(true)
    expect(fs.existsSync(path.join(targetSkillsDir, 'deepstorm-mcp-jira-write', 'SKILL.md'))).toBe(true)
    expect(fs.existsSync(path.join(targetSkillsDir, 'deepstorm-mcp-feishu-wiki-read', 'SKILL.md'))).toBe(true)
  })

  it('does nothing when tools have no mcpSkills', () => {
    const registry: Registry = {
      version: '1',
      tools: { sweep: { label: 'Sweep', description: '' } },
      wizards: {
        sweep: {
          tool: 'sweep',
          label: 'Sweep',
          description: '',
          questions: [],
        },
      },
      skills: {},
    }
    const reader = new RegistryReader(registry)
    const installedSkillIds: string[] = []

    installMcpSkills(['sweep'], reader, tmpDir, tmpDir, installedSkillIds, ['jira'])

    expect(installedSkillIds).toHaveLength(0)
    // No target directory should have been created
    const targetSkillsDir = path.join(tmpDir, '.claude', 'skills')
    expect(fs.existsSync(targetSkillsDir)).toBe(false)
  })

  it('deduplicates same skill when multiple tools need it', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: 'Reef', description: '' },
        sweep: { label: 'Sweep', description: '' },
      },
      wizards: {
        reef: {
          tool: 'reef',
          label: 'Reef',
          description: '',
          mcpSkills: ['deepstorm-mcp-jira-read'],
          questions: [],
        },
        sweep: {
          tool: 'sweep',
          label: 'Sweep',
          description: '',
          mcpSkills: ['deepstorm-mcp-jira-read'],
          questions: [],
        },
      },
      skills: {},
    }
    const reader = new RegistryReader(registry)
    const installedSkillIds: string[] = []

    installMcpSkills(['reef', 'sweep'], reader, tmpDir, tmpDir, installedSkillIds, ['jira'])

    expect(installedSkillIds).toHaveLength(1)
    expect(installedSkillIds).toEqual(['deepstorm-mcp-jira-read'])
  })

  it('skips skills that have no directory in mcp-skills', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: 'Reef', description: '' },
      },
      wizards: {
        reef: {
          tool: 'reef',
          label: 'Reef',
          description: '',
          mcpSkills: ['deepstorm-mcp-nonexistent'],
          questions: [],
        },
      },
      skills: {},
    }
    const reader = new RegistryReader(registry)
    const installedSkillIds: string[] = []

    installMcpSkills(['reef'], reader, tmpDir, tmpDir, installedSkillIds, ['nonexistent'])

    expect(installedSkillIds).toHaveLength(0)
  })

  it('only installs MCP skills for selected services', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: 'Reef', description: '' },
      },
      wizards: {
        reef: {
          tool: 'reef',
          label: 'Reef',
          description: '',
          mcpSkills: ['deepstorm-mcp-jira-read', 'deepstorm-mcp-figma-read', 'deepstorm-mcp-feishu-wiki-read'],
          questions: [],
        },
      },
      skills: {},
    }
    const reader = new RegistryReader(registry)
    const installedSkillIds: string[] = []

    // 用户只选了 jira，没有选 figma/feishu-wiki
    installMcpSkills(['reef'], reader, tmpDir, tmpDir, installedSkillIds, ['jira'])

    // 只应安装 jira 相关的 MCP skill
    expect(installedSkillIds).toHaveLength(1)
    expect(installedSkillIds).toContain('deepstorm-mcp-jira-read')
    expect(installedSkillIds).not.toContain('deepstorm-mcp-figma-read')
    expect(installedSkillIds).not.toContain('deepstorm-mcp-feishu-wiki-read')

    const targetSkillsDir = path.join(tmpDir, '.claude', 'skills')
    expect(fs.existsSync(path.join(targetSkillsDir, 'deepstorm-mcp-jira-read', 'SKILL.md'))).toBe(true)
    expect(fs.existsSync(path.join(targetSkillsDir, 'deepstorm-mcp-figma-read', 'SKILL.md'))).toBe(false)
    expect(fs.existsSync(path.join(targetSkillsDir, 'deepstorm-mcp-feishu-wiki-read', 'SKILL.md'))).toBe(false)
  })

  it('skips MCP skills when no MCP services are selected', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: 'Reef', description: '' },
      },
      wizards: {
        reef: {
          tool: 'reef',
          label: 'Reef',
          description: '',
          mcpSkills: ['deepstorm-mcp-jira-read', 'deepstorm-mcp-figma-read'],
          questions: [],
        },
      },
      skills: {},
    }
    const reader = new RegistryReader(registry)
    const installedSkillIds: string[] = []

    // selectedMcpTools 为空数组 → 不安装任何 MCP 技能
    installMcpSkills(['reef'], reader, tmpDir, tmpDir, installedSkillIds, [])

    expect(installedSkillIds).toHaveLength(0)
    const targetSkillsDir = path.join(tmpDir, '.claude', 'skills')
    expect(fs.existsSync(targetSkillsDir)).toBe(false)
  })
})

describe('shouldInstallGlobalHooks', () => {
  const registryWithHooks: Registry = {
    version: '1',
    tools: {
      reef: { label: 'Reef', description: '' },
      tide: { label: 'Tide', description: '' },
      atoll: { label: 'Atoll', description: '' },
    },
    wizards: {},
    skills: {},
    toolAssets: {
      reef: {
        hooks: ['reef-auto-format.sh'],
      },
    },
  }

  const registryWithoutHooks: Registry = {
    version: '1',
    tools: { tide: { label: 'Tide', description: '' } },
    wizards: {},
    skills: {},
  }

  it('returns true when any selected tool has hooks', () => {
    const reader = new RegistryReader(registryWithHooks)
    expect(shouldInstallGlobalHooks(['reef'], reader)).toBe(true)
  })

  it('returns true when multiple tools and at least one has hooks', () => {
    const reader = new RegistryReader(registryWithHooks)
    expect(shouldInstallGlobalHooks(['tide', 'reef'], reader)).toBe(true)
  })

  it('returns false when selected tools have no hooks', () => {
    const reader = new RegistryReader(registryWithoutHooks)
    expect(shouldInstallGlobalHooks(['tide'], reader)).toBe(false)
  })

  it('returns false when a tool with hooks is not selected', () => {
    const reader = new RegistryReader(registryWithHooks)
    expect(shouldInstallGlobalHooks(['tide', 'atoll'], reader)).toBe(false)
  })

  it('returns false for empty tool list', () => {
    const reader = new RegistryReader(registryWithHooks)
    expect(shouldInstallGlobalHooks([], reader)).toBe(false)
  })
})

describe('writeEnabledMcpJsonServers', () => {
  let tmpDir: string
  let settingsPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enabled-mcp-test-'))
    settingsPath = path.join(tmpDir, '.claude', 'settings.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes enabledMcpjsonServers to a new file', () => {
    const servers = ['deepstorm-github', 'deepstorm-jira']
    writeEnabledMcpJsonServers(settingsPath, servers)

    expect(fs.existsSync(settingsPath)).toBe(true)
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.enabledMcpjsonServers).toEqual(servers)
  })

  it('preserves existing top-level fields', () => {
    // Pre-write a file with an existing field
    const existing: Record<string, unknown> = {
      deepstorm: { installedSkills: ['reef-style'] },
    }
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

    const servers = ['deepstorm-github']
    writeEnabledMcpJsonServers(settingsPath, servers)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.enabledMcpjsonServers).toEqual(servers)
    // deepstorm namespace should be untouched
    expect(content.deepstorm).toEqual({ installedSkills: ['reef-style'] })
  })

  it('replaces enabledMcpjsonServers on subsequent calls', () => {
    writeEnabledMcpJsonServers(settingsPath, ['deepstorm-github'])
    writeEnabledMcpJsonServers(settingsPath, ['deepstorm-jira', 'deepstorm-figma'])

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.enabledMcpjsonServers).toEqual(['deepstorm-jira', 'deepstorm-figma'])
  })

  it('is a no-op when serverNames is empty', () => {
    writeEnabledMcpJsonServers(settingsPath, [])

    expect(fs.existsSync(settingsPath)).toBe(false)
  })

  it('recovers from a corrupt file', () => {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, '{invalid json', 'utf-8')

    writeEnabledMcpJsonServers(settingsPath, ['deepstorm-github'])

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.enabledMcpjsonServers).toEqual(['deepstorm-github'])
  })
})

describe('mergeSettingsMcpServers', () => {
  let tmpDir: string
  let settingsPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-mcp-settings-test-'))
    settingsPath = path.join(tmpDir, '.claude', 'settings.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes mcpServers to a new settings file', () => {
    const servers = {
      'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' },
      'deepstorm-github': { type: 'http', url: 'http://localhost:54322/mcp' },
    }
    mergeSettingsMcpServers(settingsPath, servers)

    expect(fs.existsSync(settingsPath)).toBe(true)
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.mcpServers).toEqual(servers)
  })

  it('preserves existing top-level fields', () => {
    // Pre-write a file with existing fields
    const existing: Record<string, unknown> = {
      deepstorm: { installedSkills: ['sweep-run'] },
      enabledMcpjsonServers: ['deepstorm-playwright'],
    }
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

    const servers = { 'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' } }
    mergeSettingsMcpServers(settingsPath, servers)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.deepstorm).toEqual({ installedSkills: ['sweep-run'] })
    expect(content.enabledMcpjsonServers).toEqual(['deepstorm-playwright'])
    expect(content.mcpServers).toEqual(servers)
  })

  it('merges new servers into existing mcpServers without overwriting unrelated ones', () => {
    const existing: Record<string, unknown> = {
      mcpServers: { 'deepstorm-github': { type: 'http', url: 'http://localhost:54322/mcp' } },
    }
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

    const newServers = { 'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' } }
    mergeSettingsMcpServers(settingsPath, newServers)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.mcpServers).toEqual({
      'deepstorm-github': { type: 'http', url: 'http://localhost:54322/mcp' },
      'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' },
    })
  })

  it('overwrites existing server config when same key is merged', () => {
    const existing: Record<string, unknown> = {
      mcpServers: { 'deepstorm-playwright': { type: 'sse', url: 'http://localhost:9999/mcp' } },
    }
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

    const newServers = { 'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' } }
    mergeSettingsMcpServers(settingsPath, newServers)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.mcpServers).toEqual({
      'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' },
    })
  })

  it('is a no-op when servers object is empty', () => {
    mergeSettingsMcpServers(settingsPath, {})

    expect(fs.existsSync(settingsPath)).toBe(false)
  })

  it('is a no-op when servers is null or undefined', () => {
    mergeSettingsMcpServers(settingsPath, null as unknown as Record<string, unknown>)

    expect(fs.existsSync(settingsPath)).toBe(false)
  })

  it('recovers from a corrupt file', () => {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, '{invalid json', 'utf-8')

    const servers = { 'deepstorm-playwright': { type: 'sse', url: 'http://localhost:54321/mcp' } }
    mergeSettingsMcpServers(settingsPath, servers)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.mcpServers).toEqual(servers)
  })
})

describe('mergeSandboxDisabled', () => {
  let tmpDir: string
  let settingsPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-disabled-test-'))
    settingsPath = path.join(tmpDir, '.claude', 'settings.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes sandbox disabled to a new settings file', () => {
    mergeSandboxDisabled(settingsPath)

    expect(fs.existsSync(settingsPath)).toBe(true)
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.sandbox).toEqual({ enabled: false })
  })

  it('preserves existing top-level fields', () => {
    const existing: Record<string, unknown> = {
      deepstorm: { installedSkills: ['sweep-run'] },
      enabledMcpjsonServers: ['deepstorm-playwright'],
    }
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

    mergeSandboxDisabled(settingsPath)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.deepstorm).toEqual({ installedSkills: ['sweep-run'] })
    expect(content.enabledMcpjsonServers).toEqual(['deepstorm-playwright'])
    expect(content.sandbox).toEqual({ enabled: false })
  })

  it('overwrites sandbox setting on subsequent calls', () => {
    // First call sets up the file
    mergeSandboxDisabled(settingsPath)

    // Simulate an intervening change to sandbox
    const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    existing.sandbox = { enabled: true, extra: 'field' }
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8')

    // Second call should reset
    mergeSandboxDisabled(settingsPath)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.sandbox).toEqual({ enabled: false })
  })

  it('recovers from a corrupt file', () => {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, '{invalid json', 'utf-8')

    mergeSandboxDisabled(settingsPath)

    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.sandbox).toEqual({ enabled: false })
  })

  it('works when parent directory does not exist', () => {
    // settingsPath is in a non-existent directory tree
    mergeSandboxDisabled(settingsPath)

    expect(fs.existsSync(settingsPath)).toBe(true)
    const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(content.sandbox).toEqual({ enabled: false })
  })
})

describe('copyFragmentsForSkill', () => {
  let tmpDir: string
  let srcDir: string
  let targetDir: string

  const sampleRegistry: Registry = {
    version: '1',
    tools: {},
    wizards: {
      reef: {
        tool: 'reef',
        label: 'Reef',
        description: '',
        questions: [
          {
            key: 'reef.frontend.framework',
            label: '前端框架',
            type: 'select',
            options: [
              {
                value: 'react',
                label: 'React',
                template: {},
                fragments: ['framework/react'],
              },
              {
                value: 'vue',
                label: 'Vue',
                template: {},
                fragments: ['framework/vue'],
              },
            ],
          },
        ],
      },
    },
    skills: {},
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fragments-test-'))
    srcDir = path.join(tmpDir, 'src')
    targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(path.join(srcDir, 'fragments', 'framework', 'react'), { recursive: true })
    fs.mkdirSync(path.join(srcDir, 'fragments', 'framework', 'vue'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('copies quick-reference.md for selected fragment', () => {
    fs.writeFileSync(path.join(srcDir, 'fragments', 'framework', 'react', 'quick-reference.md'), '# React Ref', 'utf-8')

    copyFragmentsForSkill('reef-lint', srcDir, { 'reef.frontend.framework': 'react' }, sampleRegistry, targetDir)

    expect(fs.existsSync(path.join(targetDir, 'react.md'))).toBe(true)
    expect(fs.readFileSync(path.join(targetDir, 'react.md'), 'utf-8')).toBe('# React Ref')
  })

  it('copies examples with value-prefixed filenames', () => {
    const examplesDir = path.join(srcDir, 'fragments', 'framework', 'react', 'examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, 'App.tsx'), '// React App', 'utf-8')

    copyFragmentsForSkill('reef-lint', srcDir, { 'reef.frontend.framework': 'react' }, sampleRegistry, targetDir)

    const targetExamplesDir = path.join(targetDir, 'examples')
    expect(fs.existsSync(path.join(targetExamplesDir, 'react-App.tsx'))).toBe(true)
    expect(fs.readFileSync(path.join(targetExamplesDir, 'react-App.tsx'), 'utf-8')).toBe('// React App')
  })

  it('does nothing when fragments directory does not exist', () => {
    // No fragments dir in srcDir
    copyFragmentsForSkill('reef-lint', path.join(tmpDir, 'empty-src'), { 'reef.frontend.framework': 'react' }, sampleRegistry, tmpDir)
    expect(fs.existsSync(path.join(tmpDir, 'react.md'))).toBe(false)
  })

  it('does nothing when no fragments are selected by config', () => {
    fs.writeFileSync(path.join(srcDir, 'fragments', 'framework', 'react', 'quick-reference.md'), '# React Ref', 'utf-8')

    // Config has none for the fragment value
    copyFragmentsForSkill('reef-lint', srcDir, { 'reef.frontend.framework': 'none' }, sampleRegistry, targetDir)

    expect(fs.existsSync(path.join(targetDir, 'react.md'))).toBe(false)
  })

  it('skips .DS_Store in examples directory', () => {
    const examplesDir = path.join(srcDir, 'fragments', 'framework', 'react', 'examples')
    fs.mkdirSync(examplesDir, { recursive: true })
    fs.writeFileSync(path.join(examplesDir, '.DS_Store'), 'binary', 'utf-8')
    fs.writeFileSync(path.join(examplesDir, 'App.tsx'), '// React App', 'utf-8')

    copyFragmentsForSkill('reef-lint', srcDir, { 'reef.frontend.framework': 'react' }, sampleRegistry, targetDir)

    const targetExamplesDir = path.join(targetDir, 'examples')
    expect(fs.existsSync(path.join(targetExamplesDir, 'react-.DS_Store'))).toBe(false)
    expect(fs.existsSync(path.join(targetExamplesDir, 'react-App.tsx'))).toBe(true)
  })
})

describe('copyReferencesForSkill', () => {
  let tmpDir: string
  let srcDir: string
  let targetDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'references-test-'))
    srcDir = path.join(tmpDir, 'src')
    targetDir = path.join(tmpDir, 'target')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('copies references/ directory recursively when it exists', () => {
    const refDir = path.join(srcDir, 'references')
    fs.mkdirSync(refDir, { recursive: true })
    fs.writeFileSync(path.join(refDir, 'role-prompts.md'), '# Role Prompts', 'utf-8')
    fs.writeFileSync(path.join(refDir, 'data-format.md'), '# Data Format', 'utf-8')

    copyReferencesForSkill(srcDir, targetDir)

    expect(fs.existsSync(path.join(targetDir, 'references', 'role-prompts.md'))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, 'references', 'data-format.md'))).toBe(true)
    expect(fs.readFileSync(path.join(targetDir, 'references', 'role-prompts.md'), 'utf-8')).toBe('# Role Prompts')
  })

  it('does nothing when references/ directory does not exist', () => {
    copyReferencesForSkill(srcDir, targetDir)

    expect(fs.existsSync(path.join(targetDir, 'references'))).toBe(false)
  })
})

describe('collectFragmentsFromQuestion', () => {
  let selectedFragments: Array<{ category: string; value: string }>

  beforeEach(() => {
    selectedFragments = []
  })

  it('collects fragment from a single-value option', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'select',
        options: [
          { value: 'a', label: 'A', template: {}, fragments: ['cat/a'] },
        ],
      },
      { x: 'a' },
      selectedFragments,
    )
    expect(selectedFragments).toEqual([{ category: 'cat', value: 'a' }])
  })

  it('collects fragments from multiselect values', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'multiselect',
        options: [
          { value: 'a', label: 'A', template: {}, fragments: ['cat/a'] },
          { value: 'b', label: 'B', template: {}, fragments: ['dog/b'] },
        ],
      },
      { x: 'a,b' },
      selectedFragments,
    )
    expect(selectedFragments).toHaveLength(2)
    expect(selectedFragments).toContainEqual({ category: 'cat', value: 'a' })
    expect(selectedFragments).toContainEqual({ category: 'dog', value: 'b' })
  })

  it('collects fragments from group sub-questions', () => {
    collectFragmentsFromQuestion(
      {
        key: 'g',
        label: 'G',
        type: 'group',
        questions: [
          {
            key: 'g.x',
            label: 'X',
            type: 'select',
            options: [
              { value: 'a', label: 'A', template: {}, fragments: ['cat/a'] },
            ],
          },
        ],
      },
      { 'g.x': 'a' },
      selectedFragments,
    )
    expect(selectedFragments).toHaveLength(1)
    expect(selectedFragments[0]).toEqual({ category: 'cat', value: 'a' })
  })

  it('skips when config value is none', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'select',
        options: [
          { value: 'a', label: 'A', template: {}, fragments: ['cat/a'] },
        ],
      },
      { x: 'none' },
      selectedFragments,
    )
    expect(selectedFragments).toHaveLength(0)
  })

  it('skips when no option matches the config value', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'select',
        options: [
          { value: 'a', label: 'A', template: {}, fragments: ['cat/a'] },
        ],
      },
      { x: 'nonexistent' },
      selectedFragments,
    )
    expect(selectedFragments).toHaveLength(0)
  })

  it('skips options with no fragments', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'select',
        options: [
          { value: 'a', label: 'A', template: {} },
        ],
      },
      { x: 'a' },
      selectedFragments,
    )
    expect(selectedFragments).toHaveLength(0)
  })

  it('handles nested category paths (multi-level)', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'select',
        options: [
          { value: 'a', label: 'A', template: {}, fragments: ['java/framework/spring-boot'] },
        ],
      },
      { x: 'a' },
      selectedFragments,
    )
    expect(selectedFragments).toEqual([{ category: 'java/framework', value: 'spring-boot' }])
  })

  it('skips fragments with fewer than 2 path parts', () => {
    collectFragmentsFromQuestion(
      {
        key: 'x',
        label: 'X',
        type: 'select',
        options: [
          { value: 'a', label: 'A', template: {}, fragments: ['single'] },
        ],
      },
      { x: 'a' },
      selectedFragments,
    )
    expect(selectedFragments).toHaveLength(0)
  })
})
