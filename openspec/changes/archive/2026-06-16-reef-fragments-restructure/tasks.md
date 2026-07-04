## 1. 后端 fragments quick-reference 文件合并

- [x] 1.1 spring-boot：合并 `quick-reference/` 下 9 个碎片文件为 `quick-reference.md`（路径：`fragments/java/framework/spring-boot/quick-reference.md`）
- [x] 1.2 hibernate：合并 `quick-reference/` 下 3 个碎片文件为 `quick-reference.md`（路径：`fragments/java/orm/hibernate/quick-reference.md`）
- [x] 1.3 spring-ai 和 liquibase：已有 `quick-reference.md`，确认内容正常
- [x] 1.4 junit5：创建 `quick-reference.md` 占位文件

## 2. 前端 fragments quick-reference 文件合并

- [x] 2.1 primeng：合并 `quick-reference/` 下 3 个文件为 `quick-reference.md`
- [x] 2.2 vitest：合并 `quick-reference/` 下 2 个文件为 `quick-reference.md`

## 3. Variants quick-reference 文件合并

- [x] 3.1 java 变体：合并 `quick-reference/` 下 4 个碎片文件为 `variants/java/quick-reference.md`
- [x] 3.2 angular 变体：合并 `quick-reference/` 下 8 个碎片文件为 `variants/angular/quick-reference.md`

## 4. 内部交叉引用更新

- [x] 4.1 更新 spring-boot 合并文件中的内部锚点
- [x] 4.2 更新 hibernate 合并文件中的跨文件引用
- [x] 4.3 更新 primeng 合并文件中的路径引用（`../examples/` → `examples/`）
- [x] 4.4 更新 vitest 合并文件中的路径引用（`../examples/` → `examples/`）
- [x] 4.5 更新 variants java/angular 合并文件中的内部锚点

## 5. SKILL.md.tmpl 更新

- [x] 5.1 更新 `reef-style-backend/SKILL.md.tmpl` 知识文件章节，反映扁平结构

## 6. CLI 单元测试补充

- [x] 6.1 导出 `copyFragmentsForSkill` 和 `collectFragmentsFromQuestion`（setup.ts）
- [x] 6.2 创建 `setup-fragments.test.ts`（16 个 case 覆盖 fragment 收集和复制）
- [x] 6.3 创建 `template-list.test.ts`（3 个 case）
- [x] 6.4 创建 `template-apply.test.ts`（2 个 case）
- [x] 6.5 创建 `template-upgrade.test.ts`（2 个 case）
- [x] 6.6 创建 `config-view.test.ts`（3 个 case）
- [x] 6.7 创建 `mcp-select.test.ts`（3 个 case）

## 7. 构建与验证

- [x] 7.1 运行全部测试通过（190/192 通过，2 个 mcp-env 失败为 master 已存在的问题）
- [x] 7.2 确认 `packages/reef/wizard.json` 路径不需要更新（`java/` 前缀保留）
- [x] 7.3 确认 `java/` 前缀移除和 `examples/` 上移留待后续 change 处理
