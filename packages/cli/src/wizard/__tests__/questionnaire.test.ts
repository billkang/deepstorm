import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runQuestionnaire } from '../questionnaire'
import type { RegistryReader } from '../../engine/registry'
import type { WizardQuestion, WizardEntry } from '../../types/registry'

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
  select: vi.fn(),
  multiselect: vi.fn(),
  groupMultiselect: vi.fn(),
  group: vi.fn(),
}))

import * as p from '@clack/prompts'

function makeWizard(questions: WizardQuestion[]): WizardEntry {
  return { tool: 'test', label: 'Test', description: 'Test wizard', questions }
}

function makeReader(wizard: WizardEntry): RegistryReader {
  return { getWizard: vi.fn(() => wizard) } as unknown as RegistryReader
}

describe('runQuestionnaire', () => {
  let configuredKeys: Set<string>

  beforeEach(() => {
    vi.resetAllMocks()
    // Re-establish default mock behaviors after reset
    vi.mocked(p.isCancel).mockReturnValue(false)
    configuredKeys = new Set()
  })

  describe('dependsOn (basic)', () => {
    const wizard = makeWizard([
      {
        key: 'parent',
        label: 'Parent',
        type: 'select',
        options: [
          { value: 'java', label: 'Java', template: {} },
          { value: 'none', label: 'None', template: {} },
        ],
      },
      {
        key: 'child',
        label: 'Child',
        type: 'select',
        dependsOn: { key: 'parent', value: 'java' },
        options: [
          { value: 'spring', label: 'Spring', template: {} },
          { value: 'none', label: 'None', template: {} },
        ],
      },
    ])

    it('shows child when condition met', async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce('java')
        .mockResolvedValueOnce('spring')
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.parent).toBe('java')
      expect(result.child).toBe('spring')
      expect(p.select).toHaveBeenCalledTimes(2)
    })

    it('skips child and sets default none when condition not met', async () => {
      vi.mocked(p.select).mockResolvedValueOnce('none')
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.parent).toBe('none')
      expect(result.child).toBe('none')
      expect(p.select).toHaveBeenCalledTimes(1)
    })

    it('skips child when parent key already configured', async () => {
      configuredKeys.add('parent')
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.parent).toBeUndefined()
      expect(result.child).toBe('none')
      expect(p.note).toHaveBeenCalled()
    })
  })

  describe('dependsOn with not flag', () => {
    const wizard = makeWizard([
      {
        key: 'env',
        label: '环境',
        type: 'select',
        options: [
          { value: 'dev', label: '开发', template: {} },
          { value: 'prod', label: '生产', template: {} },
        ],
      },
      {
        key: 'debug',
        label: '调试模式',
        type: 'select',
        dependsOn: { key: 'env', value: 'prod', not: true },
        options: [
          { value: 'on', label: '开启', template: {} },
          { value: 'off', label: '关闭', template: {} },
        ],
      },
    ])

    it('shows child when not condition holds (env=dev, not prod)', async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce('dev')
        .mockResolvedValueOnce('on')
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.env).toBe('dev')
      expect(result.debug).toBe('on')
    })

    it('skips child when not condition fails (env=prod)', async () => {
      vi.mocked(p.select).mockResolvedValueOnce('prod')
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.env).toBe('prod')
      expect(result.debug).toBe('none')
    })
  })

  describe('multiselect type', () => {
    const wizard = makeWizard([
      {
        key: 'frameworks',
        label: '选择框架',
        type: 'multiselect',
        options: [
          { value: 'react', label: 'React', template: {} },
          { value: 'vue', label: 'Vue', template: {} },
        ],
      },
    ])

    it('handles multiselect without groups', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(['react', 'vue'])
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.frameworks).toBe('react,vue')
      expect(p.multiselect).toHaveBeenCalledTimes(1)
    })

    it('handles multiselect with single selection', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(['react'])
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.frameworks).toBe('react')
    })

    it('cancels multiselect and exits', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(undefined as unknown as string[])
      vi.mocked(p.isCancel).mockReturnValueOnce(true)
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called')
      }) as any)
      await expect(runQuestionnaire(makeReader(wizard), ['test'], configuredKeys))
        .rejects.toThrow('process.exit called')
      expect(p.cancel).toHaveBeenCalledWith('已取消')
      exitSpy.mockRestore()
    })
  })

  describe('multiselect with groups', () => {
    const wizard = makeWizard([
      {
        key: 'tools',
        label: '选择工具',
        type: 'multiselect',
        options: [
          { value: 'eslint', label: 'ESLint', group: 'Linting', template: {} },
          { value: 'prettier', label: 'Prettier', group: 'Linting', template: {} },
          { value: 'jest', label: 'Jest', group: 'Testing', template: {} },
        ],
      },
    ])

    it('calls groupMultiselect when options have groups', async () => {
      vi.mocked(p.groupMultiselect).mockResolvedValue(['eslint', 'jest'])
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.tools).toBe('eslint,jest')
      expect(p.groupMultiselect).toHaveBeenCalledTimes(1)
      expect(p.multiselect).not.toHaveBeenCalled()
    })

    it('cancels groupMultiselect and exits', async () => {
      vi.mocked(p.groupMultiselect).mockResolvedValue(undefined as unknown as string[])
      vi.mocked(p.isCancel).mockReturnValueOnce(true)
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called')
      }) as any)
      await expect(runQuestionnaire(makeReader(wizard), ['test'], configuredKeys))
        .rejects.toThrow('process.exit called')
      exitSpy.mockRestore()
    })
  })

  describe('group type (single question, not in tab flow)', () => {
    const wizard = makeWizard([
      {
        key: 'db',
        label: '数据库',
        type: 'group',
        questions: [
          {
            key: 'db.type',
            label: '数据库类型',
            type: 'select',
            options: [
              { value: 'postgres', label: 'PostgreSQL', template: {} },
              { value: 'mysql', label: 'MySQL', template: {} },
            ],
          },
          {
            key: 'db.orm',
            label: 'ORM',
            type: 'select',
            options: [
              { value: 'prisma', label: 'Prisma', template: {} },
              { value: 'typeorm', label: 'TypeORM', template: {} },
            ],
          },
        ],
      },
    ])

    it('renders group type with p.group()', async () => {
      vi.mocked(p.group).mockResolvedValue({
        'db.type': 'postgres',
        'db.orm': 'prisma',
      })
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result['db.type']).toBe('postgres')
      expect(result['db.orm']).toBe('prisma')
      expect(p.group).toHaveBeenCalledTimes(1)
    })
  })

  describe('dependsOn with contains (single select)', () => {
    const wizard = makeWizard([
      {
        key: 'mode',
        label: '模式',
        type: 'select',
        options: [
          { value: 'full', label: '完整', template: {} },
          { value: 'quick', label: '快速', template: {} },
        ],
      },
      {
        key: 'detail',
        label: '详情',
        type: 'select',
        dependsOn: { key: 'mode', value: 'full', contains: true },
        options: [
          { value: 'yes', label: '是', template: {} },
        ],
      },
    ])

    it('shows question when contains condition met (non-multiselect)', async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce('full')
        .mockResolvedValueOnce('yes')
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.mode).toBe('full')
      expect(result.detail).toBe('yes')
    })
  })

  describe('hasTabs flow (multiselect + renderAsSingleGroup)', () => {
    const wizard = makeWizard([
      {
        key: 'frontend.framework',
        label: '前端框架',
        type: 'multiselect',
        options: [
          { value: 'react', label: 'React', template: {} },
          { value: 'vue', label: 'Vue', template: {} },
        ],
      },
      {
        key: 'frontend.react.version',
        label: 'React 版本',
        type: 'select',
        dependsOn: { key: 'frontend.framework', value: 'react', contains: true },
        options: [
          { value: '18', label: 'React 18', template: {} },
          { value: '19', label: 'React 19', template: {} },
        ],
      },
      {
        key: 'frontend.vue.version',
        label: 'Vue 版本',
        type: 'select',
        dependsOn: { key: 'frontend.framework', value: 'vue', contains: true },
        options: [
          { value: '3', label: 'Vue 3', template: {} },
          { value: '4', label: 'Vue 4', template: {} },
        ],
      },
    ])

    it('renders tab-eligible questions as single group', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(['react', 'vue'])
      // renderAsSingleGroup calls p.select through groupPrompts: first react.version, then vue.version
      vi.mocked(p.group).mockResolvedValue({
        'frontend.react.version': '18',
        'frontend.vue.version': '3',
      })
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result['frontend.framework']).toBe('react,vue')
      expect(result['frontend.react.version']).toBe('18')
      expect(result['frontend.vue.version']).toBe('3')
    })

    it('skips unselected tech tab and sets default', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(['react'])
      vi.mocked(p.group).mockResolvedValue({
        'frontend.react.version': '19',
      })
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result['frontend.framework']).toBe('react')
      expect(result['frontend.react.version']).toBe('19')
      expect(result['frontend.vue.version']).toBe('none')
    })
  })

  describe('hasTabs with group type in contains questions', () => {
    const wizard = makeWizard([
      {
        key: 'backend.language',
        label: '后端语言',
        type: 'multiselect',
        options: [
          { value: 'java', label: 'Java', template: {} },
          { value: 'python', label: 'Python', template: {} },
        ],
      },
      {
        key: 'backend.java',
        label: 'Java 详情',
        type: 'group',
        dependsOn: { key: 'backend.language', value: 'java', contains: true },
        questions: [
          {
            key: 'backend.java.framework',
            label: 'Java 框架',
            type: 'select',
            options: [
              { value: 'spring', label: 'Spring', template: {} },
              { value: 'quarkus', label: 'Quarkus', template: {} },
            ],
          },
        ],
      },
    ])

    it('renders group type inside tab flow', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(['java'])
      vi.mocked(p.group).mockResolvedValue({
        'backend.java.framework': 'spring',
      })
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result['backend.language']).toBe('java')
      expect(result['backend.java.framework']).toBe('spring')
    })

    it('skips group for unselected tech', async () => {
      vi.mocked(p.multiselect).mockResolvedValue(['python'])
      // No p.group should be called for python (no follow-up)
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result['backend.language']).toBe('python')
      // Java frameworks not selected -> java group skipped
    })
  })

  describe('already configured keys', () => {
    it('skips re-ask for multiselect when key is in configuredKeys', async () => {
      configuredKeys.add('frameworks')
      const wizard = makeWizard([
        {
          key: 'frameworks',
          label: '框架',
          type: 'multiselect',
          options: [{ value: 'react', label: 'React', template: {} }],
        },
      ])
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.frameworks).toBeUndefined()
      expect(p.note).toHaveBeenCalled()
    })

    it('skips re-ask for select when key is in configuredKeys', async () => {
      configuredKeys.add('lang')
      const wizard = makeWizard([
        {
          key: 'lang',
          label: '语言',
          type: 'select',
          options: [{ value: 'ts', label: 'TypeScript', template: {} }],
        },
      ])
      const result = await runQuestionnaire(makeReader(wizard), ['test'], configuredKeys)
      expect(result.lang).toBeUndefined()
      expect(p.note).toHaveBeenCalled()
    })
  })

  describe('cancellation (process.exit)', () => {
    it('cancels select and exits', async () => {
      const wizard = makeWizard([{
        key: 'x',
        label: 'X',
        type: 'select',
        options: [{ value: 'a', label: 'A', template: {} }],
      }])
      vi.mocked(p.select).mockResolvedValue(undefined as unknown as string)
      vi.mocked(p.isCancel).mockReturnValueOnce(true)
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called')
      }) as any)
      await expect(runQuestionnaire(makeReader(wizard), ['test'], configuredKeys))
        .rejects.toThrow('process.exit called')
      expect(p.cancel).toHaveBeenCalledWith('已取消')
      exitSpy.mockRestore()
    })
  })

  describe('wizard not found', () => {
    it('skips tool when no wizard exists', async () => {
      const reader = { getWizard: vi.fn(() => undefined) } as unknown as RegistryReader
      const result = await runQuestionnaire(reader, ['nonexistent'], configuredKeys)
      expect(result).toEqual({})
    })
  })
})
