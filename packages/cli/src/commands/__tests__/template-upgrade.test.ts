import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'
import { upgradeTemplates } from '../template-upgrade'

describe('upgradeTemplates', () => {
  let tmpDir: string
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-upgrade-test-'))
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    consoleLogSpy.mockRestore()
  })

  it('应复制没有用户修改的模板', () => {
    const cliDir = path.join(tmpDir, 'cli')
    const srcDir = path.join(cliDir, 'skills', 'test-skill')
    fs.mkdirSync(srcDir, { recursive: true })
    fs.writeFileSync(path.join(srcDir, 'SKILL.md'), '# Official Skill', 'utf-8')

    const targetDir = path.join(tmpDir, 'project')
    fs.mkdirSync(targetDir, { recursive: true })

    upgradeTemplates(cliDir, targetDir, ['test-skill'])

    const destFile = path.join(targetDir, '.claude', 'skills', 'test-skill', 'SKILL.md')
    expect(fs.existsSync(destFile)).toBe(true)
    expect(fs.readFileSync(destFile, 'utf-8')).toBe('# Official Skill')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('已更新'),
    )
  })

  it('用户有修改的模板应跳过', () => {
    const cliDir = path.join(tmpDir, 'cli')
    const srcDir = path.join(cliDir, 'skills', 'test-skill')
    fs.mkdirSync(srcDir, { recursive: true })
    fs.writeFileSync(path.join(srcDir, 'SKILL.md'), '# Official', 'utf-8')

    const targetDir = path.join(tmpDir, 'project')
    // 创建用户修改标记 — .deepstorm/templates/ 存在说明用户修改过
    const userTemplateDir = path.join(targetDir, '.deepstorm', 'templates', 'test-skill')
    fs.mkdirSync(userTemplateDir, { recursive: true })
    fs.writeFileSync(path.join(userTemplateDir, 'SKILL.md'), '# Custom', 'utf-8')

    upgradeTemplates(cliDir, targetDir, ['test-skill'])

    // 不应该复制官方版本
    const destFile = path.join(targetDir, '.claude', 'skills', 'test-skill', 'SKILL.md')
    expect(fs.existsSync(destFile)).toBe(false)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('检测到用户修改'),
    )
  })
})
