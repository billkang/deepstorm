import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { registerSetupCommand } from './commands/setup'
import { registerInitCommand } from './commands/init'
import { registerPluginBuildCommand } from './commands/plugin-build'
import { registerConfigCommand } from './commands/config'
import { registerTemplateCommand } from './commands/template'
import { registerUpdateCommand } from './commands/update'
import { runDoctor, printDoctorReport } from './commands/doctor'
import { uninstallDeepStorm } from './commands/uninstall'
import { getCliVersion } from './utils/version'
import type { Registry } from './types/registry'

const program = new Command()

program
  .name('deepstorm')
  .description('DeepStorm CLI — 一键配置项目开发环境')
  .version(getCliVersion(), '-v, --version', '输出版本号')

// 运行时读取 dist/registry.json（由 build 命令生成，随 npm 包一同发布）
function loadRegistry(): Registry {
  const registryPath = path.join(__dirname, 'registry.json')
  try {
    const raw = fs.readFileSync(registryPath, 'utf-8')
    return JSON.parse(raw) as Registry
  } catch {
    return { version: '1', tools: {}, wizards: {}, skills: {} }
  }
}

const registry = loadRegistry()
registerSetupCommand(program, registry)
registerInitCommand(program)
registerPluginBuildCommand(program, registry)
registerConfigCommand(program, registry)
registerTemplateCommand(program, registry)
registerUpdateCommand(program)

program
  .command('doctor')
  .description('诊断项目 DeepStorm 配置状态')
  .action(() => {
    const report = runDoctor(process.cwd())
    printDoctorReport(report)
  })

program
  .command('uninstall')
  .description('卸载所有 DeepStorm 生成的内容')
  .action(async () => {
    await uninstallDeepStorm(process.cwd())
  })

program.parse(process.argv)
