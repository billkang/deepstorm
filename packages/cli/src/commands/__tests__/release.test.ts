import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { execSync } from 'node:child_process'
import { Command } from 'commander'
import { registerReleaseCommand } from '../release'
import { buildRegistry } from '../../build-registry'

vi.mock('node:child_process', () => ({
  execSync: vi.fn().mockReturnValue(''),
}))

vi.mock('../../build-registry', () => ({
  buildRegistry: vi.fn(),
}))

describe('registerReleaseCommand', () => {
  it('注册名为 release 的子命令', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const cmd = program.commands.find((c) => c.name() === 'release')
    expect(cmd).toBeDefined()
    expect(cmd!.description()).toBe('Release 发布工作流 — 构建、版本号、发布到 npm')
  })

  it('release 包含 build 和 publish 子命令', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const releaseCmd = program.commands.find((c) => c.name() === 'release')!
    const subCommands = releaseCmd.commands.map((c) => c.name())

    expect(subCommands).toContain('build')
    expect(subCommands).toContain('publish')
  })
})

describe('release action handlers', () => {
  let tmpDir: string
  let cliPkgDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-release-'))
    fs.mkdirSync(path.join(tmpDir, 'packages', 'cli'), { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, 'packages', 'cli', 'package.json'),
      JSON.stringify({ name: '@deepstorm/cli', version: '1.2.3' }),
      'utf-8',
    )
    fs.mkdirSync(path.join(tmpDir, 'packages', 'pilot'), { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, 'packages', 'pilot', 'package.json'),
      JSON.stringify({ name: '@deepstorm/pilot', version: '1.2.3' }),
      'utf-8',
    )
    cliPkgDir = path.join(tmpDir, 'packages', 'cli')
    vi.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('release build — 执行构建', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const buildCmd = program.commands
      .find((c) => c.name() === 'release')!
      .commands.find((c) => c.name() === 'build')!

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cliPkgDir)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildCmd.parse(['node', 'test', '--root', tmpDir])

    expect(execSync).toHaveBeenCalled()
    expect(execSync).toHaveBeenCalledWith(
      'node scripts/build.mjs',
      expect.objectContaining({ cwd: cliPkgDir }),
    )
    // buildRegistry should also be called
    expect(buildRegistry).toHaveBeenCalledWith(expect.stringContaining('packages/cli'))

    consoleSpy.mockRestore()
    cwdSpy.mockRestore()
  })

  it('release publish — dry-run patch', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const publishCmd = program.commands
      .find((c) => c.name() === 'release')!
      .commands.find((c) => c.name() === 'publish')!

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    publishCmd.parse(['node', 'test', 'patch', '--root', tmpDir, '--dry-run'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('试运行'))
    const pkgAfter = JSON.parse(fs.readFileSync(path.join(cliPkgDir, 'package.json'), 'utf-8'))
    expect(pkgAfter.version).toBe('1.2.3')

    consoleSpy.mockRestore()
  })

  it('release publish — dry-run minor', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const publishCmd = program.commands
      .find((c) => c.name() === 'release')!
      .commands.find((c) => c.name() === 'publish')!

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    publishCmd.parse(['node', 'test', 'minor', '--root', tmpDir, '--dry-run'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1.2.3 → v1.3.0'))
    const pkgAfter = JSON.parse(fs.readFileSync(path.join(cliPkgDir, 'package.json'), 'utf-8'))
    expect(pkgAfter.version).toBe('1.2.3')

    consoleSpy.mockRestore()
  })

  it('release publish — dry-run major', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const publishCmd = program.commands
      .find((c) => c.name() === 'release')!
      .commands.find((c) => c.name() === 'publish')!

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    publishCmd.parse(['node', 'test', 'major', '--root', tmpDir, '--dry-run'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1.2.3 → v2.0.0'))
    const pkgAfter = JSON.parse(fs.readFileSync(path.join(cliPkgDir, 'package.json'), 'utf-8'))
    expect(pkgAfter.version).toBe('1.2.3')

    consoleSpy.mockRestore()
  })

  it('release publish — 不带 bump 默认为 patch', () => {
    const program = new Command()
    registerReleaseCommand(program)

    const publishCmd = program.commands
      .find((c) => c.name() === 'release')!
      .commands.find((c) => c.name() === 'publish')!

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    publishCmd.parse(['node', 'test', '--root', tmpDir, '--dry-run'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1.2.3 → v1.2.4'))

    consoleSpy.mockRestore()
  })
})

describe('detectRepoRoot fallback', () => {
  it('当找不到 packages/ 目录时打印错误并退出', () => {
    // 在没有 packages/ 的目录运行 build，不传 --root
    const program = new Command()
    registerReleaseCommand(program)

    const buildCmd = program.commands
      .find((c) => c.name() === 'release')!
      .commands.find((c) => c.name() === 'build')!

    // 模拟 process.cwd 返回一个没有 packages/ 的目录
    const tmpNoPkg = fs.mkdtempSync(path.join(os.tmpdir(), 'no-packages-'))
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpNoPkg)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called')
    }) as any)

    expect(() => {
      buildCmd.parse(['node', 'test'])
    }).toThrow('process.exit called')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('未找到仓库根目录'))

    fs.rmSync(tmpNoPkg, { recursive: true, force: true })
    exitSpy.mockRestore()
    errorSpy.mockRestore()
    cwdSpy.mockRestore()
  })
})
