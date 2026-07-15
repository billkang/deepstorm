/**
 * config-refresh.ts
 *
 * `deepstorm config refresh` — 读取当前项目配置中的 installedSkills 和
 * installedMcpServers，对每个有 SKILL.md.tmpl 的 skill 重新渲染，
 * 确保模板内容反映最新的 MCP 服务安装状态。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { renderTemplate } from '../template/renderer'
import { injectSkillCapabilities, buildMcpCapabilities } from '../template/registry'
import { readDeepStormConfig, writeDeepStormConfig, getDeepStormConfigPath } from '../merger/settings'
import { parseFrontmatter } from '../utils/frontmatter'
import type { Registry } from '../types/registry'

export interface RefreshResult {
  /** 成功刷新的 skill ID 列表 */
  refreshed: string[]
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 刷新所有已安装 skill 的模板渲染。
 *
 * @param cliDir - CLI 包所在的目录（dist/），用于找到源模板文件
 * @param targetDir - 目标项目根目录
 * @param registry - Registry 对象
 * @returns 刷新结果
 */
export function refreshConfig(
  cliDir: string,
  targetDir: string,
  registry: Registry,
): RefreshResult {
  const result: RefreshResult = { refreshed: [], errors: [] }

  // 1. 读取 .deepstorm/settings.json，触发自动迁移
  const settingsPath = getDeepStormConfigPath(targetDir)
  if (!fs.existsSync(settingsPath)) {
    return result
  }

  readDeepStormConfig(targetDir)

  let config: Record<string, unknown>
  try {
    config = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  } catch {
    return result
  }

  const installedSkills = (config.installedSkills as string[]) ?? []
  const installedMcpServers = (config.installedMcpServers as string[]) ?? []
  const targetDotClaudeDir = path.join(targetDir, '.claude')

  if (installedSkills.length === 0) return result

  // 2. 对每个 skill 检查 .tmpl 并重新渲染
  for (const skillId of installedSkills) {
    const tmplPath = path.join(cliDir, 'skills', skillId, 'SKILL.md.tmpl')
    if (!fs.existsSync(tmplPath)) continue

    const targetSkillDir = path.join(targetDotClaudeDir, 'skills', skillId)
    const outputPath = path.join(targetSkillDir, 'SKILL.md')

    try {
      // 注入模板变量（如有 mcpCapabilities 声明）
      const enrichedVars = injectSkillCapabilities(
        tmplPath,
        {},
        installedMcpServers,
        registry.mcpTools ?? {},
      )

      // 确保目标目录存在
      fs.mkdirSync(targetSkillDir, { recursive: true })

      renderTemplate(tmplPath, enrichedVars, outputPath)
      result.refreshed.push(skillId)
    } catch (err) {
      result.errors.push(
        `刷新 skill "${skillId}" 失败: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // 3. 重建统一 MCP 能力映射并写入 .deepstorm/settings.json
  const mcpCapabilities = buildUnifiedMcpCapabilities(cliDir, installedMcpServers, registry.mcpTools ?? {})
  if (mcpCapabilities && Object.keys(mcpCapabilities).length > 0) {
    writeDeepStormConfig(targetDir, { mcpCapabilities } as any)
  }

  return result
}

/**
 * 从所有 skill 模板文件的 frontmatter 中收集 mcpCapabilities 声明，
 * 构建统一的能力映射。
 */
function buildUnifiedMcpCapabilities(
  cliDir: string,
  installedMcpTools: string[],
  mcpTools: Record<string, { domain: string; label: string; description: string }>,
): Record<string, { available: boolean; providers: Array<{ id: string; label: string }> }> {
  const allDeclarations: Record<string, { domain: string }> = {}
  const skillsDir = path.join(cliDir, 'skills')
  if (!fs.existsSync(skillsDir)) return {}

  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  for (const entry of skillDirs) {
    if (!entry.isDirectory()) continue
    const tmplPath = path.join(skillsDir, entry.name, 'SKILL.md.tmpl')
    if (!fs.existsSync(tmplPath)) continue

    const content = fs.readFileSync(tmplPath, 'utf-8')
    const fm = parseFrontmatter(content)
    if (!fm) continue

    const mcpCap = (fm as unknown as Record<string, unknown>).mcpCapabilities as
      | Record<string, { domain: string }>
      | undefined
    if (!mcpCap || Object.keys(mcpCap).length === 0) continue

    for (const [capName, capConfig] of Object.entries(mcpCap)) {
      allDeclarations[capName] = capConfig
    }
  }

  if (Object.keys(allDeclarations).length === 0) return {}
  return JSON.parse(buildMcpCapabilities(allDeclarations, installedMcpTools, mcpTools))
}
