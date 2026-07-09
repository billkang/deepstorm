
import { Command } from 'commander'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { RegistryReader } from '../engine/registry'
import { deepMerge } from '../utils/json'
import { mergeDeepStormConfig } from '../merger/settings'
import { mergeMcpServers } from '../merger/mcp'
import { mergeHooks } from '../merger/hooks'
import { getMcpEnvStubs, collectEnvSections } from '../wizard/mcp-env'
import { runWizardFlow } from '../wizard/wizard-flow'
import { cleanInstalled } from '../wizard/reconfigure'
import { parseNonInteractiveArgs } from '../wizard/non-interactive'
import { printGuide } from '../wizard/guide'
import { renderTemplate, copyVariants } from '../template/renderer'
import { buildTemplateVariables, injectSkillCapabilities, buildMcpCapabilities } from '../template/registry'
import { parseFrontmatter } from '../utils/frontmatter'
import { copyDir, ensureDir } from '../utils/fs'
import type { Registry, SkillEntry, WizardQuestion, McpCapabilityResult, McpToolEntry } from '../types/registry'
import type { DeepStormConfig } from '../types/config'

/**
 * 注册 setup 子命令。
 */
export function registerSetupCommand(program: Command, registry: Registry): void {
  const reader = new RegistryReader(registry)
  const cliDir = __dirname

  program
    .command('setup')
    .description('交互式安装向导 — 选择套件、配置参数、生成到 .claude/')
    .option('--reconfigure', '清空旧配置后重新运行向导')
    .option('--non-interactive', '非交互模式，通过参数传递配置')
    .option('--tools <tools>', '指定要安装的工具套件，逗号分隔')
    .option('--mcp-tools <tools>', '指定要安装的 MCP 外部服务，逗号分隔')
    .option('--set <config...>', '配置项，格式 key=value')
    .action(async (options) => {
      const targetDir = process.cwd()

      try {
        await runSetup(reader, targetDir, cliDir, options, registry)
      } catch (err) {
        console.error('安装失败:', err instanceof Error ? err.message : err)
        process.exit(1)
      }
    })
}

async function runSetup(
  reader: RegistryReader,
  targetDir: string,
  cliDir: string,
  options: { reconfigure?: boolean; nonInteractive?: boolean; tools?: string; mcpTools?: string; set?: string[] },
  registry: Registry,
): Promise<void> {
  // Step 1: --reconfigure 清理旧安装
  if (options.reconfigure) {
    cleanInstalled(targetDir)
    console.log('✔ 旧安装已清理')
  }

  let tools: string[] = []
  let config: Record<string, string> = {}
  let selectedMcpTools: string[] = []
  let templateVariables: Record<string, string> = {}
  let enabledMcpJsonServers: string[] = []
  const examplesDir = path.join(cliDir, 'env-examples')
  const installedSkillIds: string[] = []

  if (options.nonInteractive) {
    // 非交互模式：解析 --tools 和 --set 参数
    const parsed = parseNonInteractiveArgs(options.tools, options.set)
    tools = parsed.tools
    config = parsed.config

    // 解析 --mcp-tools，与已选工具交叉验证
    if (options.mcpTools) {
      const rawMcp = options.mcpTools.split(',').map((t) => t.trim()).filter(Boolean)
      if (tools.length > 0) {
        const allowedMcp = reader.getMcpDeps(tools)
        selectedMcpTools = rawMcp.filter((t) => {
          if (allowedMcp.includes(t)) return true
          console.warn(`⚠ ${t} 与已选工具无关联，已忽略`)
          return false
        })
      } else {
        selectedMcpTools = rawMcp
      }
    }

    // 非交互模式：构建模板变量
    templateVariables = buildTemplateVariables(registry, config, selectedMcpTools)
  } else {
    // Step 2a-2c: 共享向导流程（工具选择 → MCP选择 → 问答 → 模板变量）
    const wizardResult = await runWizardFlow(reader, registry, [])
    tools = wizardResult.tools
    selectedMcpTools = wizardResult.selectedMcpTools
    config = wizardResult.config
    templateVariables = wizardResult.templateVariables
  }

  // Step 3: MCP 基础设施配置
  if (selectedMcpTools.length > 0) {
    const mcpPath = path.join(targetDir, '.mcp.json')
    const servers = loadMcpServerConfigs(cliDir, selectedMcpTools)
    mergeMcpServers(mcpPath, servers)
    enabledMcpJsonServers = Object.keys(servers)
    console.log(`✔ 已安装 ${selectedMcpTools.length} 个 MCP 服务`)
  }

  // Step 3b: 安装选中工具所需的 MCP 使用指南 skill
  installMcpSkills(tools, reader, cliDir, targetDir, installedSkillIds, selectedMcpTools)

  // Step 4: 按 Way 1 遍历安装各工具的 assets（skills → agents → hooks）
  for (const tool of tools) {
    const ids = renderToolAssets(tool, reader, cliDir, targetDir, templateVariables, config, registry, selectedMcpTools)
    installedSkillIds.push(...ids)
  }

  // Step 5: 合并 hooks（hooks.json）— 逐个工具读取 `{tool}-hooks.json`，只合并选中工具的 hooks
  if (shouldInstallGlobalHooks(tools, reader)) {
    const hooksSrcDir = path.join(cliDir, 'hooks')
    const destHooksJson = path.join(targetDir, '.claude', 'hooks.json')

    for (const tool of tools) {
      const toolHooksJsonPath = path.join(hooksSrcDir, `${tool}-hooks.json`)
      if (fs.existsSync(toolHooksJsonPath)) {
        ensureDir(path.join(targetDir, '.claude'))
        const incoming = JSON.parse(fs.readFileSync(toolHooksJsonPath, 'utf-8'))
        mergeHooks(destHooksJson, incoming)
      }
    }
  }

  // Step 5b: 构建统一 MCP 能力映射（从所有 skill 模板的 frontmatter 收集）
  const mcpCapabilities = buildUnifiedMcpCapabilities(cliDir, selectedMcpTools, registry.mcpTools ?? {})

  // Step 6: 写入配置
  const installedAt = new Date().toISOString()
  const nestedConfig = buildNestedConfig(config)
  const deepstormConfig: Record<string, any> = { ...nestedConfig }
  deepstormConfig.installedSkills = installedSkillIds
  deepstormConfig.installedAt = installedAt
  if (mcpCapabilities && Object.keys(mcpCapabilities).length > 0) {
    deepstormConfig.mcpCapabilities = mcpCapabilities
  }

  // 记录 MCP 安装（去重）
  if (selectedMcpTools.length > 0) {
    const settingsPath = path.join(targetDir, '.claude', 'settings.json')
    let existingMcp: string[] = []
    try {
      const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      existingMcp = (existing.deepstorm?.installedMcpServers as string[]) ?? []
    } catch {
      // 文件不存在或格式错误，从头开始
    }
    deepstormConfig.installedMcpServers = [...new Set([...existingMcp, ...selectedMcpTools])]
  }

  const settingsPath = path.join(targetDir, '.claude', 'settings.json')
  mergeDeepStormConfig(settingsPath, deepstormConfig as DeepStormConfig)

  // 将 enabledMcpjsonServers 写入 settings.json 顶层 — 与 .mcp.json 中的 deepstorm-{name} 名称一致
  if (enabledMcpJsonServers.length > 0) {
    writeEnabledMcpJsonServers(settingsPath, enabledMcpJsonServers)
    // 同时将 MCP server 配置写入 settings.json 的 mcpServers 字段，
    // 确保 Claude Code 能直接激活这些服务（而非仅依赖 .mcp.json）
    const servers = loadMcpServerConfigs(cliDir, selectedMcpTools)
    mergeSettingsMcpServers(settingsPath, servers)
  }

  // Step 6b: 禁用沙箱（允许 localhost MCP 连接）
  mergeSandboxDisabled(settingsPath)

  // Step 7: 创建 .env — 从 .env-example 文件合并选中服务的配置项
  if (selectedMcpTools.length > 0) {
    const envPath = path.join(targetDir, '.env')
    const existingKeys = readExistingEnvKeys(envPath)
    const sections = collectEnvSections(selectedMcpTools, examplesDir, existingKeys)
    if (sections.length > 0) {
      let existing = ''
      if (fs.existsSync(envPath)) {
        existing = fs.readFileSync(envPath, 'utf-8').trimEnd()
      }
      const deepstormHeader = [
        '# ── DeepStorm ──',
        '# DeepStorm 是一套 AI 协同工具集，覆盖产品→开发→测试→运维全链路。',
        '#',
        '#   Tide  产品侧 — BMAD 需求讨论、PRD、Jira 对接',
        '#   Reef  开发侧 — 规范生成、代码实现、自动格式化/安全检查',
        '#   Sweep 测试侧 — 测试生成、覆盖率分析、CI 集成',
        '#   Atoll 运维侧 — 部署辅助、监控、故障排查',
        '#',
        '# 配置以下环境变量即可启用对应的 MCP 服务能力。',
        '',
      ].join('\n')
      const content = existing
        ? existing + '\n\n' + deepstormHeader + sections.join('\n\n') + '\n'
        : deepstormHeader + sections.join('\n\n') + '\n'
      fs.writeFileSync(envPath, content, 'utf-8')
      console.log(`✔ 已生成 .env 环境变量模板`)
    }
  }

  // 构建 guide 用的 mcpEnvStubs
  const mcpEnvStubs = getMcpEnvStubs(selectedMcpTools, examplesDir)

  // Step 8: 输出引导
  await printGuide({
    targetDir,
    installedSkills: installedSkillIds,
    config,
    mcpTools: selectedMcpTools.length > 0 ? selectedMcpTools : undefined,
    mcpEnvStubs: mcpEnvStubs.length > 0 ? mcpEnvStubs : undefined,
  })
}

/**
 * 检查一个 skill 是否应基于 configKey 跳过安装。
 * 如果 skill 有 configKey，且对应配置值为 "none" 或空字符串，则跳过。
 */
function shouldSkipSkill(
  skill: SkillEntry,
  config: Record<string, string>,
): boolean {
  if (!skill.configKey) return false
  const value = config[skill.configKey]
  return !value || value === 'none'
}

/**
 * Agent 文件名 → 依赖的配置键映射。
 * 对应配置值为 "none" 或空字符串时跳过该 agent 的安装。
 */
const AGENT_CONFIG_KEYS: Record<string, string> = {
  'reef-review-frontend': 'reef.frontend.framework',
  'reef-review-backend': 'reef.backend.language',
}

function shouldSkipAgent(
  agentFile: string,
  config: Record<string, string>,
): boolean {
  const base = agentFile.replace(/\.(md|md\.tmpl)$/, '')
  const configKey = AGENT_CONFIG_KEYS[base]
  if (!configKey) return false
  const value = config[configKey]
  return !value || value === 'none'
}

/**
 * 安装单个工具的所有 assets（skills → agents → hooks）。
 *
 * 遍历工具下的所有 skill/agent/hook，检测 .tmpl 文件后决定是渲染还是直接复制。
 * - 有 .tmpl 文件：配置感知型资产 → renderTemplate + copyVariantsForConfig
 * - 无 .tmpl 文件：静态资产 → 直接复制
 */
/**
 * 安装工具套件的技能/代理/钩子到目标目录。
 *
 * @param targetSubDir - 输出子目录前缀，setup 使用 '.claude'，plugin build 使用 ''（直接写根目录）
 */
export function renderToolAssets(
  tool: string,
  reader: RegistryReader,
  cliDir: string,
  targetDir: string,
  templateVariables: Record<string, string>,
  config: Record<string, string>,
  registry: Registry,
  installedMcpTools: string[] = [],
  targetSubDir: string = '.claude',
  /** 仅安装指定 ID 的 skill，未传入时安装所有匹配的 skill（setup 行为） */
  skillIdFilter?: Set<string>,
): string[] {
  const installedSkillIds: string[] = []
  const targetSkillsDir = targetSubDir
    ? path.join(targetDir, targetSubDir, 'skills')
    : path.join(targetDir, 'skills')

  // ── 安装技能 ──
  const toolSkills = reader.getToolSkills(tool)
  const skillsDir = path.join(cliDir, 'skills')

  for (const skill of toolSkills) {
    const skillId = getSkillId(skill, registry)
    if (!skillId) continue

    // 仅安装指定的 skill（update 时传入 installedSkills），跳过非安装列表的 skill
    if (skillIdFilter && !skillIdFilter.has(skillId)) continue

    // 根据 configKey 条件过滤：前端/后端未选时跳过对应的 skill
    if (shouldSkipSkill(skill, config)) {
      console.log(`  ⏭ ${skillId}：依赖 ${skill.configKey} 未配置，跳过`)
      continue
    }

    const srcDir = path.join(skillsDir, skillId)
    const targetDirPath = path.join(targetSkillsDir, skillId)

    if (!fs.existsSync(srcDir)) continue

    const tmplPath = path.join(srcDir, 'SKILL.md.tmpl')
    const variantsDir = path.join(srcDir, 'variants')

    if (fs.existsSync(tmplPath)) {
      // 配置感知型 skill：渲染 SKILL.md.tmpl → SKILL.md，复制 variants + fragments
      // 注入 {{tide_capabilities}} 模板变量（如有 mcpCapabilities 声明）
      const enrichedVars = injectSkillCapabilities(
        tmplPath,
        templateVariables,
        installedMcpTools,
        registry.mcpTools ?? {},
      )
      ensureDir(targetDirPath)
      renderTemplate(
        tmplPath,
        enrichedVars,
        path.join(targetDirPath, 'SKILL.md'),
      )
      // 为当前 skill 的 configKey 复制对应的 variants（仅 supplementary 文件）
      copyVariantsForConfig(variantsDir, config, targetDirPath, skill.configKey)

      // 复制选中的 code-style fragments 到 dimensions/ 目录
      copyFragmentsForSkill(skillId, srcDir, config, registry, targetDirPath)

      // 复制 references/ 子目录（如 role-prompts.md、checklists.md 等参考文件）
      copyReferencesForSkill(srcDir, targetDirPath)
    } else {
      // 静态 skill：直接复制
      copyDir(srcDir, targetDirPath)
    }

    installedSkillIds.push(skillId)
  }

  // ── 安装 agent（按 registry toolAssets 过滤） ──
  const toolAgents = reader.getToolAgents(tool)
  const agentsSrcDir = path.join(cliDir, 'agents')
  const targetAgentsDir = targetSubDir
    ? path.join(targetDir, targetSubDir, 'agents')
    : path.join(targetDir, 'agents')

  if (fs.existsSync(agentsSrcDir)) {
    ensureDir(targetAgentsDir)
    for (const agentFile of toolAgents) {
      // 根据 agent 名称过滤：前端/后端未选时跳过对应的 agent
      if (shouldSkipAgent(agentFile, config)) {
        const base = agentFile.replace(/\.(md|md\.tmpl)$/, '')
        console.log(`  ⏭ ${base}：依赖未配置，跳过`)
        continue
      }

      const srcPath = path.join(agentsSrcDir, agentFile)
      if (!fs.existsSync(srcPath)) {
        // agentFile 可能带 .tmpl，尝试查找渲染后的对应文件
        const tmplSrcPath = path.join(agentsSrcDir, agentFile.replace(/\.md$/, '.md.tmpl'))
        if (fs.existsSync(tmplSrcPath)) {
          const outputName = agentFile.replace(/\.tmpl$/, '')
          renderTemplate(
            tmplSrcPath,
            templateVariables,
            path.join(targetAgentsDir, outputName),
          )
        }
        continue
      }
      copyDir(srcPath, path.join(targetAgentsDir, agentFile))
    }
  }

  // ── 安装 hooks ──
  const toolHooks = reader.getToolHooks(tool)
  const hooksSrcDir = path.join(cliDir, 'hooks')
  const targetHooksDir = targetSubDir
    ? path.join(targetDir, targetSubDir, 'hooks')
    : path.join(targetDir, 'hooks')

  if (fs.existsSync(hooksSrcDir)) {
    ensureDir(targetHooksDir)
    for (const hookFile of toolHooks) {
      const srcPath = path.join(hooksSrcDir, hookFile)
      if (fs.existsSync(srcPath)) {
        copyDir(srcPath, path.join(targetHooksDir, hookFile))
      } else {
        const tmplPath = srcPath + '.tmpl'
        if (fs.existsSync(tmplPath)) {
          renderTemplate(
            tmplPath,
            templateVariables,
            path.join(targetHooksDir, hookFile),
          )
        }
      }
    }
  }

  return installedSkillIds
}

/**
 * 安装选中工具所需的 MCP 使用指南 skill。
 *
 * 从 wizard.json 的 mcpSkills 字段获取每个工具所需的 skill ID 列表，
 * 从 cliDir/mcp-skills/{skillId}/ 目录复制到目标 .claude/skills/ 目录。
 *
 * @param tools - 选中的工具名称列表
 * @param reader - RegistryReader 实例
 * @param cliDir - CLI 包目录（源 mcp-skills 所在位置）
 * @param targetDir - 目标项目根目录
 * @param installedSkillIds - 已安装 skill ID 列表（会被追加）
 */
export function installMcpSkills(
  tools: string[],
  reader: RegistryReader,
  cliDir: string,
  targetDir: string,
  installedSkillIds: string[],
  selectedMcpTools: string[] = [],
): void {
  const mcpSkillsDir = path.join(cliDir, 'mcp-skills')
  const targetSkillsDir = path.join(targetDir, '.claude', 'skills')
  if (!fs.existsSync(mcpSkillsDir)) return

  // 用户没有选中任何 MCP 服务时，不安装任何 MCP 技能
  if (selectedMcpTools.length === 0) {
    console.log('⏭ 未选择 MCP 服务，跳过 MCP 技能安装')
    return
  }

  const selectedMcpSet = new Set(selectedMcpTools)
  const neededSkills = new Set<string>()
  for (const tool of tools) {
    const toolMcpSkills = reader.getToolMcpSkills(tool)
    for (const skillId of toolMcpSkills) {
      // 从 skill ID 提取 MCP 服务名（deepstorm-mcp-figma-read → figma）
      const service = skillId.replace(/^deepstorm-mcp-/, '').replace(/-(read|write)$/, '')
      if (!selectedMcpSet.has(service)) continue
      neededSkills.add(skillId)
    }
  }

  let installed = 0
  for (const skillId of neededSkills) {
    const srcDir = path.join(mcpSkillsDir, skillId)
    if (fs.existsSync(srcDir)) {
      const targetDirPath = path.join(targetSkillsDir, skillId)
      copyDir(srcDir, targetDirPath)
      installedSkillIds.push(skillId)
      installed++
    }
  }

  if (installed > 0) {
    console.log(`✔ 已安装 ${installed} 个 MCP 使用指南 skill`)
  }
}

/**
 * 判断选中的工具列表中是否包含 hooks 声明。
 * Step 5 的 gating 条件—仅当返回 true 时才复制全局 hooks.json。
 */
export function shouldInstallGlobalHooks(
  tools: string[],
  reader: RegistryReader,
): boolean {
  return tools.some((tool) => reader.getToolHooks(tool).length > 0)
}

/**
 * 从所有 skill 模板文件的 frontmatter 中收集 mcpCapabilities 声明，
 * 构建统一的能力映射，供写入 settings.json 的 deepstormm.mcpCapabilities。
 *
 * 扫描 cliDir/skills/{skillId}/SKILL.md.tmpl，提取 mcpCapabilities 域声明，
 * 合并后调用 buildMcpCapabilities 生成统一的能力可用性映射。
 *
 * @param cliDir - CLI 包目录（dist/），包含 skills/ 子目录
 * @param installedMcpTools - 已安装的 MCP 服务名称列表
 * @param mcpTools - registry.mcpTools 映射表，name → { domain, label }
 * @returns 按域分组的能力映射对象
 */
export function buildUnifiedMcpCapabilities(
  cliDir: string,
  installedMcpTools: string[],
  mcpTools: Record<string, McpToolEntry>,
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

/**
 * 从 registry.skills 中找到指定 skill entry 的 ID。
 */
function getSkillId(
  skill: { configKey: string; configValue: string } | { tool?: string },
  registry: Registry,
): string | undefined {
  for (const [id, entry] of Object.entries(registry.skills)) {
    if (entry === skill) return id
  }
  return undefined
}

/**
 * 遍历用户配置，为匹配的 config key 复制对应的 variants 内容。
 * 仅检查与当前 skill 的 configKey 相关的配置值，避免全局配置中其他技能的值产生误报。
 */
function copyVariantsForConfig(
  variantsDir: string,
  config: Record<string, string>,
  targetDir: string,
  configKey?: string,
): void {
  if (!fs.existsSync(variantsDir)) return

  for (const [key, value] of Object.entries(config)) {
    if (configKey && key !== configKey) continue
    // 多选值（逗号分隔）由子选项各自的 fragment 处理，变体由父级配置值覆盖
    if (value.includes(',')) continue
    copyVariants(variantsDir, value, targetDir)
  }
}

/**
 * 从 registry.wizards 中读取 fragements 配置，为当前 skill 复制选中的
 * code-style 维度文件到 skill 目录下的 dimensions/ 目录。
 */
export function copyFragmentsForSkill(
  skillId: string,
  srcDir: string,
  config: Record<string, string>,
  registry: Registry,
  targetDir: string,
): void {
  const fragmentsDir = path.join(srcDir, 'fragments')
  if (!fs.existsSync(fragmentsDir)) return

  // 收集该 tool 所有 wizard question 中选中选项的 fragments
  const selectedFragments: Array<{ category: string; value: string }> = []

  for (const wizard of Object.values(registry.wizards)) {
    for (const question of wizard.questions) {
      collectFragmentsFromQuestion(question, config, selectedFragments)
    }
  }

  if (selectedFragments.length === 0) return

  // 遍历每个选中的 fragment，将 quick-reference.md 展开到技能根目录，
  // 所有 examples 合并到统一 examples/ 文件夹（加 {value}- 前缀避免重名）
  const targetExamplesDir = path.join(targetDir, 'examples')

  for (const { category, value } of selectedFragments) {
    const srcPath = path.join(fragmentsDir, category, value)
    if (!fs.existsSync(srcPath)) continue

    // 1. quick-reference.md → {value}.md（如 spring-boot.md、hibernate.md）
    const srcQr = path.join(srcPath, 'quick-reference.md')
    if (fs.existsSync(srcQr)) {
      fs.cpSync(srcQr, path.join(targetDir, `${value}.md`), { force: true })
    }

    // 2. examples/* → examples/{value}-{filename}（加前缀防重名）
    const srcExamples = path.join(srcPath, 'examples')
    if (fs.existsSync(srcExamples)) {
      const exampleFiles = fs.readdirSync(srcExamples)
      for (const file of exampleFiles) {
        if (file === '.DS_Store') continue
        ensureDir(targetExamplesDir)
        fs.cpSync(
          path.join(srcExamples, file),
          path.join(targetExamplesDir, `${value}-${file}`),
          { force: true },
        )
      }
    }

    // 3. 其他 .md 文件（如 jackson-polymorphism.md）直接复制到技能根目录
    //    quick-reference.md 已由步骤 1 处理，此处跳过避免重复
    const allFiles = fs.readdirSync(srcPath)
    for (const file of allFiles) {
      if (file === '.DS_Store') continue
      if (file === 'quick-reference.md') continue
      if (file === 'examples') continue
      if (!file.endsWith('.md')) continue
      fs.cpSync(path.join(srcPath, file), path.join(targetDir, file), { force: true })
    }
  }
}

/**
 * 复制 references/ 子目录从源 skill 目录到目标目录。
 * 仅当 references/ 存在时复制，否则静默跳过。
 */
export function copyReferencesForSkill(srcDir: string, targetDir: string): void {
  const referencesDir = path.join(srcDir, 'references')
  if (fs.existsSync(referencesDir)) {
    const targetReferencesDir = path.join(targetDir, 'references')
    ensureDir(targetReferencesDir)
    fs.cpSync(referencesDir, targetReferencesDir, { recursive: true, force: true })
  }
}

/** 递归收集 question（含 group 子问题）中选中选项的 fragments */
export function collectFragmentsFromQuestion(
  question: WizardQuestion,
  config: Record<string, string>,
  selectedFragments: Array<{ category: string; value: string }>,
): void {
  if (question.type === 'group' && question.questions) {
    for (const sub of question.questions) {
      collectFragmentsFromQuestion(sub, config, selectedFragments)
    }
    return
  }

  const selectedValue = config[question.key]
  if (!selectedValue || selectedValue === 'none') return

  // 支持多选（逗号分隔的值列表）
  const values = selectedValue.includes(',')
    ? selectedValue.split(',').map((v) => v.trim())
    : [selectedValue]

  for (const singleValue of values) {
    const option = question.options?.find((o) => o.value === singleValue)
    if (!option?.fragments || option.fragments.length === 0) continue

    for (const fragmentPath of option.fragments) {
      // fragmentPath 格式为 "category/value"（可多层，如 "java/framework/spring-boot"）
      // 最后一层为 value，前面所有为 category
      const parts = fragmentPath.split('/')
      if (parts.length < 2) continue
      const value = parts.pop()!
      const category = parts.join('/')
      selectedFragments.push({ category, value })
    }
  }
}

/**
 * 从 dist/mcp/ 中读取选中 MCP 服务的 server 配置，合并为一个 Record。
 * 每个 server 以 deepstorm-{name} 命名，避免与用户手动配置冲突。
 */
function loadMcpServerConfigs(
  cliDir: string,
  selectedTools: string[],
): Record<string, unknown> {
  const mcpDir = path.join(cliDir, 'mcp')
  if (!fs.existsSync(mcpDir)) return {}

  const servers: Record<string, unknown> = {}

  // 递归扫描 mcp 目录下的所有 JSON 文件
  function collectJsonFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      if (entry === '.DS_Store') continue
      if (fs.statSync(fullPath).isDirectory()) {
        results.push(...collectJsonFiles(fullPath))
      } else if (entry.endsWith('.json')) {
        results.push(fullPath)
      }
    }
    return results
  }

  const jsonFiles = collectJsonFiles(mcpDir)
  for (const jsonPath of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      if (!data.name || !selectedTools.includes(data.name)) continue
      if (!data.mcpServers || typeof data.mcpServers !== 'object') continue

      for (const [serverName, serverConfig] of Object.entries(data.mcpServers)) {
        // 使用 deepstorm-{name} 命名避免冲突
        servers[`deepstorm-${serverName}`] = serverConfig
      }
    } catch {
      // 跳过无法解析的 JSON
    }
  }

  return servers
}

/** 将扁平配置转为嵌套结构 */
function buildNestedConfig(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {}
      current = current[parts[i]]
    }
    // 多选值（"subkey:value,subkey2:value2"）展开为嵌套对象
    if (isMultiselectWithSubKeys(value)) {
      const obj: Record<string, string> = {}
      for (const part of value.split(',')) {
        const colonIdx = part.indexOf(':')
        if (colonIdx > 0) {
          obj[part.slice(0, colonIdx)] = part.slice(colonIdx + 1)
        }
      }
      current[parts[parts.length - 1]] = obj
    } else {
      current[parts[parts.length - 1]] = value
    }
  }
  return result
}

/** 判断是否为 "subkey:value,subkey2:value2" 格式的多选值 */
function isMultiselectWithSubKeys(value: string): boolean {
  if (!value.includes(',')) return false
  return value.split(',').every((part) => {
    const colonIdx = part.indexOf(':')
    return colonIdx > 0 && colonIdx < part.length - 1 && !part.includes('.')
  })
}

/**
 * 将 enabledMcpjsonServers 写入 .claude/settings.json 顶层。
 * 文件不存在时自动创建，已有非 enabledMcpjsonServers 字段原样保留。
 *
 * @param settingsPath - .claude/settings.json 的绝对路径
 * @param serverNames - 已启用的 MCP server 名称列表（带 deepstorm- 前缀）
 */
export function writeEnabledMcpJsonServers(
  settingsPath: string,
  serverNames: string[],
): void {
  if (serverNames.length === 0) return

  let settings: Record<string, unknown> = {}
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      settings = JSON.parse(raw)
    }
  } catch {
    settings = {}
  }

  settings.enabledMcpjsonServers = serverNames
  ensureDir(path.dirname(settingsPath))
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
}

/**
 * 写入 sandbox 禁用配置到 .claude/settings.json 顶层。
 * 禁用沙箱以允许 Playwright MCP 等 localhost 服务的连接。
 *
 * @param settingsPath - .claude/settings.json 的绝对路径
 */
export function mergeSandboxDisabled(settingsPath: string): void {
  let settings: Record<string, unknown> = {}
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      settings = JSON.parse(raw)
    }
  } catch {
    settings = {}
  }

  settings.sandbox = { enabled: false }
  ensureDir(path.dirname(settingsPath))
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
}


/**
 * 将 MCP server 配置合并到 .claude/settings.json 的 mcpServers 字段。
 * 与 .mcp.json 保持同步，确保 Claude Code 能直接通过 settings.json 激活这些服务。
 *
 * 使用 deepMerge 合并以保证已有配置不会被覆盖。
 *
 * @param settingsPath - .claude/settings.json 的绝对路径
 * @param servers - 要合并的 MCP server 配置对象（key 为 server 名称，如 deepstorm-playwright）
 */
export function mergeSettingsMcpServers(
  settingsPath: string,
  servers: Record<string, unknown>,
): void {
  if (!servers || Object.keys(servers).length === 0) return

  let settings: Record<string, unknown> = {}
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      settings = JSON.parse(raw)
    }
  } catch {
    settings = {}
  }

  const existingServers = (settings.mcpServers as Record<string, unknown>) || {}
  settings.mcpServers = deepMerge(existingServers, servers)
  ensureDir(path.dirname(settingsPath))
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
}

/** 读取已有 .env 中已填值的 KEY */
function readExistingEnvKeys(envPath: string): Set<string> {
  const keys = new Set<string>()
  if (!fs.existsSync(envPath)) return keys
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx <= 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && value && !value.startsWith('your_') && !value.endsWith('_here')) {
      keys.add(key)
    }
  }
  return keys
}

/**
 * 生成 .env.example — 从源 .env-example 文件提取原始模板内容。
 * 在 Step 7 写入 .env 后同步调用，生成一个干净的模板参考文件（可提交版本控制）。
 */
export function generateEnvExample(
  selectedMcpTools: string[],
  examplesDir: string,
  targetDir: string,
): void {
  const rawSections: string[] = []
  for (const tool of selectedMcpTools) {
    const filePath = path.join(examplesDir, `${tool}.env-example`)
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8').trimEnd()
      rawSections.push(raw)
    }
  }
  if (rawSections.length > 0) {
    const envExamplePath = path.join(targetDir, '.env.example')
    const exampleContent = rawSections.join('\n\n') + '\n'
    fs.writeFileSync(envExamplePath, exampleContent, 'utf-8')
    console.log(`✔ 已生成 .env.example 环境变量参考模板`)
  }
}
