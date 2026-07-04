# @deepstorm/sweep

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

- **测试生成** — 基于代码分析自动生成单元测试 / 集成测试 / E2E 测试
- **测试计划** — 分层测试策略制定（单元 → 集成 → E2E → 手动探索）
- **测试执行** — 测试运行、失败分析、重试策略
- MCP hook 集成 — 外部测试工具联动
