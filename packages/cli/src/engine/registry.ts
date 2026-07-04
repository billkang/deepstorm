import type { Registry, SkillEntry, WizardEntry, McpToolEntry } from '../types/registry'

/**
 * registry.json 的运行时读取器。
 * 提供按条件查询 skill、获取工具列表和向导定义的能力。
 */
export class RegistryReader {
  constructor(private readonly registry: Registry) {}

  /** 按 configKey + configValue 匹配 skill */
  findSkills(configKey: string, configValue: string): SkillEntry[] {
    return Object.values(this.registry.skills).filter(
      (s) => s.configKey === configKey && s.configValue === configValue,
    )
  }

  /** 按 configKey + configValue 匹配 skill，返回 skill ID 列表 */
  findSkillIds(configKey: string, configValue: string): string[] {
    return Object.entries(this.registry.skills)
      .filter(
        ([, s]) => s.configKey === configKey && s.configValue === configValue,
      )
      .map(([id]) => id)
  }

  /** 获取所有工具名称列表 */
  getTools(): string[] {
    return Object.keys(this.registry.tools)
  }

  /** 获取工具元信息 */
  getToolEntry(toolName: string): { label: string; description: string } | undefined {
    return this.registry.tools[toolName]
  }

  /** 获取指定工具的问答向导定义 */
  getWizard(toolName: string): WizardEntry | undefined {
    return this.registry.wizards[toolName]
  }

  /** 按 skill ID 查找单个 skill */
  getSkill(skillId: string): SkillEntry | undefined {
    return this.registry.skills[skillId]
  }

  /** 获取指定工具的所有 skill */
  getToolSkills(toolName: string): SkillEntry[] {
    return Object.values(this.registry.skills).filter(
      (s) => s.tool === toolName,
    )
  }

  /** 获取指定工具的 agent 文件名列表 */
  getToolAgents(toolName: string): string[] {
    return this.registry.toolAssets?.[toolName]?.agents ?? []
  }

  /** 获取指定工具的 hook 文件名列表 */
  getToolHooks(toolName: string): string[] {
    return this.registry.toolAssets?.[toolName]?.hooks ?? []
  }

  /** 获取所有 MCP 工具名称列表 */
  getMcpTools(): string[] {
    return Object.keys(this.registry.mcpTools ?? {})
  }

  /** 获取 MCP 工具元信息 */
  getMcpToolEntry(name: string): McpToolEntry | undefined {
    return this.registry.mcpTools?.[name]
  }

  /** 获取指定工具所需的 MCP skill ID 列表 */
  getToolMcpSkills(toolName: string): string[] {
    const wizard = this.registry.wizards[toolName] as unknown as Record<string, unknown> | undefined
    if (!wizard || !Array.isArray(wizard.mcpSkills)) return []
    return wizard.mcpSkills as string[]
  }

  /** 获取指定工具列表关联的所有 MCP 服务名称（并集、去重） */
  getMcpDeps(tools: string[]): string[] {
    const deps = new Set<string>()
    for (const tool of tools) {
      const entry = this.registry.tools[tool]
      if (entry?.mcpDependencies) {
        for (const dep of entry.mcpDependencies) {
          deps.add(dep)
        }
      }
    }
    return [...deps]
  }
}
