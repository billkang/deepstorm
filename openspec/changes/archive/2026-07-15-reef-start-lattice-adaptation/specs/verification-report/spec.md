# Verification Report

> capability: `verification-report`

## ADDED Requirements

### Requirement: 结构化验证报告

reef-start SHALL 在 code-audit 之后、分支结束之前（阶段五），生成一份结构化验证报告，收敛本次 change 的所有验证证据。

#### Scenario: 报告生成时机
- **WHEN** code-audit 完成且所有 blocking issues 已解决
- **THEN** Agent SHALL 生成 `openspec/changes/<change-name>/verify-report.json`

#### Scenario: 报告包含任务完成状态
- **WHEN** 生成验证报告
- **THEN** Agent SHALL 汇总 tasks.md 中的完成状态，记录 total / passed / failed 计数

#### Scenario: 报告包含构建验证结果
- **WHEN** 生成验证报告
- **THEN** Agent SHALL 记录后置验证门禁中的 build 步骤结果（command、exitCode、passed、duration）

#### Scenario: 报告包含 lint 验证结果
- **WHEN** 生成验证报告
- **THEN** Agent SHALL 记录后置验证门禁中的 lint 步骤结果（command、exitCode、passed）

#### Scenario: 报告包含测试验证结果
- **WHEN** 生成验证报告
- **THEN** Agent SHALL 记录后置验证门禁中的 test 步骤结果（command、exitCode、passed、total、passed、failed、duration）

#### Scenario: 报告包含 AC 覆盖率
- **WHEN** 生成验证报告
- **THEN** Agent SHALL 记录 AC 到测试的覆盖率（total、covered、uncovered AC 列表）

#### Scenario: 报告包含 review 结果
- **WHEN** 生成验证报告
- **THEN** Agent SHALL 记录 code-audit 的结果（findings 总数、blockers、warnings、suggestions、report 文件路径）

#### Scenario: 报告包含整体摘要
- **WHEN** 生成验证报告
- **THEN** 报告 SHALL 包含 summary 字段，取值为 PASSED / PASSED with warnings / FAILED

### Requirement: 报告格式规范

验证报告 SHALL 使用以下 JSON 结构：

#### Scenario: 报告格式定义
- **WHEN** 写入 verify-report.json
- **THEN** 文件 SHALL 使用以下结构：

```json
{
  "change": "<change-name>",
  "tasks": { "total": 0, "passed": 0 },
  "build": { "command": "npm run build", "exitCode": 0, "passed": true },
  "lint": { "command": "npm run lint", "exitCode": 0, "passed": true },
  "tests": { "command": "npm test", "exitCode": 0, "passed": true, "total": 0, "passed": 0, "failed": 0 },
  "acCoverage": { "total": 0, "covered": 0, "uncovered": [] },
  "review": { "findings": 0, "blockers": 0, "warnings": 0, "suggestions": 0 },
  "summary": "PASSED"
}
```

### Requirement: 归档时报告同步

验证报告 SHALL 在归档操作中随 change 目录一起移动到 `openspec/changes/archive/`。

#### Scenario: 归档携带报告
- **WHEN** `/opsx:archive` 执行
- **THEN** verify-report.json SHALL 随 change 目录移入 `openspec/changes/archive/<date>-<change-name>/`
