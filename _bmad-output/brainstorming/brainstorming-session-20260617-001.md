# Brainstorming 记录

- **日期：** 2026-06-17
- **主题：** Setup 流程重组 + Sweep E2E 框架选择能力
- **参与角色：** 用户（产品方）、Claude（开发方）

## 讨论内容

### 背景

当前 DeepStorm `setup` 流程（`packages/cli/src/commands/setup.ts`）的执行顺序是：

```
① MCP 服务选择（全量列表）→ ② 工具套件选择 → ③ 问卷（技术选型）
```

存在问题：
1. 用户还没选择要装哪些工具，就先看到一长串 MCP 服务列表，缺乏上下文
2. MCP 选型与工具选型脱钩——用户可能选了不需要的 MCP，或漏掉需要的
3. Sweep 的 wizard.json 没有任何问卷问题，缺少 e2e 框架选择能力
4. Sweep 的 SKILL.md 中 Playwright 是硬编码的，无法适应不同团队的框架选型

### 需求 1：Setup 流程重组

**新流程顺序：**

```
① 工具套件选择（tide / reef / sweep / atoll）
   ↓
② MCP 服务选择（根据已选工具动态过滤）
   ↓
③ 问卷（仅涉及已选工具的技术选型问题）
```

**工具 → MCP 映射关系：**

| 工具 | 关联 MCP 服务 |
|------|-------------|
| tide | jira, dingding, figma |
| reef | jira, dingding, figma, github, context7 |
| sweep | jira, dingding, playwright |
| atoll | jira, dingding |

> 注意：playwright 以 MCP 服务形式出现在 sweep 的选项中，由 CLI 统一管理配置，不再由 sweep-init 单独处理。

### 需求 2：Sweep E2E 框架选择

- Sweep wizard.json 增加 `e2eFramework` 问卷问题
- 当前唯一选项为 `playwright`，但设计需支持后续扩展（如 cypress、webdriverio 等）
- Sweep 的三个 SKILL.md（sweep-init / sweep-plan / sweep-run）需要改造：
  - 从配置中读取框架选择，而非硬编码
  - 根据框架生成对应的配置文件/代码

### 范围确认

| 维度 | 内容 |
|------|------|
| **新能力** | Setup 流程重组、Sweep E2E 框架选择 |
| **修改** | CLI wizard 流程、MCP 选择过滤逻辑、Sweep wizard.json、Sweep 三个 SKILL.md |
| **不变** | 现有 MCP 服务定义、工具套件本身的逻辑、Reef wizard.json |
| **影响范围** | `packages/cli/src/commands/setup.ts`、`packages/cli/src/wizard/mcp-select.ts`、`packages/sweep/wizard.json`、`packages/sweep/skills/sweep-init/SKILL.md`、`packages/sweep/skills/sweep-plan/SKILL.md.tmpl`、`packages/sweep/skills/sweep-run/SKILL.md`、`packages/cli/mcp/`（可能新增 playwright MCP 定义） |

### 决定方向

- 两个需求合并为一个变更
- Setup 流程保持非交互模式兼容（`--non-interactive`、`--tools`、`--mcp-tools`、`--set`）
- Sweep 框架选择先用 wizard 问题，后续扩展只改 wizard.json + SKILL.md
- Playwright MCP 服务配置从 sweep-init 迁移到 CLI setup wizard 统一管理

## 下一步

进入 Step 2 — `/opsx:new` 创建 OpenSpec change。
