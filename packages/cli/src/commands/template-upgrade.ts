import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { RegistryReader } from '../engine/registry'
import { renderToolAssets, installMcpSkills } from './setup'
import { buildTemplateVariables } from '../template/registry'
import { mergeHooks } from '../merger/hooks'
import { ensureDir } from '../utils/fs'
import type { Registry } from '../types/registry'

// ─── Checkpoint utilities ────────────────────────────────────────

/**
 * 每条同步记录的格式，存储路径相对于 targetDir 便于跨环境比较。
 */
export interface SyncReport {
  /** 成功同步的 skill ID 列表 */
  syncedSkills: string[]
  /** 成功同步的 agent 文件名列表（不含路径） */
  syncedAgents: string[]
  /** 成功同步的 hook 文件名列表（不含路径） */
  syncedHooks: string[]
  /** 因检测到用户修改而被备份的文件（路径相对于 targetDir） */
  backedUpFiles: string[]
}

/** checksum 存储文件路径（相对于 targetDir/.claude/） */
const CHECKSUM_FILE = 'deepstorm-checksums.json'

// ─── Checksum utilities ──────────────────────────────────────────

/**
 * 计算单个文件的 SHA256 摘要。
 * 文件不存在或读取失败返回 null。
 */
export function computeFileChecksum(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(content).digest('hex')
  } catch {
    return null
  }
}

/**
 * 递归收集目录下所有文件的相对路径（不含目录本身）并计算摘要。
 * 返回 key = 相对路径，value = sha256。
 */
export function computeDirChecksums(
  dirPath: string,
  relativeTo: string = dirPath,
): Record<string, string> {
  const result: Record<string, string> = {}
  if (!fs.existsSync(dirPath)) return result

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.name === '.DS_Store') continue
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const relPath = path.relative(relativeTo, fullPath)
        const checksum = computeFileChecksum(fullPath)
        if (checksum) result[relPath] = checksum
      }
    }
  }
  walk(dirPath)
  return result
}

/**
 * 从 checkpoint 文件读取前次记录的 checksum 映射。
 */
function loadChecksums(targetDir: string): Record<string, string> {
  const filePath = path.join(targetDir, '.claude', CHECKSUM_FILE)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return {}
  }
}

/**
 * 将 checksum 映射写入 checkpoint 文件。
 */
function saveChecksums(targetDir: string, checksums: Record<string, string>): void {
  const dir = path.join(targetDir, '.claude')
  ensureDir(dir)
  fs.writeFileSync(
    path.join(dir, CHECKSUM_FILE),
    JSON.stringify(checksums, null, 2) + '\n',
    'utf-8',
  )
}

// ─── Backup utility ───────────────────────────────────────────────

/**
 * 备份单个文件。将源文件重命名为 `{filename}.{timestamp}.bak`。
 * 返回新文件名（仅 basename），备份失败或不需要备份返回 null。
 */
export function backupFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const dir = path.dirname(filePath)
    const ext = path.extname(filePath)
    const base = path.basename(filePath, ext)
    const timestamp = Date.now()
    const bakName = `${base}.${timestamp}.bak`
    const bakPath = path.join(dir, bakName)
    fs.cpSync(filePath, bakPath, { force: true })
    return bakName
  } catch {
    return null
  }
}

// ─── Modified-file detection & backup ────────────────────────────

/**
 * 对比目标文件的当前 checksum 与存储的历史 checksum。
 * 如果存在差异（即用户修改过），备份后返回 true；否则返回 false。
 *
 * @param fileKey  存储在 checksum 中的 key（通常为相对路径）
 * @param filePath 目标文件的绝对路径
 * @param stored   历史 checksum 映射
 * @param backedUp 会被追加的备份记录列表
 */
function checkAndBackup(
  fileKey: string,
  filePath: string,
  stored: Record<string, string>,
  backedUp: string[],
): void {
  const lastChecksum = stored[fileKey]
  if (!lastChecksum) return // 首次同步，无历史记录

  const current = computeFileChecksum(filePath)
  if (current === null) return // 文件不存在
  if (current === lastChecksum) return // 未修改

  const bakName = backupFile(filePath)
  if (bakName) {
    backedUp.push(`${fileKey} → ${bakName}`)
  }
}

/**
 * 在同步前扫描所有目标资产，检测用户修改并备份。
 */
function backupModifiedAssets(
  targetDir: string,
  skillIds: string[],
  toolNames: string[],
  registry: Registry,
): string[] {
  const stored = loadChecksums(targetDir)
  const backedUp: string[] = []

  // 1. 检查 skill 目录下的文件
  for (const skillId of skillIds) {
    const skillDir = path.join(targetDir, '.claude', 'skills', skillId)
    if (!fs.existsSync(skillDir)) continue
    const checksums = computeDirChecksums(skillDir)
    for (const [relPath] of Object.entries(checksums)) {
      const key = `skills/${skillId}/${relPath}`
      checkAndBackup(key, path.join(skillDir, relPath), stored, backedUp)
    }
  }

  // 2. 检查 agent 文件
  const reader = new RegistryReader(registry)
  for (const tool of toolNames) {
    const agents = reader.getToolAgents(tool)
    for (const agentFile of agents) {
      const filePath = path.join(targetDir, '.claude', 'agents', agentFile.replace(/\.tmpl$/, ''))
      const key = `agents/${agentFile.replace(/\.tmpl$/, '')}`
      checkAndBackup(key, filePath, stored, backedUp)
    }
  }

  // 3. 检查 hook 文件
  for (const tool of toolNames) {
    const hooks = reader.getToolHooks(tool)
    for (const hookFile of hooks) {
      const filePath = path.join(targetDir, '.claude', 'hooks', hookFile)
      const key = `hooks/${hookFile}`
      checkAndBackup(key, filePath, stored, backedUp)
    }
  }

  return backedUp
}

/**
 * 同步后收集所有已安装文件的 checksum 并存储。
 */
function storeNewChecksums(
  targetDir: string,
  skillIds: string[],
  toolNames: string[],
  registry: Registry,
): void {
  const newChecksums: Record<string, string> = {}
  const reader = new RegistryReader(registry)

  // 1. skill 目录
  for (const skillId of skillIds) {
    const skillDir = path.join(targetDir, '.claude', 'skills', skillId)
    const checksums = computeDirChecksums(skillDir)
    for (const [relPath, checksum] of Object.entries(checksums)) {
      newChecksums[`skills/${skillId}/${relPath}`] = checksum
    }
  }

  // 2. agent 文件
  for (const tool of toolNames) {
    const agents = reader.getToolAgents(tool)
    for (const agentFile of agents) {
      const installedName = agentFile.replace(/\.tmpl$/, '')
      const filePath = path.join(targetDir, '.claude', 'agents', installedName)
      const chk = computeFileChecksum(filePath)
      if (chk) newChecksums[`agents/${installedName}`] = chk
    }
  }

  // 3. hook 文件
  for (const tool of toolNames) {
    const hooks = reader.getToolHooks(tool)
    for (const hookFile of hooks) {
      const filePath = path.join(targetDir, '.claude', 'hooks', hookFile)
      const chk = computeFileChecksum(filePath)
      if (chk) newChecksums[`hooks/${hookFile}`] = chk
    }
  }

  saveChecksums(targetDir, newChecksums)
}

/**
 * 将 installedSkillIds 反向映射为唯一的 tool 名称列表。
 */
function skillIdsToTools(
  skillIds: string[],
  registry: Registry,
): string[] {
  const toolSet = new Set<string>()
  for (const skillId of skillIds) {
    const skill = registry.skills[skillId]
    if (skill?.tool) {
      toolSet.add(skill.tool)
    }
  }
  return [...toolSet]
}

/**
 * 从 settings.json 的 deepstorm.* 中提取嵌套配置，展平为 Record<string, string>。
 * 同时过滤掉非配置的元数据字段（installedSkills、installedMcpServers 等）。
 */
function readSettingsConfig(targetDir: string): {
  config: Record<string, string>
  installedMcpTools: string[]
} {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')
  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    const deepstorm = settings.deepstorm || {}

    const metaKeys = new Set([
      'installedSkills',
      'installedMcpServers',
      'installedAt',
      'mcpCapabilities',
    ])

    const config: Record<string, string> = {}
    flattenNestedConfig(deepstorm, '', config, metaKeys)

    const installedMcpTools: string[] = deepstorm.installedMcpServers ?? []

    return { config, installedMcpTools }
  } catch {
    return { config: {}, installedMcpTools: [] }
  }
}

/** 递归展开嵌套对象为点号分隔的扁平映射，跳过元数据字段 */
function flattenNestedConfig(
  obj: Record<string, unknown>,
  prefix: string,
  result: Record<string, string>,
  skipKeys: Set<string>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (skipKeys.has(key)) continue
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenNestedConfig(value as Record<string, unknown>, fullKey, result, skipKeys)
    } else if (typeof value === 'string') {
      result[fullKey] = value
    }
  }
}

/**
 * 加载 dist/ 下的 registry.json。
 */
function loadRegistryFromCliDir(cliDir: string): Registry | null {
  const registryPath = path.join(cliDir, 'registry.json')
  try {
    const raw = fs.readFileSync(registryPath, 'utf-8')
    return JSON.parse(raw) as Registry
  } catch {
    return null
  }
}

/**
 * 合并 {tool}-hooks.json 到 .claude/hooks/hooks.json。
 */
function mergeToolHooksJson(
  toolNames: string[],
  cliDir: string,
  targetDir: string,
): void {
  const hooksSrcDir = path.join(cliDir, 'hooks')
  const targetHooksDir = path.join(targetDir, '.claude', 'hooks')
  const destHooksJson = path.join(targetHooksDir, 'hooks.json')

  for (const tool of toolNames) {
    const toolHooksJsonPath = path.join(hooksSrcDir, `${tool}-hooks.json`)
    if (fs.existsSync(toolHooksJsonPath)) {
      ensureDir(targetHooksDir)
      const incoming = JSON.parse(fs.readFileSync(toolHooksJsonPath, 'utf-8'))
      mergeHooks(destHooksJson, incoming)
    }
  }
}

// ─── Main upgrade function ────────────────────────────────────────

/**
 * 全量同步工具资产（skills + agents + hooks）。
 *
 * 流程：
 * 1. 从 settings.json 读取安装记录 + 配置
 * 2. 反向映射 skill ID → tool 名称
 * 3. 备份用户修改过的文件
 * 4. 对每个 tool 调用 renderToolAssets 安装最新资产
 * 5. 合并 {tool}-hooks.json
 * 6. 存储新的 checksum 快照
 *
 * @param cliDir       dist/ 目录（__dirname）
 * @param targetDir    目标项目根目录（process.cwd()）
 * @param installedSkillIds  已安装 skill ID 列表
 * @returns 同步报告
 */
export function syncToolAssets(
  cliDir: string,
  targetDir: string,
  installedSkillIds: string[],
): SyncReport {
  // ── 1. 加载 registry ──
  const registry = loadRegistryFromCliDir(cliDir)
  if (!registry) {
    console.log('⚠ 无法加载 registry.json，跳过资产同步')
    return { syncedSkills: [], syncedAgents: [], syncedHooks: [], backedUpFiles: [] }
  }

  const reader = new RegistryReader(registry)
  const toolNames = skillIdsToTools(installedSkillIds, registry)

  if (toolNames.length === 0) {
    console.log('⚠ 无法从已安装 skill 解析工具名称，跳过资产同步')
    return { syncedSkills: [], syncedAgents: [], syncedHooks: [], backedUpFiles: [] }
  }

  // ── 2. 读取配置 ──
  const { config, installedMcpTools } = readSettingsConfig(targetDir)
  const templateVariables = buildTemplateVariables(registry, config, installedMcpTools)

  // ── 2b. 计算需要同步的 MCP skill ID 列表 ──
  const mcpSkillSet = new Set<string>()
  if (installedMcpTools.length > 0) {
    const selectedMcpSet = new Set(installedMcpTools)
    for (const tool of toolNames) {
      for (const skillId of reader.getToolMcpSkills(tool)) {
        // 从 skill ID 提取 MCP 服务名（deepstorm-mcp-figma-read → figma）
        const service = skillId.replace(/^deepstorm-mcp-/, '').replace(/-(read|write)$/, '')
        if (selectedMcpSet.has(service)) mcpSkillSet.add(skillId)
      }
    }
  }
  const mcpSkillIds = [...mcpSkillSet]

  // ── 3. 备份用户修改（包含常规 skill + 已安装的 MCP skill） ──
  const allSkillIdsForBackup = [...new Set([...installedSkillIds, ...mcpSkillIds])]
  const backedUpFiles = backupModifiedAssets(targetDir, allSkillIdsForBackup, toolNames, registry)

  if (backedUpFiles.length > 0) {
    console.log('\n⚠ 检测到用户修改的文件：')
    for (const info of backedUpFiles) {
      console.log(`  已备份 ${info}`)
    }
    console.log('')
  }

  // ── 4. 同步每个工具的资产 ──
  const actualSkillIds: string[] = []
  const syncedAgents: string[] = []
  const syncedHooks: string[] = []
  let hasWarning = false

  for (const tool of toolNames) {
    try {
      reader.getToolEntry(tool) // 确认工具存在
    } catch {
      continue
    }

    const beforeAgents = reader.getToolAgents(tool)
    const beforeHooks = reader.getToolHooks(tool)

    try {
      const ids = renderToolAssets(
        tool,
        reader,
        cliDir,
        targetDir,
        templateVariables,
        config,
        registry,
        installedMcpTools,
        '.claude',
      )
      actualSkillIds.push(...ids)
      syncedAgents.push(...beforeAgents)
      syncedHooks.push(...beforeHooks)
    } catch (err) {
      hasWarning = true
      console.log(`  ⚠ ${tool} 同步出错: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const syncedSkills = actualSkillIds.length > 0 ? actualSkillIds : [...installedSkillIds]

  // ── 5. 同步 MCP 技能（仅当用户已配置 MCP 服务时） ──
  const syncedMcpSkillIds: string[] = []
  if (installedMcpTools.length > 0) {
    installMcpSkills(toolNames, reader, cliDir, targetDir, syncedMcpSkillIds, installedMcpTools)
  }

  // ── 6. 合并 hooks.json ──
  mergeToolHooksJson(toolNames, cliDir, targetDir)

  // ── 7. 存储新的 checksum 快照（包含常规 skill + MCP skill） ──
  const allSkillIds = [...installedSkillIds, ...syncedMcpSkillIds]
  storeNewChecksums(targetDir, allSkillIds, toolNames, registry)

  if (hasWarning) {
    console.log('\n⚠ 部分工具同步出错，请检查后重试')
  }

  // 去重
  const uniqueAgents = [...new Set(syncedAgents)]
  const uniqueHooks = [...new Set(syncedHooks)]

  return {
    syncedSkills: [...syncedSkills, ...syncedMcpSkillIds],
    syncedAgents: uniqueAgents,
    syncedHooks: uniqueHooks,
    backedUpFiles,
  }
}

/**
 * 升级技能模板（旧接口，保持向后兼容）。
 * 内部委托给 syncToolAssets 但只返回 skill 同步信息。
 */
export function upgradeTemplates(
  cliDir: string,
  targetDir: string,
  skillIds: string[],
): void {
  const report = syncToolAssets(cliDir, targetDir, skillIds)
  if (report.syncedSkills.length > 0) {
    const count = report.syncedSkills.length
    const agentCount = report.syncedAgents.length
    const hookCount = report.syncedHooks.length
    console.log(`\n✔ 同步完成：${count} 个 skill${agentCount > 0 ? `、${agentCount} 个 agent` : ''}${hookCount > 0 ? `、${hookCount} 个 hook` : ''}`)
    if (report.backedUpFiles.length > 0) {
      console.log(`  已备份 ${report.backedUpFiles.length} 个修改过的文件`)
    }
  }
}
