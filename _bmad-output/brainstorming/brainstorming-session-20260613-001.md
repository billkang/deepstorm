---
stepsCompleted: [1]
inputDocuments: [openspec/specs/test-case-generation/spec.md]
session_topic: Sweep 测试侧插件开发规划
session_goals: 明确 Sweep 定位、测试模式、skill 划分
selected_approach: 2 — AI-Recommended Techniques
techniques_used: [结构化讨论, 对比分析, 分层设计]
ideas_generated:
  - Sweep 定位：只做 E2E 测试，不做单元测试和集成测试
  - 测试模式：.flow.md 测试意图文档 + Playwright MCP 执行
  - SDD 工具链：OpenSpec + grill-me 足够，不需要额外引入
  - 与 Reef 关系：各生成各自的，格式统一粒度分离
  - Sweep MVP 技能：setup / flow-create / flow-run 三个纯技能
  - 开发侧测试用例：Reef 产出，保存在 openspec/specs/{capability}/test-cases.md
  - PRD 统一来源：钉钉云文档，Reef 和 Sweep 各自读取
  - 跨仓库：Sweep 通过 GitHub MCP 阅读开发仓库的 spec 信息（已澄清不需要）
  - Sweep 不引入 agents/hooks（MVP 阶段）
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Billkang
**Date:** 2026-06-13

## Session Overview

**Topic:** Sweep (@deepstorm/sweep) 测试侧 Claude Code Plugin 开发规划
**Goals:** 明确 Sweep 的定位、测试模式、工具栈和 skill 划分

### 讨论背景

Sweep 是 DeepStorm 测试侧套件，目前处于骨架阶段。
Reef 已有 test-case-generation skill，用于生成开发侧代码级测试用例，辅助代码实现质量和单元测试。

### 关键共识

#### 1. Sweep 的定位

- **只做 E2E 测试**，不做单元测试和集成测试
- 单元测试和集成测试由 Reef 的 test-case-generation + superpowers 覆盖
- E2E 测试在独立的测试仓库中运行（测试项目与开发代码不在同一仓库）
- AI 编程时代，测试工程师的价值从"写测试"迁移到"定义质量"和"设计测试策略"

#### 2. Reef 与 Sweep 测试用例的关系

- 同一模板（Schema），不同粒度（Scope）
- 测试用例字段结构统一（ID/类型/前置条件/步骤/预期结果）
- Reef：生成代码级测试用例（方法边界、异常处理、内部状态）
- Sweep：生成系统级 E2E 测试用例（用户旅程、跨服务交互、业务流程）
- 开发侧测试用例（Reef 产出）保存在 openspec/specs/{capability}/test-cases.md
- 两者从同一源头（PRD 钉钉云文档）出发，各自提取不同视角的测试内容

#### 3. 测试模式：计划文档驱动

- 不是"生成测试代码→CI 运行"，而是"生成 .flow.md → Playwright MCP 执行"
- .flow.md 同时是测试用例文档（给人评审/手工测）和执行脚本（给 AI 执行）
- 一份文件三种用途：评审 → 手工测 → AI 自动测
- 测试意图过程保存下来，AI 可反复执行

#### 4. SDD 工具链

- 测试侧不需要 BMAD（产品侧工具）
- 测试侧不需要额外引入 SDD 工具
- **OpenSpec** 提供主干骨架（proposal → specs → design → tasks → apply → verify → archive）
- **Grill-me** 做关键节点的质量把关（质疑遗漏场景、挑战假设）
- **Playwright MCP** 做执行验证
- 三件套刚好覆盖"管 → 审 → 跑"

#### 5. Sweep MVP 技能划分

| Skill | 命令 | 作用 |
|-------|------|------|
| setup | `/sweep:init` | 初始化 E2E 项目：Playwright + MCP + 目录结构 |
| flow-create | `/sweep:plan` | 交互式生成 .flow.md 测试意图文档 |
| flow-run | `/sweep:run` | 读取 .flow.md → Playwright MCP 逐步骤执行 → 输出测试报告 |

- MVP 阶段纯 skills，不引入 agents/hooks（和 Tide 一致）
- 未来考虑 ci-diagnose skill 和 ci-monitor agent

#### 6. PRD 资源与跨仓库协调

- PRD 保存在钉钉云文档（统一共享资源），不在 GitHub 仓库
- Tide/Reef 通过 MCP 读取钉钉上的 PRD
- Sweep 同样从 PRD 读取验收标准，不需要经过 openspec
- 不需要在 Jira 中记录分支名作为协调机制
- Sweep 不需要修改已有的 jira-start skill

### Session Notes

- 初始认为 Sweep 需要依赖开发仓库的 spec/test-cases，后澄清不需要——直接从 PRD 出发更干净
- 初始认为需要生成 Playwright 代码文件，后转为 .flow.md + MCP 执行模式
- .flow.md 的合一设计（测试用例 + 执行计划）是本次讨论的关键洞察
