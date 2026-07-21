import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  findChangeByName,
  findMostRecent,
  listChanges,
} from '../find-change-dir.mjs';

describe('find-change-dir — findChangeByName', () => {
  it('should find exact match', () => {
    const changes = [
      { name: 'add-auth', path: '/c/add-auth', mtimeMs: 100 },
      { name: 'fix-login', path: '/c/fix-login', mtimeMs: 200 },
    ];
    const result = findChangeByName(changes, 'add-auth');
    assert.equal(result.name, 'add-auth');
    assert.equal(result.path, '/c/add-auth');
  });

  it('should return null for no match', () => {
    const result = findChangeByName([], 'nothing');
    assert.equal(result, null);
  });

  it('should ignore archive entries', () => {
    const changes = [
      { name: 'add-auth', path: '/c/archive/add-auth', mtimeMs: 100 },
    ];
    const result = findChangeByName(changes, 'add-auth');
    assert.equal(result, null);
  });
});

describe('find-change-dir — findMostRecent', () => {
  it('should return most recent non-archive change', () => {
    const changes = [
      { name: 'old', path: '/c/old', mtimeMs: 100, archived: false },
      { name: 'recent', path: '/c/recent', mtimeMs: 300, archived: false },
      { name: 'middle', path: '/c/middle', mtimeMs: 200, archived: false },
    ];
    const result = findMostRecent(changes);
    assert.equal(result.name, 'recent');
  });

  it('should return null if all archived', () => {
    const changes = [
      { name: 'old', path: '/c/old', mtimeMs: 100, archived: true },
    ];
    const result = findMostRecent(changes);
    assert.equal(result, null);
  });

  it('should return null for empty list', () => {
    const result = findMostRecent([]);
    assert.equal(result, null);
  });
});

describe('find-change-dir — listChanges', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'fd-test-'));
    mkdirSync(join(tmpDir, 'changes', 'add-auth'), { recursive: true });
    mkdirSync(join(tmpDir, 'changes', 'fix-login'), { recursive: true });
    mkdirSync(join(tmpDir, 'changes', 'archive', 'old-stuff'), { recursive: true });
    writeFileSync(join(tmpDir, 'changes', 'add-auth', 'proposal.md'),
      '# Add Auth\n');
  });

  it('should find non-archive changes with files', () => {
    const changes = listChanges(join(tmpDir, 'changes'));
    const addAuth = changes.find(c => c.name === 'add-auth');
    assert.equal(addAuth.archived, false);
    assert.ok(addAuth.files.length > 0);

    const fixLogin = changes.find(c => c.name === 'fix-login');
    assert.equal(fixLogin.archived, false);

    const archived = changes.find(c => c.name === 'old-stuff');
    assert.equal(archived, undefined); // archive dir not included
  });
});
