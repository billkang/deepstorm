import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { appendEnvVars } from '../env'

describe('appendEnvVars', () => {
  let tmpDir: string
  let envPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-env-'))
    envPath = path.join(tmpDir, '.env')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates .env and writes variables with comments', () => {
    appendEnvVars(envPath, [
      { key: 'DEEPSTORM_JIRA_TOKEN', comment: 'Jira API Token' },
    ])

    expect(fs.existsSync(envPath)).toBe(true)
    const content = fs.readFileSync(envPath, 'utf-8')
    expect(content).toContain('# Jira API Token')
    expect(content).toContain('DEEPSTORM_JIRA_TOKEN=')
  })

  it('appends to existing .env', () => {
    fs.writeFileSync(envPath, 'EXISTING_VAR=value\n', 'utf-8')

    appendEnvVars(envPath, [
      { key: 'DEEPSTORM_JIRA_TOKEN', comment: 'Jira Token' },
    ])

    const content = fs.readFileSync(envPath, 'utf-8')
    expect(content).toContain('EXISTING_VAR=value')
    expect(content).toContain('DEEPSTORM_JIRA_TOKEN=')
  })

  it('does not overwrite existing variables', () => {
    fs.writeFileSync(envPath, 'DEEPSTORM_JIRA_TOKEN=existing_value\n', 'utf-8')

    appendEnvVars(envPath, [
      { key: 'DEEPSTORM_JIRA_TOKEN', comment: 'Jira Token' },
    ])

    const content = fs.readFileSync(envPath, 'utf-8')
    expect(content).toContain('DEEPSTORM_JIRA_TOKEN=existing_value')
    // 不应追加空值的新条目
    const lines = content.split('\n').filter(l => l.startsWith('DEEPSTORM_JIRA_TOKEN='))
    expect(lines).toHaveLength(1)
  })

  it('writes multiple variables with a header', () => {
    appendEnvVars(envPath, [
      { key: 'VAR_A', comment: 'Variable A' },
      { key: 'VAR_B', comment: 'Variable B' },
    ])

    const content = fs.readFileSync(envPath, 'utf-8')
    expect(content).toContain('# DeepStorm')
    expect(content).toMatch(/VAR_A.*\n.*VAR_B/s)
  })
})
