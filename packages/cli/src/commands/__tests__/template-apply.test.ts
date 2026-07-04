import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'
import { applyTemplate } from '../template-apply'

describe('applyTemplate', () => {
  let tmpDir: string
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-apply-test-'))
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    consoleLogSpy.mockRestore()
  })

  it('模板不存在时应输出提示', () => {
    applyTemplate(tmpDir, 'nonexistent-skill')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('模板不存在'),
    )
  })

  it('应复制模板到目标 skill 目录', () => {
    // 创建源模板
    const templateDir = path.join(tmpDir, '.deepstorm', 'templates', 'test-skill')
    fs.mkdirSync(templateDir, { recursive: true })
    fs.writeFileSync(path.join(templateDir, 'SKILL.md'), '# Test Skill', 'utf-8')

    applyTemplate(tmpDir, 'test-skill')

    // 验证目标文件
    const destFile = path.join(tmpDir, '.claude', 'skills', 'test-skill', 'SKILL.md')
    expect(fs.existsSync(destFile)).toBe(true)
    expect(fs.readFileSync(destFile, 'utf-8')).toBe('# Test Skill')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('已应用到'),
    )
  })

  it('存在 references/ 时应完整复制', () => {
    const templateDir = path.join(tmpDir, '.deepstorm', 'templates', 'skill-with-ref')
    fs.mkdirSync(path.join(templateDir, 'references'), { recursive: true })
    fs.writeFileSync(path.join(templateDir, 'SKILL.md'), '# Skill With Ref', 'utf-8')
    fs.writeFileSync(path.join(templateDir, 'references', 'guide.md'), '# Reference Guide', 'utf-8')
    fs.writeFileSync(path.join(templateDir, 'references', 'data.md'), '# Data Format', 'utf-8')

    applyTemplate(tmpDir, 'skill-with-ref')

    const destRefDir = path.join(tmpDir, '.claude', 'skills', 'skill-with-ref', 'references')
    expect(fs.existsSync(destRefDir)).toBe(true)
    expect(fs.readFileSync(path.join(destRefDir, 'guide.md'), 'utf-8')).toBe('# Reference Guide')
    expect(fs.readFileSync(path.join(destRefDir, 'data.md'), 'utf-8')).toBe('# Data Format')
  })

  it('模板无 references/ 时不应创建目标 references/', () => {
    const templateDir = path.join(tmpDir, '.deepstorm', 'templates', 'skill-no-ref')
    fs.mkdirSync(templateDir, { recursive: true })
    fs.writeFileSync(path.join(templateDir, 'SKILL.md'), '# No Ref', 'utf-8')

    applyTemplate(tmpDir, 'skill-no-ref')

    const destRefDir = path.join(tmpDir, '.claude', 'skills', 'skill-no-ref', 'references')
    expect(fs.existsSync(destRefDir)).toBe(false)
  })
})
