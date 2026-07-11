import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { parseTasksMd, buildTaskPrompt, hasTaskCompleteMarker } from '../../daemon/claude-process'
import { findFirstActiveChange, findChangeByName, archiveChange } from '../../daemon/orchestrator'
import type { PilotState, TaskState } from '../../state/types'

describe('daemon/orchestrator integration', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-ortest-'))
    fs.mkdirSync(path.join(tmpDir, '.deepstorm'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('findFirstActiveChange', () => {
    it('finds active change under openspec/changes/', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 do something')

      const change = findFirstActiveChange(tmpDir)
      expect(change).not.toBeNull()
      expect(change!.name).toBe('my-feature')
      expect(change!.tasksPath).toBe(path.join(changeDir, 'tasks.md'))
      expect(change!.specsDir).toBe(path.join(changeDir, 'specs'))
      expect(change!.designPath).toBe(path.join(changeDir, 'design.md'))
    })

    it('returns null when no change exists', () => {
      const change = findFirstActiveChange(tmpDir)
      expect(change).toBeNull()
    })

    it('picks first active change sorted by name', () => {
      const changeA = path.join(tmpDir, 'openspec', 'changes', 'a-feature')
      const changeB = path.join(tmpDir, 'openspec', 'changes', 'b-feature')
      fs.mkdirSync(changeA, { recursive: true })
      fs.mkdirSync(changeB, { recursive: true })
      fs.writeFileSync(path.join(changeA, 'tasks.md'), '- [ ] 1.1 task a')
      fs.writeFileSync(path.join(changeB, 'tasks.md'), '- [ ] 1.1 task b')

      const change = findFirstActiveChange(tmpDir)
      expect(change).not.toBeNull()
      expect(change!.name).toBe('a-feature')
    })

    it('returns null when only archive has changes', () => {
      // archive 中的 change 不应被发现
      const archiveDir = path.join(tmpDir, 'openspec', 'changes', 'archive', 'old-feature')
      fs.mkdirSync(archiveDir, { recursive: true })
      fs.writeFileSync(path.join(archiveDir, 'tasks.md'), '- [ ] 1.1 old task')

      const change = findFirstActiveChange(tmpDir)
      expect(change).toBeNull()
    })

    it('ignores archive directory when scanning active changes', () => {
      const activeDir = path.join(tmpDir, 'openspec', 'changes', 'new-feature')
      const archiveDir = path.join(tmpDir, 'openspec', 'changes', 'archive', 'old-feature')
      fs.mkdirSync(activeDir, { recursive: true })
      fs.mkdirSync(archiveDir, { recursive: true })
      fs.writeFileSync(path.join(activeDir, 'tasks.md'), '- [ ] 1.1 new')
      fs.writeFileSync(path.join(archiveDir, 'tasks.md'), '- [ ] 1.1 old')

      const change = findFirstActiveChange(tmpDir)
      // 应该找到 active change，忽略 archive
      expect(change!.name).toBe('new-feature')
      expect(change!.dir).toBe(activeDir)
    })

    it('skips change dir without tasks.md', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'empty-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      // 不创建 tasks.md

      const change = findFirstActiveChange(tmpDir)
      expect(change).toBeNull()
    })

    it('skips first dir without tasks.md and picks next', () => {
      const emptyDir = path.join(tmpDir, 'openspec', 'changes', 'a-empty')
      const validDir = path.join(tmpDir, 'openspec', 'changes', 'b-valid')
      fs.mkdirSync(emptyDir, { recursive: true })
      fs.mkdirSync(validDir, { recursive: true })
      // a-empty 没有 tasks.md
      fs.writeFileSync(path.join(validDir, 'tasks.md'), '- [ ] 1.1 valid')

      const change = findFirstActiveChange(tmpDir)
      expect(change).not.toBeNull()
      expect(change!.name).toBe('b-valid')
    })

    it('returns ActiveChange with correct dir field', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 task')

      const change = findFirstActiveChange(tmpDir)
      expect(change!.dir).toBe(changeDir)
    })
  })

  describe('findChangeByName', () => {
    it('finds active change by name', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 task')

      const change = findChangeByName(tmpDir, 'my-feature')
      expect(change).not.toBeNull()
      expect(change!.name).toBe('my-feature')
      expect(change!.tasksPath).toBe(path.join(changeDir, 'tasks.md'))
    })

    it('returns null when change not found', () => {
      const change = findChangeByName(tmpDir, 'nonexistent')
      expect(change).toBeNull()
    })

    it('returns null when dir exists but has no tasks.md', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'no-tasks')
      fs.mkdirSync(changeDir, { recursive: true })
      // 不创建 tasks.md

      const change = findChangeByName(tmpDir, 'no-tasks')
      expect(change).toBeNull()
    })

    it('returns null for archived-only change (no active lookup)', () => {
      const archiveDir = path.join(tmpDir, 'openspec', 'changes', 'archive', 'old-feature')
      fs.mkdirSync(archiveDir, { recursive: true })
      fs.writeFileSync(path.join(archiveDir, 'tasks.md'), '- [ ] 1.1 old')

      const change = findChangeByName(tmpDir, 'old-feature')
      expect(change).toBeNull()
    })
  })

  describe('archiveChange', () => {
    function makeState(overrides: Partial<PilotState> = {}): PilotState {
      return {
        project: tmpDir,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pilotVersion: '0.6.2',
        tasks: [],
        errors: [],
        summary: null,
        restartCount: 0,
        isResumed: false,
        ...overrides,
      }
    }

    function makeTask(overrides: Partial<TaskState> = {}): TaskState {
      return {
        id: '1.1',
        title: 'test task',
        status: 'completed',
        retries: 0,
        maxRetries: 3,
        tokenBudget: 100_000,
        tokensUsed: 0,
        startedAt: null,
        completedAt: null,
        duration: null,
        error: null,
        errorDetail: null,
        errorFingerprint: null,
        logPath: null,
        ...overrides,
      }
    }

    it('archives change when all tasks completed', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 task')

      const change = findFirstActiveChange(tmpDir)!
      const state = makeState({ tasks: [makeTask({ status: 'completed' })] })

      const result = archiveChange(tmpDir, change, state)
      expect(result).toBe(true)

      // 原目录应已移除
      expect(fs.existsSync(changeDir)).toBe(false)
      // archive 目录应存在
      const dateStr = new Date().toISOString().slice(0, 10)
      const archivePath = path.join(tmpDir, 'openspec', 'changes', 'archive', `${dateStr}-my-feature`)
      expect(fs.existsSync(archivePath)).toBe(true)
    })

    it('skips archive when task failed', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 task')

      const change = findFirstActiveChange(tmpDir)!
      const state = makeState({ tasks: [makeTask({ status: 'failed' })] })

      const result = archiveChange(tmpDir, change, state)
      expect(result).toBe(false)
      // 原目录应保留
      expect(fs.existsSync(changeDir)).toBe(true)
    })

    it('skips archive when task skipped', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 task')

      const change = findFirstActiveChange(tmpDir)!
      const state = makeState({
        tasks: [makeTask({ status: 'completed' }), makeTask({ id: '1.2', status: 'skipped' })],
      })

      const result = archiveChange(tmpDir, change, state)
      expect(result).toBe(false)
      expect(fs.existsSync(changeDir)).toBe(true)
    })

    it('skips archive when no tasks', () => {
      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'my-feature')
      fs.mkdirSync(changeDir, { recursive: true })
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] 1.1 task')

      const change = findFirstActiveChange(tmpDir)!
      const state = makeState({ tasks: [] })

      const result = archiveChange(tmpDir, change, state)
      expect(result).toBe(false)
    })
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
