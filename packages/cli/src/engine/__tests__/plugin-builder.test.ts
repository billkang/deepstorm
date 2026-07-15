import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'
import { buildPlugin } from '../plugin-builder'
import type { Registry } from '../../types/registry'

describe('buildPlugin', () => {
  let tmpDir: string
  let cliDir: string
  const registry: Registry = {
    version: '1',
    tools: {
      reef: { label: 'Reef', description: '开发侧' },
    },
    wizards: {
      reef: {
        tool: 'reef',
        label: 'Reef',
        description: '',
        mcpSkills: [],
        questions: [],
      },
    },
    skills: {},
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-build-test-'))
    cliDir = path.join(tmpDir, 'cli')
    fs.mkdirSync(cliDir, { recursive: true })

    // Create dummy env-examples dir
    const envExamplesDir = path.join(cliDir, 'env-examples')
    fs.mkdirSync(envExamplesDir, { recursive: true })
    fs.writeFileSync(path.join(envExamplesDir, 'github.env-example'), '# GitHub\nGITHUB_TOKEN=xxx', 'utf-8')

    // Create dummy mcp JSON files
    const mcpDir = path.join(cliDir, 'mcp', 'code-hosting')
    fs.mkdirSync(mcpDir, { recursive: true })
    fs.writeFileSync(
      path.join(mcpDir, 'github.json'),
      JSON.stringify({
        name: 'github',
        domain: 'code-hosting',
        label: 'GitHub',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'github-mcp'],
          },
        },
      }),
      'utf-8',
    )

    const mcpDir2 = path.join(cliDir, 'mcp', 'project-management')
    fs.mkdirSync(mcpDir2, { recursive: true })
    fs.writeFileSync(
      path.join(mcpDir2, 'jira.json'),
      JSON.stringify({
        name: 'jira',
        domain: 'project-management',
        label: 'Jira',
        mcpServers: {
          jira: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'jira-mcp'],
          },
        },
      }),
      'utf-8',
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates plugin output directory under .deepstorm/', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    expect(outputDir).toContain('.deepstorm')
    expect(fs.existsSync(outputDir)).toBe(true)
  })

  it('creates .claude-plugin/ directory with plugin.json', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const pluginJsonPath = path.join(outputDir, '.claude-plugin', 'plugin.json')
    expect(fs.existsSync(pluginJsonPath)).toBe(true)
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'))

    expect(pluginJson.name).toBe('deepstorm')
    expect(pluginJson.version).toBe('0.1.0')
    expect(pluginJson.author).toEqual({ name: 'deepstorm' })
    expect(pluginJson.description).toBeDefined()
  })

  it('creates marketplace.json with user-supplied marketplace name', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'my-company',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const marketplacePath = path.join(outputDir, '.claude-plugin', 'marketplace.json')
    expect(fs.existsSync(marketplacePath)).toBe(true)
    const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf-8'))

    expect(marketplace.name).toBe('my-company')
    expect(marketplace.description).toContain('DeepStorm')
    expect(marketplace.plugins).toHaveLength(1)
    expect(marketplace.plugins[0].name).toBe('deepstorm')
  })

  it('creates settings.json with enabledMcpjsonServers', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: ['github', 'jira'],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const settingsPath = path.join(outputDir, 'settings.json')
    expect(fs.existsSync(settingsPath)).toBe(true)
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))

    expect(settings.enabledMcpjsonServers).toBeDefined()
    expect(settings.enabledMcpjsonServers).toContain('github')
    expect(settings.enabledMcpjsonServers).toContain('jira')
  })

  it('creates .env when MCP tools are selected', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: ['github'],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const envPath = path.join(tmpDir, '.env')
    expect(fs.existsSync(envPath)).toBe(true)
    expect(fs.readFileSync(envPath, 'utf-8')).toContain('GITHUB')
  })

  it('does not create .env when no MCP tools selected', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const envPath = path.join(tmpDir, '.env')
    expect(fs.existsSync(envPath)).toBe(false)
  })

  it('creates .mcp.json with selected MCP server configurations', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: ['github', 'jira'],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const mcpJsonPath = path.join(outputDir, '.mcp.json')
    expect(fs.existsSync(mcpJsonPath)).toBe(true)
    const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'))

    expect(mcpJson.mcpServers).toBeDefined()
    expect(mcpJson.mcpServers['deepstorm-github']).toBeDefined()
    expect(mcpJson.mcpServers['deepstorm-github'].command).toBe('npx')
    expect(mcpJson.mcpServers['deepstorm-jira']).toBeDefined()
  })

  it('does not create .mcp.json when no MCP tools selected', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const mcpJsonPath = path.join(outputDir, '.mcp.json')
    expect(fs.existsSync(mcpJsonPath)).toBe(false)
  })

  it('creates README.md and CHANGELOG.md', async () => {
    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: ['github'],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    expect(fs.existsSync(path.join(outputDir, 'README.md'))).toBe(true)
    expect(fs.existsSync(path.join(outputDir, 'CHANGELOG.md'))).toBe(true)
  })

  it('reads version from root package.json', async () => {
    // Create a root package.json with specific version
    const rootPkgPath = path.join(tmpDir, 'package.json')
    fs.writeFileSync(rootPkgPath, JSON.stringify({ name: 'deepstorm', version: '1.2.3' }), 'utf-8')

    const outputDir = await buildPlugin({
      marketplaceName: 'test',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const pluginJsonPath = path.join(outputDir, '.claude-plugin', 'plugin.json')
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'))

    expect(pluginJson.version).toBe('1.2.3')
  })

  it('reads description from root package.json', async () => {
    // Create a root package.json with a custom description
    const rootPkgPath = path.join(tmpDir, 'package.json')
    fs.writeFileSync(rootPkgPath, JSON.stringify({
      name: 'deepstorm',
      version: '0.1.0',
      description: 'Custom DeepStorm description from package.json',
    }), 'utf-8')

    const outputDir = await buildPlugin({
      marketplaceName: 'example-orgg',
      tools: ['reef'],
      config: {},
      selectedMcpTools: [],
      cliDir,
      targetDir: tmpDir,
      registry,
    })

    const pluginJsonPath = path.join(outputDir, '.claude-plugin', 'plugin.json')
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'))

    expect(pluginJson.description).toBe('Custom DeepStorm description from package.json')
  })
})
