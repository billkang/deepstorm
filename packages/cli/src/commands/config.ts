import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { confirm, isCancel } from '@clack/prompts'
import { viewConfig } from './config-view'
import { setConfigValue } from './config-set'
import { resetConfig } from './config-reset'
import { refreshConfig } from './config-refresh'
import type { Registry } from '../types/registry'

/**
 * 注册 config 子命令树。
 */
export function registerConfigCommand(program: Command, registry: Registry): void {
  const configCmd = program
    .command('config')
    .description('查看和修改项目级 DeepStorm 配置')

  configCmd
    .command('view')
    .description('查看当前 DeepStorm 配置')
    .action(() => {
      viewConfig(process.cwd())
    })

  configCmd
    .command('set')
    .argument('<key-value>', '配置项，格式 key=value')
    .description('修改单项配置（如 reef.frontend.framework=react）')
    .action(async (keyValue: string) => {
      const eqIdx = keyValue.indexOf('=')
      if (eqIdx <= 0) {
        console.error('格式错误：请使用 key=value 格式')
        return
      }
      const key = keyValue.slice(0, eqIdx)
      const value = keyValue.slice(eqIdx + 1)
      await setConfigValue(process.cwd(), key, value, registry)
    })

  configCmd
    .command('reset')
    .description('清除 DeepStorm 配置')
    .action(async () => {
      const shouldReset = await confirm({
        message: '此操作将清除所有 DeepStorm 配置，是否继续？',
        initialValue: false,
      })
      if (isCancel(shouldReset) || !shouldReset) {
        console.log('已取消')
        return
      }
      resetConfig(process.cwd())
      console.log('✔ 配置已清除，请运行 deepstorm setup 重新配置')
    })

  configCmd
    .command('refresh')
    .description('根据最新 MCP 安装状态，刷新所有已安装 skill 的模板渲染')
    .action(() => {
      const targetDir = process.cwd()
      const cliDir = __dirname

      const result = refreshConfig(cliDir, targetDir, registry)

      if (result.errors.length > 0) {
        for (const err of result.errors) {
          console.error(`  ⚠ ${err}`)
        }
      }

      if (result.refreshed.length > 0) {
        console.log(`✔ 已刷新 ${result.refreshed.length} 个技能：`)
        for (const id of result.refreshed) {
          console.log(`  • ${id}`)
        }
      } else {
        console.log('  没有需要刷新的技能')
      }
    })
}
