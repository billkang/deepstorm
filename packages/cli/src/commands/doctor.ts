import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseFrontmatter } from '../utils/frontmatter'
import { loadValidConfigKeys } from '../utils/config-schema'
import { readDeepStormConfig } from '../merger/settings'
import { getCliVersion } from '../utils/version'

export interface DoctorReport {
  healthy: boolean
  checks: DoctorCheck[]
}

interface DoctorCheck {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

/**
 * 读取 installedSkills 列表。
 */
function getInstalledSkills(settingsPath: string): string[] {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    return settings.deepstorm?.installedSkills || []
  } catch {
    return []
  }
}

/**
 * 运行诊断检查。
 */
export function runDoctor(targetDir: string): DoctorReport {
  const checks: DoctorCheck[] = []
  const version = getCliVersion()
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')

  // 迁移旧配置（如有）
  readDeepStormConfig(settingsPath)

  // 检查 1: CLI 版本号
  checks.push({
    name: 'CLI 版本',
    status: 'pass',
    message: `v${version}（运行 deepstorm update --check 检查最新版本）`,
  })

  // 检查 2: settings.json + deepstormm 命名空间
  let hasDeepStorm = false
  if (!fs.existsSync(settingsPath)) {
    checks.push({
      name: '配置文件',
      status: 'warn',
      message: '.claude/settings.json 不存在',
    })
  } else {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      if (settings.deepstorm) {
        hasDeepStorm = true
        checks.push({
          name: 'DeepStorm 命名空间',
          status: 'pass',
          message: '命名空间完整',
        })
      } else {
        checks.push({
          name: 'DeepStorm 命名空间',
          status: 'warn',
          message: '.claude/settings.json 中无 deepstorm 命名空间',
        })
      }
    } catch {
      checks.push({
        name: '配置文件',
        status: 'fail',
        message: '.claude/settings.json 格式错误',
      })
    }
  }

  // 检查 3: skill frontmatter 有效性
  const skillsDir = path.join(targetDir, '.claude', 'skills')
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir).filter((n) =>
      fs.statSync(path.join(skillsDir, n)).isDirectory(),
    )

    let validCount = 0
    let invalidCount = 0

    for (const skillName of skillDirs) {
      const skillMd = path.join(skillsDir, skillName, 'SKILL.md')
      if (!fs.existsSync(skillMd)) {
        invalidCount++
        continue
      }
      const content = fs.readFileSync(skillMd, 'utf-8')
      const frontmatter = parseFrontmatter(content)
      if (frontmatter && frontmatter.name) {
        validCount++
      } else {
        invalidCount++
      }
    }

    if (validCount === 0 && skillDirs.length === 0) {
      checks.push({
        name: 'Skill Frontmatter',
        status: 'warn',
        message: '无已安装的 skill',
      })
    } else if (invalidCount > 0) {
      checks.push({
        name: 'Skill Frontmatter',
        status: 'warn',
        message: `${validCount} 个有效，${invalidCount} 个无效`,
      })
    } else {
      checks.push({
        name: 'Skill Frontmatter',
        status: 'pass',
        message: `${validCount} 个 skill 全部有效`,
      })
    }

    // 检查 4: 缺少的依赖 skill
    const installedSkills = getInstalledSkills(settingsPath)
    const missingSkills: string[] = []

    for (const skillId of installedSkills) {
      if (!fs.existsSync(path.join(skillsDir, skillId))) {
        missingSkills.push(skillId)
      }
    }

    if (missingSkills.length > 0) {
      checks.push({
        name: '依赖完整性',
        status: 'warn',
        message: `缺少 ${missingSkills.length} 个 skill：${missingSkills.join(', ')}`,
      })
    } else if (installedSkills.length > 0) {
      checks.push({
        name: '依赖完整性',
        status: 'pass',
        message: `${installedSkills.length} 个 skill 全部存在`,
      })
    }
  } else {
    checks.push({
      name: 'Skill Frontmatter',
      status: 'warn',
      message: '.claude/skills/ 不存在',
    })
  }

  // 检查 5: .mcp.json 完整性
  const mcpPath = path.join(targetDir, '.mcp.json')
  if (fs.existsSync(mcpPath)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'))
      const hasServers = mcp.mcpServers && Object.keys(mcp.mcpServers).length > 0
      checks.push({
        name: 'MCP 服务器',
        status: hasServers ? 'pass' : 'warn',
        message: hasServers
          ? `${Object.keys(mcp.mcpServers).length} 个服务器`
          : '无 MCP 服务器配置',
      })
    } catch {
      checks.push({
        name: 'MCP 配置',
        status: 'fail',
        message: '.mcp.json 格式错误',
      })
    }
  } else {
    checks.push({
      name: 'MCP 配置',
      status: 'warn',
      message: '.mcp.json 不存在',
    })
  }

  // 检查 5b: MCP 安装一致性 — installedMcpServers 是否与 .mcp.json 匹配
  if (hasDeepStorm && fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      const installedMcp = settings.deepstorm?.installedMcpServers as string[] | undefined
      if (installedMcp && installedMcp.length > 0) {
        const mcpExists = fs.existsSync(mcpPath)
        if (!mcpExists) {
          checks.push({
            name: 'MCP 一致性',
            status: 'warn',
            message: `已记录 ${installedMcp.length} 个服务，但 .mcp.json 不存在`,
          })
        } else {
          try {
            const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'))
            const servers = mcpConfig.mcpServers || {}
            const missing: string[] = []
            for (const toolName of installedMcp) {
              if (!servers[`deepstorm-${toolName}`]) {
                missing.push(toolName)
              }
            }
            if (missing.length > 0) {
              checks.push({
                name: 'MCP 一致性',
                status: 'warn',
                message: `${missing.length} 个服务在 .mcp.json 中缺失：${missing.join(', ')}`,
              })
            } else {
              checks.push({
                name: 'MCP 一致性',
                status: 'pass',
                message: `${installedMcp.length} 个服务全部在 .mcp.json 中存在`,
              })
            }
          } catch {
            // .mcp.json 格式错误已在检查 5 中报告，跳过
          }
        }
      }
    } catch {
      // settings 格式错误已在检查 2 中报告，跳过
    }
  }

  // 检查 6: 配置异常值校验（config-schema.json）
  if (hasDeepStorm && fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      const config = settings.deepstorm
      const validKeys = loadValidConfigKeys()

      if (validKeys.size > 0 && config) {
        // 提取所有配置 key 的完整路径（除 installed* 和 installedAt）
        const configKeys: string[] = []
        for (const tool of Object.keys(config)) {
          if (tool.startsWith('installed')) continue
          if (typeof config[tool] === 'object' && config[tool] !== null) {
            for (const subKey of Object.keys(config[tool])) {
              configKeys.push(`${tool}.${subKey}`)
            }
          }
        }

        const invalidKeys = configKeys.filter((k) => !validKeys.has(k))
        if (invalidKeys.length > 0) {
          checks.push({
            name: '配置校验',
            status: 'warn',
            message: `${invalidKeys.length} 个未知配置项：${invalidKeys.join(', ')}`,
          })
        } else {
          checks.push({
            name: '配置校验',
            status: 'pass',
            message: `${configKeys.length} 项配置均合法`,
          })
        }
      }
    } catch {
      // 已检查过格式错误，跳过
    }
  }

  const hasFail = checks.some((c) => c.status === 'fail')
  const hasWarn = checks.some((c) => c.status === 'warn')

  return {
    healthy: !hasFail && !hasWarn,
    checks,
  }
}

/**
 * 格式化输出诊断报告。
 */
export function printDoctorReport(report: DoctorReport): void {
  console.log('')
  for (const check of report.checks) {
    const icon = check.status === 'pass' ? '✔' : check.status === 'warn' ? '⚠' : '✘'
    console.log(`  ${icon} ${check.name}: ${check.message}`)
  }
  console.log('')

  if (report.healthy) {
    console.log('  ✔ 一切正常')
  } else {
    console.log('  需要修复：请运行 deepstorm setup --reconfigure')
  }
  console.log('')
}
