import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  isArchived,
  parseTasksStatus,
  scanChanges,
} from '../check-openspec-status.mjs';

describe('check-openspec-status — isArchived', () => {
  it('should detect archived path', () => {
    assert.equal(isArchived(
      '/repo/openspec/changes/archive/add-auth'
    ), true);
  });

  it('should reject active path', () => {
    assert.equal(isArchived(
      '/repo/openspec/changes/add-auth'
    ), false);
  });

  it('should reject non-changes path', () => {
    assert.equal(isArchived('/repo/src/main.ts'), false);
  });
});

describe('check-openspec-status — parseTasksStatus', () => {
  it('should detect all tasks complete', () => {
    const content = [
      '## 1. Setup',
      '',
      '- [x] 1.1 Create dir',
      '- [x] 1.2 Add config',
      '## 2. Core',
      '',
      '- [x] 2.1 Implement',
    ].join('\n');
    const result = parseTasksStatus(content);
    assert.equal(result.total, 3);
    assert.equal(result.complete, 3);
    assert.equal(result.allDone, true);
  });

  it('should detect incomplete tasks', () => {
    const content = [
      '## 1. Setup',
      '',
      '- [x] 1.1 Create dir',
      '- [ ] 1.2 Add config',
    ].join('\n');
    const result = parseTasksStatus(content);
    assert.equal(result.total, 2);
    assert.equal(result.complete, 1);
    assert.equal(result.allDone, false);
  });

  it('should handle empty content', () => {
    const result = parseTasksStatus('');
    assert.equal(result.total, 0);
    assert.equal(result.complete, 0);
    assert.equal(result.allDone, true);
  });
});

describe('check-openspec-status — scanChanges', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'openspec-test-'));
    // 创建活跃 change
    const activeDir = join(tmpDir, 'changes', 'add-auth');
    mkdirSync(activeDir, { recursive: true });
    writeFileSync(join(activeDir, '.openspec.yaml'),
      'schema: spec-driven\ncreated: 2026-07-21\n');
    writeFileSync(join(activeDir, 'tasks.md'), [
      '- [x] 1.1 Done',
      '- [x] 1.2 Done',
    ].join('\n'));

    // 创建另一个活跃 change
    const activeDir2 = join(tmpDir, 'changes', 'fix-login');
    mkdirSync(activeDir2, { recursive: true });
    writeFileSync(join(activeDir2, '.openspec.yaml'),
      'schema: spec-driven\ncreated: 2026-07-20\n');

    // 创建归档 change
    const archiveDir = join(tmpDir, 'archive', 'old-feature');
    mkdirSync(archiveDir, { recursive: true });
  });

  it('should scan changes and detect status', () => {
    const parentDir = join(tmpDir, 'changes');
    const results = scanChanges(parentDir);

    assert.equal(results.length, 2);

    const addAuth = results.find(c => c.name === 'add-auth');
    assert.equal(addAuth.archived, false);
    assert.equal(addAuth.hasTasksMd, true);
    assert.equal(addAuth.tasksAllDone, true);

    const fixLogin = results.find(c => c.name === 'fix-login');
    assert.equal(fixLogin.archived, false);
    assert.equal(fixLogin.hasTasksMd, false);
    assert.equal(fixLogin.tasksAllDone, null);
  });
});
