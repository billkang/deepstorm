## 1. 修改 reef-start superpowers 门禁

- [x] 1.1 在 `packages/reef/skills/reef-start/SKILL.md.tmpl` 的 superpowers 门禁加载列表（第 379-382 行）中，增加 `reef:reef-style-backend` 和 `reef:reef-style-frontend` 作为硬性加载项，与 TDD、verification 并列
- [x] 1.2 在 `packages/reef/skills/reef-start/SKILL.md.tmpl` 门禁段末的安全检查清单（隐含在流程描述中），增加 code-style 技能加载的检查描述

## 2. 更新 superpowers-gate 声明模板和检查清单

- [x] 2.1 修改 `packages/reef/skills/reef-start/references/superpowers-gate.md` 的 Plan Mode 声明模板，在已加载技能表格中增加 `reef:reef-style-backend` / `reef:reef-style-frontend` 示例行
- [x] 2.2 修改 `packages/reef/skills/reef-start/references/superpowers-gate.md` 的 TDD Mode 声明模板，同样增加 code-style 技能行
- [x] 2.3 在 `packages/reef/skills/reef-start/references/superpowers-gate.md` 的安全检查清单中增加独立检查项："code-style 技能已加载（reef-style-backend/reef-style-frontend）"

## 3. 升级 reef-gen-backend code-style 加载为前置门禁

- [x] 3.1 修改 `packages/reef/skills/reef-gen-backend/SKILL.md.tmpl` 的 Step 2，标题从"查阅规范"改为"加载编码规范（硬性门禁）"，在描述中明确 **"必须先通过 Skill tool 加载 `reef:reef-style-backend`，阅读 quick-reference.md 和必要的维度规范，完成后方可进入后续代码编写步骤"**
- [x] 3.2 在 Step 2 末尾增加检查声明模板："✅ [STYLE] 已加载后端编码规范，确认完成"

## 4. 升级 reef-gen-frontend code-style 加载为前置门禁

- [x] 4.1 修改 `packages/reef/skills/reef-gen-frontend/SKILL.md.tmpl` 的 Step 2，标题从"查阅规范"改为"加载编码规范（硬性门禁）"，描述同步修改为 **"必须先通过 Skill tool 加载 `reef:reef-style-frontend`，阅读 quick-reference.md 和必要的维度规范，完成后方可进入后续代码编写步骤"**
- [x] 4.2 在 Step 2 末尾增加检查声明模板："✅ [STYLE] 已加载前端编码规范，确认完成"

## 5. stage-4-implementation 逐 task 流程增加 code-style 确认点

- [x] 5.1 在 `packages/reef/skills/reef-start/references/stage-4-implementation.md` 的 4.2 节 Plan Mode 入口（第 39 行"直接实现代码变更"前），增加"确认 code-style 技能已加载"的检查步骤
- [x] 5.2 在 `packages/reef/skills/reef-start/references/stage-4-implementation.md` 的 4.2 节 TDD Mode 入口（第 53 行"🔴 RED — 先写测试"前），增加"确认 code-style 技能已加载"的检查步骤

## 6. 构建验证

- [x] 6.1 运行 `pnpm build` 确认 .tmpl 模板编译通过
- [x] 6.2 确认构建后的 dist 文件中 code-style 门禁已正确渲染
