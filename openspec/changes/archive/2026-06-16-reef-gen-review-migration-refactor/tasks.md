## 1. wizard.json — 配置更新

- [x] 1.1 Java 选项的 `affectedTemplates` 追加 `"skills/reef-gen-backend/SKILL.md.tmpl"`
- [x] 1.2 Angular 选项的 `affectedTemplates` 追加 `"skills/reef-gen-frontend/SKILL.md.tmpl"`

## 2. reef-gen-backend — 模板化 + variants

- [x] 2.1 创建 `reef-gen-backend/SKILL.md.tmpl`：渲染通用工作流骨架，条件块引用数据库迁移，变量替换构建命令和路径
- [x] 2.2 创建 `reef-gen-backend/variants/java/steps.md`：Java 编码步骤顺序和构建指导
- [x] 2.3 创建 `reef-gen-backend/variants/java/examples/`（可选）：Java 代码生成示例
- [x] 2.4 删除旧的 `reef-gen-backend/SKILL.md`

## 3. reef-gen-frontend — 模板化 + variants

- [x] 3.1 创建 `reef-gen-frontend/SKILL.md.tmpl`：渲染通用工作流骨架，框架特有约束条件分支，变量替换构建命令和路径
- [x] 3.2 创建 `reef-gen-frontend/variants/angular/steps.md`：Angular 编码步骤顺序和核心约束说明
- [x] 3.3 删除旧的 `reef-gen-frontend/SKILL.md`

## 4. reef-review — 内容修复

- [x] 4.1 修复 agent 引用路径：`../reef/agents/*.md` → `../../agents/*.md`
- [x] 4.2 移除硬编码的 `LIQUIBASE_FILES` 检测和 `src/main/resources/db/` 路径，改为通用 `INFRA_FILES` 分支
- [x] 4.3 精简 agent 派发表格：移除冗余组合条目，只保留最小派发规则
- [x] 4.4 更新文件引用和路径变量确保与安装后目录结构一致

## 5. reef-migrate — 功能合并 + 删除

- [x] 5.1 确认 `reef-gen-backend/variants/java/` 中已包含数据库迁移指导（或在条件块中引用 style-backend 的迁移示例）
- [x] 5.2 删除 `packages/reef/skills/reef-migrate/` 整个目录
- [x] 5.3 验证无其他源文件引用 `reef-migrate` 技能

## 6. 构建验证

- [x] 6.1 运行 `pnpm build` 确认 registry 构建无错误
- [x] 6.2 验证 `dist/skills/` 中不再包含 `reef-migrate`
- [x] 6.3 验证 `dist/` 中包含 `reef-gen-backend/` 和 `reef-gen-frontend/` 的 `.tmpl` 文件
