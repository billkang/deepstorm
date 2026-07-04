# Brainstorming 记录

- **日期：** 2026-06-16
- **主题：** reef/skills markdown 文件体积优化
- **参与角色：** 用户（产品方）、Claude（开发方）

## 讨论内容

### 问题陈述

`packages/reef/skills/` 目录下的 markdown 文件存在体积问题：

1. **单文件过大**：最大的文件 `code-wrapping.md`（前端 Angular）416 行
2. **组合后过大**：当 `quick-reference.md` + `examples/` 文件一起加载到 LLM 上下文时，总行数显著增加
3. **冗余内容**：quick-reference 和 examples 之间存在重复的代码示例

### 已确认的现状

| 指标 | 数值 |
|------|------|
| 总文件数 | 47 |
| 总行数 | ~5,782 |
| 最大文件 | `reef-style-frontend/variants/angular/examples/code-wrapping.md` — 416 行 |
| 第二大 | `reef-style-backend/fragments/java/framework/spring-boot/examples/service-entity.md` — 356 行 |
| 最大目录 | `reef-style-backend/` — 128K |

### 关键发现

1. **code-wrapping.md**（前端 416 行，后端 211 行）：代码折行指南，每个规则都配了正例+反例，很多规则很明显不需要对比
2. **service-entity.md**（356 行）：Spring Boot 后端模式指南，包含完整 imports/类声明，很多样板代码
3. **testing.md**（253 行）：测试指南，多种测试类型（组件/Service/Pipe/Signal/E2E/Testing Library）各配完整示例
4. **database-migration.md**（252 行）：Liquibase XML 迁移指南，每种操作配完整 XML
5. **quick-reference.md**（Spring Boot 224 行）：速查表中有完整代码块，与 examples/ 重叠
6. **entity-types.md**（218 行）：前端实体类型指南
7. 多处 quick-reference 与 examples 的代码内容重叠

### 决定方向

- 不减内容（保留所有规则和规范点）
- 精简表达方式（更紧凑的代码示例、移除冗余样板、删除不必要的正反对比）
- quick-reference 只保留真正的"速查"内容，完整示例引用到 examples/
- 少数相关小文件可以合并

## 下一步

进入 Step 2 — `/opsx:new` 创建 OpenSpec change。
