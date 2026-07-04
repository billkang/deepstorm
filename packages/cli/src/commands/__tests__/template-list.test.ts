import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listTemplates } from '../template-list'
import type { Registry } from '../../types/registry'

describe('listTemplates', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('无 skill 时应输出提示', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
    }
    listTemplates(registry)
    expect(consoleLogSpy).toHaveBeenCalledWith('没有找到可用的模板')
  })

  it('应列出所有 skill', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: '开发侧', description: '' },
      },
      wizards: {},
      skills: {
        'reef-style-backend': {
          tool: 'reef',
          configKey: 'reef.backend.language',
          configValue: 'java',
          name: '后端编码规范',
          description: '后端规范',
        },
        'reef-style-frontend': {
          tool: 'reef',
          configKey: 'reef.frontend.framework',
          configValue: 'angular',
          name: '前端编码规范',
        },
      },
    }
    listTemplates(registry)
    expect(consoleLogSpy).toHaveBeenCalledWith('可用的模板:')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('后端编码规范'),
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('前端编码规范'),
    )
  })

  it('按工具名筛选应只列出该工具下的 skill', () => {
    const registry: Registry = {
      version: '1',
      tools: {
        reef: { label: '开发侧', description: '' },
        tide: { label: '产品侧', description: '' },
      },
      wizards: {},
      skills: {
        'reef-style-backend': {
          tool: 'reef',
          configKey: 'reef.backend.language',
          configValue: 'java',
          name: '后端编码规范',
        },
        'tide-prd': {
          tool: 'tide',
          configKey: 'tide.issueTracker',
          configValue: 'jira',
          name: 'PRD 生成',
        },
      },
    }
    listTemplates(registry, 'reef')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('后端编码规范'),
    )
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('PRD 生成'),
    )
  })
})
