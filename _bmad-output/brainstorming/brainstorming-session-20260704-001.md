# Brainstorming Session — 2026-07-04

## 会话信息

- **日期：** 2026-07-04
- **议题：** CLI `update` 命令设计
- **参与者：** Bill（用户）、Claude

## 讨论内容

### 背景

`@deepstorm/cli` 目前没有自更新功能。现有的 `deepstorm template upgrade` 命令只能同步内置 skill 模板文件到项目 `.claude/skills/` 目录，不能更新 CLI 本身。CLI 的版本号在 `index.ts` 中硬编码为 `0.1.0`，与 `package.json` 中的 `0.1.2` 不同步（bug）。

### 关键决策

1. **命令名：`deepstorm update`**
   - 参考行业惯例：rustup、asdf、sdkman、npm 等工具均使用 `update` 作为自更新动词
   - `upgrade` 偏向下游依赖升级语义（brew upgrade, apt upgrade），与 DeepStorm 的 skill 同步场景不匹配
   - 命令名确定为 `update`，不再保留 `upgrade` 子命令

2. **功能范围合并**
   - 将 `template upgrade` 的能力合并到 `update` 中
   - `update` 命令同时覆盖：CLI 自身版本检查和更新 + skill 模板同步

3. **子选项设计**
   - `deepstorm update` — 全量更新（检查 CLI 版本 + 同步 skill 模板）
   - `deepstorm update --check` — 只查看版本信息，不执行更新
   - `deepstorm update --cli` — 只更新 CLI 自身（npm install -g @deepstorm/cli）
   - `deepstorm update --skills` — 只同步 skill 模板（取代原 `template upgrade`）

### 待办问题

- CLI 自身更新策略：通过 `npm install -g @deepstorm/cli` 还是下载 tarball？初步定 npm
- `index.ts` 中硬编码版本号需从 `package.json` 读取

## 检查清单

- [x] 已明确"做什么"：实现 `deepstorm update` 命令
- [x] 已明确"不做什么"：不保留 `template upgrade` 命令（功能合并）
- [x] 已收敛到可执行的变更范围
- [ ] 变更名称确认后进入 Step 2
