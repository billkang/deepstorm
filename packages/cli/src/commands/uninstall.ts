import * as fs from 'node:fs'
import * as path from 'node:path'
import { confirm } from '@clack/prompts'
import { cleanInstalled } from '../wizard/reconfigure'
import { resetConfig } from './config-reset'

/**
 * 卸载所有 DeepStorm 生成的内容。
 */
export async function uninstallDeepStorm(targetDir: string): Promise<void> {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')

  // 检查是否已安装
  if (!fs.existsSync(settingsPath)) {
    console.log('DeepStorm 尚未配置，无需卸载')
    return
  }

  let hasDeepStorm = false
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    hasDeepStorm = !!settings.deepstorm
  } catch {
    // 继续执行清理
  }

  if (!hasDeepStorm) {
    console.log('DeepStorm 尚未配置，无需卸载')
    return
  }

  // 清理已安装的 skill/agent/MCP/hooks
  cleanInstalled(targetDir)

  // 删除 deepstormm 命名空间
  resetConfig(targetDir)

  // 询问是否删除 .deepstorm/templates/
  const templatesDir = path.join(targetDir, '.deepstorm', 'templates')
  if (fs.existsSync(templatesDir)) {
    const shouldDelete = await confirm({
      message: '是否删除 .deepstorm/templates/ 目录？',
      initialValue: false,
    })
    if (shouldDelete) {
      fs.rmSync(templatesDir, { recursive: true, force: true })
      console.log('✔ .deepstorm/templates/ 已删除')
    } else {
      console.log('保留 .deepstorm/templates/')
    }
  }

  console.log('✔ DeepStorm 已卸载')
}
