/** registry.json 整体结构 */
export interface Registry {
  version: string
  tools: Record<string, ToolEntry>
  wizards: Record<string, WizardEntry>
  skills: Record<string, SkillEntry>
  /** 工具 → assets 映射（agent/hook 文件名列表） */
  toolAssets?: Record<string, ToolAssets>
  /** MCP 工具元信息（从 mcp/ 目录 JSON 文件聚合） */
  mcpTools?: Record<string, McpToolEntry>
}

/** 工具关联的 agent 和 hook 资产 */
export interface ToolAssets {
  agents?: string[]
  hooks?: string[]
}

/** 工具元信息 */
export interface ToolEntry {
  label: string
  description: string
  /** 该工具关联的 MCP 服务名称列表 */
  mcpDependencies?: string[]
}

/** 工具的问答流程定义 */
export interface WizardEntry {
  tool: string
  label: string
  description: string
  /** 该工具所需的 deepstorm-mcp-* skill 列表 */
  mcpSkills?: string[]
  questions: WizardQuestion[]
}

/** 单个问答项 */
export interface WizardQuestion {
  key: string
  label: string
  description?: string
  type: 'select' | 'confirm' | 'multiselect' | 'group'
  /** 依赖条件 — 父问题选择特定值后才展示本问题 */
  dependsOn?: {
    key: string
    value: string
    not?: boolean
    /** 父值为多选时（逗号分隔），检查 value 是否包含在父值列表中 */
    contains?: boolean
  }
  options?: WizardOption[]
  /** 子问题列表（仅 type === 'group' 时有效） */
  questions?: WizardQuestion[]
}

/** 问答选项 */
export interface WizardOption {
  value: string
  label: string
  /** 选项分组（用于 groupMultiselect 展示分类标题） */
  group?: string
  /** 该选项对应的模板变量映射（如 { label: "Angular 21", buildTool: "pnpm:*" }） */
  template?: Record<string, string>
  /** 该选项变更时需要重新渲染的模板路径列表（相对于 dist/） */
  affectedTemplates?: string[]
  /** 该选项关联的 code-style fragment 路径列表（如 ["framework/angular"] → 对应 fragments/framework/angular/） */
  fragments?: string[]
}

/** MCP 工具元信息（从 mcp/**&#47;*.json 聚合） */
export interface McpToolEntry {
  domain: string
  label: string
  description: string
}

/** 能力映射结果 — 单个能力域的可用性和 provider 列表 */
export interface McpCapabilityResult {
  available: boolean
  providers: Array<{ id: string; label: string }>
}

/** 技能注册条目（从 SKILL.md frontmatter 聚合） */
export interface SkillEntry {
  tool: string
  configKey: string
  configValue: string
  dependencies?: string[]
  /** 技能显示名称（从 SKILL.md frontmatter name 字段） */
  name?: string
  /** 技能描述（从 SKILL.md frontmatter description 字段） */
  description?: string
  /** 是否使用 SKILL.md.tmpl 模板渲染（配置感知型 skill） */
  hasTemplate?: boolean
}
