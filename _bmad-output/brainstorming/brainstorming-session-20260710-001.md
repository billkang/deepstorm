# Brainstorming Session

- **Date:** 2026-07-10
- **Session:** 001
- **Source:** DeepStorm Flow — Step 1 BMAD 需求讨论

## 参与者

- 用户（产品/开发）
- Claude (DeepStorm Flow 引导)

## 讨论主题

为 `@deepstorm/cli` 新增 `init` 命令，提供独立于 `setup` 的项目脚手架初始化能力。

## 关键对话

### 背景

目前 `setup` 命令只负责安装 DeepStorm 插件环境（skills、agents、hooks、MCP 配置到 `.claude/`），不涉及用户应用项目的创建。需要一个 `init` 命令来填补「项目脚手架搭建」这个空白。

### 决策过程

**Q1：`init` 生成的脚手架是否同时安装 DeepStorm 插件？**
- 结论：**只初始化项目**。`init` 和 `setup` 保持独立，用户如果需要 DeepStorm 插件可以后续运行 `deepstorm setup`。

**Q2：脚手架模板的来源？**
- 结论：**内置在 CLI 包中**。类似 `create-react-app` 模式，模板文件放在 `packages/cli/` 下。

**Q3：首批支持的框架范围？**
- 结论：**沿用 reef 现有框架选项**。
  - 前端：Angular / React / Vue（带 UI 库、CSS、测试、TS 配置等子选项）
  - 后端：Java (Spring Boot) / Python (FastAPI)（带 ORM、迁移、测试等子选项）

### 未解决的问题

- 具体脚手架目录结构（`frontend/` + `backend/` 还是同层混放？）
- 模板文件的具体内容（每种组合的最小骨架）
- 前端+后端是否必须同时选，还是可以只选一个？

## 产出物

- `packages/cli/src/commands/init.ts` — 新命令入口
- `packages/cli/src/templates/init/` — 项目脚手架模板目录

## 下一步

→ Step 2: `/opsx:new` 创建 OpenSpec change
