import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'

// Mock renderToolAssets 和 installMcpSkills 以避免 setup.ts 的文件系统依赖
vi.mock('../setup', () => ({
  renderToolAssets: vi.fn().mockReturnValue([]),
  installMcpSkills: vi.fn(),
}))

// Mock mergeHooks
vi.mock('../../merger/hooks', () => ({
  mergeHooks: vi.fn(),
}))

import {
  computeFileChecksum,
  computeDirChecksums,
  backupFile,
  syncToolAssets,
} from '../template-upgrade'
import { installMcpSkills as mockInstallMcpSkills } from '../setup'

// ─── computeFileChecksum ──────────────────────────────────────────

describe('computeFileChecksum', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-test-checksum-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('应对存在的文件返回 SHA256 摘要', () => {
    const filePath = path.join(tmpDir, 'test.txt')
    fs.writeFileSync(filePath, 'hello world', 'utf-8')
    const hash = computeFileChecksum(filePath)
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
  })

  it('应对空文件返回正确 SHA256', () => {
    const filePath = path.join(tmpDir, 'empty.txt')
    fs.writeFileSync(filePath, '', 'utf-8')
    const hash = computeFileChecksum(filePath)
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('文件不存在应返回 null', () => {
    const hash = computeFileChecksum(path.join(tmpDir, 'nonexistent.txt'))
    expect(hash).toBeNull()
  })

  it('不同内容应产生不同摘要', () => {
    const a = path.join(tmpDir, 'a.txt')
    const b = path.join(tmpDir, 'b.txt')
    fs.writeFileSync(a, 'hello', 'utf-8')
    fs.writeFileSync(b, 'world', 'utf-8')
    expect(computeFileChecksum(a)).not.toBe(computeFileChecksum(b))
  })
})

// ─── backupFile ───────────────────────────────────────────────────

describe('backupFile', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-test-backup-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('应备份文件并返回备份文件名', () => {
    const filePath = path.join(tmpDir, 'test.md')
    fs.writeFileSync(filePath, 'original content', 'utf-8')
    const bakName = backupFile(filePath)
    expect(bakName).not.toBeNull()
    expect(bakName).toMatch(/^test\.\d+\.bak$/)
    // 原始文件保留
    expect(fs.existsSync(filePath)).toBe(true)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('original content')
    // 备份文件存在
    const bakPath = path.join(tmpDir, bakName!)
    expect(fs.existsSync(bakPath)).toBe(true)
    expect(fs.readFileSync(bakPath, 'utf-8')).toBe('original content')
  })

  it('文件不存在时应返回 null', () => {
    const result = backupFile(path.join(tmpDir, 'nonexistent.txt'))
    expect(result).toBeNull()
  })

  it('备份不修改原始文件内容', () => {
    const filePath = path.join(tmpDir, 'test.md')
    fs.writeFileSync(filePath, 'original', 'utf-8')
    backupFile(filePath)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('original')
  })
})

// ─── computeDirChecksums ──────────────────────────────────────────

describe('computeDirChecksums', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-test-dirsum-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('应返回目录下所有文件的相对路径和摘要', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'aaa', 'utf-8')
    fs.mkdirSync(path.join(tmpDir, 'sub'))
    fs.writeFileSync(path.join(tmpDir, 'sub', 'b.txt'), 'bbb', 'utf-8')
    fs.writeFileSync(path.join(tmpDir, '.DS_Store'), '', 'utf-8')

    const result = computeDirChecksums(tmpDir)
    expect(result['.DS_Store']).toBeUndefined()
    expect(result['a.txt']).toBeDefined()
    expect(result['sub/b.txt']).toBeDefined()
    expect(Object.keys(result).length).toBe(2)
  })

  it('目录不存在应返回空对象', () => {
    const result = computeDirChecksums(path.join(tmpDir, 'nonexistent'))
    expect(result).toEqual({})
  })

  it('空目录应返回空对象', () => {
    const result = computeDirChecksums(tmpDir)
    expect(result).toEqual({})
  })
})

// ─── syncToolAssets (边缘情况) ─────────────────────────────────────

describe('syncToolAssets', () => {
  let tmpDir: string
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-test-sync-'))
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    consoleLogSpy.mockRestore()
  })

  it('registry.json 不存在时应返回空报告', () => {
    const cliDir = path.join(tmpDir, 'dist')
    fs.mkdirSync(cliDir, { recursive: true })

    const report = syncToolAssets(cliDir, tmpDir, ['tide-discuss'])
    expect(report.syncedSkills).toEqual([])
    expect(report.syncedAgents).toEqual([])
    expect(report.syncedHooks).toEqual([])
    expect(report.backedUpFiles).toEqual([])
  })

  it('installedSkills 为空时不应抛出异常', () => {
    const cliDir = path.join(tmpDir, 'dist')
    fs.mkdirSync(cliDir, { recursive: true })
    fs.writeFileSync(
      path.join(cliDir, 'registry.json'),
      JSON.stringify({ version: '1', tools: {}, wizards: {}, skills: {} }),
      'utf-8',
    )

    const report = syncToolAssets(cliDir, tmpDir, [])
    expect(report.syncedSkills).toEqual([])
  })

  it('skill ID 无法匹配工具时应返回空报告', () => {
    const cliDir = path.join(tmpDir, 'dist')
    fs.mkdirSync(cliDir, { recursive: true })
    fs.writeFileSync(
      path.join(cliDir, 'registry.json'),
      JSON.stringify({
        version: '1',
        tools: {},
        wizards: {},
        skills: { 'other-skill': { tool: 'other', configKey: 'x', configValue: 'y' } },
        toolAssets: {},
      }),
      'utf-8',
    )

    const report = syncToolAssets(cliDir, tmpDir, ['tide-discuss'])
    expect(report.syncedSkills).toEqual([])
    expect(report.syncedAgents).toEqual([])
    expect(report.syncedHooks).toEqual([])
  })

  it('有效工具应调用 renderToolAssets 并返回报告', async () => {
    const cliDir = path.join(tmpDir, 'dist')
    fs.mkdirSync(cliDir, { recursive: true })

    // 创建 registry.json
    fs.writeFileSync(
      path.join(cliDir, 'registry.json'),
      JSON.stringify({
        version: '1',
        tools: { tide: { label: 'Tide', description: 'Product' } },
        wizards: { tide: { tool: 'tide', label: 'Tide', description: '', questions: [] } },
        skills: {
          'tide-discuss': { tool: 'tide', configKey: 'x', configValue: 'y' },
          'tide-read': { tool: 'tide', configKey: 'x', configValue: 'y' },
        },
        toolAssets: {
          tide: {
            agents: ['tide-agent.md'],
            hooks: ['post-checkout'],
          },
        },
      }),
      'utf-8',
    )

    const report = syncToolAssets(cliDir, tmpDir, ['tide-discuss', 'tide-read'])
    // renderToolAssets 被 mock 返回空数组，所以 syncedSkills 降级为 installedSkillIds
    expect(report.syncedSkills).toEqual(['tide-discuss', 'tide-read'])
    expect(report.syncedAgents).toEqual(['tide-agent.md'])
    expect(report.syncedHooks).toEqual(['post-checkout'])
  })

  it('同步 MCP 技能当用户已安装 MCP 服务时', () => {
    mockInstallMcpSkills.mockImplementation((_tools, _reader, _cliDir, _targetDir, skillIds) => {
      skillIds.push('deepstorm-mcp-jira-read')
    })

    const cliDir = path.join(tmpDir, 'dist')
    fs.mkdirSync(cliDir, { recursive: true })

    fs.writeFileSync(
      path.join(cliDir, 'registry.json'),
      JSON.stringify({
        version: '1',
        tools: { reef: { label: 'Reef', description: '' } },
        wizards: {
          reef: {
            tool: 'reef',
            label: 'Reef',
            description: '',
            mcpSkills: ['deepstorm-mcp-jira-read', 'deepstorm-mcp-figma-read'],
            questions: [],
          },
        },
        skills: {
          'reef-gen-code': { tool: 'reef', configKey: 'x', configValue: 'y' },
        },
        toolAssets: {
          reef: { agents: ['reef-agent.md'], hooks: ['post-checkout'] },
        },
      }),
      'utf-8',
    )

    // settings.json 包含 installedMcpServers，表示用户已配置 jira MCP 服务
    const settingsDir = path.join(tmpDir, '.claude')
    fs.mkdirSync(settingsDir, { recursive: true })
    fs.writeFileSync(
      path.join(settingsDir, 'settings.json'),
      JSON.stringify({
        deepstorm: {
          installedSkills: ['reef-gen-code'],
          installedMcpServers: ['jira'],
        },
      }),
      'utf-8',
    )

    const report = syncToolAssets(cliDir, tmpDir, ['reef-gen-code'])

    // installMcpSkills 被调用，参数正确
    expect(mockInstallMcpSkills).toHaveBeenCalled()
    const callArgs = mockInstallMcpSkills.mock.calls[0]
    expect(callArgs[0]).toEqual(['reef']) // tools
    expect(callArgs[5]).toEqual(['jira']) // selectedMcpTools

    // 报告中应包含 MCP skill ID（由 mock 模拟安装）
    expect(report.syncedSkills).toContain('deepstorm-mcp-jira-read')
    expect(report.syncedSkills).toContain('reef-gen-code')
  })

  it('跳过 MCP 技能当 installedMcpTools 为空时', () => {
    mockInstallMcpSkills.mockReset()

    const cliDir = path.join(tmpDir, 'dist')
    fs.mkdirSync(cliDir, { recursive: true })

    fs.writeFileSync(
      path.join(cliDir, 'registry.json'),
      JSON.stringify({
        version: '1',
        tools: { reef: { label: 'Reef', description: '' } },
        wizards: {
          reef: {
            tool: 'reef',
            label: 'Reef',
            description: '',
            mcpSkills: ['deepstorm-mcp-jira-read'],
            questions: [],
          },
        },
        skills: {
          'reef-gen-code': { tool: 'reef', configKey: 'x', configValue: 'y' },
        },
        toolAssets: {
          reef: { agents: [], hooks: [] },
        },
      }),
      'utf-8',
    )

    // 不创建 settings.json → installedMcpTools 默认为 []
    const report = syncToolAssets(cliDir, tmpDir, ['reef-gen-code'])

    // installMcpSkills 未被调用
    expect(mockInstallMcpSkills).not.toHaveBeenCalled()
    // MCP skill ID 不应出现在报告中
    expect(report.syncedSkills).not.toContain('deepstorm-mcp-jira-read')
  })
})
