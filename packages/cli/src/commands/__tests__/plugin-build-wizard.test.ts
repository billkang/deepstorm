import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as p from '@clack/prompts'

// 模拟 @clack/prompts
vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  note: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
}))

vi.mock('node:process', () => ({
  exit: vi.fn(),
}))

import { promptMarketplaceName } from '../plugin-build-wizard'

describe('promptMarketplaceName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the marketplace name entered by user', async () => {
    vi.mocked(p.text).mockResolvedValue('example-orgg')

    const name = await promptMarketplaceName()

    expect(name).toBe('example-orgg')
    expect(p.text).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('市场名'),
      }),
    )
  })

  it('validates that name is not empty', async () => {
    vi.mocked(p.text).mockResolvedValue('')

    const name = await promptMarketplaceName()

    // Should retry or reject empty input
    expect(p.text).toHaveBeenCalled()
  })

  it('validates kebab-case format and gives suggestion', async () => {
    // Get the validate function passed to text()
    vi.mocked(p.text).mockImplementation(async (opts: any) => {
      // Test the validate function with various inputs
      const validate = opts.validate
      if (validate) {
        expect(validate('')).toBeTruthy() // empty should fail
        expect(validate('a')).toBeFalsy()   // single char ok
        expect(validate('my-name')).toBeFalsy() // kebab-case ok
        expect(validate('My Name')).toBeTruthy() // spaces should fail
        expect(validate('my_name')).toBeTruthy() // underscores should fail or be warned
      }
      return 'example-orgg'
    })

    await promptMarketplaceName()
  })
})
