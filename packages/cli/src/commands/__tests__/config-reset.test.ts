import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { resetConfig } from '../config-reset'

describe('resetConfig', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-reset-'))
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('removes deepstorm namespace from settings', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: { reef: { frontend: { framework: 'react' } } },
        mcpServers: { test: {} },
      }),
      'utf-8',
    )

    resetConfig(tmpDir)

    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.deepstorm).toBeUndefined()
    expect(settings.mcpServers).toEqual({ test: {} })
  })

  it('does nothing if no deepstorm namespace', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify({ mcpServers: {} }),
      'utf-8',
    )

    resetConfig(tmpDir)

    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.mcpServers).toEqual({})
  })

  it('handles non-existent settings.json', () => {
    expect(() => resetConfig(tmpDir)).not.toThrow()
  })
})
