## Context

DeepStorm CLI (`@deepstorm/cli`) 当前通过 `setup` 命令将 skills/agents/hooks 安装到项目的 `.claude/` 目录下。部分团队不希望将这些文件纳入代码仓库管理。

插件机制（Claude Plugin）是官方支持的替代方案：Plugin 是一个自包含的目录结构，通过 `/plugin install` 安装，不依赖 `.claude/` 目录。参考实现为 `lc-toolkit`。

本变更新增 `plugin build` 命令，复用现有 `setup` 的向导和渲染引擎，将 DeepStorm 工具套件构建为可安装的 Claude Plugin。

## 目标

- 在 `@deepstorm/cli` 中新增 `plugin build` 子命令
- 复用 `setup` 的完整向导流程（MCP 选择、工具套件选择、语言/框架配置）
- 在向导之前新增 marketplace name 输入环节
- 构建产出物为完整 Claude Plugin 目录（.deepstorm/plugins/deepstorm/）
- 构建产出物可直接通过 `/plugin install` 安装使用
- 不修改现有 `setup` 功能

## 非目标

- 本变更不实现 `plugin install` 命令（用户使用 Claude Code 内置的 `/plugin install`）
- 本变更不实现插件发布/市场功能
- 本变更不修改现有 `setup` 的向导流程或产出物

## 决策

### 决策 1：`plugin build` 作为独立子命令注册

**选择：** 在 `src/index.ts` 中新增 `registerPluginBuildCommand(program, registry)`，与 `registerSetupCommand` 同级。

**Alternatives considered：**
- 在 `setup` 命令中加 `--output plugin` 参数 — ❹ 导致 setup 职责不单一，逻辑分支过多
- 新的单独 CLI 入口 — ❹ 无法复用现有 RegistryReader 和 installer 模块

### 决策 2：向导流程 — 包装模式

**选择：** `plugin build` 向导 = 新增 market name 输入 → 复用 setup 现有向导流程。

```
市场名输入 ──► MCP 选择 (复用) ──► 工具选择 (复用) ──► 配置问答 (复用)
```

向导结果传递给构建函数，而不是传给 `installAllToolAssets` 写入 `.claude/`。

**Wizard 模块复用清单：**
| 模块 | 复用方式 |
|------|---------|
| `wizard/tool-select.ts` — `selectTools()` | 直接调用 |
| `wizard/mcp-select.ts` — `selectMcpTools()` | 直接调用 |
| `wizard/questionnaire.ts` — `runQuestionnaire()` | 直接调用 |
| `template/registry.ts` — `buildTemplateVariables()` | 直接调用 |

### 决策 3：构建引擎 — 复用 installer 逻辑，重定向输出

**选择：** 复用 `installAllToolAssets()` 的核心渲染逻辑，但将输出目标从 `.claude/` 切换到 plugin 目录。

实现方式：
1. 对每个选中的工具，调用 `installAllToolAssets()` 但传入 plugin 目录作为 `targetDir`
2. 构建完成后，在 plugin 根目录补充 Plugin 专属文件（`.claude-plugin/`, `.mcp.json`, `settings.json`, `.env.example`, `README.md`, `CHANGELOG.md`）

**Alternatives considered：**
- 完全重写输出逻辑 — ❹ 与现有 installer 重复，维护两套渲染逻辑
- 先安装到 `.claude/` 再复制 — ❹ 多余步骤，且会污染用户的 `.claude/`

### 决策 4：市场名作为 `plugin.json` 和 `marketplace.json` 的输入

**选择：** 用户在向导第一步输入的市场名同时影响：

```jsonc
// marketplace.json
{
  "name": "<market-name>",       // ← 用户输入
  "plugins": [{ "name": "deepstorm", ... }]  // "deepstorm" 固定
}

// plugin.json  
{
  "name": "deepstorm",            // ← 固定
  "version": "<root package.json version>"
}
```

插件名 `deepstorm` 固定不可修改，但市场名（vendor namespace）可自定义。

### 决策 5：构建目录使用删除-重建策略

**选择：** 构建前检查 `.deepstorm/plugins/deepstorm/`。如已存在，先删除目录再构建。不提供 `--force` 保护（因为是纯构建产物，重建是预期行为）。

### 决策 6：README.md 动态生成

**选择：** 根据用户选择的工具套件，构建时动态生成 README.md，包含：
- DeepStorm 项目介绍
- 所选工具套件列表及说明
- 所选 MCP 服务列表
- 安装和使用说明

### 决策 7：.gitignore 自动管理

**选择：** 构建完成后检查项目根目录 `.gitignore`，如尚无 `.deepstorm/` 规则则追加。只追加不删除。

## 风险与权衡

| 风险 | 缓解措施 |
|------|---------|
| 复用 installer 逻辑可能导致 setup 和 plugin build 耦合过紧 | 通过独立命令入口和独立输出路径解耦，共享的核心模块通过接口而非内部状态通信 |
| 模板渲染依赖 dist/ 目录（需要先 `pnpm build`） | 与 setup 一致，无额外风险 |
| 插件 skills 中引用了 `.claude/` 相关路径 | 确保所有模板变量不依赖 `.claude/` 路径；插件中的路径是自引用的 |
| `.gitignore` 追加操作可能重复 | 先读取现有 `.gitignore` 内容，仅在不存在时追加 |

## 产出目录结构

```
<project>/.deepstorm/plugins/deepstorm/
├── .claude-plugin/
│   ├── marketplace.json     ← 市场名用户自定义，plugin name 固定为 "deepstorm"
│   └── plugin.json          ← name: "deepstorm", version: 取自 package.json
├── skills/                  ← 按工具套件生成（含模板渲染）
│   ├── tide-discuss/
│   ├── reef-review/
│   └── ...
├── agents/                  ← 按工具套件生成
│   ├── reef-review-backend.md
│   └── ...
├── hooks/                   ← 按工具套件生成
│   ├── hooks.json
│   ├── auto-format.sh
│   └── ...
├── .mcp.json                ← 仅含用户选中的 MCP 服务
├── settings.json            ← { "enabledMcpjsonServers": [...] }
├── .env.example             ← 所选 MCP 服务对应的环境变量模板
├── README.md                ← DeepStorm 介绍 + 所选工具信息
└── CHANGELOG.md             ← 版本变更记录
```

## 实现文件清单

| 文件 | 说明 |
|------|------|
| `packages/cli/src/commands/plugin-build.ts` | 新增：`plugin build` 命令主逻辑 |
| `packages/cli/src/commands/plugin-build-wizard.ts` | 新增：市场名输入向导模块 |
| `packages/cli/src/index.ts` | 修改：注册 `plugin build` 命令 |
| `packages/cli/src/engine/plugin-builder.ts` | 新增：Plugin 目录构建引擎 |
| `packages/cli/src/engine/readme-generator.ts` | 新增：动态 README.md 生成器 |
| `.gitignore` | 修改：添加 `.deepstorm/` 忽略规则 |
