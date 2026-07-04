import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { runDoctor } from '../doctor'

function tmpDir(): string {
  return path.join(process.env.TMPDIR || '/tmp', `.doctor-test-${Date.now()}`)
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

describe('runDoctor', () => {
  let testDir: string

  beforeEach(() => {
    testDir = tmpDir()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('应当报告未配置的状态（warn）', () => {
    const report = runDoctor(testDir)
    expect(report.healthy).toBe(false)

    const warnChecks = report.checks.filter((c) => c.status === 'warn')
    expect(warnChecks.length).toBeGreaterThanOrEqual(1)

    // 应有 CLI 版本号检查（始终通过）
    const versionCheck = report.checks.find((c) => c.name === 'CLI 版本')
    expect(versionCheck).toBeDefined()
    expect(versionCheck!.status).toBe('pass')
  })

  it('应当通过 settings.json 不存在检查', () => {
    const report = runDoctor(testDir)
    const configCheck = report.checks.find((c) => c.name === '配置文件')
    expect(configCheck).toBeDefined()
    expect(configCheck!.status).toBe('warn')
    expect(configCheck!.message).toContain('不存在')
  })

  it('应当检测 deepstorm 命名空间完整（pass）', () => {
    writeFile(
      path.join(testDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: {
          installedSkills: ['reef-react-lint'],
          installedAt: '2024-01-01T00:00:00.000Z',
        },
      }),
    )
    const report = runDoctor(testDir)
    const nsCheck = report.checks.find((c) => c.name === 'DeepStorm 命名空间')
    expect(nsCheck).toBeDefined()
    expect(nsCheck!.status).toBe('pass')
  })

  it('应当检测 settings.json 格式错误（fail）', () => {
    writeFile(path.join(testDir, '.claude', 'settings.json'), 'invalid json')
    const report = runDoctor(testDir)
    const configCheck = report.checks.find((c) => c.name === '配置文件')
    expect(configCheck).toBeDefined()
    expect(configCheck!.status).toBe('fail')
  })

  it('应当检测缺少的依赖 skill（warn）', () => {
    writeFile(
      path.join(testDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: {
          installedSkills: ['missing-skill-a', 'missing-skill-b'],
          installedAt: '2024-01-01T00:00:00.000Z',
        },
      }),
    )
    // 创建非空的 skills 目录但不包含 installedSkills 中的目录
    fs.mkdirSync(path.join(testDir, '.claude', 'skills', 'other-skill'), { recursive: true })
    writeFile(
      path.join(testDir, '.claude', 'skills', 'other-skill', 'SKILL.md'),
      '---\nname: other\n---',
    )

    const report = runDoctor(testDir)
    const depCheck = report.checks.find((c) => c.name === '依赖完整性')
    expect(depCheck).toBeDefined()
    expect(depCheck!.status).toBe('warn')
    expect(depCheck!.message).toContain('missing-skill-a')
    expect(depCheck!.message).toContain('missing-skill-b')
  })

  it('应当检测 skill frontmatter 有效性', () => {
    // 创建一个有效和一个无效的 skill
    const skillsDir = path.join(testDir, '.claude', 'skills')
    fs.mkdirSync(path.join(skillsDir, 'valid-skill'), { recursive: true })
    writeFile(
      path.join(skillsDir, 'valid-skill', 'SKILL.md'),
      '---\nname: valid\ndescription: a valid skill\n---\n\n# Content',
    )
    fs.mkdirSync(path.join(skillsDir, 'invalid-skill'), { recursive: true })
    writeFile(path.join(skillsDir, 'invalid-skill', 'SKILL.md'), 'no frontmatter here')

    const report = runDoctor(testDir)
    const fmCheck = report.checks.find((c) => c.name === 'Skill Frontmatter')
    expect(fmCheck).toBeDefined()
    expect(fmCheck!.status).toBe('warn')
    expect(fmCheck!.message).toContain('1 个有效')
    expect(fmCheck!.message).toContain('1 个无效')
  })

  it('应当检测 .mcp.json 完整性', () => {
    writeFile(
      path.join(testDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          jira: { type: 'http', url: 'https://jira.example.com' },
        },
      }),
    )
    const report = runDoctor(testDir)
    const mcpCheck = report.checks.find((c) => c.name === 'MCP 服务器')
    expect(mcpCheck).toBeDefined()
    expect(mcpCheck!.status).toBe('pass')
    expect(mcpCheck!.message).toContain('1 个服务器')
  })

  it('应当检测 MCP 安装一致性 — 已记录服务在 .mcp.json 中缺失', () => {
    writeFile(
      path.join(testDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: {
          installedAt: '2024-01-01T00:00:00.000Z',
          installedMcpServers: ['jira', 'github'],
        },
      }),
    )
    // .mcp.json 中只包含 github，缺 jira
    writeFile(
      path.join(testDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'deepstorm-github': { command: 'npx', args: [] },
        },
      }),
    )
    const report = runDoctor(testDir)
    const consistencyCheck = report.checks.find((c) => c.name === 'MCP 一致性')
    expect(consistencyCheck).toBeDefined()
    expect(consistencyCheck!.status).toBe('warn')
    expect(consistencyCheck!.message).toContain('jira')
  })

  it('MCP 一致性检查通过 — 所有已记录服务均存在于 .mcp.json', () => {
    writeFile(
      path.join(testDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: {
          installedAt: '2024-01-01T00:00:00.000Z',
          installedMcpServers: ['figma'],
        },
      }),
    )
    writeFile(
      path.join(testDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'deepstorm-figma': { command: 'npx', args: [] },
        },
      }),
    )
    const report = runDoctor(testDir)
    const consistencyCheck = report.checks.find((c) => c.name === 'MCP 一致性')
    expect(consistencyCheck).toBeDefined()
    expect(consistencyCheck!.status).toBe('pass')
  })
})
