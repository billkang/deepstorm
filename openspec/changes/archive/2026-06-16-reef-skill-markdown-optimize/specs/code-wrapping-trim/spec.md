## ADDED Requirements

### Requirement: 精简前端 code-wrapping.md

前端 `code-wrapping.md`（416 行）SHALL 精简至 ~220 行，保留所有代码折行规则。

#### Scenario: 前端 code-wrapping 精简完成
- **WHEN** 优化完成
- **THEN** 文件行数不超过 250 行
- **THEN** 每个折行规则保留至少 1 个正例
- **THEN** 规则标题和描述文字完整保留
- **THEN** 删除规则明显时不必要的正反对比示例

### Requirement: 精简后端 code-wrapping.md

后端 `code-wrapping.md`（211 行）SHALL 精简至 ~150 行，保留所有代码折行规则。

#### Scenario: 后端 code-wrapping 精简完成
- **WHEN** 优化完成
- **THEN** 文件行数不超过 160 行
- **THEN** 每个折行规则保留至少 1 个正例
- **THEN** 保留 Checkstyle 等相关配置说明
