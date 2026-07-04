# Reef 技能改造 — 语言/框架动态化

- **日期：** 2026-06-16
- **参与角色：** Dev
- **讨论类型：** 结构化需求讨论

## 背景

reef 技能集中，`reef-style-backend` 和 `reef-style-frontend` 已实现根据 setup 阶段用户语言/框架选择的动态内容生成（`.tmpl` + `variants/` + `fragments/`）。但 `reef-gen-backend`、`reef-gen-frontend`、`reef-review` 仍存在硬编码的 Java/Liquibase 假设，`reef-migrate` 完全硬编码为 Liquibase 专用。

## 讨论内容

### 问题定义

1. **`reef-gen-backend`** — 工作流内容充满 Java 特有内容（`./gradlew`、`src/main/java`、MapStruct/Liquibase 引用），需要动态化
2. **`reef-gen-frontend`** — 工作流内容充满 Angular 特有内容（`src/main/web/`、`pnpm`、PrimeNG），当有其他前端框架时不可用
3. **`reef-review`** — 虽已模板化，但内容过时：agent 路径引用错误 (`../reef/agents/` → 应为安装后路径 `../../agents/`)、Liquibase 路径硬编码、冗余代码
4. **`reef-migrate`** — 完全 Java/Liquibase 硬编码，可废弃

### 决定的方案

#### 总体原则
遵循 `reef-style-backend`/`reef-style-frontend` 已建立的模式：
- `.tmpl` 只做骨架结构和条件判断
- 语言/框架特有内容放入 `variants/{value}/`
- 子维度特有内容放入 `fragments/{category}/{value}/`
- 不修改渲染引擎，不新增配置维度

#### 各技能改造方案

| 技能 | 改造方式 | 说明 |
|------|---------|------|
| `reef-gen-backend` | `.md` → `.tmpl` + `variants/` | 通用工作流在 `.tmpl`，语言特有步骤在 `variants/java/steps.md` |
| `reef-gen-frontend` | `.md` → `.tmpl` + `variants/` | 同上，框架特有步骤在 `variants/angular/steps.md` |
| `reef-review` | 修复已有 `.tmpl` | 修复 agent 路径、移除硬编码 Liquibase、精简派发表格 |
| `reef-migrate` | 整包废弃 | 数据库迁移指导已通过 `reef-style-backend` 的 `fragments/java/db-migration/liquibase/` 提供 |
| `wizard.json` | 新增 `affectedTemplates` | 将 `reef-gen-backend` 和 `reef-gen-frontend` 注册到对应选项的 `affectedTemplates` |

#### 不分拆技能
- `reef-gen-backend` 和 `reef-gen-frontend` 保持为两个独立技能，不做合并
- 迁移功能不另建技能，合入 `reef-gen-backend` 的条件块中

### 关键决策

1. 每种语言/框架的生成步骤顺序不同（Java: Entity→DTO→Mapper→...、Python: Model→Schema→...），差异放入 `variants/{value}/steps.md`
2. agent 引用路径指安装后路径 `../../agents/`，非源码路径 `../reef/agents/`
3. `wizard.json` 不需要新增配置维度，只需将技能加入 `affectedTemplates`

### 影响范围

- **新增/修改文件：** `reef-gen-backend/`、`reef-gen-frontend/`、`reef-review/`、`wizard.json`
- **删除文件：** `reef-migrate/`（注意检查是否有其他引用）
- **涉及包：** `packages/reef/`、`packages/cli/`
- **涉及构建：** `build-registry.ts`（自动发现，无需手动修改）
