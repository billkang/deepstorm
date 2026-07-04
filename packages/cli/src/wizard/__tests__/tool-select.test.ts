import { describe, it, expect, beforeEach, vi } from 'vitest'
import { selectTools } from '../tool-select'
import type { RegistryReader } from '../../engine/registry'

// 模拟 @clack/prompts
vi.mock('@clack/prompts', () => ({
  multiselect: vi.fn(),
  note: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
}))

import * as p from '@clack/prompts'

describe('selectTools', () => {
  let mockReader: RegistryReader

  beforeEach(() => {
    vi.clearAllMocks()
    mockReader = {
      getTools: vi.fn(() => ['reef', 'tide', 'sweep', 'atoll']),
      getToolEntry: vi.fn((t: string) => {
        const labels: Record<string, { label: string; description: string }> = {
          reef: { label: '开发侧', description: '规范生成、代码实现' },
          tide: { label: '产品侧', description: 'BMAD 需求讨论' },
          sweep: { label: '测试侧', description: '测试生成' },
          atoll: { label: '运维侧', description: '部署辅助' },
        }
        return labels[t] || null
      }),
    } as unknown as RegistryReader
  })

  it('无可用工具时返回空数组并提示', async () => {
    const emptyReader = {
      getTools: vi.fn(() => []),
    } as unknown as RegistryReader

    const result = await selectTools(emptyReader)

    expect(result).toEqual([])
    expect(p.note).toHaveBeenCalledWith('没有可用的工具套件', '提示')
    expect(p.multiselect).not.toHaveBeenCalled()
  })

  it('用户选择多个工具时返回对应名称列表', async () => {
    vi.mocked(p.multiselect).mockResolvedValue(['reef', 'tide'])

    const result = await selectTools(mockReader)

    expect(result).toEqual(['reef', 'tide'])
    expect(p.multiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('DeepStorm'),
      }),
    )
  })

  it('构建选项时包含标签和提示', async () => {
    vi.mocked(p.multiselect).mockResolvedValue(['reef'])

    await selectTools(mockReader)

    const options = vi.mocked(p.multiselect).mock.calls[0][0].options
    expect(options).toBeDefined()
    const reefOption = options!.find((o) => o.value === 'reef')
    expect(reefOption).toBeDefined()
    expect(reefOption!.label).toContain('开发侧')
    expect(reefOption!.hint).toContain('规范生成')
  })

  it('空选项时返回空数组', async () => {
    vi.mocked(p.multiselect).mockResolvedValue([])

    const result = await selectTools(mockReader)

    expect(result).toEqual([])
  })
})
