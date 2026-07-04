import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { mergeHooks } from '../hooks'

describe('mergeHooks', () => {
  let tmpDir: string
  let hooksPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-hooks-'))
    hooksPath = path.join(tmpDir, 'hooks.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function readHooks(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(hooksPath, 'utf-8'))
  }

  it('creates hooks.json if it does not exist', () => {
    mergeHooks(hooksPath, {
      'pre-commit': ['deepstorm-lint'],
    })

    expect(fs.existsSync(hooksPath)).toBe(true)
    const hooks = readHooks()
    expect(hooks['pre-commit']).toEqual(['deepstorm-lint'])
  })

  it('merges into existing hooks', () => {
    fs.writeFileSync(
      hooksPath,
      JSON.stringify({
        'pre-commit': ['existing-hook'],
        'post-checkout': ['some-hook'],
      }),
      'utf-8',
    )

    mergeHooks(hooksPath, {
      'pre-commit': ['deepstorm-lint'],
    })

    const hooks = readHooks()
    expect(hooks['post-checkout']).toEqual(['some-hook'])
    expect(hooks['pre-commit']).toEqual(['deepstorm-lint'])
  })

  it('handles non-JSON file gracefully', () => {
    fs.writeFileSync(hooksPath, 'bad-json', 'utf-8')

    expect(() => {
      mergeHooks(hooksPath, { 'pre-commit': ['deepstorm-lint'] })
    }).not.toThrow()
  })

  it('merges UserPromptSubmit hook alongside existing PreToolUse hooks', () => {
    // Simulate existing hooks.json with PreToolUse entries
    fs.writeFileSync(
      hooksPath,
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'bash reef-block-dangerous.sh' }],
            },
          ],
          Stop: [
            {
              hooks: [{ type: 'command', command: 'bash reef-run-tests.sh' }],
            },
          ],
        },
      }),
      'utf-8',
    )

    // Merge in UserPromptSubmit entry
    mergeHooks(hooksPath, {
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [{ type: 'command', command: 'bash reef-intent-detect.sh' }],
          },
        ],
      },
    })

    const hooks = readHooks() as any
    // Existing hooks preserved
    expect(hooks.hooks.PreToolUse).toHaveLength(1)
    expect(hooks.hooks.PreToolUse[0].matcher).toBe('Bash')
    expect(hooks.hooks.Stop).toHaveLength(1)
    // New UserPromptSubmit hook added
    expect(hooks.hooks.UserPromptSubmit).toHaveLength(1)
    expect(hooks.hooks.UserPromptSubmit[0].hooks[0].command).toBe('bash reef-intent-detect.sh')
  })

  it('merges UserPromptSubmit with empty existing hooks', () => {
    mergeHooks(hooksPath, {
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [{ type: 'command', command: 'bash reef-intent-detect.sh' }],
          },
        ],
      },
    })

    const hooks = readHooks() as any
    expect(hooks.hooks.UserPromptSubmit).toHaveLength(1)
    expect(hooks.hooks.UserPromptSubmit[0].hooks[0].command).toBe('bash reef-intent-detect.sh')
  })
})
