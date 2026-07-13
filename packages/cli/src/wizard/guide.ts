import * as fs from 'node:fs'
import * as path from 'node:path'
import { confirm, isCancel } from '@clack/prompts'
import { parseEnvExampleFile } from './mcp-env'

export interface GuideOptions {
  targetDir: string
  installedSkills: string[]
  config: Record<string, string>
  /** 已安装的 MCP 服务名列表 */
  mcpTools?: string[]
  /** MCP 服务的环境变量 stub 列表 */
  mcpEnvStubs?: Array<{ key: string; comment: string }>
  /** 本次安装前已安装的 MCP 服务名列表（用于 env status 展示） */
  previouslyInstalledMcp?: string[]
  /** env-examples 目录路径（用于 env status 展示） */
  mcpExamplesDir?: string
}

/**
 * 输出 MCP 环境变量配置状态。
 * 遍历所有 MCP 服务（含新装和之前安装的），检查 .env 中 key 是否已配置。
 *
 * @param mcpTools - 本次新选的 MCP 服务名列表
 * @param installedMcpServices - 之前已安装的 MCP 服务名列表
 * @param examplesDir - env-examples 目录路径
 * @param targetDir - 项目根目录（用于读取 .env）
 */
export function printMcpEnvStatus(
  mcpTools: string[],
  installedMcpServices: string[],
  examplesDir: string,
  targetDir: string,
): void {
  const allMcp = [...new Set([...mcpTools, ...installedMcpServices])]
  if (allMcp.length === 0) return

  console.log('')
  console.log('  环境变量配置状态：')

  for (const mcp of allMcp) {
    const filePath = path.join(examplesDir, `${mcp}.env-example`)
    if (!fs.existsSync(filePath)) {
      console.log(`  ℹ ${mcp}: 无需环境变量配置`)
      continue
    }

    const entries = parseEnvExampleFile(filePath)
    if (entries.length === 0) {
      console.log(`  ℹ ${mcp}: 无需环境变量配置`)
      continue
    }

    // 读取 .env 中的实际值
    const dotEnvPath = path.join(targetDir, '.env')
    const dotEnvMap = new Map<string, string>()
    if (fs.existsSync(dotEnvPath)) {
      const content = fs.readFileSync(dotEnvPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.includes('=') && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=')
          const key = trimmed.slice(0, eqIdx).trim()
          const value = trimmed.slice(eqIdx + 1).trim()
          if (key && /^[A-Z][A-Z0-9_]*$/.test(key)) {
            dotEnvMap.set(key, value)
          }
        }
      }
    }

    // 检查缺少的 key 或仍为默认值的 key
    const envDefaultContent = fs.readFileSync(filePath, 'utf-8')
    const defaults = new Map<string, string>()
    for (const line of envDefaultContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.includes('=') && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).trim()
        if (key && /^[A-Z][A-Z0-9_]*$/.test(key)) {
          defaults.set(key, value)
        }
      }
    }

    const missingKeys: string[] = []
    for (const [key, defaultValue] of defaults) {
      const actualValue = dotEnvMap.get(key)
      if (!actualValue || actualValue === defaultValue) {
        missingKeys.push(key)
      }
    }

    if (missingKeys.length === 0) {
      console.log(`  ✅ ${mcp}: 环境变量已配置`)
    } else {
      console.log(`  ⚠ ${mcp}: 缺少 ${missingKeys.join('、')}`)
    }
  }
}

/**
 * 安装完成后输出引导信息。
 * 显示已安装的 skill 列表、下一步指引，询问是否提交到 Git。
 */
export async function printGuide(options: GuideOptions): Promise<void> {
  const { installedSkills, config, targetDir, mcpTools, mcpEnvStubs } = options

  console.log('')
  console.log('  ✔ 配置已保存到 .claude/settings.json')

  // 输出 MCP 安装摘要
  if (mcpTools && mcpTools.length > 0) {
    console.log('')
    console.log(`  ✔ 已安装 ${mcpTools.length} 个外部服务`)
    for (const tool of mcpTools) {
      console.log(`    • ${tool}`)
    }
    if (mcpEnvStubs && mcpEnvStubs.length > 0) {
      console.log('')
      console.log('  请配置以下环境变量到 .env：')
      for (const stub of mcpEnvStubs) {
        console.log(`    ${stub.key}=    ← ${stub.comment}`)
      }
    }
    if (mcpTools.includes('github')) {
      console.log('')
      console.log('  ⚠ GitHub MCP 需要本地 Docker 环境')
    }
  }

  if (installedSkills.length > 0) {
    console.log('')
    console.log(`  已安装 ${installedSkills.length} 个 skill：`)
    for (const skill of installedSkills) {
      console.log(`    • ${skill}`)
    }
  }

  console.log('')
  console.log('  下一步：')
  console.log('    运行 Claude Code，输入 /help 查看所有可用的 DeepStorm 命令')
  console.log('')

  // 检查 .git 是否存在
  const gitDir = path.join(options.targetDir, '.git')
  if (fs.existsSync(gitDir)) {
    const shouldAdd = await confirm({
      message: '是否将 .claude/ 配置提交到 Git？(.gitignore 需要忽略 .claude/)',
      initialValue: false,
    })
    if (!isCancel(shouldAdd) && shouldAdd) {
      // 检查 .gitignore 中是否有 .claude/ 忽略规则
      const gitignorePath = path.join(options.targetDir, '.gitignore')
      let isIgnored = false
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
        // 简单检测：如果 .gitignore 包含 ".claude" 则视为被忽略
        isIgnored = gitignore.split('\n').some((line) => {
          const trimmed = line.trim()
          return trimmed === '.claude' || trimmed === '.claude/' || trimmed === '.claude/**'
        })
      }
      if (isIgnored) {
        console.log('  提示：.gitignore 中包含了 .claude/ 忽略规则，请在 .gitignore 中移除或添加例外后手动提交')
      } else {
        console.log('  提示：请手动执行 git add .claude/ && git commit 提交配置')
      }
    }
    console.log('')
  }

  console.log('  需要重新配置？运行：deepstorm setup --reconfigure')
  console.log('')
}
