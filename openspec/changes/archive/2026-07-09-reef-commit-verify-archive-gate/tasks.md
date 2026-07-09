## 1. deepstorm-commit SKILL.md 新增 OpenSpec 检查步骤

- [x] 1.1 在步骤 5（运行测试）和步骤 6（收集上下文）之间插入「5.5 OpenSpec 验证与归档检查」步骤
- [x] 1.2 实现步骤 5.5.1-5.5.2：查找关联 OpenSpec change 并匹配（扫描 openspec/changes/*/、分支名比对、多 change 时询问用户）
- [x] 1.3 实现步骤 5.5.3：检查归档状态（读取 .openspec.yaml 的 status 字段，为 archived 则跳过）
- [x] 1.4 实现步骤 5.5.4：运行验证（检查 tasks.md checkbox 完成度、未完成则中止、已完成则自动调用 Skill 工具 /opsx:verify、CRITICAL 问题中止、WARNING/SUGGESTION 通过）
- [x] 1.5 实现步骤 5.5.5：运行归档（自动调用 Skill 工具 /opsx:archive、失败则提示用户手动处理）
- [x] 1.6 实现步骤 5.5.6：确认已就绪（校验 status: archived、archive 目录存在、向用户报告）

## 2. reef-commit 通用模板同步

- [x] 2.1 在 `packages/reef/skills/reef-commit/SKILL.md` 的步骤 6（运行单元测试）和步骤 7（收集上下文）之间同步新增步骤 6.5 OpenSpec 检查步骤
- [x] 2.2 确认步骤编号、判断逻辑、bash 命令块与 deepstorm-commit 保持一致的深层结构中，仅 OpenSpec 路径差异做适配

## 3. discuss-apply-active 标记管理

- [x] 3.1 在 deepstorm-discuss Step 8（TDD 实现/Apply）入口处添加创建 `.claude/.discuss-apply-active` 标记的指令，使 hook 在合法 apply 阶段放行 skill 文件编辑
- [x] 3.2 在 deepstorm-discuss Step 10（归档/Archive）完成后添加清理 `.claude/.discuss-apply-active` 标记的指令

## 4. 验证

- [x] 4.1 读取完整 SKILL.md 确认步骤序列无断裂（deepstorm-commit: 1→2→3→4→4.5→5→5.5→6→7→8→9→10；reef-commit: 1→2→3→4→5→6→6.5→7→8→9→10→11）
- [x] 4.2 确认 reef-commit 模板语法正确（非 template 文件，纯 .md，无 handlebars 语法）
- [x] 4.3 运行 `pnpm test` 确认全量测试通过（CLI: 451 passed, reef: 109 passed, tide: 10 passed, sweep: 7 passed）
