# Brainstorming Session — 2026-07-05

## 会话信息

- **日期：** 2026-07-05
- **议题：** CLI `update` 命令设计迭代 — 简化子命令，强化全量更新
- **参与者：** Bill（用户）、Claude

## 讨论内容

### 背景

2026-07-04 的 brainstorming 设计了 `deepstorm update` 的 `--check`/`--cli`/`--skills` 三个子选项。用户反馈认为子选项过多，希望简化为一个无选项的命令。

### 本次关键决策

1. **去掉全部子选项**：`deepstorm update` 无参数执行，不再保留 `--check`、`--cli`、`--skills`
2. **同步范围扩大**：不只是 skill，还包括 hooks、agents 等所有已安装资产
3. **读取安装在 .claude/settings.json**：从 `deepstorm.installedSkills` 读取用户已安装的内容，不再依赖 registry 的完整列表；同时读取 `deepstorm.tide.*`、`deepstorm.reef.*` 等配置项来精确确定要同步的内容
4. **用户修改保护**：对于用户已修改的文件——将用户版本加后缀保留（如 `.bak` 或时间戳标记），安装系统新版本，并告知用户哪些文件有改动
5. **`template upgrade` 不保留**：其功能完全合并到 `deepstorm update` 中

### 执行流程

```
deepstorm update:
  1. 检查 npm registry CLI 版本（同现有 updateCLI）
  2. 如有更新则自动 npm install -g @deepstorm/cli
  3. 读取 .claude/settings.json deepstorm 命名空间
  4. 获取 installedSkills、installedMcpServers 等安装记录
  5. 获取配置项（如 reef.frontend.framework 等）
  6. 仅为已安装的工具套件同步 skill/hooks/agents
  7. 对用户已修改的文件：备份旧版 → 覆盖新版 → 报告差异

不做的：
  - 不会安装用户未选过的技能
  - 不会覆盖用户明确修改过的文件（会备份）
```

### 与旧设计对比

| 维度 | 旧设计（2026-07-04） | 新设计（2026-07-05） |
|------|---------------------|---------------------|
| 命令 | `update` + `--check`/`--cli`/`--skills` | 纯 `update`，无子选项 |
| 同步范围 | 仅 skill 模板 | skill + hooks + agents + MCP |
| 安装判断 | `Object.keys(registry.skills)` | `deepstorm.installedSkills` + 配置项 |
| 用户修改 | 跳过 | 备份 + 覆盖 + 报告 |
| template upgrade | 保留 | 不保留，合入 update |

## 检查清单

- [x] 已明确"做什么"：简化 update 为无选项的全量更新命令，包含 CLI 升级 + 已装资产同步 + 用户修改检测
- [x] 已明确"不做什么"：不保留子选项、不安装未选内容
- [x] 已收敛到可执行的变更范围
