import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { printGuide, printMcpEnvStatus } from '../guide'

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn().mockReturnValue(false),
}))

import * as p from '@clack/prompts'

describe('printGuide', () => {
  let tmpDir: string
  let logs: string[]
  const origLog = console.log

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-guide-'))
    logs = []
    console.log = (...args: any[]) => {
      logs.push(args.join(' '))
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.log = origLog
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('prints installed skill list', async () => {
    await printGuide({
      targetDir: tmpDir,
      installedSkills: ['reef-react-lint', 'reef-jira-link'],
      config: { 'reef.frontend.framework': 'react' },
    })
    const output = logs.join(' ')
    expect(output).toContain('reef-react-lint')
    expect(output).toContain('reef-jira-link')
    expect(output).toContain('2 个 skill')
  })

  it('skips skill section for empty list', async () => {
    await printGuide({
      targetDir: tmpDir,
      installedSkills: [],
      config: {},
    })
    const output = logs.join(' ')
    expect(output).not.toContain('skill')
  })

  it('shows MCP tools section when mcpTools provided', async () => {
    await printGuide({
      targetDir: tmpDir,
      installedSkills: [],
      config: {},
      mcpTools: ['github', 'jira'],
    })
    const output = logs.join(' ')
    expect(output).toContain('2 个外部服务')
    expect(output).toContain('github')
    expect(output).toContain('jira')
  })

  it('shows MCP env stubs when mcpEnvStubs provided', async () => {
    await printGuide({
      targetDir: tmpDir,
      installedSkills: [],
      config: {},
      mcpTools: ['github'],
      mcpEnvStubs: [
        { key: 'GITHUB_TOKEN', comment: 'GitHub personal access token' },
        { key: 'JIRA_API_KEY', comment: 'Jira API key' },
      ],
    })
    const output = logs.join(' ')
    expect(output).toContain('GITHUB_TOKEN')
    expect(output).toContain('JIRA_API_KEY')
    expect(output).toContain('GitHub personal access token')
  })

  it('shows GitHub Docker warning when github is in mcpTools', async () => {
    await printGuide({
      targetDir: tmpDir,
      installedSkills: [],
      config: {},
      mcpTools: ['github'],
    })
    const output = logs.join(' ')
    expect(output).toContain('Docker')
  })

  it('does not show GitHub Docker warning for non-github tools', async () => {
    await printGuide({
      targetDir: tmpDir,
      installedSkills: [],
      config: {},
      mcpTools: ['jira'],
    })
    const output = logs.join(' ')
    expect(output).not.toContain('Docker')
  })

  describe('printMcpEnvStatus', () => {
    let examplesDir: string

    beforeEach(() => {
      examplesDir = path.join(tmpDir, 'env-examples')
      fs.mkdirSync(examplesDir, { recursive: true })
    })

    it('所有 MCP 已配置时显示 ✅', () => {
      fs.writeFileSync(path.join(examplesDir, 'github.env-example'), 'GITHUB_TOKEN=ghp_xxx\n', 'utf-8')
      fs.writeFileSync(path.join(tmpDir, '.env'), 'GITHUB_TOKEN=ghp_my_real_token\n', 'utf-8')

      printMcpEnvStatus(['github'], [], examplesDir, tmpDir)
      const output = logs.join('\n')
      expect(output).toContain('✅')
      expect(output).toContain('github')
      expect(output).toContain('已配置')
    })

    it('某 key 缺失时显示 ⚠️', () => {
      fs.writeFileSync(
        path.join(examplesDir, 'jira.env-example'),
        'JIRA_URL=url\nJIRA_TOKEN=token\n',
        'utf-8',
      )
      fs.writeFileSync(path.join(tmpDir, '.env'), 'JIRA_URL=https://my.atlassian.net\n', 'utf-8')

      printMcpEnvStatus(['jira'], [], examplesDir, tmpDir)
      const output = logs.join('\n')
      expect(output).toContain('⚠')
      expect(output).toContain('JIRA_TOKEN')
    })

    it('无 env-example 时显示 ℹ', () => {
      printMcpEnvStatus(['no-env-service'], [], examplesDir, tmpDir)
      const output = logs.join('\n')
      expect(output).toContain('ℹ')
      expect(output).toContain('无需环境变量配置')
    })

    it('同时包含 mcpTools 和 installedMcpServices', () => {
      fs.writeFileSync(
        path.join(examplesDir, 'github.env-example'),
        'GITHUB_TOKEN=ghp_xxx\n',
        'utf-8',
      )
      fs.writeFileSync(path.join(examplesDir, 'jira.env-example'), 'JIRA_TOKEN=token\n', 'utf-8')
      fs.writeFileSync(path.join(tmpDir, '.env'), 'GITHUB_TOKEN=real\nJIRA_TOKEN=real\n', 'utf-8')

      printMcpEnvStatus(['github'], ['jira'], examplesDir, tmpDir)
      const output = logs.join('\n')
      expect(output).toContain('github')
      expect(output).toContain('jira')
    })

    it('无 MCP 时无输出', () => {
      printMcpEnvStatus([], [], examplesDir, tmpDir)
      const output = logs.join('\n')
      expect(output).toBe('')
    })
  })

  describe('git prompt', () => {
    it('shows git prompt when .git directory exists', async () => {
      fs.mkdirSync(path.join(tmpDir, '.git'))
      await printGuide({
        targetDir: tmpDir,
        installedSkills: ['reef-react-lint'],
        config: {},
      })
      expect(p.confirm).toHaveBeenCalled()
    })

    it('does not show git prompt when no .git directory', async () => {
      await printGuide({
        targetDir: tmpDir,
        installedSkills: ['reef-react-lint'],
        config: {},
      })
      expect(p.confirm).not.toHaveBeenCalled()
    })

    it('when user confirms and .gitignore has .claude/, prints warning', async () => {
      fs.mkdirSync(path.join(tmpDir, '.git'))
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.claude/\nnode_modules/\n', 'utf-8')
      vi.mocked(p.confirm).mockResolvedValue(true)
      vi.mocked(p.isCancel).mockReturnValue(false)

      await printGuide({
        targetDir: tmpDir,
        installedSkills: ['reef-react-lint'],
        config: {},
      })
      const output = logs.join(' ')
      expect(output).toContain('.gitignore 中包含了 .claude/')
    })

    it('when user confirms and .gitignore has .claude (no slash), prints warning', async () => {
      fs.mkdirSync(path.join(tmpDir, '.git'))
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.claude\nnode_modules\n', 'utf-8')
      vi.mocked(p.confirm).mockResolvedValue(true)
      vi.mocked(p.isCancel).mockReturnValue(false)

      await printGuide({
        targetDir: tmpDir,
        installedSkills: [],
        config: {},
      })
      const output = logs.join(' ')
      expect(output).toContain('.gitignore 中包含了 .claude/')
    })

    it('when user confirms and .gitignore has .claude/** pattern, prints warning', async () => {
      fs.mkdirSync(path.join(tmpDir, '.git'))
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.claude/**\nnode_modules\n', 'utf-8')
      vi.mocked(p.confirm).mockResolvedValue(true)
      vi.mocked(p.isCancel).mockReturnValue(false)

      await printGuide({
        targetDir: tmpDir,
        installedSkills: [],
        config: {},
      })
      const output = logs.join(' ')
      expect(output).toContain('.gitignore 中包含了 .claude/')
    })

    it('when user confirms and .gitignore does NOT have .claude/, prints manual commit hint', async () => {
      fs.mkdirSync(path.join(tmpDir, '.git'))
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n.env\n', 'utf-8')
      vi.mocked(p.confirm).mockResolvedValue(true)
      vi.mocked(p.isCancel).mockReturnValue(false)

      await printGuide({
        targetDir: tmpDir,
        installedSkills: [],
        config: {},
      })
      const output = logs.join(' ')
      expect(output).toContain('手动执行')
      expect(output).not.toContain('.gitignore 中包含了')
    })

    it('when user declines git commit, no commit message shown', async () => {
      fs.mkdirSync(path.join(tmpDir, '.git'))
      vi.mocked(p.confirm).mockResolvedValue(false)
      vi.mocked(p.isCancel).mockReturnValue(false)

      await printGuide({
        targetDir: tmpDir,
        installedSkills: ['reef-react-lint'],
        config: {},
      })
      const output = logs.join(' ')
      expect(output).not.toContain('git add')
    })
  })
})
