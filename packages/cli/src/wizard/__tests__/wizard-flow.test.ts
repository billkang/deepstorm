import { describe, it, expect, vi, beforeEach } from 'vitest'
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
const { runWizardFlow } = await import('../wizard-flow')

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

    expect(selectMcpTools).toHaveBeenCalledWith(mockReader, ['reef'], [])
  })

  it('passes initialMcpValues when provided', async () => {
    vi.mocked(selectTools).mockResolvedValue(['reef'])
    vi.mocked(selectMcpTools).mockResolvedValue(['github'])
    vi.mocked(runQuestionnaire).mockResolvedValue({})
    vi.mocked(buildTemplateVariables).mockReturnValue({})

    await runWizardFlow(mockReader, mockRegistry, ['context7'])

    expect(selectMcpTools).toHaveBeenCalledWith(mockReader, ['reef'], ['context7'])
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
