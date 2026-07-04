import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { initTemplate } from '../template-init'

// 模拟 @clack/prompts 的 confirm，默认返回 false（不覆盖）
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn().mockReturnValue(false),
}))

import { confirm } from '@clack/prompts'

describe('initTemplate', () => {
  let tmpDir: string
  let cliDir: string
  let targetDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-init-'))
    cliDir = path.join(tmpDir, 'cli')
    targetDir = path.join(tmpDir, 'project')

    // 模拟 cliDir/skills/ 目录
    fs.mkdirSync(path.join(cliDir, 'skills', 'reef-style-frontend'), { recursive: true })
    fs.writeFileSync(
      path.join(cliDir, 'skills', 'reef-style-frontend', 'SKILL.md'),
      '# Reef Style Frontend',
      'utf-8',
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('skill 不存在时应输出提示', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await initTemplate(cliDir, targetDir, 'nonexistent-skill')

    expect(consoleSpy).toHaveBeenCalledWith('模板不存在：nonexistent-skill')

    // 不应创建任何目录
    expect(fs.existsSync(path.join(targetDir, '.deepstorm', 'templates'))).toBe(false)
    consoleSpy.mockRestore()
  })

  it('成功时复制 skill 到 .deepstorm/templates/', async () => {
    await initTemplate(cliDir, targetDir, 'reef-style-frontend')

    const destDir = path.join(targetDir, '.deepstorm', 'templates', 'reef-style-frontend')
    expect(fs.existsSync(destDir)).toBe(true)
    expect(fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf-8')).toBe('# Reef Style Frontend')
  })

  it('目标已存在且用户确认覆盖时应覆盖', async () => {
    // 预先创建一个模板
    const existingDir = path.join(targetDir, '.deepstorm', 'templates', 'reef-style-frontend')
    fs.mkdirSync(existingDir, { recursive: true })
    fs.writeFileSync(path.join(existingDir, 'SKILL.md'), '# Old content', 'utf-8')

    // mock confirm 返回 true（覆盖）
    vi.mocked(confirm).mockResolvedValueOnce(true)

    await initTemplate(cliDir, targetDir, 'reef-style-frontend')

    // 验证已被覆盖
    expect(fs.readFileSync(path.join(existingDir, 'SKILL.md'), 'utf-8')).toBe('# Reef Style Frontend')
  })

  it('存在 references/ 时应完整复制', async () => {
    const skillId = 'reef-style-frontend'
    const refDir = path.join(cliDir, 'skills', skillId, 'references')
    fs.mkdirSync(refDir, { recursive: true })
    fs.writeFileSync(path.join(refDir, 'role-prompts.md'), '# Role Prompts', 'utf-8')
    fs.writeFileSync(path.join(refDir, 'checklists.md'), '# Checklists', 'utf-8')

    await initTemplate(cliDir, targetDir, skillId)

    const destRefDir = path.join(targetDir, '.deepstorm', 'templates', skillId, 'references')
    expect(fs.existsSync(destRefDir)).toBe(true)
    expect(fs.readFileSync(path.join(destRefDir, 'role-prompts.md'), 'utf-8')).toBe('# Role Prompts')
    expect(fs.readFileSync(path.join(destRefDir, 'checklists.md'), 'utf-8')).toBe('# Checklists')
  })

  it('源目录无 references/ 时不应创建目标 references/ 目录', async () => {
    await initTemplate(cliDir, targetDir, 'reef-style-frontend')

    const destRefDir = path.join(targetDir, '.deepstorm', 'templates', 'reef-style-frontend', 'references')
    expect(fs.existsSync(destRefDir)).toBe(false)
  })

  it('目标已存在且用户取消时应保留原内容', async () => {
    const existingDir = path.join(targetDir, '.deepstorm', 'templates', 'reef-style-frontend')
    fs.mkdirSync(existingDir, { recursive: true })
    fs.writeFileSync(path.join(existingDir, 'SKILL.md'), '# Original content', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // mock confirm 返回 false（不覆盖）
    vi.mocked(confirm).mockResolvedValueOnce(false)

    await initTemplate(cliDir, targetDir, 'reef-style-frontend')

    // 验证原内容保留
    expect(fs.readFileSync(path.join(existingDir, 'SKILL.md'), 'utf-8')).toBe('# Original content')
    expect(consoleSpy).toHaveBeenCalledWith('已取消')
    consoleSpy.mockRestore()
  })
})
