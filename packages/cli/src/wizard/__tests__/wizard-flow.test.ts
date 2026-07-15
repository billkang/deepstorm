import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import type { RegistryReader } from '../../engine/registry'
import type { Registry } from '../../types/registry'

// Mock the interactive wizard modules
vi.mock('../tool-select', () => ({
  selectTools: vi.fn(),
}))
vi.mock('../mcp-select', () => ({
  selectMcpTools: vi.fn(),
}))
vi.mock('../questionnaire', () => ({
  runQuestionnaire: vi.fn(),
}))
vi.mock('../../template/registry', () => ({
  buildTemplateVariables: vi.fn(),
}))

const { selectTools } = await import('../tool-select')
const { selectMcpTools } = await import('../mcp-select')
const { runQuestionnaire } = await import('../questionnaire')
const { buildTemplateVariables } = await import('../../template/registry')
const { runWizardFlow, loadExistingConfigKeys, getInstalledMcpServices, getInstalledTools } = await import('../wizard-flow')

describe('runWizardFlow', () => {
  const mockReader = {} as RegistryReader
  const mockRegistry = { version: '1', tools: {}, wizards: {}, skills: {} } as Registry

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns wizard results after running all steps', async () => {
    vi.mocked(selectTools).mockResolvedValue(['reef', 'tide'])
    vi.mocked(selectMcpTools).mockResolvedValue(['github'])
    vi.mocked(runQuestionnaire).mockResolvedValue({ language: 'TypeScript' })
    vi.mocked(buildTemplateVariables).mockReturnValue({ language: 'TypeScript', has_github: 'true' })

    const result = await runWizardFlow(mockReader, mockRegistry)

    expect(result.tools).toEqual(['reef', 'tide'])
    expect(result.selectedMcpTools).toEqual(['github'])
    expect(result.config).toEqual({ language: 'TypeScript' })
    expect(result.templateVariables).toEqual({ language: 'TypeScript', has_github: 'true' })
  })

  it('passes selected tools to selectMcpTools for filtering', async () => {
    vi.mocked(selectTools).mockResolvedValue(['reef'])
    vi.mocked(selectMcpTools).mockResolvedValue([])
    vi.mocked(runQuestionnaire).mockResolvedValue({})
    vi.mocked(buildTemplateVariables).mockReturnValue({})

    await runWizardFlow(mockReader, mockRegistry)

    expect(selectMcpTools).toHaveBeenCalledWith(mockReader, ['reef'], [], [])
  })

  it('passes initialMcpValues when provided', async () => {
    vi.mocked(selectTools).mockResolvedValue(['reef'])
    vi.mocked(selectMcpTools).mockResolvedValue(['github'])
    vi.mocked(runQuestionnaire).mockResolvedValue({})
    vi.mocked(buildTemplateVariables).mockReturnValue({})

    await runWizardFlow(mockReader, mockRegistry, ['context7'])

    expect(selectMcpTools).toHaveBeenCalledWith(mockReader, ['reef'], ['context7'], [])
  })

  it('passes config and selectedMcpTools to buildTemplateVariables', async () => {
    vi.mocked(selectTools).mockResolvedValue(['reef'])
    vi.mocked(selectMcpTools).mockResolvedValue(['jira'])
    vi.mocked(runQuestionnaire).mockResolvedValue({ framework: 'Next.js' })
    vi.mocked(buildTemplateVariables).mockReturnValue({})

    await runWizardFlow(mockReader, mockRegistry)

    expect(buildTemplateVariables).toHaveBeenCalledWith(mockRegistry, { framework: 'Next.js' }, ['jira'])
  })

  it('exits when no tools are selected', async () => {
    vi.mocked(selectTools).mockResolvedValue([])
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    // The function should call process.exit, so wrapping in try/catch or testing the side effect
    // Since process.exit throws with mockImplementation returning undefined, let's just check it was called
    try {
      await runWizardFlow(mockReader, mockRegistry)
    } catch {
      // process.exit might throw depending on how it's mocked
    }

    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })
})

describe('loadExistingConfigKeys', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-wf-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeConfig(data: Record<string, unknown>): void {
    const settingsDir = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(settingsDir, { recursive: true })
    fs.writeFileSync(path.join(settingsDir, 'settings.json'), JSON.stringify(data), 'utf-8')
  }

  it('解析完整的 reef 配置返回对应 key 集合', () => {
    writeConfig({
      reef: {
        techs: 'frontend,backend',
        frontend: { framework: 'angular', uiLibrary: 'primeng', css: 'tailwind' },
        backend: { language: 'java', java: { orm: 'hibernate' } },
      },
    })
    const keys = loadExistingConfigKeys(tmpDir)
    expect(keys.has('reef.techs')).toBe(true)
    expect(keys.has('reef.frontend.framework')).toBe(true)
    expect(keys.has('reef.frontend.uiLibrary')).toBe(true)
    expect(keys.has('reef.frontend.css')).toBe(true)
    expect(keys.has('reef.backend.language')).toBe(true)
    expect(keys.has('reef.backend.java.orm')).toBe(true)
  })

  it('值为 none 的 key 不应加入集合', () => {
    writeConfig({
      reef: {
        techs: 'frontend',
        frontend: { framework: 'angular', uiLibrary: 'none', test: 'none' },
      },
    })
    const keys = loadExistingConfigKeys(tmpDir)
    expect(keys.has('reef.techs')).toBe(true)
    expect(keys.has('reef.frontend.framework')).toBe(true)
    expect(keys.has('reef.frontend.uiLibrary')).toBe(false)
    expect(keys.has('reef.frontend.test')).toBe(false)
  })

  it('无 settings.json 时返回空集合', () => {
    const keys = loadExistingConfigKeys(tmpDir)
    expect(keys.size).toBe(0)
  })

  it('配置为空时返回空集合', () => {
    writeConfig({})
    const keys = loadExistingConfigKeys(tmpDir)
    expect(keys.size).toBe(0)
  })
})

describe('getInstalledMcpServices', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-imcp-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeSettings(data: Record<string, unknown>): void {
    const dir = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(data), 'utf-8')
  }

  it('读取已安装的 MCP 服务列表', () => {
    writeSettings({ installedMcpServers: ['github', 'jira'] })
    expect(getInstalledMcpServices(tmpDir)).toEqual(['github', 'jira'])
  })

  it('无 settings.json 时返回空数组', () => {
    expect(getInstalledMcpServices(tmpDir)).toEqual([])
  })

  it('installedMcpServers 不存在时返回空数组', () => {
    writeSettings({ other: {} })
    expect(getInstalledMcpServices(tmpDir)).toEqual([])
  })

  it('installedMcpServers 不是数组时返回空数组', () => {
    writeSettings({ installedMcpServers: 'github' })
    expect(getInstalledMcpServices(tmpDir)).toEqual([])
  })
})

describe('getInstalledTools', () => {
  let tmpDir: string

  const mockRegistry = {
    version: '1',
    tools: {},
    wizards: {},
    skills: {
      'reef-react-lint': { tool: 'reef' },
      'reef-jira-link': { tool: 'reef' },
      'tide-bmad': { tool: 'tide' },
      'without-tool': {},
    },
  } as any

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-itools-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeSettings(data: Record<string, unknown>): void {
    const dir = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(data), 'utf-8')
  }

  it('从 installedSkills 反向推导已安装工具', () => {
    writeSettings({ installedSkills: ['reef-react-lint', 'reef-jira-link'] })
    const tools = getInstalledTools(tmpDir, mockRegistry)
    expect(tools).toEqual(['reef'])
  })

  it('处理多个工具的 skill', () => {
    writeSettings({ installedSkills: ['reef-react-lint', 'tide-bmad'] })
    const tools = getInstalledTools(tmpDir, mockRegistry)
    expect(tools.sort()).toEqual(['reef', 'tide'])
  })

  it('无 installedSkills 时返回空数组', () => {
    writeSettings({})
    expect(getInstalledTools(tmpDir, mockRegistry)).toEqual([])
  })

  it('无 settings.json 时返回空数组', () => {
    expect(getInstalledTools(tmpDir, mockRegistry)).toEqual([])
  })
})
