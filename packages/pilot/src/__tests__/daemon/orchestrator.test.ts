import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { parseTasksMd, buildTaskPrompt, hasTaskCompleteMarker } from '../../daemon/claude-process'

describe('daemon/orchestrator integration', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-ortest-'))
    fs.mkdirSync(path.join(tmpDir, '.deepstorm'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('OpenSpec tasks integration', () => {
    it('reads and parses tasks from real tasks.md format', () => {
      const content = [
        '## 1. Project Setup',
        '',
        '- [ ] 1.1 Initialize npm package',
        '- [ ] 1.2 Configure TypeScript',
        '',
        '## 2. Core Feature',
        '',
        '- [ ] 2.1 Implement main logic',
        '- [ ] 2.2 Add error handling',
        '',
        '## 3. Testing',
        '',
        '- [ ] 3.1 Write unit tests',
      ].join('\n')

      const tasksMdPath = path.join(tmpDir, 'tasks.md')
      fs.writeFileSync(tasksMdPath, content, 'utf-8')

      const raw = fs.readFileSync(tasksMdPath, 'utf-8')
      const tasks = parseTasksMd(raw)

      expect(tasks).toHaveLength(5)
      expect(tasks[0]).toEqual({ id: '1.1', title: 'Initialize npm package' })
      expect(tasks[1]).toEqual({ id: '1.2', title: 'Configure TypeScript' })
      expect(tasks[2]).toEqual({ id: '2.1', title: 'Implement main logic' })
    })
  })

  describe('Prompt building with spec context', () => {
    it('builds prompt including spec requirements', () => {
      const specContent = '## ADDED Requirements\n\n### Requirement: User can login'
      const prompt = buildTaskPrompt(
        '2.1',
        'Implement login',
        'Create user login functionality',
        specContent,
        ['Use TypeScript', 'TDD required'],
      )

      expect(prompt).toContain('任务 2.1')
      expect(prompt).toContain('Implement login')
      expect(prompt).toContain('User can login')
      expect(prompt).toContain('Use TypeScript')
      expect(prompt).toContain('TDD required')
      expect(prompt).toContain('##TASK_COMPLETE ##2.1##')
    })

    it('builds minimal prompt without spec', () => {
      const prompt = buildTaskPrompt('1.1', 'Setup', 'Initialize project', '', [])

      expect(prompt).toContain('任务 1.1')
      expect(prompt).toContain('Setup')
      expect(prompt).not.toContain('## Spec')
      expect(prompt).toContain('##TASK_COMPLETE ##1.1##')
    })
  })

  describe('Completion marker detection', () => {
    it('detects completion in claude output', () => {
      const output = [
        'Here is the implementation:',
        '```typescript',
        'const x = 1;',
        '```',
        '##TASK_COMPLETE ##1.3##',
        'Task finished.',
      ].join('\n')

      expect(hasTaskCompleteMarker(output, '1.3')).toBe(true)
    })

    it('handles multi-line output without marker', () => {
      const output = [
        'Working on it...',
        'Still working...',
        'Done?',
      ].join('\n')

      expect(hasTaskCompleteMarker(output, '1.1')).toBe(false)
    })
  })
})
