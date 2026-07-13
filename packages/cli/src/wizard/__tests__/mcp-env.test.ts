import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { getMcpEnvStubs, collectEnvSections, isMcpFullyConfigured, parseEnvExampleFile } from '../mcp-env'

const GITHUB_EXAMPLE = [
  '# ═══════════════════════════',
  '# GitHub MCP 服务器',
  '# ═══════════════════════════',
  'GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx',
  '',
].join('\n')

const JIRA_EXAMPLE = [
  '# ═══════════════════════════',
  '# Jira MCP 服务器',
  '# ═══════════════════════════',
  'JIRA_INSTANCE_URL=https://example.atlassian.net',
  'JIRA_USER_EMAIL=user@example.com',
  'JIRA_API_KEY=token',
  '',
].join('\n')

const CONTEXT7_EXAMPLE = [
  '# ═══════════════════════════',
  '# Context7 API Key',
  '# ═══════════════════════════',
  'CONTEXT7_API_KEY=ctx7sk_xxx',
  '',
].join('\n')

describe('getMcpEnvStubs', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-mcp-env-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('reads stubs from env-example files', () => {
    fs.writeFileSync(path.join(tmpDir, 'jira.env-example'), JIRA_EXAMPLE, 'utf-8')
    const stubs = getMcpEnvStubs(['jira'], tmpDir)
    expect(stubs).toHaveLength(3)
    expect(stubs[0].key).toBe('JIRA_INSTANCE_URL')
    expect(stubs[1].key).toBe('JIRA_USER_EMAIL')
    expect(stubs[2].key).toBe('JIRA_API_KEY')
  })

  it('returns stubs for multiple tools', () => {
    fs.writeFileSync(path.join(tmpDir, 'github.env-example'), GITHUB_EXAMPLE, 'utf-8')
    fs.writeFileSync(path.join(tmpDir, 'jira.env-example'), JIRA_EXAMPLE, 'utf-8')
    const stubs = getMcpEnvStubs(['github', 'jira'], tmpDir)
    expect(stubs).toHaveLength(4)
    const keys = stubs.map((s) => s.key)
    expect(keys).toContain('GITHUB_PERSONAL_ACCESS_TOKEN')
    expect(keys).toContain('JIRA_API_KEY')
  })

  it('returns empty array when examplesDir is undefined', () => {
    const stubs = getMcpEnvStubs(['jira'])
    expect(stubs).toEqual([])
  })

  it('returns empty array for unknown tool (no file)', () => {
    const stubs = getMcpEnvStubs(['unknown-tool'], tmpDir)
    expect(stubs).toEqual([])
  })

  it('returns empty array for empty input', () => {
    const stubs = getMcpEnvStubs([], tmpDir)
    expect(stubs).toEqual([])
  })
})

describe('parseEnvExampleFile (exported)', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-parse-env-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('解析 .env-example 文件返回 key 和 comment', () => {
    const filePath = path.join(tmpDir, 'test.env-example')
    fs.writeFileSync(filePath, [
      '# 测试服务',
      'TEST_KEY=value1',
      '# 另一项配置',
      'ANOTHER_KEY=value2',
    ].join('\n'), 'utf-8')

    const entries = parseEnvExampleFile(filePath)
    expect(entries).toHaveLength(2)
    expect(entries[0].key).toBe('TEST_KEY')
    expect(entries[0].comment).toBe('测试服务')
    expect(entries[1].key).toBe('ANOTHER_KEY')
    expect(entries[1].comment).toBe('另一项配置')
  })

  it('文件不存在时返回空数组', () => {
    const entries = parseEnvExampleFile('/nonexistent/path')
    expect(entries).toEqual([])
  })
})

describe('isMcpFullyConfigured', () => {
  let tmpDir: string
  let examplesDir: string
  let dotEnvPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-mcp-check-'))
    examplesDir = path.join(tmpDir, 'env-examples')
    dotEnvPath = path.join(tmpDir, '.env')
    fs.mkdirSync(examplesDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('所有 key 在 .env 中有非默认值时返回 true', () => {
    fs.writeFileSync(
      path.join(examplesDir, 'test.env-example'),
      'TEST_API_KEY=your_key_here\nTEST_URL=https://default.example.com\n',
      'utf-8',
    )
    fs.writeFileSync(dotEnvPath, 'TEST_API_KEY=real_key_123\nTEST_URL=https://my.company.com\n', 'utf-8')

    expect(isMcpFullyConfigured('test', examplesDir, dotEnvPath)).toBe(true)
  })

  it('某 key 仍是默认值时返回 false', () => {
    fs.writeFileSync(
      path.join(examplesDir, 'test.env-example'),
      'TEST_API_KEY=your_key_here\n',
      'utf-8',
    )
    fs.writeFileSync(dotEnvPath, 'TEST_API_KEY=your_key_here\n', 'utf-8')

    expect(isMcpFullyConfigured('test', examplesDir, dotEnvPath)).toBe(false)
  })

  it('某 key 在 .env 中不存在时返回 false', () => {
    fs.writeFileSync(
      path.join(examplesDir, 'test.env-example'),
      'TEST_API_KEY=your_key_here\nTEST_URL=https://default.com\n',
      'utf-8',
    )
    fs.writeFileSync(dotEnvPath, 'TEST_API_KEY=my_real_key\n', 'utf-8')

    expect(isMcpFullyConfigured('test', examplesDir, dotEnvPath)).toBe(false)
  })

  it('无 .env-example 文件时返回 true（无需配置）', () => {
    expect(isMcpFullyConfigured('nonexistent', examplesDir, dotEnvPath)).toBe(true)
  })

  it('空 .env-example 文件时返回 true', () => {
    fs.writeFileSync(path.join(examplesDir, 'test.env-example'), '', 'utf-8')
    expect(isMcpFullyConfigured('test', examplesDir, dotEnvPath)).toBe(true)
  })

  it('无 .env 文件且 env-example 有 key 时返回 false', () => {
    fs.writeFileSync(
      path.join(examplesDir, 'test.env-example'),
      'TEST_API_KEY=your_key_here\n',
      'utf-8',
    )
    expect(isMcpFullyConfigured('test', examplesDir, dotEnvPath)).toBe(false)
  })
})

describe('collectEnvSections', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-env-sections-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns sections for selected tools', () => {
    fs.writeFileSync(path.join(tmpDir, 'github.env-example'), GITHUB_EXAMPLE, 'utf-8')
    fs.writeFileSync(path.join(tmpDir, 'jira.env-example'), JIRA_EXAMPLE, 'utf-8')

    const sections = collectEnvSections(['github', 'jira'], tmpDir, new Set())
    expect(sections).toHaveLength(2)
    expect(sections[0]).toContain('GITHUB_PERSONAL_ACCESS_TOKEN')
    expect(sections[1]).toContain('JIRA_INSTANCE_URL')
  })

  it('skips sections whose keys already exist', () => {
    fs.writeFileSync(path.join(tmpDir, 'github.env-example'), GITHUB_EXAMPLE, 'utf-8')
    fs.writeFileSync(path.join(tmpDir, 'jira.env-example'), JIRA_EXAMPLE, 'utf-8')

    const sections = collectEnvSections(
      ['github', 'jira'],
      tmpDir,
      new Set(['GITHUB_PERSONAL_ACCESS_TOKEN']),
    )
    expect(sections).toHaveLength(1)
    expect(sections[0]).toContain('JIRA_INSTANCE_URL')
    expect(sections[0]).not.toContain('GITHUB_PERSONAL_ACCESS_TOKEN')
  })

  it('does not include context7 when includeContext7 is false', () => {
    fs.writeFileSync(path.join(tmpDir, 'github.env-example'), GITHUB_EXAMPLE, 'utf-8')
    fs.writeFileSync(path.join(tmpDir, 'context7.env-example'), CONTEXT7_EXAMPLE, 'utf-8')

    const sections = collectEnvSections(['github'], tmpDir, new Set())
    expect(sections).toHaveLength(1)
  })

  it('returns empty array when no tools selected', () => {
    const sections = collectEnvSections([], tmpDir, new Set())
    expect(sections).toEqual([])
  })
})
