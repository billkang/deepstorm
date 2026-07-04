import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { installSkills } from '../installer'
import { ensureDir, writeTextFile, readTextFile } from '../../utils/fs'

describe('installSkills', () => {
  let tmpDir: string
  let sourceSkillsDir: string
  let targetSkillsDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-installer-'))
    sourceSkillsDir = path.join(tmpDir, 'source', 'skills')
    targetSkillsDir = path.join(tmpDir, 'target', 'skills')

    // Create source skills
    ensureDir(path.join(sourceSkillsDir, 'reef-react-lint'))
    writeTextFile(
      path.join(sourceSkillsDir, 'reef-react-lint', 'SKILL.md'),
      '---\nname: reef-react-lint\n---\n# React Lint',
    )

    ensureDir(path.join(sourceSkillsDir, 'deepstorm-jira-parser'))
    writeTextFile(
      path.join(sourceSkillsDir, 'deepstorm-jira-parser', 'SKILL.md'),
      '---\nname: deepstorm-jira-parser\n---\n# Jira Parser',
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('copies skill directories from source to target', () => {
    const result = installSkills(
      ['reef-react-lint', 'deepstorm-jira-parser'],
      sourceSkillsDir,
      targetSkillsDir,
    )

    expect(result).toEqual(['reef-react-lint', 'deepstorm-jira-parser'])

    // Verify files were copied
    expect(readTextFile(path.join(targetSkillsDir, 'reef-react-lint', 'SKILL.md'))).toContain('reef-react-lint')
    expect(readTextFile(path.join(targetSkillsDir, 'deepstorm-jira-parser', 'SKILL.md'))).toContain('deepstorm-jira-parser')
  })

  it('creates target directory if it does not exist', () => {
    const nonExistent = path.join(tmpDir, 'new-target')
    installSkills(['reef-react-lint'], sourceSkillsDir, nonExistent)

    expect(fs.existsSync(path.join(nonExistent, 'reef-react-lint'))).toBe(true)
  })

  it('returns empty array for empty skill list', () => {
    const result = installSkills([], sourceSkillsDir, targetSkillsDir)
    expect(result).toEqual([])
    expect(fs.existsSync(targetSkillsDir)).toBe(false)
  })

  it('throws for non-existent source skill', () => {
    expect(() => {
      installSkills(['nonexistent-skill'], sourceSkillsDir, targetSkillsDir)
    }).toThrow('nonexistent-skill')
  })
})
