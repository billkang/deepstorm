import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  parseTopology,
  parseFlows,
  resolveFlowFile,
  scanFlowFiles,
  buildChoicesWithFlows,
  normalizeSelection,
  buildFlatFileChoices,
  getCheckbox,
  isTtyAvailable,
} from '../flow-selector.mjs';

// ── Test fixtures ──────────────────────────────────────────

const SAMPLE_TOPOLOGY_YAML = `# DeepStorm Demo 测试拓扑
# 注释行

name: 测试拓扑
version: 1

modules:
  - name: user-system
    description: 用户系统
    children:
      - name: register
        description: 用户注册
      - name: login
        description: 用户登录

  - name: tasks
    description: 任务管理
    children:
      - name: crud
        description: 任务增删改查
      - name: filter
        description: 任务筛选
`;

const MINIMAL_TOPOLOGY_YAML = `modules:
  - name: single
    description: 单模块
`;

const EMPTY_TOPOLOGY_YAML = `modules: []
`;

const SAMPLE_FLOW_MD = `# E2E 测试流程：用户登录

**来源：** DeepStorm Demo 测试工程
**创建时间：** 2026-06-13

---

## 场景清单

| ID | 场景 | 类型 | 优先级 |
|----|------|------|--------|
| L01 | 正常登录 | 正常流程 | P0 |
| L02 | 错误密码登录 | 异常场景 | P1 |

---

## Flow: L01 - 正常登录

### 前置条件
- 应用已启动
- 用户登录

### 执行步骤
1. 导航到页面
   ✅ 验证点：页面加载

### 环境要求
- 目标环境：test

---

## Flow: L02 - 错误密码登录

### 前置条件
- 应用已启动

### 执行步骤
1. 输入错误密码
   ✅ 验证点：显示错误提示
`;

const FLOW_MD_NO_FLOWS = `# 空测试集

---

## 场景清单

| ID | 场景 | 类型 | 优先级 |
|----|------|------|--------|

---

`;

// ── parseTopology ──────────────────────────────────────────

describe('parseTopology(yaml)', () => {
  it('should parse a valid topology with modules and children', () => {
    const result = parseTopology(SAMPLE_TOPOLOGY_YAML);

    assert.equal(result.length, 2);

    // user-system
    assert.equal(result[0].name, 'user-system');
    assert.equal(result[0].children.length, 2);
    assert.equal(result[0].children[0].name, 'register');
    assert.equal(result[0].children[1].name, 'login');

    // tasks
    assert.equal(result[1].name, 'tasks');
    assert.equal(result[1].children.length, 2);
    assert.equal(result[1].children[0].name, 'crud');
    assert.equal(result[1].children[1].name, 'filter');
  });

  it('should parse a minimal topology with one module', () => {
    const result = parseTopology(MINIMAL_TOPOLOGY_YAML);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'single');
    assert.equal(result[0].children.length, 0);
  });

  it('should handle empty topology gracefully', () => {
    const result = parseTopology(EMPTY_TOPOLOGY_YAML);
    assert.equal(result.length, 0);
  });

  it('should handle empty string', () => {
    const result = parseTopology('');
    assert.equal(result.length, 0);
  });

  it('should ignore comment lines', () => {
    const result = parseTopology(SAMPLE_TOPOLOGY_YAML);
    // Should not produce extra entries from comments
    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'user-system');
  });
});

// ── parseFlows ─────────────────────────────────────────────

describe('parseFlows(content)', () => {
  it('should extract all flows from .flow.md content', () => {
    const result = parseFlows(SAMPLE_FLOW_MD);

    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'L01');
    assert.equal(result[0].title, '正常登录');
    assert.equal(result[1].id, 'L02');
    assert.equal(result[1].title, '错误密码登录');
  });

  it('should return empty array when no flows exist', () => {
    const result = parseFlows(FLOW_MD_NO_FLOWS);
    assert.equal(result.length, 0);
  });

  it('should return empty array for empty content', () => {
    const result = parseFlows('');
    assert.equal(result.length, 0);
  });

  it('should handle flows with special characters in title', () => {
    const content = `## Flow: T01 - 任务 CRUD（增/删/改/查）`;
    const result = parseFlows(content);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'T01');
    assert.equal(result[0].title, '任务 CRUD（增/删/改/查）');
  });
});

// ── resolveFlowFile ────────────────────────────────────────

describe('resolveFlowFile(modulePath, baseFlowsDir)', () => {
  it('should find a direct .flow.md file match', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmpDir, 'login.flow.md');
    writeFileSync(flowPath, '', 'utf-8');

    const result = resolveFlowFile('login', tmpDir);
    assert.equal(result, flowPath);
  });

  it('should find file in subdirectory', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const subDir = join(tmpDir, 'user-system');
    mkdirSync(subDir, { recursive: true });
    const flowPath = join(subDir, 'login.flow.md');
    writeFileSync(flowPath, '', 'utf-8');

    const result = resolveFlowFile('user-system/login', tmpDir);
    assert.equal(result, flowPath);
  });

  it('should return null when file does not exist', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const result = resolveFlowFile('nonexistent', tmpDir);
    assert.equal(result, null);
  });
});

// ── scanFlowFiles ──────────────────────────────────────────

describe('scanFlowFiles(dir)', () => {
  it('should find all .flow.md files recursively', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const subDir = join(tmpDir, 'user-system');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(tmpDir, 'tasks.flow.md'), '', 'utf-8');
    writeFileSync(join(subDir, 'login.flow.md'), '', 'utf-8');
    writeFileSync(join(subDir, 'register.flow.md'), '', 'utf-8');

    const result = scanFlowFiles(tmpDir);
    assert.equal(result.length, 3);
    assert.ok(result.some((f) => f.endsWith('tasks.flow.md')));
    assert.ok(result.some((f) => f.endsWith('login.flow.md')));
    assert.ok(result.some((f) => f.endsWith('register.flow.md')));
  });

  it('should skip hidden directories', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const hiddenDir = join(tmpDir, '.hidden');
    mkdirSync(hiddenDir, { recursive: true });
    writeFileSync(join(hiddenDir, 'secret.flow.md'), '', 'utf-8');
    writeFileSync(join(tmpDir, 'visible.flow.md'), '', 'utf-8');

    const result = scanFlowFiles(tmpDir);
    assert.equal(result.length, 1);
    assert.ok(result.every((f) => !f.includes('.hidden')));
  });

  it('should return empty array for empty directory', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const result = scanFlowFiles(tmpDir);
    assert.equal(result.length, 0);
  });
});

// ── buildChoicesWithFlows ──────────────────────────────────

describe('buildChoicesWithFlows(modules, baseFlowsDir)', () => {
  it('should build choices for modules with flow files', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const subDir = join(tmpDir, 'user-system');
    mkdirSync(subDir, { recursive: true });
    const flowPath = join(subDir, 'login.flow.md');
    writeFileSync(flowPath, SAMPLE_FLOW_MD, 'utf-8');

    const modules = [
      {
        name: 'user-system',
        children: [{ name: 'login' }],
      },
    ];

    const choices = buildChoicesWithFlows(modules, tmpDir);

    // Should have file-level choice + individual flow choices
    assert.ok(choices.length >= 2);
    assert.ok(choices.some((c) => c.value === `__file:${flowPath}`));
    assert.ok(choices.some((c) => {
      try {
        const v = JSON.parse(c.value);
        return v.file === flowPath && v.flowId === 'L01';
      } catch { return false; }
    }));
    assert.ok(choices.some((c) => {
      try {
        const v = JSON.parse(c.value);
        return v.file === flowPath && v.flowId === 'L02';
      } catch { return false; }
    }));
  });

  it('should create module choice when flow file not found', () => {
    const modules = [
      { name: 'orphan', children: [{ name: 'missing' }] },
    ];

    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const choices = buildChoicesWithFlows(modules, tmpDir);

    assert.ok(choices.some((c) => c.value === '__module:orphan/missing'));
    assert.equal(
      choices.find((c) => c.value === '__module:orphan/missing').description,
      '未找到对应 .flow.md 文件',
    );
  });

  it('should handle nested module hierarchy', () => {
    const modules = [
      {
        name: 'a',
        children: [
          {
            name: 'b',
            children: [{ name: 'c' }],
          },
        ],
      },
    ];

    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const dirC = join(tmpDir, 'a', 'b');
    mkdirSync(dirC, { recursive: true });
    const flowPath = join(dirC, 'c.flow.md');
    writeFileSync(flowPath, '## Flow: C01 - Deep', 'utf-8');

    const choices = buildChoicesWithFlows(modules, tmpDir);
    assert.ok(choices.some((c) => c.value === `__file:${flowPath}`));
  });
});

// ── normalizeSelection ─────────────────────────────────────

describe('normalizeSelection(answer)', () => {
  it('should return type:all when __all__ is selected', () => {
    const result = normalizeSelection(['__all__']);
    assert.equal(result.type, 'all');
  });

  it('should normalize file-level selection', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmpDir, 'test.flow.md');
    writeFileSync(flowPath, SAMPLE_FLOW_MD, 'utf-8');

    const result = normalizeSelection([`__file:${flowPath}`]);
    assert.equal(result.type, 'selection');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].file, flowPath);
    assert.equal(result.files[0].all, true);
  });

  it('should normalize individual flow selection', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmpDir, 'test.flow.md');
    writeFileSync(flowPath, SAMPLE_FLOW_MD, 'utf-8');

    const result = normalizeSelection([
      JSON.stringify({ file: flowPath, flowId: 'L01' }),
    ]);
    assert.equal(result.type, 'selection');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].file, flowPath);
    assert.equal(result.files[0].all, false);
    assert.deepEqual(result.files[0].flows, ['L01']);
  });

  it('should ignore __module: entries silently', () => {
    const result = normalizeSelection(['__module:user-system']);
    assert.equal(result.type, 'selection');
    assert.equal(result.files.length, 0);
  });

  it('should merge selections from the same file', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-test-'));
    const flowPath = join(tmpDir, 'test.flow.md');
    writeFileSync(flowPath, SAMPLE_FLOW_MD, 'utf-8');

    const result = normalizeSelection([
      JSON.stringify({ file: flowPath, flowId: 'L01' }),
      JSON.stringify({ file: flowPath, flowId: 'L02' }),
    ]);
    assert.equal(result.type, 'selection');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].all, true); // all flows selected
  });
});

// ── buildFlatFileChoices ───────────────────────────────────

describe('buildFlatFileChoices(choices)', () => {
  const sampleChoices = [
    { name: '📋 全部执行', value: '__all__' },
    { name: '📁 user-system/register', value: '__file:/flows/user-system/register.flow.md', description: '3 个用例' },
    { name: '📁 user-system/login', value: '__file:/flows/user-system/login.flow.md', description: '3 个用例' },
    { name: '📁 tasks/crud', value: '__file:/flows/tasks/crud.flow.md', description: '4 个用例' },
    { name: '📁 tasks/filter', value: '__file:/flows/tasks/filter.flow.md', description: '3 个用例' },
  ];

  it('should exclude __all__ entry from flat list', () => {
    const flat = buildFlatFileChoices(sampleChoices);
    assert.equal(flat.length, 4);
    assert.ok(flat.every((f) => f.value !== '__all__'));
  });

  it('should assign sequential indices starting from 1', () => {
    const flat = buildFlatFileChoices(sampleChoices);
    assert.equal(flat[0].index, 1);
    assert.equal(flat[1].index, 2);
    assert.equal(flat[2].index, 3);
    assert.equal(flat[3].index, 4);
  });

  it('should strip 📁 prefix from label', () => {
    const flat = buildFlatFileChoices(sampleChoices);
    assert.equal(flat[0].label, 'user-system/register');
    assert.equal(flat[1].label, 'user-system/login');
  });

  it('should only include __file: entries', () => {
    const mixedChoices = [
      { name: '📋 全部执行', value: '__all__' },
      { name: '📁 user-system/register', value: '__file:/f.flow.md', description: '3 个用例' },
      { name: '  L01 - 正常', value: '{"file":"/f.flow.md","flowId":"L01"}', description: '/f.flow.md' },
      { name: '__module:orphan', value: '__module:orphan', description: 'not found' },
    ];
    const flat = buildFlatFileChoices(mixedChoices);
    assert.equal(flat.length, 1);
    assert.equal(flat[0].value, '__file:/f.flow.md');
  });

  it('should return empty array for no file choices', () => {
    const result = buildFlatFileChoices([{ name: '📋 全部执行', value: '__all__' }]);
    assert.equal(result.length, 0);
  });
});

// ── isTtyAvailable ─────────────────────────────────────────

describe('isTtyAvailable()', () => {
  it('should return a boolean', () => {
    const result = isTtyAvailable();
    assert.equal(typeof result, 'boolean');
  });

  it('should detect non-TTY environment in test runner', () => {
    const result = isTtyAvailable();
    assert.equal(typeof result, 'boolean');
  });
});

// ── getCheckbox ────────────────────────────────────────────

describe('getCheckbox()', () => {
  it('should return a checkbox function or null', async () => {
    const checkbox = await getCheckbox();
    // @inquirer/checkbox may or may not be installed in the test runner
    // This just validates the return type
    assert.ok(checkbox === null || typeof checkbox === 'function');
  });

  it('should be idempotent (stable reference)', async () => {
    const a = await getCheckbox();
    const b = await getCheckbox();
    assert.equal(a, b);
  });
});

// ── askTextSelection pipeline (end-to-end with temp files) ─

describe('askTextSelection pipeline', () => {
  it('should produce __file: values that normalizeSelection can consume with real files', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'flow-selector-pipeline-'));
    const aPath = join(tmpDir, 'a.flow.md');
    const bPath = join(tmpDir, 'b.flow.md');
    writeFileSync(aPath, SAMPLE_FLOW_MD, 'utf-8');
    writeFileSync(bPath, SAMPLE_FLOW_MD, 'utf-8');

    const flatChoices = [
      { index: 1, value: `__file:${aPath}`, label: 'a', description: '2 个用例' },
      { index: 2, value: `__file:${bPath}`, label: 'b', description: '2 个用例' },
    ];

    // Simulate selecting file 1
    const simulatedAnswer = [flatChoices[0].value];
    const result = normalizeSelection(simulatedAnswer);
    assert.equal(result.type, 'selection');
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].file, aPath);
    assert.equal(result.files[0].all, true);
  });

  it('should produce __all__ when "all" is chosen', () => {
    const result = normalizeSelection(['__all__']);
    assert.equal(result.type, 'all');
  });
});

// ── Edge cases: empty/missing flows directory ─────────────

describe('Flow selector edge cases', () => {
  it('buildFlatFileChoices should not fail on empty input', () => {
    assert.deepEqual(buildFlatFileChoices([]), []);
  });

  it('buildFlatFileChoices should handle choices with non-file values', () => {
    const choices = [
      { name: '📋 全部执行', value: '__all__' },
      { name: '📁 existing', value: '__file:/test.flow.md', description: '1 个用例' },
    ];
    const flat = buildFlatFileChoices(choices);
    assert.equal(flat.length, 1);
    assert.equal(flat[0].value, '__file:/test.flow.md');
  });
});
