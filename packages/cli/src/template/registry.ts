import type { Registry, McpCapabilityResult, McpToolEntry, WizardQuestion } from '../types/registry'
import { parseFrontmatter } from '../utils/frontmatter'
import * as fs from 'node:fs'

/**
 * 根据 skill 声明的 mcpCapabilities 和实际已安装的 MCP 服务，
 * 构建能力映射 JSON 字符串（注入 {{tide_capabilities}} 模板变量时使用）。
 *
 * 只返回 skill 声明了的能力域，不相关 MCP 服务被自动过滤。
 *
 * @param mcpCapabilities - SKILL.md.tmpl frontmatter 中声明的能力声明
 *   { knowledge_base: { domain: "knowledge-base" }, ... }
 * @param installedMcpServers - 已安装的 MCP 服务名称列表（如 ["jira", "feishu-wiki"]）
 * @param mcpTools - registry.mcpTools 映射表，name → { domain, label, ... }
 * @returns 能力映射 JSON 字符串
 *
 * 输出示例：
 * {
 *   "knowledge_base": {
 *     "available": true,
 *     "providers": [{ "id": "feishu-wiki", "label": "飞书知识库" }]
 *   },
 *   "issue_tracker": {
 *     "available": false,
 *     "providers": []
 *   }
 * }
 */
export function buildMcpCapabilities(
  mcpCapabilities: Record<string, { domain: string }>,
  installedMcpServers: string[],
  mcpTools: Record<string, McpToolEntry>,
): string {
  const installedSet = new Set(installedMcpServers)
  const result: Record<string, McpCapabilityResult> = {}

  for (const [capName, capConfig] of Object.entries(mcpCapabilities)) {
    const providers = Object.entries(mcpTools)
      .filter(([, tool]) => tool.domain === capConfig.domain)
      .filter(([name]) => installedSet.has(name))
      .map(([name, tool]) => ({
        id: name,
        label: tool.label,
      }))

    result[capName] = {
      available: providers.length > 0,
      providers,
    }
  }

  return JSON.stringify(result)
}

/**
 * 读取 SKILL.md.tmpl 文件，解析 frontmatter 中的 mcpCapabilities，
 * 调用 buildMcpCapabilities 生成 JSON 字符串，注入到模板变量中。
 *
 * 如果 .tmpl 文件不存在、无 frontmatter、或无 mcpCapabilities 声明，
 * 直接返回 baseVariables（安全降级）。
 *
 * @param tmplFilePath - SKILL.md.tmpl 的完整路径
 * @param baseVariables - 已有的模板变量映射
 * @param installedMcpServers - 已安装的 MCP 服务名称列表
 * @param mcpTools - registry.mcpTools 映射表
 * @returns 注入 tide_capabilities 后的模板变量映射
 */
/**
 * 从 frontmatter 的 deepstormm.tool 字段推导模板变量名。
 * Tide → tide_capabilities, Reef → reef_capabilities, 未定义 → tide_capabilities（向后兼容）。
 */
function deriveVariableName(frontmatter: Record<string, unknown>): string {
  const deepstorm = frontmatter.deepstormm as Record<string, unknown> | undefined
  const tool = deepstorm?.tool as string | undefined
  if (tool && /^[a-z_]+$/.test(tool)) {
    return `${tool}_capabilities`
  }
  return 'tide_capabilities'
}

export function injectSkillCapabilities(
  tmplFilePath: string,
  baseVariables: Record<string, string>,
  installedMcpServers: string[],
  mcpTools: Record<string, McpToolEntry>,
  variableName?: string,
): Record<string, string> {
  if (!fs.existsSync(tmplFilePath)) return baseVariables

  const content = fs.readFileSync(tmplFilePath, 'utf-8')
  const fm = parseFrontmatter(content)
  if (!fm) return baseVariables

  const mcpCapabilities = (fm as unknown as Record<string, unknown>).mcpCapabilities as
    | Record<string, { domain: string }>
    | undefined
  if (!mcpCapabilities || Object.keys(mcpCapabilities).length === 0) {
    return baseVariables
  }

  // 从 frontmatter.deepstorm.tool 推导变量名，可选参数可以显式覆盖
  const resolvedVarName = variableName ?? deriveVariableName(fm as unknown as Record<string, unknown>)
  const capabilities = buildMcpCapabilities(mcpCapabilities, installedMcpServers, mcpTools)
  return { ...baseVariables, [resolvedVarName]: capabilities }
}

/**
 * 按 config key 在 wizard 中查找所有受影响的模板路径。
 *
 * 从 registry.wizards 中找到对应 tool 的 wizard，
 * 在 questions 中找到 key 匹配的 question，
 * 收集其所有 options 的 affectedTemplates 并集。
 *
 * @param registry - Registry 对象
 * @param configKey - 配置键（如 "reef.frontend.framework"）
 * @returns 受影响的模板路径列表（相对路径，相对于 dist/）
 */
export function findAffectedTemplates(
  registry: Registry,
  configKey: string,
): string[] {
  const affected = new Set<string>()

  for (const wizard of Object.values(registry.wizards)) {
    for (const question of wizard.questions) {
      findTemplatesInQuestion(question, configKey, affected)
    }
  }

  return [...affected]
}

/** 递归查找 question（含 group 子问题）中匹配 configKey 的 affectedTemplates */
function findTemplatesInQuestion(
  question: WizardQuestion,
  configKey: string,
  affected: Set<string>,
): void {
  if (question.type === 'group' && question.questions) {
    for (const sub of question.questions) {
      findTemplatesInQuestion(sub, configKey, affected)
    }
    return
  }

  if (question.key !== configKey) return
  for (const option of question.options || []) {
    if (option.affectedTemplates) {
      for (const tmpl of option.affectedTemplates) {
        affected.add(tmpl)
      }
    }
  }
}

/** 递归收集 question（含 group 子问题）的选项模板映射 */
function collectQuestionOptionMap(
  question: WizardQuestion,
  map: Map<string, Record<string, Record<string, string>>>,
): void {
  if (question.type === 'group' && question.questions) {
    for (const sub of question.questions) {
      collectQuestionOptionMap(sub, map)
    }
    return
  }

  const optionMap: Record<string, Record<string, string>> = {}
  for (const option of question.options || []) {
    if (option.template) {
      optionMap[option.value] = option.template
    }
  }
  map.set(question.key, optionMap)
}

/**
 * 从用户配置和 wizard 定义构建模板变量映射表。
 *
 * 对每个配置键，查找对应 wizard question，根据选中值取得选项的 template 字段，
 * 将所有 template 字段展开为 `{{configKey.field}}` → value 的扁平映射。
 *
 * 同时注入 MCP 服务状态变量 `mcp.{serviceName}` → "true" / "false"，
 * 供 skill 模板在安装时感知外部服务是否已配置。
 *
 * @param registry - Registry 对象
 * @param config - 用户配置（如 { "reef.frontend.framework": "angular" }）
 * @param installedMcpTools - 已安装的 MCP 服务名称列表
 * @returns 扁平模板变量映射表
 */
export function buildTemplateVariables(
  registry: Registry,
  config: Record<string, string>,
  installedMcpTools: string[] = [],
): Record<string, string> {
  const variables: Record<string, string> = {}

  // 收集所有 wizard 中的 question key → options 映射（含 group 子问题）
  const questionMap = new Map<string, Record<string, Record<string, string>>>()
  for (const wizard of Object.values(registry.wizards)) {
    for (const question of wizard.questions) {
      collectQuestionOptionMap(question, questionMap)
    }
  }

  for (const [key, value] of Object.entries(config)) {
    const optionMap = questionMap.get(key)
    if (!optionMap) continue

    // 支持多选（逗号分隔的值列表）
    const values = value.includes(',') ? value.split(',').map((v) => v.trim()) : [value]

    for (const singleValue of values) {
      const template = optionMap[singleValue]
      if (!template) continue

      for (const [field, fieldValue] of Object.entries(template)) {
        variables[`${key}.${field}`] = fieldValue
      }
    }
  }

  // 注入 MCP 服务状态：mcp.{serviceName} = "true" | "false"
  // 以及领域级状态：mcp.{domain} = "true"（任一服务安装）| "false"
  const knownMcpTools = Object.keys(registry.mcpTools ?? {})
  const installedSet = new Set(installedMcpTools)
  // 按领域聚合安装状态
  const domainStatus: Record<string, boolean> = {}

  for (const toolName of knownMcpTools) {
    const entry = registry.mcpTools![toolName]
    const isInstalled = installedSet.has(toolName)
    variables[`mcp.${toolName}`] = isInstalled ? 'true' : 'false'
    // 更新领域状态：任一工具安装则领域为 true
    if (isInstalled && entry.domain) {
      domainStatus[entry.domain] = true
    }
    // 确保未安装的领域也标记为 false
    if (entry.domain && !(entry.domain in domainStatus)) {
      domainStatus[entry.domain] = false
    }
  }

  // 注入领域级变量
  for (const [domain, hasAnyTool] of Object.entries(domainStatus)) {
    variables[`mcp.${domain}`] = hasAnyTool ? 'true' : 'false'
  }

  return variables
}
