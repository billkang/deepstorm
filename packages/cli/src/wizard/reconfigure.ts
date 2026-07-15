import * as fs from 'node:fs'
import * as path from 'node:path'
import { readDeepStormConfig, getDeepStormConfigPath } from '../merger/settings'

/**
 * --reconfigure 流程：读取 .deepstorm/settings.json → 清理旧 skill → 清理 agent/MCP/hooks。
 * 不删除 .deepstorm/templates/ 中的用户修改。
 */
export function cleanInstalled(targetDir: string): void {
  const settingsPath = getDeepStormConfigPath(targetDir)

  if (!fs.existsSync(settingsPath)) {
    return // 没有 DeepStorm 安装记录
  }

  let config: Record<string, unknown>
  try {
    config = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  } catch {
    return // 无有效配置，跳过清理
  }

  if (!config || Object.keys(config).length === 0) return

  // 清理已安装的 skill
  const installedSkills = config.installedSkills as string[] | undefined
  if (installedSkills) {
    for (const skillId of installedSkills) {
      const skillDir = path.join(targetDir, '.claude', 'skills', skillId)
      if (fs.existsSync(skillDir)) {
        fs.rmSync(skillDir, { recursive: true, force: true })
      }
    }
  }

  // 清理已安装的 agent
  const installedAgents = config.installedAgents as string[] | undefined
  if (installedAgents) {
    for (const agent of installedAgents) {
      const agentDir = path.join(targetDir, '.claude', 'agents', agent)
      if (fs.existsSync(agentDir)) {
        fs.rmSync(agentDir, { recursive: true, force: true })
      }
    }
  }

  // 清理已安装的 hooks（.claude/hooks.json 配置 + .claude/hooks/ 脚本）
  const hooksJson = path.join(targetDir, '.claude', 'hooks.json')
  if (fs.existsSync(hooksJson)) {
    fs.rmSync(hooksJson, { force: true })
  }
  const hooksDir = path.join(targetDir, '.claude', 'hooks')
  if (fs.existsSync(hooksDir)) {
    fs.rmSync(hooksDir, { recursive: true, force: true })
  }

  // 清理 MCP 中 DeepStorm 安装的条目
  const installedMcp = config.installedMcpServers as string[] | undefined
  if (installedMcp) {
    const mcpPath = path.join(targetDir, '.mcp.json')
    if (fs.existsSync(mcpPath)) {
      try {
        const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'))
        if (mcp.mcpServers) {
          for (const serverName of installedMcp) {
            // serverName 为工具名（如 "jira"），而 .mcp.json 中 key 为 "deepstorm-jira"
            delete mcp.mcpServers[`deepstorm-${serverName}`]
          }
        }
        fs.writeFileSync(mcpPath, JSON.stringify(mcp, null, 2) + '\n', 'utf-8')
      } catch {
        // 忽略 MCP 文件错误
      }
    }
  }
}
