import * as p from '@clack/prompts'
import type { RegistryReader } from '../engine/registry'

/**
 * 领域 → 展示标签映射
 */
const DOMAIN_LABELS: Record<string, string> = {
  'project-management': '项目管理',
  'knowledge-base': '知识管理',
  'code-hosting': '代码托管',
  'design-tools': '设计工具',
  'docs-reference': '文档参考',
  'e2e-testing': '端到端测试',
}

/**
 * 让用户多选要集成的 MCP 外部服务。
 * 选项按 domain 分组展示，并根据已选工具动态过滤。
 * 全部不选时返回空数组，调用方应继续执行（跳过 MCP 配置）。
 *
 * @param reader - RegistryReader 实例
 * @param selectedTools - 用户已选的工具套件名称列表
 * @param initialValues - 默认勾选的服务名列表（默认全不选，仅当出现在过滤后列表中时生效）
 * @param installedMcpServices - 已安装且 key 完整的 MCP 服务列表（将完全隐藏）
 */
export async function selectMcpTools(
  reader: RegistryReader,
  selectedTools: string[] = [],
  initialValues: string[] = [],
  installedMcpServices: string[] = [],
): Promise<string[]> {
  // 构建 MCP 服务 → 依赖工具的反向映射
  const mcpToTools = buildMcpToToolsMap(reader)
  const allTools = reader.getMcpTools()

  if (allTools.length === 0) {
    p.note('没有可用的 MCP 工具', '提示')
    return []
  }

  // 根据已选工具过滤 MCP 列表
  let tools: string[]
  if (selectedTools.length > 0) {
    const allowedMcp = reader.getMcpDeps(selectedTools)
    tools = allTools.filter((t) => allowedMcp.includes(t))
  } else {
    tools = [...allTools]
  }

  if (tools.length === 0 && selectedTools.length > 0) {
    p.note('所选工具没有可用的 MCP 集成服务', '提示')
    return []
  }
  if (tools.length === 0) {
    p.note('没有可用的 MCP 工具', '提示')
    return []
  }

  // 移除已安装且 key 完整的 MCP 服务（隐藏已装）
  const hiddenMcpServices = tools.filter((t) => installedMcpServices.includes(t))
  if (hiddenMcpServices.length > 0) {
    console.log(`ℹ ${hiddenMcpServices.join('、')} 已安装，跳过选择`)
    tools = tools.filter((t) => !installedMcpServices.includes(t))
  }

  if (tools.length === 0) {
    p.note('所有相关 MCP 服务已安装，无需额外选择', '提示')
    return [...new Set([...initialValues, ...installedMcpServices])]
  }

  // Context7 放最后，其余按字母序
  tools = tools.sort((a, b) => {
    if (a === 'context7') return 1
    if (b === 'context7') return -1
    return a.localeCompare(b)
  })

  // 仅保留出现在过滤后列表中的 initialValues
  const validInitialValues = initialValues.filter((v) => tools.includes(v))

  const selected = await p.multiselect<string>({
    message: '选择要集成外部服务（空格选中，回车确认，跳过则仅安装工具本身）：',
    options: tools.map((toolName) => {
      const entry = reader.getMcpToolEntry(toolName)
      const domainLabel = entry?.domain ? (DOMAIN_LABELS[entry.domain] ?? entry.domain) : ''
      const dependents = mcpToTools[toolName] ?? []
      const hintParts: string[] = []
      if (entry?.description) hintParts.push(entry.description)
      if (dependents.length > 0) hintParts.push(`依赖: ${dependents.join(', ')}`)
      return {
        value: toolName,
        label: `${domainLabel} · ${entry?.label ?? toolName}`,
        hint: hintParts.join(' | '),
      }
    }),
    required: false,
    initialValues: validInitialValues,
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消安装')
    process.exit(0)
  }

  return selected as string[]
}

/**
 * 构建 MCP 服务名称 → 依赖该服务的工具名称列表 的反向映射。
 * 用于在选项列表中标注每个 MCP 服务的来源工具。
 */
function buildMcpToToolsMap(reader: RegistryReader): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const toolName of reader.getTools()) {
    const deps = reader.getMcpDeps([toolName])
    for (const dep of deps) {
      if (!map[dep]) map[dep] = []
      if (!map[dep].includes(toolName)) {
        map[dep].push(toolName)
      }
    }
  }
  return map
}

/**
 * 获取领域标签映射（测试用）。
 */
export function getDomainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain
}
