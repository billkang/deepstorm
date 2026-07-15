import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { resetConfig } from '../config-reset'

describe('resetConfig', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-reset-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('删除 .deepstorm/settings.json', () => {
    const dotDeepstorm = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(dotDeepstorm, { recursive: true })
    fs.writeFileSync(
      path.join(dotDeepstorm, 'settings.json'),
      JSON.stringify({ reef: { frontend: { framework: 'react' } } }),
      'utf-8',
    )

    resetConfig(tmpDir)

    expect(fs.existsSync(path.join(dotDeepstorm, 'settings.json'))).toBe(false)
  })

  it('无 .deepstorm/settings.json 时不报错', () => {
    expect(() => resetConfig(tmpDir)).not.toThrow()
  })

  it('非 DeepStorm 文件不受影响', () => {
    const dotClaude = path.join(tmpDir, '.claude')
    fs.mkdirSync(dotClaude, { recursive: true })
    fs.writeFileSync(
      path.join(dotClaude, 'settings.json'),
      JSON.stringify({ mcpServers: { test: {} } }),
      'utf-8',
    )

    resetConfig(tmpDir)

    const settings = JSON.parse(
      fs.readFileSync(path.join(dotClaude, 'settings.json'), 'utf-8'),
    )
    expect(settings.mcpServers).toEqual({ test: {} })
  })
})
