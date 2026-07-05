import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { getCliVersion } from '../utils/version'
import { upgradeTemplates } from './template-upgrade'

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
 * 从 .claude/settings.json 读取已安装的 skill ID 列表。
 * 仅在 `deepstorm.setup` 时写入 installedSkills，update 命令以此判断哪些是用户已安装的内容。
 */
function getInstalledSkillIds(targetDir: string): string[] {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')
  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    return settings.deepstorm?.installedSkills ?? []
  } catch {
    return []
  }
}

/**
 * 注册 update 子命令。
 *  deepstorm update    全量更新：CLI 版本检查 + CLI 自身更新 + 已安装 skill 模板同步
 */
export function registerUpdateCommand(program: Command): void {
  const cliDir = __dirname

  program
    .command('update')
    .description('检查 CLI 更新并同步已安装 skill 的官方最新模板')
    .action(async () => {
      // 1. 模板同步（核心功能，不限网络）
      const installedIds = getInstalledSkillIds(process.cwd())
      if (installedIds.length === 0) {
        console.log('未检测到已安装的 skill，跳过同步')
      } else {
        upgradeTemplates(cliDir, process.cwd(), installedIds)
      }

      // 2. 版本检查（辅助信息，不阻塞主流程）
      await updateCLI()
    })
}
