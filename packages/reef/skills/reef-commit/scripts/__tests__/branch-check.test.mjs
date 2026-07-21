import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { checkBranch, TEMP_PATTERN, isMainOrMaster } from '../branch-check.mjs';

describe('branch-check — isMainOrMaster', () => {
  it('should detect main branch', () => {
    assert.equal(isMainOrMaster('main'), true);
  });
  it('should detect master branch', () => {
    assert.equal(isMainOrMaster('master'), true);
  });
  it('should reject regular branches', () => {
    assert.equal(isMainOrMaster('feat/add-user-auth'), false);
    assert.equal(isMainOrMaster('fix/login-bug'), false);
    assert.equal(isMainOrMaster('chore/update-deps'), false);
  });
});

describe('branch-check — TEMP_PATTERN', () => {
  it('should match temp/xxx', () => {
    assert.equal(TEMP_PATTERN.test('temp/foo'), true);
  });
  it('should match wip/xxx', () => {
    assert.equal(TEMP_PATTERN.test('wip/add-feature'), true);
  });
  it('should match test/xxx', () => {
    assert.equal(TEMP_PATTERN.test('test/experiment'), true);
  });
  it('should not match regular branches', () => {
    assert.equal(TEMP_PATTERN.test('feat/add-user-auth'), false);
    assert.equal(TEMP_PATTERN.test('fix/login-bug'), false);
  });
});

describe('branch-check — checkBranch', () => {
  it('should block main branch', () => {
    const result = checkBranch('main', []);
    assert.equal(result.isValid, false);
    assert.equal(result.action, 'create-branch');
    assert.equal(result.reason.includes('main'), true);
  });

  it('should block master branch', () => {
    const result = checkBranch('master', []);
    assert.equal(result.isValid, false);
    assert.equal(result.action, 'create-branch');
  });

  it('should warn on temp branch', () => {
    const result = checkBranch('temp/test-foo', []);
    assert.equal(result.isValid, true);
    assert.equal(result.warning, true);
    assert.equal(result.action, 'suggest-rename');
  });

  it('should accept regular feature branch', () => {
    const result = checkBranch('feat/add-user-auth', []);
    assert.equal(result.isValid, true);
    assert.equal(result.warning, false);
  });

  it('should match OpenSpec tasks when possible', () => {
    const tasks = [
      { name: 'add-user-auth', hasProposal: true },
      { name: 'fix-login', hasProposal: false },
    ];
    const result = checkBranch('add-user-auth', tasks);
    assert.equal(result.isValid, true);
    assert.equal(result.matchedTask, 'add-user-auth');
  });
});
