import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { tmpdir } from 'node:os'
import { RegistryReader } from '../../engine/registry'
import { mergePluginHooks, updatePluginJsonHooks } from '../plugin-build'
import type { Registry } from '../../types/registry'

describe('mergePluginHooks', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'plugin-hooks-test-'))
  })

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('creates merged hooks.json from selected tools', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-block-dangerous.sh', 'reef-protect-files.sh'] },
        sweep: { hooks: ['sweep-mcp-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    // Create source hooks.json files
    const packagesDir = path.join(tmpDir, 'packages')
    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'reef', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write|Edit',
              hooks: [{ type: 'command', command: 'bash ./reef-protect-files.sh' }],
            },
          ],
        },
      }),
    )

    fs.mkdirSync(path.join(packagesDir, 'sweep', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'sweep', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'bash ./sweep-mcp-hook.sh' }],
            },
          ],
        },
      }),
    )

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks(['reef', 'sweep'], reader, pluginDir, packagesDir)

    // Verify merged result
    const resultPath = path.join(pluginDir, 'hooks', 'deepstorm-hooks.json')
    expect(fs.existsSync(resultPath)).toBe(true)

    const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
    expect(result.hooks.PreToolUse).toBeDefined()
    expect(result.hooks.PreToolUse[0].matcher).toBe('Write|Edit')
    expect(result.hooks.PreToolUse[0].hooks[0].command).toContain('reef-protect-files.sh')

    expect(result.hooks.SessionStart).toBeDefined()
    expect(result.hooks.SessionStart[0].hooks[0].command).toContain('sweep-mcp-hook.sh')
  })

  it('skips when no tool has hooks', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        tide: { agents: ['tide-agent.md'] },
      },
    }
    const reader = new RegistryReader(registry)

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks(['tide'], reader, pluginDir, path.join(tmpDir, 'packages'))

    expect(fs.existsSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'))).toBe(false)
  })

  it('skips missing hooks.json for a tool', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-protect.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const packagesDir = path.join(tmpDir, 'packages')
    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    // Intentionally NOT writing hooks.json

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks(['reef'], reader, pluginDir, packagesDir)

    expect(fs.existsSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'))).toBe(false)
  })

  it('merges real-world reef hooks content (multi-event structure)', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-block-dangerous.sh', 'reef-protect-files.sh', 'reef-auto-format.sh', 'reef-run-tests.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const packagesDir = path.join(tmpDir, 'packages')
    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    // Simulate the full reef hooks.json with PreToolUse, PostToolUse, Stop
    fs.writeFileSync(
      path.join(packagesDir, 'reef', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'bash ./reef-block-dangerous.sh' }],
            },
            {
              matcher: 'Write|Edit',
              hooks: [
                { type: 'command', command: 'bash ./reef-protect-files.sh' },
                { type: 'prompt', timeout: 5, prompt: 'You are about to write or edit a file.' },
              ],
            },
          ],
          PostToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'bash ./reef-auto-format.sh' }],
            },
          ],
          Stop: [
            {
              hooks: [{ type: 'command', command: 'bash ./reef-run-tests.sh' }],
            },
          ],
        },
      }),
    )

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks(['reef'], reader, pluginDir, packagesDir)

    const result = JSON.parse(fs.readFileSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'), 'utf-8'))

    // PreToolUse: 2 matchers preserved
    expect(result.hooks.PreToolUse).toHaveLength(2)
    expect(result.hooks.PreToolUse[0].matcher).toBe('Bash')
    expect(result.hooks.PreToolUse[1].matcher).toBe('Write|Edit')
    // Write|Edit has 2 hooks (command + prompt)
    expect(result.hooks.PreToolUse[1].hooks).toHaveLength(2)
    expect(result.hooks.PreToolUse[1].hooks[1].type).toBe('prompt')

    // PostToolUse preserved
    expect(result.hooks.PostToolUse).toHaveLength(1)
    expect(result.hooks.PostToolUse[0].matcher).toBe('Edit|Write')

    // Stop preserved
    expect(result.hooks.Stop).toHaveLength(1)
    expect(result.hooks.Stop[0].hooks[0].command).toContain('reef-run-tests.sh')
  })

  it('merges all three tools (reef + sweep + tide) with distinct events', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-hook.sh'] },
        sweep: { hooks: ['sweep-hook.sh'] },
        tide: { hooks: ['tide-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const packagesDir = path.join(tmpDir, 'packages')
    for (const [tool, config] of Object.entries({
      reef: { PreToolUse: [{ matcher: 'Write|Edit', hooks: [{ type: 'command', command: 'bash reef.sh' }] }] },
      sweep: { SessionStart: [{ hooks: [{ type: 'command', command: 'bash sweep.sh' }] }] },
      tide: { SessionStart: [{ hooks: [{ type: 'command', command: 'bash tide.sh' }] }] },
    })) {
      fs.mkdirSync(path.join(packagesDir, tool, 'hooks'), { recursive: true })
      fs.writeFileSync(path.join(packagesDir, tool, 'hooks', 'hooks.json'), JSON.stringify({ hooks: config }))
    }

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks(['reef', 'sweep', 'tide'], reader, pluginDir, packagesDir)

    const result = JSON.parse(fs.readFileSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'), 'utf-8'))
    expect(result.hooks.PreToolUse).toHaveLength(1)
    expect(result.hooks.PreToolUse[0].matcher).toBe('Write|Edit')
    // SessionStart: sweep's entry, then tide overwrites with deepMerge — last wins
    // This is identical to setup.ts Step 5 behavior
    expect(result.hooks.SessionStart).toHaveLength(1)
    expect(result.hooks.SessionStart[0].hooks[0].command).toContain('tide.sh')
  })

  it('handles non-existent packagesDir without crashing', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    // packagesDir = non-existent path
    mergePluginHooks(['reef'], reader, pluginDir, path.join(tmpDir, 'nonexistent'))

    expect(fs.existsSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'))).toBe(false)
  })

  it('throws on invalid JSON in source hooks.json', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const packagesDir = path.join(tmpDir, 'packages')
    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    // Write invalid JSON
    fs.writeFileSync(path.join(packagesDir, 'reef', 'hooks', 'hooks.json'), 'not-valid-json{{{')

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    expect(() => {
      mergePluginHooks(['reef'], reader, pluginDir, packagesDir)
    }).toThrow(SyntaxError)
  })

  it('is a no-op when tools list is empty', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks([], reader, pluginDir, path.join(tmpDir, 'packages'))

    expect(fs.existsSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'))).toBe(false)
  })

  it('is idempotent when called twice with same tools', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-hook.sh'] },
        sweep: { hooks: ['sweep-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const packagesDir = path.join(tmpDir, 'packages')
    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'reef', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'bash reef.sh' }] }] },
      }),
    )
    fs.mkdirSync(path.join(packagesDir, 'sweep', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'sweep', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'bash sweep.sh' }] }] },
      }),
    )

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    // First call
    mergePluginHooks(['reef', 'sweep'], reader, pluginDir, packagesDir)
    // Second call with same tools
    mergePluginHooks(['reef', 'sweep'], reader, pluginDir, packagesDir)

    const result = JSON.parse(fs.readFileSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'), 'utf-8'))
    // Same entries, not duplicated
    expect(result.hooks.PreToolUse).toHaveLength(1)
    expect(result.hooks.SessionStart).toHaveLength(1)
  })

  it('preserves different events from multiple tools', () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-hook.sh'] },
        sweep: { hooks: ['sweep-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)

    const packagesDir = path.join(tmpDir, 'packages')

    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'reef', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'bash reef-block.sh' }],
            },
          ],
        },
      }),
    )

    fs.mkdirSync(path.join(packagesDir, 'sweep', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'sweep', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'bash sweep-mcp.sh' }],
            },
          ],
        },
      }),
    )

    const pluginDir = path.join(tmpDir, 'plugin')
    fs.mkdirSync(pluginDir, { recursive: true })

    mergePluginHooks(['reef', 'sweep'], reader, pluginDir, packagesDir)

    const result = JSON.parse(
      fs.readFileSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'), 'utf-8'),
    )
    // Different events — both preserved
    expect(result.hooks.PreToolUse).toHaveLength(1)
    expect(result.hooks.PreToolUse[0].matcher).toBe('Bash')
    expect(result.hooks.SessionStart).toHaveLength(1)
    expect(result.hooks.SessionStart[0].hooks[0].command).toContain('sweep-mcp.sh')
  })
})

describe('full plugin build flow (mergePluginHooks)', () => {
  let tmpDir: string
  let packagesDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'plugin-full-flow-'))
    packagesDir = path.join(tmpDir, 'packages')

    // Create source hooks.json for reef and sweep
    fs.mkdirSync(path.join(packagesDir, 'reef', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'reef', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'bash ./reef-block-dangerous.sh' }],
            },
          ],
          PostToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'bash ./reef-auto-format.sh' }],
            },
          ],
        },
      }),
    )

    fs.mkdirSync(path.join(packagesDir, 'sweep', 'hooks'), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, 'sweep', 'hooks', 'hooks.json'),
      JSON.stringify({
        hooks: {
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'bash ./sweep-mcp-hook.sh' }],
            },
          ],
        },
      }),
    )
  })

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('full flow: merges hooks to deepstorm-hooks.json and declares path in plugin.json', async () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {
        reef: { hooks: ['reef-block-dangerous.sh', 'reef-auto-format.sh'] },
        sweep: { hooks: ['sweep-mcp-hook.sh'] },
      },
    }
    const reader = new RegistryReader(registry)
    const pluginDir = path.join(tmpDir, 'plugin')
    const { mergePluginHooks, updatePluginJsonHooks } = await import('../plugin-build')

    // Step 7b: merge hooks
    mergePluginHooks(['reef', 'sweep'], reader, pluginDir, packagesDir)

    // Create minimal plugin.json (as buildPlugin would)
    const pluginJsonDir = path.join(pluginDir, '.claude-plugin')
    fs.mkdirSync(pluginJsonDir, { recursive: true })
    fs.writeFileSync(
      path.join(pluginJsonDir, 'plugin.json'),
      JSON.stringify({ name: 'deepstorm', version: '1.0.0' }),
    )

    // Step 7c: update plugin.json with hooks declaration
    updatePluginJsonHooks(pluginDir)

    // Verify: deepstorm-hooks.json has both reef and sweep hooks with relative paths
    const hooksJson = JSON.parse(fs.readFileSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'), 'utf-8'))
    expect(hooksJson.hooks.PreToolUse).toBeDefined()
    expect(hooksJson.hooks.PreToolUse[0].hooks[0].command).toBe('bash ./reef-block-dangerous.sh')
    expect(hooksJson.hooks.PostToolUse).toBeDefined()
    expect(hooksJson.hooks.SessionStart).toBeDefined()
    expect(hooksJson.hooks.SessionStart[0].hooks[0].command).toBe('bash ./sweep-mcp-hook.sh')

    // No ${CLAUDE_PLUGIN_ROOT} anywhere
    const raw = fs.readFileSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'), 'utf-8')
    expect(raw).not.toContain('CLAUDE_PLUGIN_ROOT')

    // plugin.json 声明 hooks 指向 deepstorm-hooks.json（非标准文件名，避免与 auto-load 冲突）
    const pluginJson = JSON.parse(fs.readFileSync(path.join(pluginJsonDir, 'plugin.json'), 'utf-8'))
    expect(pluginJson.hooks).toBe('./hooks/deepstorm-hooks.json')
    expect(pluginJson.name).toBe('deepstorm')
  })

  it('full flow: skips merging when no tools have hooks', async () => {
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      toolAssets: {},
    }
    const reader = new RegistryReader(registry)
    const pluginDir = path.join(tmpDir, 'plugin')
    const { mergePluginHooks, updatePluginJsonHooks } = await import('../plugin-build')

    // mergePluginHooks exits early (no hooks)
    mergePluginHooks([], reader, pluginDir, packagesDir)

    // Create minimal plugin.json
    const pluginJsonDir = path.join(pluginDir, '.claude-plugin')
    fs.mkdirSync(pluginJsonDir, { recursive: true })
    fs.writeFileSync(
      path.join(pluginJsonDir, 'plugin.json'),
      JSON.stringify({ name: 'deepstorm' }),
    )

    updatePluginJsonHooks(pluginDir)

    // No hooks dir exists, so plugin.json stays unchanged
    expect(fs.existsSync(path.join(pluginDir, 'hooks', 'deepstorm-hooks.json'))).toBe(false)
    const pluginJson = JSON.parse(fs.readFileSync(path.join(pluginJsonDir, 'plugin.json'), 'utf-8'))
    expect(pluginJson.hooks).toBeUndefined()
  })
})
