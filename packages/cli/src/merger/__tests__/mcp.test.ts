import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { mergeMcpServers } from '../mcp'

describe('mergeMcpServers', () => {
  let tmpDir: string
  let mcpPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-mcp-'))
    mcpPath = path.join(tmpDir, '.mcp.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function readMcp(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(mcpPath, 'utf-8'))
  }

  it('creates .mcp.json if it does not exist', () => {
    mergeMcpServers(mcpPath, {
      'deepstorm-jira': {
        command: 'node',
        args: ['jira-mcp.js'],
        env: { JIRA_TOKEN: '${JIRA_TOKEN}' },
      },
    })

    expect(fs.existsSync(mcpPath)).toBe(true)
    const mcp = readMcp()
    expect(mcp.mcpServers).toBeDefined()
    expect((mcp.mcpServers as any)['deepstorm-jira'].command).toBe('node')
  })

  it('merges into existing mcpServers', () => {
    fs.writeFileSync(
      mcpPath,
      JSON.stringify({
        mcpServers: {
          'existing-server': { command: 'python', args: ['existing.py'] },
        },
      }),
      'utf-8',
    )

    mergeMcpServers(mcpPath, {
      'deepstorm-jira': {
        command: 'node',
        args: ['jira-mcp.js'],
      },
    })

    const mcp = readMcp()
    expect((mcp.mcpServers as any)['existing-server'].command).toBe('python')
    expect((mcp.mcpServers as any)['deepstorm-jira'].command).toBe('node')
  })

  it('does not overwrite existing non-mcpServers fields', () => {
    fs.writeFileSync(
      mcpPath,
      JSON.stringify({ otherConfig: { keep: true } }),
      'utf-8',
    )

    mergeMcpServers(mcpPath, {
      'deepstorm-jira': { command: 'node', args: [] },
    })

    const mcp = readMcp()
    expect(mcp.otherConfig).toEqual({ keep: true })
  })

  it('handles non-JSON file gracefully', () => {
    fs.writeFileSync(mcpPath, 'bad-json', 'utf-8')

    expect(() => {
      mergeMcpServers(mcpPath, {
        'deepstorm-jira': { command: 'node', args: [] },
      })
    }).not.toThrow()
  })

  it('preserves env var placeholders', () => {
    mergeMcpServers(mcpPath, {
      'deepstorm-db': {
        command: 'npx',
        args: ['@deepstorm/db-mcp'],
        env: {
          DB_HOST: '${DB_HOST}',
          DB_TOKEN: '${DB_TOKEN}',
        },
      },
    })

    const mcp = readMcp()
    const server = (mcp.mcpServers as any)['deepstorm-db']
    expect(server.env.DB_HOST).toBe('${DB_HOST}')
    expect(server.env.DB_TOKEN).toBe('${DB_TOKEN}')
  })
})
