## Why

`@deepstorm/cli` 目前缺少独立生成项目脚手架的能力。`setup` 命令只负责安装 DeepStorm 插件环境（skills/agents/hooks/MCP），不涉及用户应用项目的创建。用户在开始新项目时，需要手动搭建前端/后端项目骨架，这增加了上手摩擦。

新增 `init` 命令填补这一空白，让用户可以一键生成完整的应用项目脚手架，复用 reef 已有的前端/后端技术栈选项。

## What Changes

- **新增** `deepstorm init` 命令，独立于 `setup`，用于创建新项目脚手架
- **新增** 内置项目模板目录，包含 Angular / React / Vue 前端模板和 Java (Spring Boot) / Python (FastAPI) 后端模板
- **新增** 交互式问答流程，引导用户选择技术栈组合
- **注册** `init` 为 CLI 子命令，与现有 `setup`/`update`/`doctor` 等平级

## Capabilities

### New Capabilities

- `init-command`: CLI 命令入口 — 注册 `init` 子命令，解析参数，启动交互式问答流程
- `project-scaffold`: 项目脚手架生成 — 根据用户选择的技术栈，从内置模板渲染并生成完整的项目目录结构、配置文件和代码骨架

### Modified Capabilities

（无）

## Impact

- `packages/cli/src/commands/` — 新增 `init.ts` 命令文件
- `packages/cli/src/` — 新增 `templates/init/` 模板目录
- `packages/cli/src/index.ts` — 注册 `init` 命令
- `packages/cli/package.json` — 如果新增模板引擎依赖，需更新依赖声明
