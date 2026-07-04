import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { ensureDir, copyDir, readTextFile, writeTextFile, removeDirContents } from '../fs'

describe('fs utilities', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-fs-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('ensureDir', () => {
    it('creates a directory that does not exist', () => {
      const dir = path.join(tmpDir, 'a', 'b', 'c')

      expect(fs.existsSync(dir)).toBe(false)
      ensureDir(dir)
      expect(fs.existsSync(dir)).toBe(true)
      expect(fs.statSync(dir).isDirectory()).toBe(true)
    })

    it('does not throw if directory already exists', () => {
      ensureDir(tmpDir)
      expect(() => ensureDir(tmpDir)).not.toThrow()
    })
  })

  describe('writeTextFile / readTextFile', () => {
    it('writes and reads a text file', () => {
      const file = path.join(tmpDir, 'hello.txt')
      writeTextFile(file, 'Hello, World!')
      expect(readTextFile(file)).toBe('Hello, World!')
    })

    it('creates parent directories automatically', () => {
      const file = path.join(tmpDir, 'nested', 'deep', 'test.txt')
      writeTextFile(file, 'nested content')
      expect(readTextFile(file)).toBe('nested content')
    })
  })

  describe('copyDir', () => {
    it('copies a directory recursively', () => {
      const src = path.join(tmpDir, 'src')
      const dest = path.join(tmpDir, 'dest')

      ensureDir(path.join(src, 'sub'))
      writeTextFile(path.join(src, 'a.txt'), 'file a')
      writeTextFile(path.join(src, 'sub', 'b.txt'), 'file b')

      copyDir(src, dest)

      expect(readTextFile(path.join(dest, 'a.txt'))).toBe('file a')
      expect(readTextFile(path.join(dest, 'sub', 'b.txt'))).toBe('file b')
    })

    it('overwrites existing destination', () => {
      const src = path.join(tmpDir, 'src')
      const dest = path.join(tmpDir, 'dest')

      ensureDir(src)
      writeTextFile(path.join(src, 'hello.txt'), 'new version')
      ensureDir(dest)
      writeTextFile(path.join(dest, 'hello.txt'), 'old version')

      copyDir(src, dest)

      expect(readTextFile(path.join(dest, 'hello.txt'))).toBe('new version')
    })
  })

  describe('removeDirContents', () => {
    it('删除目录中所有文件', () => {
      const dir = path.join(tmpDir, 'target')
      ensureDir(dir)
      writeTextFile(path.join(dir, 'a.txt'), 'file a')
      writeTextFile(path.join(dir, 'b.txt'), 'file b')
      fs.mkdirSync(path.join(dir, 'sub'), { recursive: true })

      removeDirContents(dir)

      expect(fs.existsSync(path.join(dir, 'a.txt'))).toBe(false)
      expect(fs.existsSync(path.join(dir, 'b.txt'))).toBe(false)
      expect(fs.existsSync(path.join(dir, 'sub'))).toBe(false)
      // 目录本身应保留
      expect(fs.existsSync(dir)).toBe(true)
    })

    it('删除嵌套子目录', () => {
      const dir = path.join(tmpDir, 'deep')
      ensureDir(path.join(dir, 'a', 'b', 'c'))
      writeTextFile(path.join(dir, 'a', 'b', 'file.txt'), 'nested')

      removeDirContents(dir)

      expect(fs.existsSync(path.join(dir, 'a'))).toBe(false)
      expect(fs.existsSync(dir)).toBe(true)
    })

    it('跳过 .DS_Store', () => {
      const dir = path.join(tmpDir, 'dsstore')
      ensureDir(dir)
      writeTextFile(path.join(dir, 'real-file.txt'), 'keep me')
      writeTextFile(path.join(dir, '.DS_Store'), 'fake')

      removeDirContents(dir)

      // real-file.txt 应被删除
      expect(fs.existsSync(path.join(dir, 'real-file.txt'))).toBe(false)
      // .DS_Store 应被保留（跳过）
      expect(fs.existsSync(path.join(dir, '.DS_Store'))).toBe(true)
    })

    it('空目录不应报错', () => {
      const dir = path.join(tmpDir, 'empty')
      ensureDir(dir)

      expect(() => removeDirContents(dir)).not.toThrow()
    })
  })
})
