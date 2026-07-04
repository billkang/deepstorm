## Context

### 背景

当前 `deepstorm setup` 的执行顺序为：

```
Step 1: MCP 服务选择 ← 用户在不知道选什么工具的情况下面对全量 MCP 列表
Step 2: 工具套件选择
Step 3: 问卷（技术选型）
```

这种顺序导致用户缺少决策上下文，且 MCP 与工具的选择完全脱钩。同时，Sweep 的 E2E 框架（Playwright）在 SKILL.md 中硬编码，wizard.json 为空，无法满足不同团队的选型需求。

### 现状

- **CLI setup**（`packages/cli/src/commands/setup.ts`）: 三步线性执行，MCP 全量展示
- **MCP 选择**（`packages/cli/src/wizard/mcp-select.ts`）: 展示所有 MCP 服务，无过滤
- **工具选择**（`packages/cli/src/wizard/tool-select.ts`）: 多选，独立于 MCP
- **问卷**（`packages/cli/src/wizard/questionnaire.ts`）: 展示所有已注册工具的 wizard 问题
- **Registry**（`packages/cli/src/engine/registry.ts`）: 提供工具/MCP/wizard 元数据，但无工具→MCP 映射
- **Sweep skill 模板**（`packages/sweep/skills/sweep-init/SKILL.md`）: Playwright 硬编码在 markdown 中
- **Sweep wizard.json**: 空的（无问题）
- **MCP 服务定义**（`packages/cli/mcp/`）: 有 jira/github/figma/dingtalk-wiki/context7，无 playwright

### 约束

- 非交互模式（`--non-interactive`、`--tools`、`--mcp-tools`、`--set`）必须保持兼容
- Context7 默认勾选（当它出现在过滤后列表中时）
- Sweep E2E 框架设计需可扩展，后续新增框架只需改 wizard.json + SKILL.md
- Playwright MCP 使用 WebSocket（`ws://`）协议，不同于其他 MCP 的 HTTP/SSE

## Goals / Non-Goals

**Goals:**
- 将 setup 流程改为「工具选择 → MCP 选择（按工具过滤）→ 问卷」
- 建立工具 ↔ MCP 的映射关系，并嵌入 registry
- 新增 Playwright MCP 服务定义
- Sweep wizard.json 增加 e2eFramework 选择
- 改造 Sweep 三个 SKILL.md 为框架可配置
- Playwright MCP 配置从 sweep-init 迁移到 CLI 统一管理

**Non-Goals:**
- 不改动各工具自身逻辑（tide/reef/atoll 核心逻辑不变）
- 不改动现有非 DeepStorm 管理的 MCP 服务配置
- 不新增除 Playwright 外的 E2E 框架（仅预留扩展点）
- 不修改问卷渲染引擎（questionnaire.ts）本身的逻辑

## Decisions

### Decision 1: 工具→MCP 映射存储位置

**结论：** 在 Registry 类型中新增 `mcpDependencies` 字段，每个工具的 registry 条目包含其关联的 MCP 服务列表。

**备选方案：**

| 方案 | 说明 | 评价 |
|------|------|------|
| ✅ **Registry `mcpDependencies`** | 在每个工具的 registry entry 中新增 `mcpDependencies: string[]` | **选择**。registry 已聚合工具元数据，一劳永逸；构建时从 wizard.json 读取或硬编码在 build-registry.ts |
| ❌ `wizard.json` 扩展 | 在每个工具包的 `wizard.json` 中新增 `mcpDependencies` 字段 | 耦合了 wizard 和 MCP 两层概念，wizard.json 语义不匹配 |
| ❌ 独立映射文件 | 在 `packages/cli/` 下新增 `tool-mcp-mapping.json` | 多一个配置文件要维护；映射关系变更时容易忘记同步 |

**理由：** Registry 是 CLI 运行时的元数据中心，工具→MCP 映射是元数据的一部分。将其放在 registry 中，mcp-select.ts 可以直接通过 `registry.getToolsMcpDeps(toolNames)` 获取，无需额外的 IO 或配置。

### Decision 2: MCP 过滤实现方式

**结论：** `mcp-select.ts` 接收已选工具列表作为参数，调用 registry 查询工具关联的 MCP 服务，生成过滤后的选项列表。

**流程：**
1. `runSetup()` 先调用 `selectTools()` → 得到 `selectedTools: string[]`
2. 调用 `selectMcpTools(selectedTools)` → 内部通过 `registry.getMcpDeps(selectedTools)` 获取关联 MCP 列表
3. 将全量 MCP 选项与关联列表取交集，仅展示交集部分
4. 每项标注来源工具（如 `"Jira — 被 tide, reef 依赖"`）

**备选方案：**

| 方案 | 说明 | 评价 |
|------|------|------|
| ✅ **mcp-select 接收 selectedTools** | 作为参数传入，内部过滤 | **选择**。最小改动，函数接口清晰 |
| ❌ 在 setup.ts 中预过滤再传入 | 调用方先算好 filtered list 再传 | 逻辑散落在调用方，不利于测试 |

### Decision 3: Playwright MCP 服务定义

**结论：** 在 `packages/cli/mcp/` 下新增 `e2e-testing/playwright.json`。Playwright 使用 `ws://` 协议，与其他 MCP 的 `STDIO` 模式不同。

```
packages/cli/mcp/
├── project-management/
│   └── jira.json
├── code-hosting/
│   └── github.json
├── design-tools/
│   └── figma.json
├── knowledge-base/
│   └── dingtalk-wiki.json
├── docs-reference/
│   └── context7.json
└── e2e-testing/           ← 新增领域分组
    └── playwright.json    ← 新增
```

Playwright MCP 配置示例：
```json
{
  "name": "playwright",
  "domain": "e2e-testing",
  "label": "Playwright",
  "description": "Browser automation for E2E testing",
  "mcpServers": {
    "deepstorm-playwright": {
      "type": "ws",
      "url": "${❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）}"
    }
  },
  "envVars": {
    "❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）": {
      "description": "Playwright WebSocket Endpoint",
      "default": "ws://localhost:54321"
    }
  },
  "mcpSkills": ["deepstorm-mcp-playwright-read"],
  "defaultMCPPort": 54321
}
```

### Decision 4: Sweep 框架配置传递给 SKILL.md

**结论：** 通过 Handlebars 模板变量 `{{deepstorm.sweep.e2eFramework}}` 传递给 SKILL.md 模板。

**流程：**
1. wizard.json 中的 `e2eFramework` 问题将用户选择保存为配置值
2. `setup.ts` 最终将其写入 `.claude/settings.json` 的 `deepstorm.sweep.e2eFramework`
3. 模板渲染阶段，`registry.ts` 读取配置并注入 Handlebars 上下文
4. SKILL.md 模板使用 `{{#if (eq deepstorm.sweep.e2eFramework "playwright")}}` 判断框架

**备选方案：**

| 方案 | 说明 | 评价 |
|------|------|------|
| ✅ **Handlebars 模板变量** | 使用 `{{deepstorm.sweep.e2eFramework}}` 条件判断 | **选择**。与现有模板渲染机制一致，零新依赖 |
| ❌ SKILL.md 运行时读取 settings.json | skill 自身读取 `.claude/settings.json` | skill 每次运行都要读文件，冗余且增加延迟 |
| ❌ 环境变量传递 | 通过 `DEEPSTORM_SWEEP_E2E` 传递 | 不正确，这是安装时配置而非运行时配置 |

### Decision 5: Sweep SKILL.md 改造策略

**结论：** 只修改 SKILL.md 中与 Playwright 直接相关的部分，使用 `{{#if}}` 条件包裹。不改变 SKILL.md 的整体结构和流程。

| Skill | 改动范围 |
|-------|---------|
| `sweep-init/SKILL.md` | Playwright config 生成改为 `{{#if}}` 条件；MCP 配置检查改为读取 `.mcp.json` 而非 `.claude/settings.json` |
| `sweep-plan/SKILL.md.tmpl` | 引用 Playwright MCP 的 `mcpCapabilities` 声明改为动态（不硬编码） |
| `sweep-run/SKILL.md` | Playwright MCP 引用从 `.claude/settings.json` 改为 `.mcp.json` |

### Decision 6: mcp-select.ts 的非交互模式兼容

**结论：** `--mcp-tools` 参数在非交互模式下仍然接受逗号分隔的列表，但与 `--tools` 参数交叉验证。

```
deepstorm setup --non-interactive --tools reef,sweep --mcp-tools jira,github,playwright
```

验证逻辑：
1. 解析 `--tools` 获取已选工具列表
2. 查询工具→MCP 映射，获取允许的 MCP 列表
3. `--mcp-tools` 中的值若不在允许列表中，输出 warning 并忽略
4. 若 `--tools` 未指定，`--mcp-tools` 可独立指定（向后兼容）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 工具→MCP 映射变更时可能遗漏同步 | 映射集中在 registry 一处维护，变更时只看 registry 类型定义 |
| Context7 默认勾选在过滤后列表中可能不出现 | Context7 当前仅与 reef 关联；用户未选 reef 时不展示，这是预期行为 |
| 用户升级后旧配置（不包含 e2eFramework）导致 SKILL.md 渲染异常 | 模板中 `{{#if}}` 对空值/未定义做 false 处理，降级为仅创建目录结构 |
| Sweep 用户升级后 `.mcp.json` 中无 playwright 但 SKILL.md 期望它存在 | sweep-init 检查 `.mcp.json`，若无则提示运行 setup 而非静默失败 |
| `--mcp-tools playwright` 但未选 sweep 时需要兼容处理 | CLI 验证逻辑会忽略并 warning，不影响安装 |
| Playwright 的 WebSocket MCP 模式与已有的 STDIO 模式不同 | mcp.json schema 支持 `type: "ws"` 字段，与现有 STDIO 模式共存 |
