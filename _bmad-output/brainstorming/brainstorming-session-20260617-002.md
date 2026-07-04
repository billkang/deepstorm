# Brainstorming Session: DeepStorm Plugin Build 命令

- **日期**: 2026-06-17
- **参与者**: billkang, Claude
- **主题**: 新增 `deepstorm plugin build` 命令，构建 Claude Plugin 产出物

---

## 背景

DeepStorm 当前有 `deepstorm setup` 命令，通过向导让用户选择 MCP 服务、工具套件（Tide/Reef/Sweep/Atoll）、语言/框架等，然后将 skills/agents/hooks 安装到项目的 `.claude/` 目录下。

现需新增 `deepstorm plugin build` 命令，复用 setup 的向导逻辑，但产出是一个独立的 Claude Plugin 目录，可通过 Claude Code 的 `/plugin install` 命令安装使用。

## 参考实现

- `/Users/billkang/workspace/lc-toolkit` — Claude Plugin 的参考实现
- Plugin 结构：`.claude-plugin/marketplace.json` + `plugin.json`、`skills/`、`agents/`、`hooks/`、`.mcp.json`、`settings.json`

## 关键决策

| 决策 | 结论 |
|------|------|
| **变更名** | `build-plugin` |
| **命令名** | `deepstorm plugin build`（`@deepstorm/cli` 的子命令） |
| **输入** | 复用 setup 的完整向导流程（MCP 选择、工具套件选择、语言/框架配置） |
| **插件名** | 固定为 `deepstorm`，不可修改 |
| **市场名** | 向导中让用户自定义输入（如 "example-org"） |
| **版本号** | 从 root `package.json` 读取 |
| **原作者** | `author: "deepstorm"` |
| **仓库** | 暂不写入 |
| **描述** | 从 root `package.json` 取 |
| **构建产出目录** | `.deepstorm/plugins/deepstorm/` |
| **目录已存在** | 先删除再重建（`--force` 保护） |
| **README/CHANGELOG** | 包含，README 生成实际内容（DeepStorm 介绍 + 所选工具信息） |
| **.env.example** | 包含 |
| **.gitignore** | 添加 `.deepstorm/` 忽略规则 |
| **交互模式** | 纯向导模式，暂不支持 `--non-interactive` |
| **plugin install** | 本次不做，用户用 Claude Code 内置 `/plugin install` 安装 |

## 产出物结构

```
.deepstorm/plugins/deepstorm/
├── .claude-plugin/
│   ├── marketplace.json   ← 市场名用户自定义
│   └── plugin.json        ← name: "deepstorm", version: 取自 package.json
├── skills/                ← 根据选择的工具套件生成
├── agents/                ← 根据选择的工具套件生成
├── hooks/                 ← 根据选择的工具套件生成
├── .mcp.json              ← 根据选择的 MCP 服务生成
├── settings.json          ← enabledMcpjsonServers
├── .env.example           ← MCP 环境变量模板
├── README.md              ← DeepStorm 介绍 + 所选工具套件说明
└── CHANGELOG.md           ← 版本变更记录
```

## 向导流程

1. **Step 1**: 输入 marketplace name（自定义市场名）
2. **Step 2-4**: 复用 setup 向导（MCP 选择 → 工具套件选择 → 语言/框架配置）
3. **Step 5**: 确认构建配置并执行
