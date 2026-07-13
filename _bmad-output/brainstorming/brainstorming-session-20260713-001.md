# Brainstorming Session

- **Date:** 2026-07-13
- **Topic:** DeepStorm CLI 安装用户体验优化
- **Participants:** user (billkang) + Claude

## 背景与动机

用户在安装 DeepStorm 工具套件的过程中发现两个 UX 问题：
1. `deepstorm init` 已经选择了技术方案（Angular/Java/Spring Boot 等），但 `deepstorm setup` 安装 reef 时又要重新选一遍。虽然 init 和 setup 做的事情不同（init 是脚手架，setup 是 Claude 环境），但技术方案一般不会在前后的几分钟里变化。
2. 安装 tide 时已选择了 MCP 服务（jira、feishu-wiki、figma），安装 reef 时又提示用户选择和配置。实际场景中用户可能分次安装不同工具，已经配置过的 MCP 不应重复提示。

## 讨论过程

### 问题 1：init → setup 重复问技术方案

- `init` 和 `setup` 是完全独立的两个命令，没有共享状态
- `init` 问：前端(Angular) → UI库 → CSS → 后端(Java) → ORM → 迁移工具 → AI框架
- `setup` 的 reef 问：前端/后端 → 框架(Angular/React/Vue) → UI库 → CSS → 测试框架 → ...
- 选项高度重叠，但没有任何数据通道

**用户选择：** init 选择的方案 → setup 直接跳过对应的问卷（A）+ init 完成后提示继续 setup（C）

### 问题 2：MCP 跨工具重复提示

- Tide 依赖 jira/feishu-wiki/figma，Reef 也依赖同样的 + github/context7
- `configuredKeys` 只在一个 `setup` 进程内有效
- 跨 session 运行时不知道哪些 MCP 已经装过

**用户选择：** 已装且 `.env` key 完整的 MCP 完全隐藏（B）

### 额外发现的 3 个问题

1. **setup 二次运行时全部重来** — 追加安装新工具时会重新列出所有工具、所有问卷
2. **安装引导不够直观** — guide 只列出 env 变量，不区分已配/未配
3. **MCP 状态端到端不可见** — 不知道哪些 key 漏了

### 方案选择

用户选择了**方案 A（推荐）**：以 `.claude/settings.json` 为唯一 truth source，所有命令读写它。

### 详细设计共识

| 模块 | 设计 |
|------|------|
| init 写配置 | init 结束时将技术方案写入 `deepstorm.reef.*`，只写它问过的字段 |
| init → setup 跳转 | init 完成后提示"是否继续安装 DeepStorm 环境？"，选 Yes 后直接在进程内调 setup |
| setup 读已有配置 | 启动时读 `settings.json` 填充 `configuredKeys`，跳过已配问题 |
| 整组跳过 | 如果 `reef.techs` 已有完整配置，跳过 reef 整组问卷 |
| selectTools 默认勾选 | 已装工具在 multiselect 中默认选中 |
| selectMcpTools 过滤 | 传入 `installedMcpServers`，隐藏已装且 key 完整的 MCP |
| `.env` key 完整性检测 | 按 MCP 分组检查 `.env` 中的所有 key 是否有非默认值 |
| Guide 分组展示 | 安装完成后按服务展示 ✅ / ⚠️ / ❌ 状态 |
| 二次运行幂等 | deepMerge 增量安装，不覆盖已有配置 |

## 决定

采用方案 A（配置优先 + 状态感知），走 OpenSpec 流程正式产出 spec，然后实现。

## 相关链接

- CLAUDE.md: 记录了各套件与 CLI 的联动约束
- memory: `suite-changes-need-cli-sync.md` — 修改套件内容时必须同步更新 CLI
