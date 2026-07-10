import { describe, it, expect } from 'vitest'
import {
  hasTaskCompleteMarker,
  hasTaskStuckMarker,
  parseTokenUsage,
  buildTaskPrompt,
  parseTasksMd,
} from '../../daemon/claude-process'

describe('daemon/claude-process', () => {
  describe('hasTaskCompleteMarker', () => {
    it('detects completion marker in output', () => {
      const output = 'some code\n##TASK_COMPLETE ##1.3##\nmore output'
      expect(hasTaskCompleteMarker(output, '1.3')).toBe(true)
    })

    it('returns false when marker is for different task', () => {
      const output = '##TASK_COMPLETE ##1.2##'
      expect(hasTaskCompleteMarker(output, '1.3')).toBe(false)
    })

    it('returns false when no marker present', () => {
      const output = 'just some output'
      expect(hasTaskCompleteMarker(output, '1.1')).toBe(false)
    })
  })

  describe('hasTaskStuckMarker', () => {
    it('extracts stuck reason from marker', () => {
      const output = '##TASK_STUCK ##2.1##API rate limit exceeded'
      expect(hasTaskStuckMarker(output, '2.1')).toBe('API rate limit exceeded')
    })

    it('returns null when no stuck marker', () => {
      const output = 'normal output'
      expect(hasTaskStuckMarker(output, '1.1')).toBeNull()
    })
  })

  describe('parseTokenUsage', () => {
    it('parses input and output tokens', () => {
      const output = 'Tokens: 1,234 input, 5,678 output'
      const result = parseTokenUsage(output)
      expect(result.input).toBe(1234)
      expect(result.output).toBe(5678)
    })

    it('returns empty object when no token info', () => {
      expect(parseTokenUsage('no tokens here')).toEqual({})
    })
  })

  describe('buildTaskPrompt', () => {
    it('includes task ID and title in prompt', () => {
      const prompt = buildTaskPrompt('1.1', 'User login', 'Implement login form', '', ['Use TypeScript'])
      expect(prompt).toContain('任务 1.1')
      expect(prompt).toContain('User login')
      expect(prompt).toContain('Use TypeScript')
      expect(prompt).toContain('##TASK_COMPLETE ##1.1##')
      expect(prompt).toContain('##TASK_STUCK ##1.1##')
    })
  })

  describe('parseTasksMd', () => {
    it('parses checkbox tasks from markdown', () => {
      const content = [
        '## 1. Setup',
        '',
        '- [ ] 1.1 Create config',
        '- [ ] 1.2 Install deps',
        '',
        '## 2. Core',
        '',
        '- [ ] 2.1 Implement core logic',
      ].join('\n')

      const tasks = parseTasksMd(content)
      expect(tasks).toHaveLength(3)
      expect(tasks[0]).toEqual({ id: '1.1', title: 'Create config' })
      expect(tasks[1]).toEqual({ id: '1.2', title: 'Install deps' })
      expect(tasks[2]).toEqual({ id: '2.1', title: 'Implement core logic' })
    })

    it('ignores completed checkboxes', () => {
      const content = '- [x] 1.1 Already done\n- [ ] 1.2 Pending'
      const tasks = parseTasksMd(content)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].id).toBe('1.2')
    })

    it('returns empty array for no tasks', () => {
      expect(parseTasksMd('# Just a heading')).toEqual([])
    })
  })
})
