import * as fs from 'node:fs'
import * as path from 'node:path'
import * as p from '@clack/prompts'
import { renderTemplate, copyVariants } from '../template/renderer'
import { findAffectedTemplates, buildTemplateVariables } from '../template/registry'
import { ensureDir } from '../utils/fs'
import { validateConfigKey } from '../utils/config-schema'
import { readDeepStormConfig, getDeepStormConfigPath } from '../merger/settings'
import type { Registry } from '../types/registry'

// 打包后 __dirname = dist/
const cliDir = __dirname

/**
 * 修改单项 DeepStorm 配置并触发重渲染。
 *
 * 写入配置后，检查配置变更是否影响已安装的模板资产。
 * 若受影响，提示用户确认后从 dist/ 原始模板重新渲染并覆盖 .claude/ 下的文件。
 */
export async function setConfigValue(
  targetDir: string,
  key: string,
  value: string,
  registry: Registry,
): Promise<void> {
  // 校验配置 key 是否合法
  if (!validateConfigKey(key)) {
    return
  }

  const settingsPath = getDeepStormConfigPath(targetDir)

  // 先触发配置迁移（补全新维度字段），确保配置存在
  readDeepStormConfig(targetDir)

  let config: Record<string, unknown> = {}

  if (fs.existsSync(settingsPath)) {
    try {
      config = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    } catch {
      config = {}
    }
  }

  // 读取旧值，判断是否真的变更
  const parts = key.split('.')
  let oldValue: string | undefined
  let current = config as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    const val = current[parts[i]]
    if (!val || typeof val !== 'object') {
      oldValue = undefined
      break
    }
    current = val as Record<string, unknown>
    if (i === parts.length - 2) {
      oldValue = current[parts[i + 1]] as string | undefined
    }
  }
  if (parts.length === 1) {
    oldValue = config[key] as string | undefined
  }

  // 值相同 → 跳过
  if (oldValue === value) {
    console.log(`✔ ${key} 已是 ${value}，无变更`)
    return
  }

  // 写入新配置
  let writePointer = config
  for (let i = 0; i < parts.length - 1; i++) {
    if (!writePointer[parts[i]] || typeof writePointer[parts[i]] !== 'object') {
      writePointer[parts[i]] = {}
    }
    writePointer = writePointer[parts[i]] as Record<string, unknown>
  }
  writePointer[parts[parts.length - 1]] = value

  fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
  console.log(`✔ ${key} 已更新为 ${value}`)

  // 查找受影响模板
  const affected = findAffectedTemplates(registry, key)
  if (affected.length === 0) {
    return
  }

  // 提取受影响资产名称用于展示
  const assetNames = affected.map((t) =>
    t.replace(/\/SKILL\.md\.tmpl$/, '').replace(/\/[^/]+\.md\.tmpl$/, ''),
  )

  // 提示用户确认
  console.log('')
  console.log('检测到配置变更，需要重新生成以下内容：')
  for (const name of assetNames) {
    console.log(`  • ${name}`)
  }
  console.log('')

  const shouldProceed = await p.confirm({
    message: '确认重新生成？',
    initialValue: false,
  })

  if (p.isCancel(shouldProceed) || !shouldProceed) {
    console.log('配置已保存，skill 内容未同步。运行 deepstorm setup --reconfigure 手动更新。')
    return
  }

  // 构建完整的 config 对象（含旧值用于 affectedTemplates 的完整变量解析）
  const fullConfig: Record<string, string> = {}
  // 从当前配置中提取所有值
  for (const [toolKey, toolVal] of Object.entries(config)) {
    if (typeof toolVal === 'object' && toolVal !== null && !Array.isArray(toolVal)) {
      for (const [subKey, subVal] of Object.entries(toolVal as Record<string, unknown>)) {
        if (typeof subVal === 'string') {
          fullConfig[`${toolKey}.${subKey}`] = subVal
        }
      }
    }
  }
  // 确保新值在最前面
  fullConfig[key] = value

  // 读取已安装的 MCP 服务列表，一并注入模板变量
  const installedMcpServers = (config.installedMcpServers as string[]) ?? []

  const templateVariables = buildTemplateVariables(registry, fullConfig, installedMcpServers)

  let renderCount = 0
  for (const tmplRelPath of affected) {
    const tmplPath = path.join(cliDir, tmplRelPath)
    if (!fs.existsSync(tmplPath)) {
      console.warn(`  ⚠ 模板文件不存在: ${tmplRelPath}，跳过`)
      continue
    }

    // 计算目标路径
    // tmplRelPath 形如 "skills/reef-style-frontend/SKILL.md.tmpl"
    const pathParts = tmplRelPath.split('/')
    const assetType = pathParts[0] // "skills" | "agents" | "hooks"
    const assetName = pathParts[1] // "reef-style-frontend"
    const outputFile = pathParts[pathParts.length - 1].replace(/\.tmpl$/, '') // "SKILL.md"

    const targetDirPath = path.join(targetDir, '.claude', assetType, assetName)
    ensureDir(targetDirPath)

    // 渲染模板
    const outputPath = path.join(targetDirPath, outputFile)
    renderTemplate(tmplPath, templateVariables, outputPath)

    // 复制 variants（仅复制当前变更 key 对应的变体，避免全局配置误报）
    const variantsDir = path.join(cliDir, assetType, assetName, 'variants')
    if (fs.existsSync(variantsDir)) {
      copyVariants(variantsDir, value, targetDirPath, true)
    }

    renderCount++
  }

  console.log(`✔ 已重新生成 ${renderCount} 个文件`)
  console.log('请重启 Claude Code 会话生效')
}
