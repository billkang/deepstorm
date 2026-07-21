import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkUncommitted,
  buildPrBody,
  buildGhCreateArgs,
} from '../create-pr.mjs';

describe('create-pr — checkUncommitted', () => {
  it('should detect uncommitted changes', () => {
    const result = checkUncommitted(' M src/main.ts\n');
    assert.equal(result, true);
  });

  it('should return false for clean state', () => {
    const result = checkUncommitted('');
    assert.equal(result, false);
  });
});

describe('create-pr — buildPrBody', () => {
  it('should build body with proposal content', () => {
    const ctx = {
      branch: 'feat/add-auth',
      diffStat: {
        files: 3, insertions: 20, deletions: 5,
        changedFiles: ['src/auth.ts', 'src/login.ts'],
      },
      commitLog: [
        { hash: 'abc123', message: 'add auth module' },
      ],
      proposalTitle: '用户认证功能',
    };
    const body = buildPrBody(ctx);
    assert.match(body, /用户认证功能/);
    assert.match(body, /feat\/add-auth/);
    assert.match(body, /3 文件/);
  });

  it('should build body without proposal', () => {
    const ctx = {
      branch: 'fix/login-bug',
      diffStat: {
        files: 1, insertions: 2, deletions: 1,
        changedFiles: ['src/login.ts'],
      },
      commitLog: [
        { hash: 'def456', message: 'fix login timeout' },
      ],
    };
    const body = buildPrBody(ctx);
    assert.match(body, /fix login timeout/);
    assert.match(body, /fix\/login-bug/);
  });
});

describe('create-pr — buildGhCreateArgs', () => {
  it('should build basic gh pr create command', () => {
    const args = buildGhCreateArgs({
      title: 'Add user auth',
      body: '## Summary\nAdd auth',
      branch: 'feat/add-auth',
    });
    assert.match(args, /gh pr create/);
    assert.match(args, /--title "Add user auth"/);
    assert.match(args, /--body "/);
  });

  it('should include optional flags', () => {
    const args = buildGhCreateArgs({
      title: 'Fix bug',
      body: 'Fixed',
      branch: 'fix/bug',
      reviewer: 'alice',
      label: 'bug',
      draft: true,
    });
    assert.match(args, /--reviewer alice/);
    assert.match(args, /--label bug/);
    assert.match(args, /--draft/);
  });
});
