## ADDED Requirements

### Requirement: Entry Routn
每次 reef-start 被调用时，AI SHALL 根据用户输入判断是否存在 Issue 相关信息，并路由到对应流程路径。

#### Scenario: Bundle Issue 信息时走 Issue 驱动路径
- **WHEN** 用户输入中包含 Issue URL、Issue 编号（如 `LC-1234`、`PROJ-456`）或任何与 Issue 跟踪系统相关的引用
- **THEN** AI SHALL 路由到 Path A（Issue 驱动流程），按照 `issue-driven-flow` 的规范执行 Issue 获取、PRD 获取、设计稿获取等步骤

#### Scenario: 无 Issue 信息时走开放讨论路径
- **WHEN** 用户输入中不包含任何 Issue 编号或 Issue 跟踪系统引用，且用户未明确提到某个 Issue
- **THEN** AI SHALL 路由到 Path B（开放讨论流程），按照 `open-discussion-flow` 的规范执行

#### Scenario: 模糊情况引导用户选择
- **WHEN** 用户输入模棱两可，AI 无法确定是否包含 Issue 信息
- **THEN** AI SHALL 向用户确认："你是基于某个 Issue 开始，还是想从零讨论一个新需求？" 根据用户回答路由到对应路径
