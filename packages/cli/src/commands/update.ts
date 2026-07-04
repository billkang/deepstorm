import { Command } from 'commander'
import { getCliVersion } from '../utils/version'
import { upgradeTemplates } from './template-upgrade'
import type { Registry } from '../types/registry'

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
    console.log('')
    console.log('→ 运行以下命令更新：')
    console.log('  npm install -g @deepstorm/cli@latest')
  } else {
    console.log('✓ 已是最新版本')
  }
}

/**
 * 同步 skill 模板（委托 upgradeTemplates）。
 */
export function updateSkills(
  cliDir: string,
  targetDir: string,
  skillIds: string[],
): void {
  upgradeTemplates(cliDir, targetDir, skillIds)
}

/**
 * 注册 update 子命令树。
 *   deepstorm update            全量更新（CLI 检查 + skill 同步）
 *   deepstorm update --check    仅检查版本
 *   deepstorm update --cli      仅更新 CLI
 *   deepstorm update --skills   仅同步 skill 模板
 */
export function registerUpdateCommand(program: Command, registry: Registry): void {
  const cliDir = __dirname

  const updateCmd = program
    .command('update')
    .description('检查更新并同步 skill 模板')

  updateCmd
    .option('--check', '仅检查 npm 最新版本')
    .option('--cli', '更新 CLI 自身')
    .option('--skills', '同步 skill 模板到本地')
    .action(async (options: { check?: boolean; cli?: boolean; skills?: boolean }) => {
      const { check, cli, skills } = options

      // 无选项：全量更新
      if (!check && !cli && !skills) {
        const result = await checkNpmVersion()
        printVersionInfo(result)
        if (result.latest) {
          console.log('')
          upgradeTemplates(cliDir, process.cwd(), Object.keys(registry.skills))
        } else {
          console.log('')
          console.log('跳过 skill 同步（版本检查失败时保留现有模板）')
        }
        return
      }

      if (check) {
        const result = await checkNpmVersion()
        printVersionInfo(result)
        if (result.error) process.exit(1)
        return
      }

      if (cli) {
        await updateCLI()
        return
      }

      if (skills) {
        const skillIds = Object.keys(registry.skills)
        if (skillIds.length === 0) {
          console.log('registry 中无已注册 skill')
          return
        }
        updateSkills(cliDir, process.cwd(), skillIds)
        return
      }
    })
}

function printVersionInfo(result: NpmVersionResult): void {
  if (result.error) {
    console.log(`⚠ 无法检查更新：${result.error}`)
    return
  }

  console.log(`✔ 当前版本: v${result.current}`)
  console.log(`✔ 最新版本: v${result.latest}`)

  if (result.hasUpdate) {
    console.log('')
    console.log('→ 有新版本可用！运行 "deepstorm update --cli" 更新')
  } else {
    console.log('✓ 已是最新版本')
  }
}
