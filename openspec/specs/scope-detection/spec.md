# Scope Detection

## Purpose

通过 AI 语义分析 git diff 内容，检测分支变更涉及的业务领域，为分支范围门禁提供判定依据。

## Requirements

### Requirement: Branch diff MUST be semantically analyzed for business domain detection

系统 SHALL 对分支的 diff 内容进行 AI 语义分析，识别该分支涉及的所有业务领域。分析应基于代码变更的语义含义，而非文件路径或目录结构。

#### Scenario: 分析单领域变更

- **WHEN** 分支 diff 仅涉及订单模块的变更（如订单创建、订单查询）
- **THEN** 系统返回业务领域列表 `["order"]`，且该领域的可信度评分 SHOULD 不低于 0.8

#### Scenario: 分析多领域变更

- **WHEN** 分支 diff 同时涉及订单模块和支付模块的变更
- **THEN** 系统返回业务领域列表 `["order", "payment"]`，且每个领域都有独立的可信度评分

#### Scenario: 分析文档类变更

- **WHEN** 分支 diff 仅包含文档文件（如 README、文档注释、Markdown 文件）
- **THEN** 系统将此类变更归类为 `documentation` 领域，而非硬性阻断

#### Scenario: 分析空 diff

- **WHEN** 分支与目标分支（如 `main`）之间没有差异
- **THEN** 系统返回空列表，不触发任何门禁检查

### Requirement: Detection result SHOULD include confidence score per domain

每个检测到的业务领域 MUST 附带一个 0.0-1.0 的可信度评分，表示系统对该分类判定的确信程度。

#### Scenario: 高置信度分类

- **WHEN** diff 内容中的领域特征非常明确（如包含大量订单实体的增删改）
- **THEN** 该领域的可信度评分 MUST 不低于 0.8

#### Scenario: 低置信度分类

- **WHEN** diff 内容同时涉及多个领域或领域特征不明确
- **THEN** 系统 SHOULD 降低各领域的可信度评分，且 MUST 在报告中标明"需人工确认"

### Requirement: Detection MUST provide explanation for each domain classification

每个业务领域 MUST 附带一条简短的解释，说明为什么该 diff 被归为该领域。

#### Scenario: 获取分类解释

- **WHEN** 系统将某段 diff 归类为 `payment` 领域
- **THEN** 解释信息如 `"涉及支付网关接口调用和退款逻辑"` MUST 包含在检测结果中
