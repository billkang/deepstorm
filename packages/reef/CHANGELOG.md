# @deepstorm/reef

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

### Patch Changes

- 补充 Java 代码风格中注释与逻辑块之间的空行规则

  修复 reef-commit 中 JIRA 行与正文之间缺少空行的问题

## 0.1.0

- **代码规范生成** — 后端（Java Spring Boot / Python FastAPI）+ 前端（Angular）
  - Fragment 架构：按维度（API 规范、依赖管理、异常处理、安全红线、ORM、测试、AI 集成等）组合成完整 SKILL.md
  - 后端代码折行规范（方法签名、Stream 管道、Builder、注解、Text Block 等）
  - 前端代码规范（TypeScript 严格模式、Tailwind、PrimeNG）
- **后端代码生成** — Entity → DTO → Mapper → Repository → Service → Controller
- **前端代码生成** — Angular 组件 / 服务 / 路由
- **代码审查 Agent** — Java / Python / Angular / 基础设施专项审查
- **自动格式化 Hook** — google-java-format / ruff / eslint 自动修复
- **提交辅助** — 智能 commit message 生成
- **开发流程** — reef-start → reef-scope → reef-gen → reef-review → reef-harden → reef-commit
- **安全红线** — P0/P1 规则嵌入代码审查和生成流程
- **Figma 设计审查** — 设计稿与实现对比分析
