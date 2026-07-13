import * as p from '@clack/prompts'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { RegistryReader } from '../engine/registry'
import type { Registry } from '../types/registry'
import { selectTools } from './tool-select'
import { selectMcpTools } from './mcp-select'
import { runQuestionnaire } from './questionnaire'
import { buildTemplateVariables } from '../template/registry'

export interface WizardFlowResult {
  tools: string[]
  config: Record<string, string>
  selectedMcpTools: string[]
  templateVariables: Record<string, string>
}

/**
 * 从 .claude/settings.json 中读取已存在的 deepstorm 配置，
 * 递归拍平为扁平的 key 集合，供 runQuestionnaire 跳过使用。
 * 值为 'none' 的 key 不被加入集合（表示显式不选）。
 */
export function loadExistingConfigKeys(targetDir: string): Set<string> {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')
  if (!fs.existsSync(settingsPath)) return new Set()

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    const deepstorm = settings.deepstorm as Record<string, unknown> | undefined
    if (!deepstorm) return new Set()

    const keys = new Set<string>()
    flattenConfig(deepstorm, '', keys)
    return keys
  } catch {
    return new Set()
  }
}

function flattenConfig(obj: Record<string, unknown>, prefix: string, keys: Set<string>): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenConfig(value as Record<string, unknown>, fullKey, keys)
    } else if (typeof value === 'string' && value !== 'none') {
      keys.add(fullKey)
    }
  }
}

/**
 * 从 settings.json 中读取已安装的 MCP 服务列表。
 */
export function getInstalledMcpServices(targetDir: string): string[] {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')
  if (!fs.existsSync(settingsPath)) return []
  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    const installed = settings.deepstorm?.installedMcpServers
    return Array.isArray(installed) ? installed : []
  } catch {
    return []
  }
}

/**
 * 从 settings.json 的 installedSkills 反向推导已安装的工具套件列表。
 * 遍历 registry.skills，将 installedSkills 中的 skill ID 映射到其所属的工具名称。
 */
export function getInstalledTools(targetDir: string, registry: Registry): string[] {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')
  if (!fs.existsSync(settingsPath)) return []
  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    const installedSkills: string[] = settings.deepstorm?.installedSkills ?? []
    if (!Array.isArray(installedSkills) || installedSkills.length === 0) return []

    const skillSet = new Set(installedSkills)
    const toolSet = new Set<string>()
    for (const [skillId, skill] of Object.entries(registry.skills)) {
      if (skillSet.has(skillId) && skill.tool) {
        toolSet.add(skill.tool)
      }
    }
    return Array.from(toolSet)
  } catch {
    return []
  }
}

/**
 * 共享向导流程：工具选择 → MCP 选择（按工具过滤）→ 配置问答 → 模板变量。
 *
 * setup 和 plugin build 共用此流程，确保一致的向导体验。
 *
 * @param reader - RegistryReader 实例
 * @param registry - Registry 实例
 * @param initialMcpValues - MCP 默认勾选的服务名列表（如 setup 的 ['context7']）
 * @param targetDir - 项目根目录（用于读取已有配置），为空时不做增量检测
 */
export async function runWizardFlow(
  reader: RegistryReader,
  registry: Registry,
  initialMcpValues?: string[],
  targetDir?: string,
): Promise<WizardFlowResult> {
  // Step 0: 读取已有配置（增量安装感知）
  const installedTools = targetDir ? getInstalledTools(targetDir, registry) : []
  const existingConfigKeys = targetDir ? loadExistingConfigKeys(targetDir) : new Set<string>()

  // Step 1: 工具套件选择（已装工具默认勾选）
  const tools = await selectTools(reader, installedTools.length > 0 ? installedTools : undefined)
  if (tools.length === 0) {
    p.cancel('未选择任何工具，退出')
    process.exit(0)
  }

  // Step 1b: 确定新增工具（之前未安装的）
  const newTools = installedTools.length > 0
    ? tools.filter((t) => !installedTools.includes(t))
    : tools
  const hasNewTools = newTools.length > 0

  // Step 2: MCP 服务选择（过滤已装服务）
  const installedMcpServices = targetDir ? getInstalledMcpServices(targetDir) : []
  const selectedMcpTools = await selectMcpTools(reader, tools, initialMcpValues ?? [], installedMcpServices)

  // Step 3: 配置问答（仅对新增工具执行，已有配置 key 自动跳过）
  const configuredKeys = new Set(existingConfigKeys)
  const config = hasNewTools
    ? await runQuestionnaire(reader, newTools, configuredKeys)
    : {}

  // Step 4: 模板变量
  const templateVariables = buildTemplateVariables(registry, config, selectedMcpTools)

  return { tools, config, selectedMcpTools, templateVariables }
}
