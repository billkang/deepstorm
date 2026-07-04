import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, utimesSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { compile, compileFromFile, compileAllFromDir, outputPath, isUpToDate } from '../spec-compiler.mjs';

// Sample parsed result (matching flow-parser output)
const SAMPLE_PARSED = {
  featureName: '用户登录',
  source: 'DeepStorm Demo 测试工程',
  createdAt: '2026-06-13',
  scenarios: [
    { id: 'L01', scenario: '正常登录', type: '正常流程', priority: 'P0' },
    { id: 'L02', scenario: '错误密码登录', type: '异常场景', priority: 'P1' },
  ],
  flows: [
    {
      id: 'L01',
      title: '正常登录',
      preconditions: '应用已启动\n用户 logintest_user 已注册',
      steps: [
        { order: 1, description: '导航到登录页面', validations: ['页面标题包含"登录"，登录表单可见'] },
        { order: 2, description: '在用户名输入框中输入 logintest_user', validations: ['输入框内容正确'] },
        { order: 3, description: '点击"登录"按钮', validations: ['页面跳转到 http://localhost:3000/dashboard.html'] },
      ],
      envRequirements: { targetEnv: 'test' },
    },
    {
      id: 'L02',
      title: '错误密码登录',
      steps: [
        { order: 1, description: '导航到登录页面', validations: ['登录表单可见'] },
        { order: 2, description: '输入错误密码 wrongpassword', validations: [] },
        { order: 3, description: '点击"登录"按钮', validations: ['页面不跳转，仍然停留在登录页', '页面显示错误提示"用户名或密码错误"'] },
      ],
    },
  ],
};

// Minimal parsed result (no preconditions, no envRequirements)
const MINIMAL_PARSED = {
  featureName: '最小测试',
  source: 'Test',
  createdAt: '',
  scenarios: [],
  flows: [
    {
      id: 'T01',
      title: '最小 Flow',
      steps: [
        { order: 1, description: '导航到首页', validations: ['页面加载'] },
      ],
    },
  ],
};

// Flow with AI_REQUIRED marker
const AI_REQUIRED_PARSED = {
  featureName: 'AI 辅助测试',
  source: '',
  createdAt: '',
  scenarios: [],
  flows: [
    {
      id: 'A01',
      title: '验证码流程',
      steps: [
        { order: 1, description: '导航到登录页面', validations: ['页面加载'] },
        { order: 2, description: '输入验证码 <!-- AI_REQUIRED -->', validations: ['验证码验证通过'] },
      ],
    },
  ],
};

describe('Spec Compiler', () => {
  describe('compile(parsed)', () => {
    it('should generate a valid .spec.ts string', () => {
      const spec = compile(SAMPLE_PARSED);
      assert.ok(spec.includes("import { test, expect } from '@playwright/test'"));
      assert.ok(spec.includes("test('用户登录 - L01 - 正常登录'"));
      assert.ok(spec.includes("test('用户登录 - L02 - 错误密码登录'"));
    });

    it('should generate step actions for each flow', () => {
      const spec = compile(SAMPLE_PARSED);
      // L01 has 3 steps
      assert.ok(spec.includes('// Step 1'));
      assert.ok(spec.includes('// Step 2'));
      assert.ok(spec.includes('// Step 3'));
      // L02 has 3 steps starting from a new test block
      assert.ok(spec.includes("test('用户登录 - L02 - 错误密码登录'"));
    });

    it('should generate expect assertions for validation points', () => {
      const spec = compile(SAMPLE_PARSED);
      assert.ok(spec.includes('expect('));
      // Step 1 validation: title contains "登录"
      assert.ok(spec.includes('toHaveTitle') || spec.includes('toHaveURL') || spec.includes('toBeVisible'));
    });

    it('should handle flows without preconditions', () => {
      const spec = compile(MINIMAL_PARSED);
      assert.ok(spec.includes("test('最小测试 - T01 - 最小 Flow'"));
      assert.ok(spec.includes('page.goto'));
    });

    it('should mark AI_REQUIRED steps with comment and skip', () => {
      const spec = compile(AI_REQUIRED_PARSED);
      assert.ok(spec.includes('// AI_REQUIRED'));
    });

    it('should include preconditions as comments', () => {
      const spec = compile(SAMPLE_PARSED);
      assert.ok(spec.includes('logintest_user'));
    });

    it('should handle empty flows gracefully', () => {
      const empty = { featureName: 'Empty', source: '', createdAt: '', scenarios: [], flows: [] };
      const spec = compile(empty);
      // Empty flows: no test blocks generated, just the import
      assert.ok(spec.includes("@playwright/test"));
      assert.ok(!spec.includes("test("));
    });
  });

  describe('outputPath(flowMdPath)', () => {
    it('should derive .flow.spec.ts path from .flow.md path', () => {
      const result = outputPath('/flows/user-system/login/login.flow.md');
      assert.equal(result, '/flows/user-system/login/login.flow.spec.ts');
    });

    it('should work with relative paths', () => {
      const result = outputPath('flows/login.flow.md');
      assert.equal(result, 'flows/login.flow.spec.ts');
    });
  });

  describe('compileFromFile(flowMdPath)', () => {
    it('should parse .flow.md and compile to .spec.ts', () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'spec-compile-'));
      const flowPath = join(tmpDir, 'login.flow.md');
      writeFileSync(flowPath, SAMPLE_FLOW_MD_CONTENT, 'utf-8');

      const specPath = compileFromFile(flowPath);
      assert.ok(specPath.endsWith('.flow.spec.ts'));
      assert.ok(readFileSync(specPath, 'utf-8').includes('@playwright/test'));
    });
  });
});

describe('isUpToDate(flowMdPath)', () => {
  it('should return true when .spec.ts is newer than .flow.md', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'spec-fresh-'));
    const flowPath = join(tmpDir, 'fresh.flow.md');
    const specPath = join(tmpDir, 'fresh.flow.spec.ts');
    writeFileSync(flowPath, '# test', 'utf-8');
    writeFileSync(specPath, '// test', 'utf-8');
    assert.ok(isUpToDate(flowPath));
  });

  it('should return false when .spec.ts is older than .flow.md', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'spec-stale-'));
    const flowPath = join(tmpDir, 'stale.flow.md');
    const specPath = join(tmpDir, 'stale.flow.spec.ts');
    writeFileSync(specPath, '// test', 'utf-8');
    // Wait 1ms so .flow.md is definitely newer
    const specMtime = statSync(specPath).mtimeMs;
    writeFileSync(flowPath, '# test', 'utf-8');
    // Ensure .flow.md mtime > .spec.ts mtime
    const flowMtime = statSync(flowPath).mtimeMs;
    if (flowMtime <= specMtime) {
      utimesSync(flowPath, new Date(specMtime + 100), new Date(specMtime + 100));
    }
    assert.equal(isUpToDate(flowPath), false);
  });

  it('should return false when .spec.ts does not exist', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'spec-missing-'));
    const flowPath = join(tmpDir, 'missing.flow.md');
    writeFileSync(flowPath, '# test', 'utf-8');
    assert.equal(isUpToDate(flowPath), false);
  });

  it('should return false when .flow.md does not exist', () => {
    assert.equal(isUpToDate('/nonexistent/path.flow.md'), false);
  });
});

// Minimal .flow.md for compileFromFile test
const SAMPLE_FLOW_MD_CONTENT = `# E2E 测试流程：用户登录

**来源：** Test

---

## 场景清单

| ID | 场景 | 类型 | 优先级 |
|----|------|------|--------|
| L01 | 正常登录 | 正常流程 | P0 |

---

## Flow: L01 - 正常登录

### 执行步骤
1. 导航到登录页面
   ✅ 验证点：页面加载
`;
