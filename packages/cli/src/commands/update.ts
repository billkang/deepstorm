import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { getCliVersion } from '../utils/version'
import { upgradeTemplates } from './template-upgrade'
import { getDeepStormConfigPath, writeDeepStormConfig, readDeepStormConfig } from '../merger/settings'

export interface NpmVersionResult {
  /** 本地当前版本号 */
  current: string
  /** npm 线上最新版本号（null 表示获取失败） */
  latest: string | null
  /** 错误信息（有值时表示检查过程出错） */
  error?: string
  /** 是否已是最新版本 */
  isUpToDate?: boolean
  /** 是否有更新可用 */
  hasUpdate?: boolean
}

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@deepstorm/cli/latest'

/**
 * 获取检查更新用的 registry URL。
 * 可通过 DEEPSTORM_REGISTRY_URL 环境变量覆盖，用于本地测试。
 */
export function getRegistryUrl(): string {
  return process.env.DEEPSTORM_REGISTRY_URL || NPM_REGISTRY_URL
}

/**
 * 如果 url 是本地文件路径，读取并解析 JSON；否则返回 null。
 * 支持 file:// 协议和纯文件路径。
 */
function readLocalRegistryFile(url: string): Record<string, unknown> | null {
  let filePath = url
  if (filePath.startsWith('file://')) {
    filePath = filePath.slice(7)
  }
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch {
    // 忽略解析错误，继续走 fetch 路径
  }
  return null
}

/**
 * 检查 npm registry 上 @deepstorm/cli 的最新版本。
 * 接受可选的 fetch 函数以供测试时注入 mock。
 */
export async function checkNpmVersion(
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<NpmVersionResult> {
  const current = getCliVersion()
  const url = getRegistryUrl()

  try {
    // 本地文件路径优先读取文件，避免 fetch 不支持 file:// 协议
    const localData = readLocalRegistryFile(url)
    if (localData) {
      return parseVersionResponse(localData, current)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetchFn(url, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        current,
        latest: null,
        error: `registry 返回状态码 ${response.status}`,
      }
    }

    const data = (await response.json()) as Record<string, unknown>
    return parseVersionResponse(data, current)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const hint = message.includes('abort')
      ? '连接超时'
      : message.includes('fetch failed') || message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
        ? `无法连接 registry（${url}），请检查网络`
        : message
    return {
      current,
      latest: null,
      error: hint,
    }
  }
}

/** 从 registry JSON 响应中提取版本号并比较 */
function parseVersionResponse(
  data: Record<string, unknown>,
  current: string,
): NpmVersionResult {
  const latest: string | undefined = data.version as string | undefined
  if (!latest) {
    return {
      current,
      latest: null,
      error: '无法解析 registry 响应中的版本号',
    }
  }

  const isUpToDate = current === latest
  const hasUpdate = !isUpToDate && latest !== null

  return {
    current,
    latest,
    isUpToDate,
    hasUpdate,
  }
}

/**
 * 检查版本并输出更新指引。
 * @returns NpmVersionResult，调用方可根据 isUpToDate/hasUpdate 决定后续流程
 */
export async function updateCLI(fetchFn?: typeof fetch): Promise<NpmVersionResult> {
  const result = await checkNpmVersion(fetchFn)

  if (result.error) {
    console.log(`⚠ 无法检查更新：${result.error}`)
    return result
  }

  console.log(`✔ 当前版本: v${result.current}`)
  console.log(`✔ 最新版本: v${result.latest}`)

  if (result.hasUpdate) {
    console.log('→ 正在自动更新...')
    const updateCmd = process.env.DEEPSTORM_UPDATE_CMD || 'npm install -g @deepstorm/cli@latest'
    try {
      execSync(updateCmd, { stdio: 'inherit' })
      console.log(`\n✔ 已更新至 v${result.latest}`)
    } catch {
      console.log('\n⚠ 自动更新失败，请手动执行：')
      console.log('  npm install -g @deepstorm/cli@latest')
    }
  } else {
    console.log('✓ 已是最新版本')
  }

  return result
}

/**
 * 从 .deepstorm/settings.json 读取已安装的 skill ID 列表。
 * 使用 readDeepStormConfig 以触发内部 configVersion 迁移。
 */
function getInstalledSkillIds(targetDir: string): string[] {
  const config = readDeepStormConfig(targetDir)
  if (!config) return []
  const ids = config.installedSkills
  return Array.isArray(ids) ? ids : []
}

// ── 旧数据源迁移 ────────────────────────────────────────────────

/**
 * 迁移结果报告。
 */
interface MigrationReport {
  /** 已执行的迁移项描述列表 */
  migrated: string[]
}

/**
 * 检测并迁移旧版数据源到 .deepstorm/settings.json。
 *
 * 集中处理以下旧数据源的迁移，使其他消费代码无需再做兼容判断：
 *
 * | 旧数据源 | 新位置 |
 * |----------|--------|
 * | `.claude/settings.json` → `deepstorm` key | `.deepstorm/settings.json` 顶层字段 |
 * | `.sweep-init` 标记文件 | `sweep.e2eProjectPath` |
 * | `.env` 中的 BASE_URL_* / DEFAULT_ENV | `sweep.environments`（同时清理 .env）|
 * | `.deepstorm/scope-config.json` | `reef.scope` |
 *
 * 迁移原则：
 * - 如果新位置已有数据，不覆盖（旧数据源优先级低）
 * - 迁移后删除旧文件/清理旧数据
 * - 不阻塞主流程，迁移失败仅输出警告
 */
export function migrateOldDataSources(targetDir: string): MigrationReport {
  const migrated: string[] = []

  // ── 1. .claude/settings.json deepstorm 配置迁移 ──
  // 旧格式（v0.6.x 及之前）：DeepStorm 配置存在 .claude/settings.json 的 deepstorm 字段下
  //    { "deepstorm": { "installedSkills": [...], "installedMcpServers": [...], ... } }
  // 新格式：DeepStorm 配置直接存在 .deepstorm/settings.json 顶层
  //    { "installedSkills": [...], "installedMcpServers": [...], ... }
  try {
    const claudeSettingsPath = path.join(targetDir, '.claude', 'settings.json')
    if (fs.existsSync(claudeSettingsPath)) {
      const raw = fs.readFileSync(claudeSettingsPath, 'utf-8')
      const claudeConfig = JSON.parse(raw)
      if (claudeConfig.deepstorm && typeof claudeConfig.deepstorm === 'object' && Object.keys(claudeConfig.deepstorm).length > 0) {
        writeDeepStormConfig(targetDir, claudeConfig.deepstorm as Record<string, unknown>)
        delete claudeConfig.deepstorm
        fs.writeFileSync(claudeSettingsPath, JSON.stringify(claudeConfig, null, 2) + '\n', 'utf-8')
        migrated.push('.claude/settings.json → .deepstorm/settings.json')
        console.log('  ✔ 已迁移 .claude/settings.json 中的 DeepStorm 配置')
      }
    }
  } catch (err) {
    console.log(`  ⚠ deepstorm 配置迁移失败: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 2. .sweep-init → sweep.e2eProjectPath ──
  try {
    const sweepInitPath = path.join(targetDir, '.sweep-init')
    if (fs.existsSync(sweepInitPath)) {
      const existing = readDeepStormConfig(targetDir) as Record<string, any> | null
      const hasE2ePath = existing && existing.sweep?.e2eProjectPath
      if (!hasE2ePath) {
        writeDeepStormConfig(targetDir, { sweep: { e2eProjectPath: '.' } } as any)
        migrated.push('.sweep-init → sweep.e2eProjectPath')
        console.log('  ✔ 已迁移 .sweep-init → sweep.e2eProjectPath = "."')
      }
      fs.rmSync(sweepInitPath, { force: true })
      if (hasE2ePath) {
        console.log('  ℹ  .sweep-init 已删除（sweep.e2eProjectPath 已存在，未覆盖）')
      }
    }
  } catch (err) {
    console.log(`  ⚠ .sweep-init 迁移失败: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 3. .env BASE_URL_* / DEFAULT_ENV → sweep.environments ──
  try {
    const envPath = path.join(targetDir, '.env')
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf-8')
      const lines = raw.split('\n')

      const baseUrlVars: Record<string, string> = {}
      let defaultEnv = 'test'
      let hasDefaultEnv = false

      const remainingLines: string[] = []
      for (const line of lines) {
        const trimmed = line.trim()
        const baseMatch = trimmed.match(/^BASE_URL_(\w+)=(.+)$/)
        if (baseMatch) {
          const envName = baseMatch[1].toLowerCase()
          let url = baseMatch[2].trim()
          // Strip surrounding quotes
          if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
            url = url.slice(1, -1)
          }
          baseUrlVars[envName] = url
          continue
        }
        const defaultMatch = trimmed.match(/^DEFAULT_ENV=(.+)$/)
        if (defaultMatch) {
          hasDefaultEnv = true
          defaultEnv = defaultMatch[1].trim()
          continue
        }
        remainingLines.push(line)
      }

      if (Object.keys(baseUrlVars).length > 0) {
        // 构建 environments 对象
        const environments: Record<string, { baseUrl: string }> = {}
        for (const [envName, url] of Object.entries(baseUrlVars)) {
          environments[envName] = { baseUrl: url }
        }
        environments.default = defaultEnv as 'test' | 'staging' | 'prod'

        // 检查 settings.json 是否已有 environments 数据
        const existing = readDeepStormConfig(targetDir) as Record<string, any> | null
        const hasEnvs = existing && existing.sweep?.environments
        if (!hasEnvs) {
          writeDeepStormConfig(targetDir, { sweep: { environments } } as any)
          migrated.push('.env BASE_URL → sweep.environments')
          console.log(`  ✔ 已迁移 .env 中 ${Object.keys(baseUrlVars).length} 个环境配置`)
        }

        // 清理 .env 中的 BASE_URL 行
        const cleaned = remainingLines.join('\n').trimEnd()
        if (cleaned === '') {
          // .env 只剩下 base URL 行，全部被清理 → 保留一个注释说明
          // （但不要把空文件留在这里，可能用户有其他非 baseURL 的变量在后续追加）
          // 写回空文件也行，但保留注释供用户感知
          fs.writeFileSync(envPath, '# 环境 baseURL 配置已迁移至 .deepstorm/settings.json\n# 请勿在此处重复定义 BASE_URL_* 配置\n', 'utf-8')
        } else if (hasDefaultEnv || Object.keys(baseUrlVars).length > 0) {
          fs.writeFileSync(envPath, cleaned + '\n', 'utf-8')
        }
      }
    }
  } catch (err) {
    console.log(`  ⚠ .env baseURL 迁移失败: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 4. .deepstorm/scope-config.json → reef.scope ──
  try {
    const scopeConfigPath = path.join(targetDir, '.deepstorm', 'scope-config.json')
    if (fs.existsSync(scopeConfigPath)) {
      const raw = fs.readFileSync(scopeConfigPath, 'utf-8')
      const scopeData = JSON.parse(raw)
      const scope: Record<string, unknown> = {}
      if ('enabled' in scopeData) scope.enabled = scopeData.enabled
      if ('ciEnabled' in scopeData) scope.ciEnabled = scopeData.ciEnabled
      if ('domains' in scopeData) scope.domains = scopeData.domains

      const existing = readDeepStormConfig(targetDir) as Record<string, any> | null
      const hasReefScope = existing && existing.reef?.scope
      if (!hasReefScope) {
        writeDeepStormConfig(targetDir, { reef: { scope } } as any)
        migrated.push('scope-config.json → reef.scope')
        console.log('  ✔ 已迁移 .deepstorm/scope-config.json → reef.scope')
      }
      fs.rmSync(scopeConfigPath, { force: true })
      if (hasReefScope) {
        console.log('  ℹ  scope-config.json 已删除（reef.scope 已存在，未覆盖）')
      }
    }
  } catch (err) {
    console.log(`  ⚠ scope-config.json 迁移失败: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { migrated }
}

/**
 * 注册 update 子命令。
 *  deepstorm update    全量更新：旧数据源迁移 + CLI 版本检查 + CLI 自身更新 + 已安装 skill 模板同步
 */
export function registerUpdateCommand(program: Command): void {
  const cliDir = __dirname

  program
    .command('update')
    .description('检查 CLI 更新并同步已安装 skill 的官方最新模板')
    .action(async () => {
      const targetDir = process.cwd()

      // 1. 旧数据源迁移（集中处理，确保后续所有代码只读 settings.json）
      const { migrated } = migrateOldDataSources(targetDir)
      if (migrated.length > 0) {
        console.log(`✔ 已完成 ${migrated.length} 项旧数据源迁移`)
      }

      // 2. 模板同步（核心功能，不限网络）
      const installedIds = getInstalledSkillIds(targetDir)
      if (installedIds.length === 0) {
        console.log('未检测到已安装的 skill，跳过同步')
      } else {
        upgradeTemplates(cliDir, targetDir, installedIds)
      }

      // 3. 版本检查（辅助信息，不阻塞主流程）
      await updateCLI()
    })
}
