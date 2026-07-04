import { describe, it, expect } from 'vitest'
import { loadValidConfigKeys, validateConfigKey } from '../config-schema'

describe('loadValidConfigKeys', () => {
  it('returns known config keys from schema', () => {
    const keys = loadValidConfigKeys()
    expect(keys.size).toBeGreaterThan(0)
    expect(keys.has('reef.frontend.framework')).toBe(true)
    expect(keys.has('reef.backend.language')).toBe(true)
    expect(keys.has('sweep.ciProvider')).toBe(true)
    expect(keys.has('atoll.deployTarget')).toBe(true)
    expect(keys.has('mcp.installedMcpServers')).toBe(true)
  })
})

describe('validateConfigKey', () => {
  it('returns true for valid keys', () => {
    expect(validateConfigKey('reef.frontend.framework')).toBe(true)
  })

  it('returns false for invalid keys', () => {
    expect(validateConfigKey('invalid.key')).toBe(false)
    expect(validateConfigKey('reef.unknown')).toBe(false)
  })
})
