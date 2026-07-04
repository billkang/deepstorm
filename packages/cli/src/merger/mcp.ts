import * as fs from 'node:fs'
import { deepMerge } from '../utils/json'

/**
 * 合并 MCP 服务器配置到 .mcp.json 的 mcpServers 字段。
 * 文件不存在时自动创建，已有字段原样保留。
 */
export function mergeMcpServers(
  mcpPath: string,
  servers: Record<string, unknown>,
): void {
  let mcp: Record<string, unknown> = {}

  try {
    if (fs.existsSync(mcpPath)) {
      const raw = fs.readFileSync(mcpPath, 'utf-8')
      mcp = JSON.parse(raw)
    }
  } catch {
    mcp = {}
  }

  const existingServers = (mcp.mcpServers as Record<string, unknown>) || {}
  mcp.mcpServers = deepMerge(existingServers, servers)

  fs.writeFileSync(mcpPath, JSON.stringify(mcp, null, 2) + '\n', 'utf-8')
}
