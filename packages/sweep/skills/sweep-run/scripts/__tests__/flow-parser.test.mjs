import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Import the parser (will fail initially — this is TDD RED phase)
import { parseFlowMd, parse, FlowParseResultSchema } from '../flow-parser.mjs';

// Sample .flow.md content matching the actual format
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
- 用户 \`logintest_user\` 已注册

### 执行步骤
1. 导航到登录页面 \`http://localhost:3000/\`
   ✅ 验证点：页面标题包含"登录"，登录表单可见
2. 在用户名输入框中输入 \`logintest_user\`
   ✅ 验证点：输入框内容正确
3. 点击"登录"按钮
   ✅ 验证点：页面跳转到 \`http://localhost:3000/dashboard.html\`

### 环境要求
- 目标环境：test

---

## Flow: L02 - 错误密码登录

### 前置条件
- 应用已启动

### 执行步骤
1. 导航到登录页面 \`http://localhost:3000/\`
   ✅ 验证点：登录表单可见
2. 输入用户名 \`logintest_user\`
3. 输入错误密码 \`wrongpassword\`
4. 点击"登录"按钮
   ✅ 验证点：页面不跳转，仍然停留在登录页
   ✅ 验证点：页面显示错误提示"用户名或密码错误"

### 环境要求
- 目标环境：test
`;

// Minimal .flow.md with only required fields
const MINIMAL_FLOW_MD = `# 最小测试

**来源：** Test

---

## 场景清单

| ID | 场景 | 类型 | 优先级 |
|----|------|------|--------|

---

## Flow: T01 - 最小 Flow

### 执行步骤
1. 导航到首页
   ✅ 验证点：页面加载
`;

describe('Flow Parser', () => {
  describe('parseFlowMd(filePath)', () => {
    it('should parse a valid .flow.md file', () => {
      // Use a temp file so we test file I/O
      const tmpDir = mkdtempSync(join(tmpdir(), 'flow-parser-test-'));
      const filePath = join(tmpDir, 'login.flow.md');
      writeFileSync(filePath, SAMPLE_FLOW_MD, 'utf-8');

      const result = parseFlowMd(filePath);

      assert.equal(result.featureName, '用户登录');
      assert.equal(result.source, 'DeepStorm Demo 测试工程');
      assert.equal(result.createdAt, '2026-06-13');

      // Scenarios
      assert.equal(result.scenarios.length, 2);
      assert.equal(result.scenarios[0].id, 'L01');
      assert.equal(result.scenarios[0].scenario, '正常登录');
      assert.equal(result.scenarios[0].type, '正常流程');
      assert.equal(result.scenarios[0].priority, 'P0');
      assert.equal(result.scenarios[1].id, 'L02');
      assert.equal(result.scenarios[1].scenario, '错误密码登录');

      // Flows
      assert.equal(result.flows.length, 2);

      // Flow L01
      const flow1 = result.flows.find(f => f.id === 'L01');
      assert.ok(flow1);
      assert.equal(flow1.title, '正常登录');
      assert.ok(flow1.preconditions);
      assert.ok(flow1.preconditions.includes('logintest_user'));
      assert.equal(flow1.steps.length, 3);

      // Step 1 of L01
      const step1 = flow1.steps.find(s => s.order === 1);
      assert.ok(step1);
      assert.ok(step1.description.includes('导航到登录页面'));
      assert.equal(step1.validations.length, 1);
      assert.ok(step1.validations[0].includes('页面标题'));

      // Step 3 of L01 (multi-step with validation)
      const step3 = flow1.steps.find(s => s.order === 3);
      assert.ok(step3);
      assert.equal(step3.validations.length, 1);
      assert.ok(step3.validations[0].includes('页面跳转'));

      // Flow L02
      const flow2 = result.flows.find(f => f.id === 'L02');
      assert.ok(flow2);
      assert.equal(flow2.steps.length, 4);
      // Step 4 of L02 has 2 validation points
      const step4L02 = flow2.steps.find(s => s.order === 4);
      assert.ok(step4L02);
      assert.equal(step4L02.validations.length, 2);

      // Environment
      assert.equal(flow2.envRequirements?.targetEnv, 'test');

      // Cleanup
      writeFileSync(filePath, '');
    });

    it('should throw when file does not exist', () => {
      assert.throws(() => {
        parseFlowMd('/nonexistent/path.flow.md');
      }, /not found|不存在|ENOENT/i);
    });

    it('should handle minimal .flow.md with optional fields missing', () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'flow-parser-test-'));
      const filePath = join(tmpDir, 'minimal.flow.md');
      writeFileSync(filePath, MINIMAL_FLOW_MD, 'utf-8');

      const result = parseFlowMd(filePath);
      assert.equal(result.featureName, '最小测试');
      assert.equal(result.flows.length, 1);
      assert.equal(result.flows[0].id, 'T01');
      // Preconditions should be undefined/null when missing
      assert.equal(result.flows[0].preconditions, undefined);
      // envRequirements should be undefined when missing
      assert.equal(result.flows[0].envRequirements, undefined);
    });

    it('should parse multiple validation points in one step', () => {
      // Step 4 of L02 has "验证点不跳转" and "验证点显示错误提示"
      const tmpDir = mkdtempSync(join(tmpdir(), 'flow-parser-test-'));
      const filePath = join(tmpDir, 'multi-validate.flow.md');
      writeFileSync(filePath, SAMPLE_FLOW_MD, 'utf-8');

      const result = parseFlowMd(filePath);
      const flowL02 = result.flows.find(f => f.id === 'L02');
      const step4 = flowL02.steps.find(s => s.order === 4);
      assert.equal(step4.validations.length, 2);
      assert.ok(step4.validations[0].includes('不跳转'));
      assert.ok(step4.validations[1].includes('错误提示'));
    });
  });

  describe('parse(content)', () => {
    it('should parse raw content without file I/O', () => {
      const result = parse(SAMPLE_FLOW_MD);
      assert.equal(result.featureName, '用户登录');
      assert.equal(result.flows.length, 2);
    });

    it('should handle empty content gracefully', () => {
      const result = parse('');
      assert.equal(result.featureName, '');
      assert.deepEqual(result.scenarios, []);
      assert.deepEqual(result.flows, []);
    });
  });

  describe('FlowParseResultSchema', () => {
    it('should export a valid JSON Schema', () => {
      assert.ok(FlowParseResultSchema);
      assert.equal(FlowParseResultSchema.title, 'FlowParseResult');
      assert.equal(FlowParseResultSchema.type, 'object');
      assert.ok(FlowParseResultSchema.properties);
      assert.ok(FlowParseResultSchema.properties.featureName);
      assert.ok(FlowParseResultSchema.properties.scenarios);
      assert.ok(FlowParseResultSchema.properties.flows);
      assert.ok(FlowParseResultSchema.properties.flows.items.properties.steps);
    });

    it('schema should describe the parsed result structure', () => {
      const result = parse(SAMPLE_FLOW_MD);
      // Validate result matches schema
      const topLevel = FlowParseResultSchema.properties;
      assert.ok(typeof result[Object.keys(topLevel)[0]]);
      assert.ok(Array.isArray(result.scenarios));
      assert.ok(Array.isArray(result.flows));
      if (result.flows.length > 0) {
        const flow = result.flows[0];
        const flowProps = FlowParseResultSchema.properties.flows.items.properties;
        assert.ok('id' in flow);
        assert.ok('steps' in flow);
        assert.equal(typeof flow.steps[0].order, 'number');
        assert.ok(Array.isArray(flow.steps[0].validations));
      }
    });
  });
});
