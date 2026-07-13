import { describe, it, expect, vi, beforeEach } from 'vitest'
import { selectMcpTools, getDomainLabel } from '../mcp-select'
import type { RegistryReader } from '../../engine/registry'

vi.mock('@clack/prompts', () => ({
  multiselect: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  note: vi.fn(),
}))

import * as p from '@clack/prompts'

function createMockReader(mcpTools: Record<string, any> = {}): RegistryReader {
  const mcpToolNames = Object.keys(mcpTools)
  return {
    getMcpTools: vi.fn(() => mcpToolNames),
    getMcpToolEntry: vi.fn((name: string) => mcpTools[name] ?? undefined),
    getTools: vi.fn(() => []),
    getMcpDeps: vi.fn((tools: string[]) => {
      // Return all MCP tools when no specific tools are selected
      if (tools.length === 0) return mcpToolNames
      // When tools are specified, return all MCP tools (no filtering in mock)
      return mcpToolNames
    }),
  } as unknown as RegistryReader
}

describe('getDomainLabel', () => {
  it('returns localized label for known domains', () => {
    expect(getDomainLabel('project-management')).toBe('项目管理')
    expect(getDomainLabel('knowledge-base')).toBe('知识管理')
    expect(getDomainLabel('code-hosting')).toBe('代码托管')
    expect(getDomainLabel('design-tools')).toBe('设计工具')
    expect(getDomainLabel('docs-reference')).toBe('文档参考')
    expect(getDomainLabel('e2e-testing')).toBe('端到端测试')
  })

  it('returns raw name for unknown domains', () => {
    expect(getDomainLabel('unknown-domain')).toBe('unknown-domain')
    expect(getDomainLabel('ai-models')).toBe('ai-models')
  })

  it('returns empty string for empty input', () => {
    expect(getDomainLabel('')).toBe('')
  })
})

describe('selectMcpTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows note and returns empty when no MCP tools available', async () => {
    const reader = createMockReader({})
    const result = await selectMcpTools(reader)
    expect(result).toEqual([])
    expect(p.note).toHaveBeenCalledWith('没有可用的 MCP 工具', '提示')
    expect(p.multiselect).not.toHaveBeenCalled()
  })

  it('returns selected tools from multiselect', async () => {
    const reader = createMockReader({
      github: { domain: 'code-hosting', label: 'GitHub', description: 'code hosting' },
      jira: { domain: 'project-management', label: 'Jira', description: 'project mgmt' },
      figma: { domain: 'design-tools', label: 'Figma', description: 'design tool' },
    })
    vi.mocked(p.multiselect).mockResolvedValue(['github', 'jira'])
    const result = await selectMcpTools(reader)
    expect(result).toEqual(['github', 'jira'])
    expect(p.multiselect).toHaveBeenCalledTimes(1)
    // order: figma, github, jira (alphabetical, no context7)
    const opts = vi.mocked(p.multiselect).mock.calls[0][0].options as Array<{ value: string }>
    expect(opts.map((o) => o.value)).toEqual(['figma', 'github', 'jira'])
  })

  it('sorts context7 last regardless of alphabetical order', async () => {
    const reader = createMockReader({
      context7: { domain: 'docs-reference', label: 'Context7', description: 'docs' },
      github: { domain: 'code-hosting', label: 'GitHub', description: 'code hosting' },
      ai: { domain: 'ai-models', label: 'AI Models', description: 'ai' },
    })
    vi.mocked(p.multiselect).mockResolvedValue(['ai', 'github'])
    await selectMcpTools(reader)
    const opts = vi.mocked(p.multiselect).mock.calls[0][0].options as Array<{ value: string }>
    const values = opts.map((o) => o.value)
    expect(values[values.length - 1]).toBe('context7')
    expect(values.slice(0, -1)).toEqual(['ai', 'github'])
  })

  it('includes domain label in option label, sorted by tool name', async () => {
    const reader = createMockReader({
      github: { domain: 'code-hosting', label: 'GitHub', description: 'code hosting' },
      custom: { domain: 'custom-domain', label: 'Custom', description: 'custom' },
    })
    vi.mocked(p.multiselect).mockResolvedValue(['github'])
    await selectMcpTools(reader)
    const opts = vi.mocked(p.multiselect).mock.calls[0][0].options as Array<{ label: string }>
    // custom sorts before github alphabetically
    expect(opts[0].label).toContain('custom-domain')
    expect(opts[1].label).toContain('代码托管')
  })

  it('returns empty array when user does not select any', async () => {
    const reader = createMockReader({
      github: { domain: 'code-hosting', label: 'GitHub', description: '' },
    })
    vi.mocked(p.multiselect).mockResolvedValue([])
    const result = await selectMcpTools(reader)
    expect(result).toEqual([])
  })

  it('calls process.exit(0) when user cancels', async () => {
    const reader = createMockReader({
      github: { domain: 'code-hosting', label: 'GitHub', description: '' },
    })
    vi.mocked(p.multiselect).mockResolvedValue(undefined as unknown as string[])
    vi.mocked(p.isCancel).mockReturnValueOnce(true)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called')
    }) as any)
    await expect(selectMcpTools(reader)).rejects.toThrow('process.exit called')
    expect(p.cancel).toHaveBeenCalledWith('已取消安装')
    exitSpy.mockRestore()
  })

  it('handles undefined entry gracefully', async () => {
    const reader = {
      getMcpTools: vi.fn(() => ['tool-a']),
      getMcpToolEntry: vi.fn(() => undefined),
      getTools: vi.fn(() => []),
      getMcpDeps: vi.fn(() => ['tool-a']),
    } as unknown as RegistryReader
    vi.mocked(p.multiselect).mockResolvedValue(['tool-a'])
    await selectMcpTools(reader)
    const opts = vi.mocked(p.multiselect).mock.calls[0][0].options as Array<{ label: string }>
    expect(opts[0].label).toContain('tool-a')
  })

  it('sets required to false', async () => {
    const reader = createMockReader({
      github: { domain: 'code-hosting', label: 'GitHub', description: '' },
    })
    vi.mocked(p.multiselect).mockResolvedValue(['github'])
    await selectMcpTools(reader)
    expect(vi.mocked(p.multiselect).mock.calls[0][0].required).toBe(false)
  })

  it('passes initialValues to multiselect', async () => {
    const reader = createMockReader({
      github: { domain: 'code-hosting', label: 'GitHub', description: '' },
      jira: { domain: 'project-management', label: 'Jira', description: '' },
    })
    vi.mocked(p.multiselect).mockResolvedValue(['github'])
    // New signature: selectMcpTools(reader, selectedTools, initialValues)
    await selectMcpTools(reader, [], ['jira'])
    expect(vi.mocked(p.multiselect).mock.calls[0][0].initialValues).toEqual(['jira'])
  })

  describe('MCP filtering by selected tools', () => {
    it('filters MCP list based on selected tools', async () => {
      const reader = {
        getMcpTools: vi.fn(() => ['jira', 'github', 'figma', 'playwright']),
        getMcpToolEntry: vi.fn((name: string) => {
          const map: Record<string, any> = {
            jira: { domain: 'project-management', label: 'Jira', description: '' },
            github: { domain: 'code-hosting', label: 'GitHub', description: '' },
            figma: { domain: 'design-tools', label: 'Figma', description: '' },
            playwright: { domain: 'e2e-testing', label: 'Playwright', description: '' },
          }
          return map[name]
        }),
        getTools: vi.fn(() => ['tide', 'reef']),
        getMcpDeps: vi.fn((tools: string[]) => {
          const toolDeps: Record<string, string[]> = {
            tide: ['jira', 'figma'],
            reef: ['jira', 'github', 'figma'],
          }
          const deps = new Set<string>()
          for (const t of tools) {
            for (const d of (toolDeps[t] ?? [])) deps.add(d)
          }
          return [...deps]
        }),
      } as unknown as RegistryReader

      vi.mocked(p.multiselect).mockResolvedValue(['jira', 'github'])
      const result = await selectMcpTools(reader, ['tide', 'reef'])

      // tide+reef should only show jira, figma, github (not playwright)
      const opts = vi.mocked(p.multiselect).mock.calls[0][0].options as Array<{ value: string }>
      expect(opts.map((o) => o.value)).toEqual(['figma', 'github', 'jira'])
      expect(opts.map((o) => o.value)).not.toContain('playwright')
      expect(result).toEqual(['jira', 'github'])
    })

    it('shows note when selected tools have no MCP dependencies', async () => {
      const reader = {
        getMcpTools: vi.fn(() => ['jira', 'github']),
        getMcpToolEntry: vi.fn(() => ({ domain: 'test', label: 'Test', description: '' })),
        getTools: vi.fn(() => ['atoll']),
        getMcpDeps: vi.fn(() => []),
      } as unknown as RegistryReader

      const result = await selectMcpTools(reader, ['atoll'])
      expect(result).toEqual([])
      expect(p.note).toHaveBeenCalledWith('所选工具没有可用的 MCP 集成服务', '提示')
    })

    it('filters initialValues against available MCP list', async () => {
      const reader = {
        getMcpTools: vi.fn(() => ['jira', 'github', 'context7']),
        getMcpToolEntry: vi.fn((name: string) => {
          const map: Record<string, any> = {
            jira: { domain: 'project-management', label: 'Jira', description: '' },
            github: { domain: 'code-hosting', label: 'GitHub', description: '' },
            context7: { domain: 'docs-reference', label: 'Context7', description: '' },
          }
          return map[name]
        }),
        getTools: vi.fn(() => ['reef']),
        getMcpDeps: vi.fn(() => ['jira', 'github', 'context7']),
      } as unknown as RegistryReader

      vi.mocked(p.multiselect).mockResolvedValue(['github'])
      await selectMcpTools(reader, ['reef'], ['context7'])
      // context7 should be in initialValues since it's in the filtered list
      expect(vi.mocked(p.multiselect).mock.calls[0][0].initialValues).toEqual(['context7'])
    })
  })

  describe('installedMcpServices filtering', () => {
    it('隐藏已安装的 MCP 服务', async () => {
      const reader = createMockReader({
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
        jira: { domain: 'project-management', label: 'Jira', description: '' },
      })
      vi.mocked(p.multiselect).mockResolvedValue(['jira'])
      await selectMcpTools(reader, [], [], ['github'])
      const opts = vi.mocked(p.multiselect).mock.calls[0][0].options as Array<{ value: string }>
      const values = opts.map((o) => o.value)
      expect(values).not.toContain('github')
      expect(values).toContain('jira')
    })

    it('打印已安装服务的过滤日志', async () => {
      const reader = createMockReader({
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
      })
      vi.mocked(p.multiselect).mockResolvedValue([])
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await selectMcpTools(reader, [], [], ['github'])
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('github 已安装'))
      logSpy.mockRestore()
    })

    it('所有 MCP 都已装时返回初始值 + 已装服务', async () => {
      const reader = createMockReader({
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
      })
      vi.mocked(p.multiselect).mockResolvedValue([])
      const result = await selectMcpTools(reader, [], ['context7'], ['github'])
      expect(result).toEqual(['context7', 'github'])
    })

    it('所有 MCP 都已装且无初始值时返回已装服务', async () => {
      const reader = createMockReader({
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
      })
      vi.mocked(p.multiselect).mockResolvedValue([])
      const result = await selectMcpTools(reader, [], [], ['github'])
      expect(result).toEqual(['github'])
    })

    it('已装服务无对应 MCP 工具（empty reader）时不崩溃', async () => {
      const reader = createMockReader({})
      const result = await selectMcpTools(reader, [], [], ['nonexistent'])
      expect(result).toEqual([])
    })
  })
})
