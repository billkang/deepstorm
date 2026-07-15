# AC-to-Test Trace

> capability: `ac-test-trace`

## ADDED Requirements

### Requirement: AC 回溯检查项

reef-start SHALL 在 code-audit（阶段五）的检查清单中增加"验收标准到测试的显式回溯"检查项。

#### Scenario: code-audit 增加 AC trace 项
- **WHEN** Agent 执行 code-audit
- **THEN** 检查清单 SHALL 包含一行：`- [ ] 每个 AC 已被至少一个测试方法覆盖（AC-to-test trace）`
- **AND** Agent SHALL 逐条检查 spec.md 中的 Acceptance Criteria，标记每条对应的测试文件+方法名

#### Scenario: AC 全覆盖通过
- **WHEN** 所有 AC 都找到对应的测试覆盖
- **THEN** Agent SHALL 在检查清单标记为 ✅，并输出 AC Coverage 报告

#### Scenario: AC 遗漏发现
- **WHEN** 存在未被测试覆盖的 AC
- **THEN** Agent SHALL 在检查清单标记为 ❌（未覆盖），并输出遗漏 AC 列表
- **AND** Agent SHALL 根据风险等级决定是否需要补测
    - 高风险 AC（涉及权限/安全/资金/幂等）：SHALL 要求补测，补充后重新验证
    - 低风险 AC（UI 文案变更/日志调整等）：MAY 豁免，但记录到 verify-report 的 acCoverage.uncovered 中

### Requirement: AC Coverage 输出格式

AC-to-test trace 的检查结果 SHALL 以结构化格式输出。

#### Scenario: 输出到 code-audit 报告
- **WHEN** AC trace 检查完成
- **THEN** Agent SHALL 将 AC Coverage 表格写入 code-audit 的 review 报告

```
AC Coverage: 4/5
├── AC-1 ✅ UserRegistrationTest::testCreateSuccess
├── AC-2 ✅ UserRegistrationTest::testDuplicateEmail
├── AC-3 ✅ UserRegistrationTest::testPasswordPolicy
├── AC-4 ✅ UserRegistrationIntegrationTest::testEndToEnd
└── AC-5 ❌ （未找到匹配测试）
```

#### Scenario: 同步到 verify-report
- **WHEN** 验证报告（verify-report.json）生成时
- **THEN** AC Coverage 的统计数据 SHALL 同步到 `acCoverage` 字段
