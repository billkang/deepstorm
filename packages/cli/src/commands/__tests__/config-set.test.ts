import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { setConfigValue } from '../config-set'
import type { Registry } from '../../types/registry'

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn().mockReturnValue(false),
}))

import * as p from '@clack/prompts'

const mockRegistry: Registry = {
  version: '1',
  tools: {},
  wizards: {
    reef: {
      tool: 'reef',
      label: '开发侧',
      description: '开发侧配置',
      questions: [
        {
          key: 'reef.frontend.framework',
          label: '前端框架',
          description: '前端技术栈',
          type: 'select',
          options: [
            {
              value: 'angular',
              label: 'Angular 21',
              template: { label: 'Angular 21' },
              affectedTemplates: ['skills/reef-style-frontend/SKILL.md.tmpl'],
            },
          ],
        },
      ],
    },
  },
  skills: {},
}

describe('setConfigValue', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-config-'))
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify({
        deepstorm: {
          reef: { frontend: { framework: 'react' } },
          installedSkills: ['reef-react-lint'],
        },
      }),
      'utf-8',
    )
    vi.clearAllMocks()
    vi.mocked(p.confirm).mockReset()
    vi.mocked(p.isCancel).mockReset()
    vi.mocked(p.isCancel).mockReturnValue(false)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('sets a config value at a nested path', async () => {
    await setConfigValue(tmpDir, 'reef.frontend.framework', 'vue', mockRegistry)
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.deepstorm.reef.frontend.framework).toBe('vue')
  })

  it('creates deepstorm namespace if missing', async () => {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify({ mcpServers: {} }),
      'utf-8',
    )

    await setConfigValue(tmpDir, 'reef.frontend.framework', 'react', mockRegistry)
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.deepstorm.reef.frontend.framework).toBe('react')
    expect(settings.mcpServers).toEqual({})
  })

  it('handles non-existent settings.json', async () => {
    fs.rmSync(path.join(tmpDir, '.claude', 'settings.json'))

    await setConfigValue(tmpDir, 'reef.frontend.framework', 'react', mockRegistry)
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.deepstorm.reef.frontend.framework).toBe('react')
  })

  it('logs unchanged message when value is the same', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await setConfigValue(tmpDir, 'reef.frontend.framework', 'react', mockRegistry)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('已是'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('无变更'))
    logSpy.mockRestore()
  })

  it('does not prompt when no affected templates', async () => {
    const registryNoAffected: Registry = {
      version: '1',
      tools: {},
      wizards: {
        reef: {
          tool: 'reef',
          label: 'Reef',
          description: '',
          questions: [
            {
              key: 'reef.frontend.framework',
              label: '前端框架',
              type: 'select',
              options: [
                { value: 'vue', label: 'Vue', template: {} },
              ],
            },
          ],
        },
      },
      skills: {},
    }
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await setConfigValue(tmpDir, 'reef.frontend.framework', 'vue', registryNoAffected)
    // Should write and return without prompting
    expect(p.confirm).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('已更新'))
    logSpy.mockRestore()
  })

  it('prompts user when affected templates exist', async () => {
    vi.mocked(p.confirm).mockResolvedValue(false)
    vi.mocked(p.isCancel).mockReturnValue(false)

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await setConfigValue(tmpDir, 'reef.frontend.framework', 'angular', mockRegistry)

    expect(p.confirm).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('检测到配置变更'))
    logSpy.mockRestore()
  })

  it('logs manual update hint when user declines template re-render', async () => {
    vi.mocked(p.confirm).mockResolvedValue(false)
    vi.mocked(p.isCancel).mockReturnValue(false)

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await setConfigValue(tmpDir, 'reef.frontend.framework', 'angular', mockRegistry)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('setup --reconfigure'))
    logSpy.mockRestore()
  })

  it('rejects unknown config keys and returns early', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await setConfigValue(tmpDir, 'invalid.key', 'value', mockRegistry)
    // validateConfigKey returns false, so value is not written
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.deepstorm.reef.frontend.framework).toBe('react')
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('已更新'))
    logSpy.mockRestore()
  })

  it('recovers from corrupt settings.json', async () => {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      '{corrupt',
      'utf-8',
    )
    await setConfigValue(tmpDir, 'reef.frontend.framework', 'vue', mockRegistry)
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
    )
    expect(settings.deepstorm.reef.frontend.framework).toBe('vue')
  })
})
