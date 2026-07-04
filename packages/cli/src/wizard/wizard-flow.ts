import * as p from '@clack/prompts'
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
 * 共享向导流程：工具选择 → MCP 选择（按工具过滤）→ 配置问答 → 模板变量。
 *
 * setup 和 plugin build 共用此流程，确保一致的向导体验。
 *
 * @param reader - RegistryReader 实例
 * @param registry - Registry 实例
 * @param initialMcpValues - MCP 默认勾选的服务名列表（如 setup 的 ['context7']）
 */
export async function runWizardFlow(
  reader: RegistryReader,
  registry: Registry,
  initialMcpValues?: string[],
): Promise<WizardFlowResult> {
  // Step 1: 工具套件选择
  const tools = await selectTools(reader)
  if (tools.length === 0) {
    p.cancel('未选择任何工具，退出')
    process.exit(0)
  }

  // Step 2: MCP 服务选择（按已选工具过滤）
  const selectedMcpTools = await selectMcpTools(reader, tools, initialMcpValues ?? [])

  // Step 3: 配置问答
  const configuredKeys = new Set<string>()
  const config = await runQuestionnaire(reader, tools, configuredKeys)

  // Step 4: 模板变量
  const templateVariables = buildTemplateVariables(registry, config, selectedMcpTools)

  return { tools, config, selectedMcpTools, templateVariables }
}
