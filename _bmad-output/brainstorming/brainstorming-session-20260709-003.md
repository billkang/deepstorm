# Brainstorming Session — DeepStorm Update 命令未同步 Reef 资产

- **日期：** 2026-07-09
- **主题：** `deepstorm update` 未同步 Reef 项目的 hooks/agents/skills
- **参与角色：** User (Dev) / Claude (AI)

## 讨论内容

### 问题描述

完成 v0.3.3 版本发布后，用户在 playground 测试项目（E2E 测试环境，包含 sweep skills 和 reef 配置）执行 `deepstorm update`，发现 reef 的 hooks、`.sh` 模板文件（渲染为 `.sh`）、agent `.md` 文件均未更新。

### 初步怀疑

用户最初怀疑 `deepstorm setup` 命令实现有误，但确认后判断：**setup 命令是正确的，update 命令有问题，没有更新文件。**

### 根因分析

#### 数据流追踪

1. `registerUpdateCommand()`（`update.ts`）读取 `installedSkills` → 传给 `upgradeTemplates()` → 委托 `syncToolAssets()`
2. `syncToolAssets()` 内通过 `skillIdsToTools()` 将 `installedSkills` 反推为 tool 名称（如 `["sweep-init","sweep-plan","sweep-run"]` → `["sweep"]`）
3. 如果 `installedSkills` 中没有 reef 的任何 skill entry，`toolNames` 就是 `["sweep"]`，完全不处理 reef

#### 实际数据（playground 项目）

```json
{
  "installedSkills": [
    "deepstorm-mcp-jira-read", "deepstorm-mcp-feishu-wiki-read",
    "sweep-init", "sweep-plan", "sweep-run"
  ],
  "reef.techs": "frontend,backend",
  "reef.frontend.framework": "angular",
  "reef.backend.language": "java"
}
```

- `installedSkills` 中没有 reef 的任何 skill → `skillIdsToTools()` 只返回 `["sweep"]`
- 但配置中有 `deepstorm.reef.*` 键（表示用户已通过 setup 配置了 reef 选项）

#### 解决方案

在 `syncToolAssets()` 中增加从扁平配置 Key 前缀检测 tool 的机制：
- 扫描 `deepstorm.*` 配置的所有 Key，提取第一个 `.` 之前的 prefix
- 如果 prefix 在 `registry.tools` 中，则认为该 tool 已安装
- 与 `skillIdsToTools()` 结果合并去重，作为最终处理的 tool 列表

### 影响范围

- **修改文件：** `packages/cli/src/commands/template-upgrade.ts`
- **新增函数：** `detectToolsFromConfig(config, registry): string[]`
- **修改函数：** `syncToolAssets()` — 双来源合并 tool 名称
- **无需修改：** `update.ts`、`setup.ts`、build 流程、registry 结构

### 边界情况

| 场景 | 预期行为 |
|------|---------|
| `installedSkills` 完整（含 reef skills） | 按原有 `skillIdsToTools()` 检测，`configTools` 补充不额外影响 |
| `installedSkills` 为空，配置中也有 reef.* | `configTools` 发现 reef，正常同步 |
| `installedSkills` 和配置都为空 | `allTools` 为空，跳过同步并显示提示 |
| 配置中没有 `deepstorm.*` 命名空间 | `readSettingsConfig` 返回空 config，检测不到任何 tool |
| 无关的配置 key（如 `reef.xxx.invalid`） | 仍按 prefix 检测，不会报错 |
