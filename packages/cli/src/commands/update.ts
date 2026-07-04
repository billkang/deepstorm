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
 * 检查 npm registry 上 @deepstorm/cli 的最新版本。
 * 接受可选的 fetch 函数以供测试时注入 mock。
 */
export async function checkNpmVersion(
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<NpmVersionResult> {
  const current = getCliVersion()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetchFn(NPM_REGISTRY_URL, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        current,
        latest: null,
        error: `npm registry 返回状态码 ${response.status}`,
      }
    }

    const data = (await response.json()) as Record<string, unknown>
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      current,
      latest: null,
      error: message,
    }
  }
}

/**
 * 检查版本并输出更新指引。
 */
export async function updateCLI(fetchFn?: typeof fetch): Promise<void> {
  const result = await checkNpmVersion(fetchFn)

  if (result.error) {
    console.log(`⚠ 无法检查更新：${result.error}`)
    return
  }

  console.log(`✔ 当前版本: v${result.current}`)
  console.log(`✔ 最新版本: v${result.latest}`)

  if (result.hasUpdate) {
    console.log('→ 正在自动更新...')
    try {
      execSync('npm install -g @deepstorm/cli@latest', { stdio: 'inherit' })
      console.log(`\n✔ 已更新至 v${result.latest}`)
    } catch {
      console.log('\n⚠ 自动更新失败，请手动执行：')
      console.log('  npm install -g @deepstorm/cli@latest')
    }
  } else {
    console.log('✓ 已是最新版本')
  }
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
      await updateCLI()
      console.log('')
      const installedIds = getInstalledSkillIds(process.cwd())
      if (installedIds.length === 0) {
        console.log('未检测到已安装的 skill，跳过同步')
      } else {
        upgradeTemplates(cliDir, process.cwd(), installedIds)
      }
    })
}
