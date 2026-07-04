## Why

Tide（@deepstorm/tide）v0.1.0 已实现了 BMAD 多角色需求讨论 → PRD 自动生成 → 钉钉云文档发布 → Jira 任务拆分创建的全流程功能，但缺少结构化的 OpenSpec 规范文档。建立基线规范后，后续功能迭代可以基于明确的 spec 和 tasks 进行，避免重复理解已有架构，也便于追踪变更历史。

## What Changes

- 创建 Tide 的技术规范文档（spec），覆盖：数据模型、工作流各步骤、角色定义、MCP 集成、文件组织
- 创建 Tide 的任务清单（tasks），按已实现/未来迭代分类
- 不修改任何现有代码或 skill 文件
- 不新增或修改功能

## Capabilities

### New Capabilities
- `tide-core`: Tide 产品侧需求讨论与 PRD 工作流的核心技术规范，包含数据存储结构、状态流转、BMAD 角色讨论流程、发布与归档机制

### Modified Capabilities

（无，首次基线建立）

## Impact

- 新增 OpenSpec 规范文件，不修改现有代码
- 供后续迭代参考的任务清单
