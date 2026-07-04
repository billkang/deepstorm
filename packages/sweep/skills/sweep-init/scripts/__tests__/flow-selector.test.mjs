import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  parseTopology,
  parseFlows,
  resolveFlowFile,
  scanFlowFiles,
  buildChoicesWithFlows,
  normalizeSelection,
  writeSelection,
} from '../flow-selector.mjs';

// ── parseTopology ───────────────────────────────────────────

describe('parseTopology', () => {
  it('should parse a simple flat topology', () => {
    const yaml = `- name: login
- name: register
`;
    const result = parseTopology(yaml);
    assert.deepEqual(result, [
      { name: 'login', children: [] },
      { name: 'register', children: [] },
    ]);
  });

  it('should parse nested topology', () => {
    const yaml = `- name: user-system
  - name: login
  - name: register
- name: payment
  - name: checkout
`;
    const result = parseTopology(yaml);
    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'user-system');
    assert.equal(result[0].children.length, 2);
    assert.equal(result[0].children[0].name, 'login');
    assert.equal(result[1].name, 'payment');
    assert.equal(result[1].children.length, 1);
  });

  it('should return empty array for empty yaml', () => {
    assert.deepEqual(parseTopology(''), []);
  });

  it('should skip comments', () => {
    const yaml = `# 用户系统
- name: login
# - name: register (commented out)
- name: register
`;
    const result = parseTopology(yaml);
    assert.equal(result.length, 2);
  });

  it('should deduplicate same-named children', () => {
    const yaml = `- name: user-system
  - name: login
  - name: login
`;
    const result = parseTopology(yaml);
    assert.equal(result[0].children.length, 1);
  });
});

// ── parseFlows ──────────────────────────────────────────────

describe('parseFlows', () => {
  it('should extract flows from .flow.md content', () => {
    const content = `## Flow: L01 - 正常登录

### 执行步骤
1. 打开登录页面

---

## Flow: L02 - 错误密码

### 执行步骤
1. 输入错误密码
`;
    const result = parseFlows(content);
    assert.deepEqual(result, [
      { id: 'L01', title: '正常登录' },
      { id: 'L02', title: '错误密码' },
    ]);
  });

  it('should return empty array for content without flows', () => {
    assert.deepEqual(parseFlows('# 只有标题'), []);
  });

  it('should handle flow IDs with hyphens and numbers', () => {
    const content = `## Flow: TC-001 - Data export with special chars
## Flow: F02 - Another flow
`;
    const result = parseFlows(content);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'TC-001');
    assert.equal(result[1].id, 'F02');
  });
});

// ── resolveFlowFile ─────────────────────────────────────────

describe('resolveFlowFile', () => {
  it('should find direct .flow.md file', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    writeFileSync(join(tmp, 'login.flow.md'), '# login', 'utf-8');

    const result = resolveFlowFile('login', tmp);
    assert.equal(result, join(tmp, 'login.flow.md'));
  });

  it('should return null when file not found', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    assert.equal(resolveFlowFile('nonexistent', tmp), null);
  });

  it('should find file by leaf name match in parent directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    // For 'user-system/login', parentDir is {tmp}/user-system/
    const parent = join(tmp, 'user-system');
    mkdirSync(parent, { recursive: true });
    writeFileSync(join(parent, 'login.flow.md'), '# login', 'utf-8');

    const result = resolveFlowFile('user-system/login', tmp);
    assert.ok(result);
    assert.ok(result.endsWith('login.flow.md'));
  });

  it('should find file in subdirectory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const sub = join(tmp, 'user-system');
    mkdirSync(sub, { recursive: true });
    writeFileSync(join(sub, 'login.flow.md'), '# login', 'utf-8');

    const result = resolveFlowFile('user-system', tmp);
    assert.equal(result, join(sub, 'login.flow.md'));
  });
});

// ── scanFlowFiles ───────────────────────────────────────────

describe('scanFlowFiles', () => {
  it('should find all .flow.md files recursively', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    writeFileSync(join(tmp, 'login.flow.md'), '', 'utf-8');
    mkdirSync(join(tmp, 'tasks'));
    writeFileSync(join(tmp, 'tasks', 'task-crud.flow.md'), '', 'utf-8');

    const result = scanFlowFiles(tmp);
    assert.equal(result.length, 2);
    assert.ok(result.some((p) => p.endsWith('login.flow.md')));
    assert.ok(result.some((p) => p.endsWith('task-crud.flow.md')));
  });

  it('should skip hidden directories', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    writeFileSync(join(tmp, 'login.flow.md'), '', 'utf-8');
    mkdirSync(join(tmp, '.hidden'));
    writeFileSync(join(tmp, '.hidden', 'secret.flow.md'), '', 'utf-8');

    const result = scanFlowFiles(tmp);
    assert.equal(result.length, 1);
  });

  it('should return empty array for empty directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    assert.deepEqual(scanFlowFiles(tmp), []);
  });
});

// ── buildChoicesWithFlows ──────────────────────────────────

describe('buildChoicesWithFlows', () => {
  it('should build choice tree from topology modules', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    writeFileSync(join(tmp, 'login.flow.md'), '## Flow: L01 - 正常登录\n## Flow: L02 - 错误密码\n', 'utf-8');

    const modules = [{ name: 'login', children: [] }];
    const choices = buildChoicesWithFlows(modules, '', tmp);

    // File-level choice
    const fileChoice = choices.find((c) => c.value === `__file:${join(tmp, 'login.flow.md')}`);
    assert.ok(fileChoice);
    assert.ok(fileChoice.name.includes('login'));
    assert.equal(fileChoice.description, '2 个用例');

    // Flow-level choices
    const flowChoices = choices.filter((c) => c.value.includes('"flowId"'));
    assert.equal(flowChoices.length, 2);
    assert.ok(flowChoices[0].name.includes('L01'));
    assert.ok(flowChoices[1].name.includes('L02'));
  });

  it('should mark modules without .flow.md', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const modules = [{ name: 'no-file', children: [] }];
    const choices = buildChoicesWithFlows(modules, '', tmp);

    const missing = choices.find((c) => c.value === '__module:no-file');
    assert.ok(missing);
    assert.equal(missing.description, '未找到对应 .flow.md 文件');
  });
});

// ── normalizeSelection ──────────────────────────────────────

describe('normalizeSelection', () => {
  it('should normalize __all__ selection', () => {
    const result = normalizeSelection(['__all__']);
    assert.deepEqual(result, { type: 'all' });
  });

  it('should normalize single file selection', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmp, 'login.flow.md');
    writeFileSync(flowPath, '## Flow: L01 - 正常登录\n', 'utf-8');

    const result = normalizeSelection([`__file:${flowPath}`]);
    assert.equal(result.type, 'selection');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].file, flowPath);
    assert.equal(result.files[0].all, true);
  });

  it('should normalize specific flow selection', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmp, 'login.flow.md');
    writeFileSync(flowPath, '## Flow: L01 - 正常登录\n## Flow: L02 - 错误密码\n', 'utf-8');

    const result = normalizeSelection([JSON.stringify({ file: flowPath, flowId: 'L01' })]);
    assert.equal(result.type, 'selection');
    assert.equal(result.files[0].flows.length, 1);
    assert.equal(result.files[0].flows[0], 'L01');
    assert.equal(result.files[0].all, false);
  });

  it('should treat file-level and flow-level mixed selection as all', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmp, 'login.flow.md');
    writeFileSync(flowPath, '## Flow: L01 - 正常登录\n## Flow: L02 - 错误密码\n', 'utf-8');

    const result = normalizeSelection([
      `__file:${flowPath}`,
      JSON.stringify({ file: flowPath, flowId: 'L01' }),
    ]);
    assert.equal(result.files[0].all, true);
  });
});

// ── writeSelection ─────────────────────────────────────────

describe('writeSelection', () => {
  it('should write JSON to file and stdout (captured)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const outPath = join(tmp, 'selection.json');

    // Capture console.log
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      writeSelection({ type: 'all' }, outPath);

      const written = JSON.parse(readFileSync(outPath, 'utf-8'));
      assert.deepEqual(written, { type: 'all' });
      assert.equal(logs.length, 1);
      assert.ok(logs[0].includes('"all"'));
    } finally {
      console.log = origLog;
    }
  });
});

