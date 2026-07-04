import { describe, it, expect } from 'vitest'
import { parseNonInteractiveArgs } from '../non-interactive'

describe('parseNonInteractiveArgs', () => {
  it('parses tools and set values', () => {
    const result = parseNonInteractiveArgs('reef,tide', [
      'reef.frontend.framework=react',
      'tide.issueTracker=jira',
    ])
    expect(result.tools).toEqual(['reef', 'tide'])
    expect(result.config).toEqual({
      'reef.frontend.framework': 'react',
      'tide.issueTracker': 'jira',
    })
  })

  it('handles undefined tools', () => {
    const result = parseNonInteractiveArgs(undefined, [])
    expect(result.tools).toEqual([])
    expect(result.config).toEqual({})
  })

  it('handles empty set values', () => {
    const result = parseNonInteractiveArgs('reef', undefined)
    expect(result.tools).toEqual(['reef'])
    expect(result.config).toEqual({})
  })

  it('ignores malformed set values', () => {
    const result = parseNonInteractiveArgs('reef', [
      'valid=ok',
      'novalue',
      '=emptykey',
      '',
    ])
    expect(result.config).toEqual({ valid: 'ok' })
  })

  it('trims whitespace from tools', () => {
    const result = parseNonInteractiveArgs(' reef , tide ', [])
    expect(result.tools).toEqual(['reef', 'tide'])
  })
})
