import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateReport } from '../generate-report.mjs';

describe('generate-report — generateReport', () => {
  const sampleData = {
    fileName: 'user-system/login.flow.md',
    timestamp: '2026-07-21 14:30',
    env: 'test',
    envUrl: 'https://test.example.com',
    mode: 'hybrid',
    flows: [
      {
        id: 'L01',
        title: '正常登录成功',
        failed: 0,
        steps: [
          { n: '1/3', op: '打开登录页面', vf: '页面加载', result: 'pass' },
          { n: '2/3', op: '输入邮箱', vf: '输入框显示', result: 'pass' },
          { n: '3/3', op: '点击登录', vf: '跳转 dashboard', result: 'pass' },
        ],
      },
    ],
    passed: 3,
    failed: 0,
    skipped: 0,
  };

  it('should generate report with flow details', () => {
    const report = generateReport(sampleData);
    assert.match(report, /# 测试执行报告/);
    assert.match(report, /user-system\/login\.flow\.md/);
    assert.match(report, /test \(https:\/\/test\.example\.com\)/);
    assert.match(report, /hybrid/);
    assert.match(report, /Flow: L01 - 正常登录成功 OK/);
    assert.match(report, /打开登录页面/);
  });

  it('should include summary table', () => {
    const report = generateReport(sampleData);
    assert.match(report, /汇总/);
    assert.match(report, /总 Flows 数.*1/);
    assert.match(report, /总步骤数.*3/);
    assert.match(report, /100%/);
  });

  it('should mark failed flows with X', () => {
    const data = {
      ...sampleData,
      flows: [{ ...sampleData.flows[0], failed: 1, steps: [
        { n: '1/2', op: '登录', vf: '成功', result: 'fail' },
      ] }],
      passed: 0, failed: 1,
    };
    const report = generateReport(data);
    assert.match(report, /Flow: L01 - 正常登录成功 X/);
  });

  it('should handle skipped steps', () => {
    const data = {
      ...sampleData,
      flows: [{ ...sampleData.flows[0], steps: [
        { n: '1/2', op: '登录', vf: '页面', result: 'pass' },
        { n: '2/2', op: '操作', vf: '结果', result: 'skip' },
      ] }],
      passed: 1, skipped: 1,
    };
    const report = generateReport(data);
    assert.match(report, /50%/);  // 1/2 pass rate
  });

  it('should handle empty data', () => {
    const data = {
      fileName: 'empty.md',
      timestamp: '',
      env: '', envUrl: '',
      mode: 'native',
      flows: [],
      passed: 0, failed: 0, skipped: 0,
    };
    const report = generateReport(data);
    assert.match(report, /总 Flows 数.*0/);
    assert.match(report, /0%/);
  });
});
