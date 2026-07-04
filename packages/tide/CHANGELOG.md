# @deepstorm/tide

## 0.1.2

### Patch Changes

- refactor: 扁平化插件输出目录 .deepstorm/plugins/deepstorm/ → .deepstorm/

  style: 统一代码折行列宽规范（前端 90 / 后端 100）

  chore: 移除 reef-auto-format hook 中的 Java 自动格式化

  docs: 完善 Java 代码折行规范并清理 google-java-format 残留

  docs: 补充 Java 代码风格中注释与逻辑块之间的空行规则

  fix: reef-commit 中 JIRA 行与正文之间缺少空行

  fix: plugin.json 缺少 hooks 声明导致 plugin 模式下 hooks 不触发

  chore: 归档 plugin-hooks-registration + 同步 main specs

## 0.1.1

## 0.1.0

- BMAD 深度需求讨论 — 多角色 agent（PM / 架构师 / 开发者 / UX / 分析师）协作 elicitation
- PRD 生成与管理 — 从需求讨论到结构化 PRD 文档
- Jira 发布集成 — PRD → epic / story / task 同步到 Jira
- 会话管理 — sessionId 格式 `tide-YYYYMMDD-NNN`
- 需求讨论技巧库 — 多轮聚焦 questioning 避免过拟合
