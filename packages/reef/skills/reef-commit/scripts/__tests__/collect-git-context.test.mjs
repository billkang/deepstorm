import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { collectContext, parseDiffStat, parseCommitLog, extractJiraRef } from '../collect-git-context.mjs';

describe('collect-git-context — parseDiffStat', () => {
  it('should parse git diff --stat output', () => {
    const lines = [
      ' src/main.ts | 10 ++++++++--',
      ' src/utils.ts |  5 +++++',
      ' 2 files changed, 13 insertions(+), 2 deletions(-)',
    ].join('\n');
    const result = parseDiffStat(lines);
    assert.equal(result.files, 2);
    assert.equal(result.insertions, 13);
    assert.equal(result.deletions, 2);
    assert.deepEqual(result.changedFiles, ['src/main.ts', 'src/utils.ts']);
  });

  it('should handle empty stat output', () => {
    const result = parseDiffStat('');
    assert.equal(result.files, 0);
    assert.equal(result.insertions, 0);
    assert.equal(result.deletions, 0);
    assert.deepEqual(result.changedFiles, []);
  });

  it('should handle single file changes', () => {
    const lines = [
      ' src/main.ts | 1 +',
      ' 1 file changed, 1 insertion(+)',
    ].join('\n');
    const result = parseDiffStat(lines);
    assert.equal(result.files, 1);
    assert.equal(result.insertions, 1);
    assert.equal(result.deletions, 0);
  });
});

describe('collect-git-context — extractJiraRef', () => {
  it('should extract JIRA ref from branch name', () => {
    assert.equal(extractJiraRef('feat/LC-1234-add-auth'), 'LC-1234');
    assert.equal(extractJiraRef('PROJ-456-fix-bug'), 'PROJ-456');
  });

  it('should return null when no JIRA ref found', () => {
    assert.equal(extractJiraRef('main'), null);
    assert.equal(extractJiraRef('feat/add-auth'), null);
  });

  it('should extract JIRA ref from commit messages', () => {
    const commits = [
      { hash: 'abc', message: 'fix: resolve login timeout' },
      { hash: 'def', message: 'PROJ-789 implement auth flow' },
    ];
    assert.equal(extractJiraRef('feature/login', commits), 'PROJ-789');
  });

  it('should prefer branch ref over commit ref', () => {
    const commits = [
      { hash: 'abc', message: 'DEPT-111 some work' },
    ];
    assert.equal(extractJiraRef('LC-999-feature', commits), 'LC-999');
  });

  it('should return null for empty commit list', () => {
    assert.equal(extractJiraRef('feature/x', []), null);
  });

  it('should return first JIRA ref from branch name', () => {
    assert.equal(extractJiraRef('LC-111/PROJ-222'), 'LC-111');
  });
});
describe('collect-git-context — parseCommitLog', () => {
  it('should parse git log --oneline output', () => {
    const lines = [
      'abc1234 feat: add user auth',
      'def5678 fix: login timeout',
    ].join('\n');
    const result = parseCommitLog(lines);
    assert.equal(result.length, 2);
    assert.equal(result[0].hash, 'abc1234');
    assert.equal(result[0].message, 'feat: add user auth');
    assert.equal(result[1].hash, 'def5678');
    assert.equal(result[1].message, 'fix: login timeout');
  });

  it('should handle empty log', () => {
    const result = parseCommitLog('');
    assert.deepEqual(result, []);
  });

  it('should handle single commit', () => {
    const result = parseCommitLog('abc1234 chore: init');
    assert.equal(result.length, 1);
    assert.equal(result[0].hash, 'abc1234');
  });
});
