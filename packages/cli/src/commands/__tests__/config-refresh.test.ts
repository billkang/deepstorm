import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { refreshConfig } from '../config-refresh'
import type { Registry } from '../../types/registry'

const mockRegistry: Registry = {
  version: '1',
  tools: { tide: { label: '产品侧', description: '' } },
  wizards: {},
  skills: {
    'tide-discuss': {
      tool: 'tide',
      name: 'tide-discuss',
      description: 'BMAD 需求讨论',
      hasTemplate: true,
    },
  },
  mcpTools: {
    'feishu-wiki': { domain: 'knowledge-base', label: '飞书知识库', description: '' },
    jira: { domain: 'project-management', label: 'Jira', description: '' },
  },
}

describe('refreshConfig', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-refresh-'))

    // 创建 settings.json（模拟已安装状态）
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: {
          installedSkills: ['tide-discuss'],
          installedMcpServers: ['jira', 'feishu-wiki'],
        },
      }),
      'utf-8',
    )

    // 创建 cliDir（模拟 dist/skills/ 结构）
    const cliSkillsDir = path.join(tmpDir, 'cli', 'skills', 'tide-discuss')
    fs.mkdirSync(cliSkillsDir, { recursive: true })
    fs.writeFileSync(
      path.join(cliSkillsDir, 'SKILL.md.tmpl'),
      `---
name: tide-discuss
deepstorm:
  tool: tide
mcpCapabilities:
  knowledge_base:
    domain: "knowledge-base"
  issue_tracker:
    domain: "project-management"
---
# Tide
Provider: {{tide_capabilities}}`,
      'utf-8',
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('reads settings.json and re-renders skills with latest MCP info', async () => {
    const result = await refreshConfig(
      path.join(tmpDir, 'cli'),
      path.join(tmpDir, '.claude'),
      mockRegistry,
    )

    expect(result.refreshed).toContain('tide-discuss')
    expect(result.errors).toHaveLength(0)

    // Verify rendered SKILL.md exists
    const renderedPath = path.join(tmpDir, '.claude', 'skills', 'tide-discuss', 'SKILL.md')
    expect(fs.existsSync(renderedPath)).toBe(true)

    const content = fs.readFileSync(renderedPath, 'utf-8')
    // {{tide_capabilities}} should be replaced with JSON
    expect(content).not.toContain('{{tide_capabilities}}')
    expect(content).toContain('knowledge_base')
    expect(content).toContain('issue_tracker')
  })

  it('skips skills without .tmpl file', async () => {
    // Create a skill without .tmpl
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json')
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    settings.deepstorm.installedSkills = ['tide-discuss', 'nonexistent-skill']
    fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf-8')

    const result = await refreshConfig(
      path.join(tmpDir, 'cli'),
      path.join(tmpDir, '.claude'),
      mockRegistry,
    )

    expect(result.refreshed).toContain('tide-discuss')
  })

  it('handles missing settings.json gracefully', async () => {
    fs.rmSync(path.join(tmpDir, '.claude', 'settings.json'))

    const result = await refreshConfig(
      path.join(tmpDir, 'cli'),
      path.join(tmpDir, '.claude'),
      mockRegistry,
    )

    expect(result.refreshed).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('handles empty installedSkills gracefully', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json')
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ deepstorm: { installedMcpServers: [] } }),
      'utf-8',
    )

    const result = await refreshConfig(
      path.join(tmpDir, 'cli'),
      path.join(tmpDir, '.claude'),
      mockRegistry,
    )

    expect(result.refreshed).toHaveLength(0)
  })
})
