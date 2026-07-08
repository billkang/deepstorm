import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { cleanInstalled } from '../reconfigure'

describe('cleanInstalled', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-reconfigure-'))
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeSettings(json: Record<string, unknown>): void {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify(json),
      'utf-8',
    )
  }

  function writeMcp(json: Record<string, unknown>): void {
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), JSON.stringify(json), 'utf-8')
  }

  function readMcp(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'))
  }

  function writeHooksHook(): void {
    const hooksDir = path.join(tmpDir, '.claude', 'hooks')
    fs.mkdirSync(hooksDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '.claude', 'hooks.json'), JSON.stringify({ hooks: {} }), 'utf-8')
    fs.writeFileSync(path.join(hooksDir, 'reef-block-dangerous.sh'), 'echo ok', 'utf-8')
  }

  it('应清理 deepstorm-* MCP server 条目，保留其他条目', () => {
    writeSettings({
      deepstorm: {
        installedMcpServers: ['jira', 'github'],
        installedSkills: [],
      },
    })
    writeMcp({
      mcpServers: {
        'deepstorm-jira': { command: 'npx', args: ['-y', 'jira-mcp'] },
        'deepstorm-github': { command: 'docker', args: ['run'] },
        'user-manual': { command: 'python', args: ['manual.py'] },
      },
    })

    cleanInstalled(tmpDir)

    const mcp = readMcp()
    expect(mcp.mcpServers).not.toHaveProperty('deepstorm-jira')
    expect(mcp.mcpServers).not.toHaveProperty('deepstorm-github')
    expect((mcp.mcpServers as any)['user-manual']).toBeDefined()
  })

  it('无 mcpServers 时不应报错', () => {
    writeSettings({
      deepstorm: {
        installedMcpServers: ['jira'],
        installedSkills: [],
      },
    })
    writeMcp({})

    expect(() => cleanInstalled(tmpDir)).not.toThrow()
  })

  it('无 installedMcpServers 时不应修改 .mcp.json', () => {
    writeSettings({
      deepstorm: {
        installedSkills: [],
      },
    })
    writeMcp({
      mcpServers: {
        'deepstorm-jira': { command: 'npx', args: [] },
      },
    })

    cleanInstalled(tmpDir)

    const mcp = readMcp()
    expect((mcp.mcpServers as any)['deepstorm-jira']).toBeDefined()
  })

  it('settings.json 不存在时不应报错', () => {
    expect(() => cleanInstalled(tmpDir)).not.toThrow()
  })

  it('.mcp.json 不存在时不应报错', () => {
    writeSettings({
      deepstorm: {
        installedMcpServers: ['jira'],
        installedSkills: [],
      },
    })

    expect(() => cleanInstalled(tmpDir)).not.toThrow()
  })

  it('应清理 .mcp.json 中所有 deepstorm-* 前缀条目，含服务名与 MCP JSON 中 serverName 不同的情况', () => {
    writeSettings({
      deepstorm: {
        installedMcpServers: ['jira', 'feishu-wiki'],
        installedSkills: [],
      },
    })
    writeMcp({
      mcpServers: {
        'deepstorm-jira': { command: 'npx', args: [] },
        // feishu-wiki 的 mcpServers key 是 "feishu-wiki"，所以 deepstormm key 是 "deepstorm-feishu-wiki"
        'deepstorm-feishu-wiki': { command: 'npx', args: [] },
        'user-manual': { command: 'python', args: [] },
      },
    })

    cleanInstalled(tmpDir)

    const mcp = readMcp()
    expect(mcp.mcpServers).not.toHaveProperty('deepstorm-jira')
    expect(mcp.mcpServers).not.toHaveProperty('deepstorm-feishu-wiki')
    expect((mcp.mcpServers as any)['user-manual']).toBeDefined()
  })

  it('应清理已安装的 hooks（.claude/hooks.json + .claude/hooks/ 脚本）', () => {
    writeSettings({
      deepstorm: {
        installedMcpServers: [],
        installedSkills: ['reef'],
      },
    })
    writeHooksHook()

    cleanInstalled(tmpDir)

    const hooksRootJson = path.join(tmpDir, '.claude', 'hooks.json')
    expect(fs.existsSync(hooksRootJson)).toBe(false)
    const hooksDir = path.join(tmpDir, '.claude', 'hooks')
    expect(fs.existsSync(hooksDir)).toBe(false)
  })

  it('hooks 目录不存在时不应报错', () => {
    writeSettings({
      deepstorm: {
        installedMcpServers: [],
        installedSkills: ['reef'],
      },
    })

    expect(() => cleanInstalled(tmpDir)).not.toThrow()
  })

  it('无 deepstorm 命名空间时不应清理 hooks', () => {
    writeSettings({ other: true })
    writeHooksHook()

    cleanInstalled(tmpDir)

    const hooksRootJson = path.join(tmpDir, '.claude', 'hooks.json')
    expect(fs.existsSync(hooksRootJson)).toBe(true)
    const hooksDir = path.join(tmpDir, '.claude', 'hooks')
    expect(fs.existsSync(hooksDir)).toBe(true)
  })
})
