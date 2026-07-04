import { describe, it, expect } from 'vitest'
import { deepMerge } from '../json'

describe('deepMerge', () => {
  it('merges simple flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('overwrites primitive values from source', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3 })
    expect(result).toEqual({ a: 1, b: 3 })
  })

  it('merges nested objects recursively', () => {
    const result = deepMerge(
      { outer: { inner: 'a', other: 'x' } },
      { outer: { inner: 'b' } },
    )
    expect(result).toEqual({ outer: { inner: 'b', other: 'x' } })
  })

  it('replaces arrays instead of merging', () => {
    const result = deepMerge(
      { items: [1, 2, 3] },
      { items: [4, 5] },
    )
    expect(result).toEqual({ items: [4, 5] })
  })

  it('adds new keys from source', () => {
    const result = deepMerge({ a: 1 }, { b: 2, c: 3 })
    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('handles empty target', () => {
    const result = deepMerge({}, { a: 1, b: { c: 2 } })
    expect(result).toEqual({ a: 1, b: { c: 2 } })
  })

  it('handles empty source', () => {
    const result = deepMerge({ a: 1 }, {})
    expect(result).toEqual({ a: 1 })
  })

  it('does not mutate the original objects', () => {
    const target = { a: { b: 1 } }
    const source = { a: { c: 2 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { b: 1, c: 2 } })
    expect(target).toEqual({ a: { b: 1 } })
    expect(source).toEqual({ a: { c: 2 } })
  })

  it('overwrites null values', () => {
    const result = deepMerge({ a: null }, { a: 'value' })
    expect(result).toEqual({ a: 'value' })
  })

  it('merges deeply nested structures', () => {
    const target = { level1: { level2: { a: 1, b: 2 } } }
    const source = { level1: { level2: { c: 3 } } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ level1: { level2: { a: 1, b: 2, c: 3 } } })
  })
})
