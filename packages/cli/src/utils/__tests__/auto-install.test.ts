import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'
import os from 'node:os'

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

import { execSync } from 'node:child_process'
import {
  execSafe,
  isBmadInstalled,
  isGrillMeInstalled,
  installBmadMethod,
  installGrillMe,
  installPlaywright,
  step9AutoInstallDeps,
} from '../auto-install'

describe('execSafe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success when execSync succeeds', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('ok'))
    const result = execSafe('echo ok')
    expect(result.success).toBe(true)
    expect(result.output).toBe('ok')
  })

  it('returns failure with error message when execSync throws', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('command not found') })
    const result = execSafe('invalid-command')
    expect(result.success).toBe(false)
    expect(result.output).toContain('command not found')
  })
})

describe('isBmadInstalled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when bmad-method status shows Version', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('Version: 6.8.0\nInstalled'))
    expect(isBmadInstalled()).toBe(true)
  })

  it('returns false when bmad-method status fails', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not installed') })
    expect(isBmadInstalled()).toBe(false)
  })
})

describe('isGrillMeInstalled', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grill-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns true when SKILL.md exists', () => {
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'grill-me')
    fs.mkdirSync(skillDir, { recursive: true })
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# grill-me', 'utf-8')
    expect(isGrillMeInstalled(tmpDir)).toBe(true)
  })

  it('returns false when SKILL.md does not exist', () => {
    expect(isGrillMeInstalled(tmpDir)).toBe(false)
  })
})

describe('installBmadMethod', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips installation when bmad is already installed', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('Version: 6.8.0\nInstalled'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installBmadMethod()
    expect(log).toHaveBeenCalledWith('ℹ BMAD Method 已存在，跳过安装')
    expect(execSync).toHaveBeenCalledWith('npx bmad-method status', expect.any(Object))
    log.mockRestore()
  })

  it('installs bmad when not installed', () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => { throw new Error('not found') }) // status fails
      .mockImplementationOnce(() => Buffer.from('installed'))          // install succeeds
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installBmadMethod()
    expect(log).toHaveBeenCalledWith('✔ BMAD Method 已安装')
    expect(execSync).toHaveBeenCalledWith('npx bmad-method install', expect.any(Object))
    log.mockRestore()
  })

  it('shows warning when installation fails', () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => { throw new Error('not found') })    // status fails
      .mockImplementationOnce(() => { throw new Error('network error') }) // install fails
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installBmadMethod()
    expect(log).toHaveBeenCalledWith('⚠ BMAD Method 安装失败，请手动执行 npx bmad-method install')
    log.mockRestore()
  })
})

describe('installGrillMe', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grill-test-'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('skips when grill-me is already installed', () => {
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'grill-me')
    fs.mkdirSync(skillDir, { recursive: true })
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# grill-me', 'utf-8')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installGrillMe(tmpDir)
    expect(log).toHaveBeenCalledWith('ℹ grill-me 已存在，跳过安装')
    log.mockRestore()
  })

  it('installs grill-me by downloading SKILL.md', () => {
    // execSync handles the curl command
    vi.mocked(execSync).mockReturnValue(Buffer.from('downloaded'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installGrillMe(tmpDir)
    expect(log).toHaveBeenCalledWith('✔ grill-me skill 已安装')
    // Verify the directory was created (execSync is mocked so file won't exist)
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'grill-me'))).toBe(true)
    log.mockRestore()
  })

  it('shows warning when download fails', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('network error') })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installGrillMe(tmpDir)
    expect(log).toHaveBeenCalledWith('⚠ grill-me 安装失败，请手动安装 https://github.com/mattpocock/skills')
    log.mockRestore()
  })
})

describe('installPlaywright', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-test-'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('does nothing when config does not have playwright e2e', () => {
    const config = { 'sweep.e2eFramework': 'none' }
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installPlaywright(config, tmpDir)
    expect(execSync).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('skips when config key is missing', () => {
    const config = {}
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installPlaywright(config, tmpDir)
    expect(execSync).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('skips when Playwright browsers are already installed', () => {
    // dry-run outputs browser paths when installed (no "to install" hint)
    vi.mocked(execSync).mockReturnValue(Buffer.from('chromium found at /path/to/chromium'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installPlaywright({ 'sweep.e2eFramework': 'playwright' }, tmpDir)
    expect(log).toHaveBeenCalledWith('ℹ Playwright 浏览器已存在，跳过安装')
    log.mockRestore()
  })

  it('installs Playwright browsers', () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => { throw new Error('not installed') }) // dry-run fails
      .mockImplementationOnce(() => Buffer.from('installed'))              // install succeeds
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installPlaywright({ 'sweep.e2eFramework': 'playwright' }, tmpDir)
    expect(log).toHaveBeenCalledWith('✔ Playwright 浏览器已安装')
    log.mockRestore()
  })

  it('shows warning when installation fails', () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => { throw new Error('not installed') })    // dry-run fails
      .mockImplementationOnce(() => { throw new Error('network error') })    // install fails
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    installPlaywright({ 'sweep.e2eFramework': 'playwright' }, tmpDir)
    expect(log).toHaveBeenCalledWith('⚠ Playwright 浏览器安装失败，请手动执行 npx playwright install')
    log.mockRestore()
  })
})

describe('step9AutoInstallDeps', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'step9-test-'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('installs bmad and grill-me when tide is selected', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('ok'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    step9AutoInstallDeps(['tide'], {}, tmpDir)
    // Should have called bmad-method status + install, and grill-me download
    const calls = vi.mocked(execSync).mock.calls
    expect(calls.some(c => c[0].includes('bmad-method'))).toBe(true)
    expect(calls.some(c => c[0].includes('curl') || c[0].includes('grill'))).toBe(true)
    log.mockRestore()
  })

  it('skips bmad and grill-me when tide is not selected', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('ok'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    step9AutoInstallDeps(['reef', 'sweep'], {}, tmpDir)
    const calls = vi.mocked(execSync).mock.calls
    expect(calls.some(c => c[0].includes('bmad-method'))).toBe(false)
    expect(calls.some(c => c[0].includes('grill'))).toBe(false)
    log.mockRestore()
  })

  it('installs playwright when sweep + playwright config is selected', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('ok'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    step9AutoInstallDeps(['sweep'], { 'sweep.e2eFramework': 'playwright' }, tmpDir)
    const calls = vi.mocked(execSync).mock.calls
    expect(calls.some(c => c[0].includes('playwright'))).toBe(true)
    log.mockRestore()
  })

  it('combines tide and sweep auto-installs', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('ok'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    step9AutoInstallDeps(['tide', 'sweep'], { 'sweep.e2eFramework': 'playwright' }, tmpDir)
    const calls = vi.mocked(execSync).mock.calls
    expect(calls.some(c => c[0].includes('bmad-method'))).toBe(true)
    expect(calls.some(c => c[0].includes('grill'))).toBe(true)
    expect(calls.some(c => c[0].includes('playwright'))).toBe(true)
    log.mockRestore()
  })
})
