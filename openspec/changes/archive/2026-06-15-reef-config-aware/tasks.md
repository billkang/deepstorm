## 1. CLI 基础设施：模板渲染引擎

- [x] 1.1 新增 `src/template/renderer.ts`：实现 `renderTemplate(tmplPath, variables, outputPath)` 函数，支持 `{{configKey.field}}` 占位符替换，未匹配占位符警告日志
- [x] 1.2 新增 `src/template/renderer.ts`：实现 `copyVariants(sourceVariantsDir, selectedValue, targetDir)` 函数，支持 variants/ 目录文件级选择和先清后拷逻辑
- [x] 1.3 新增 `src/template/registry.ts`：实现按 config key 在 wizard.json 中查找 affectedTemplates 列表的工具函数
- [x] 1.4 新增 `src/template/__tests__/renderer.test.ts`：覆盖基本替换、未匹配占位符、variant 存在/不存在、变体目录清理等场景

## 2. CLI 基础设施：build-registry 增强 + 类型更新

- [x] 2.1 修改 `packages/cli/src/build-registry.ts`：SKILL.md 扫描改为优先检查 SKILL.md，不存在则读 SKILL.md.tmpl frontmatter
- [x] 2.2 修改 `packages/cli/src/build-registry.ts`：registry 条目新增 `hasTemplate` 字段（当使用 .tmpl 文件时设为 true）
- [x] 2.3 修改 `src/types/registry.ts`：`WizardOption` 新增 `template` 字段（Record<string, string>）和 `affectedTemplates` 字段（string[]）
- [x] 2.4 修改 `src/types/registry.ts`：`SkillEntry` 新增 `hasTemplate` 可选字段（boolean）

## 3. CLI 基础设施：Way 1 安装流水线

- [x] 3.1 重写 `packages/cli/src/commands/setup.ts`：抽取 `installAllToolAssets()` 函数，遍历工具下所有 skill/agent/hook，检测 .tmpl 后决定是否渲染
- [x] 3.2 `src/commands/setup.ts`：调用 `renderTemplate()` + `copyVariants()` 集成模板渲染到安装流程
- [x] 3.3 `src/commands/setup.ts`：补全 agent 和 hook 的安装逻辑（当前为 TODO），与 skill 使用同一套安装/渲染逻辑
- [x] 3.4 修改 `src/wizard/guide.ts`：`ResolvedSkill[]` → `string[]`，平铺展示已安装 skill 列表，不再区分 explicit/autoInstalled
- [x] 3.5 修改 `src/commands/config.ts`：`registerConfigCommand` 接收 registry 参数，传给 `setConfigValue`

## 4. CLI 基础设施：config set 重渲染

- [x] 4.1 修改 `src/commands/config-set.ts`：`setConfigValue` 新增 `cliDir` 和 `registry` 参数，在写入配置后通过 `__dirname` 定位 dist/ 下的原始 .tmpl 文件
- [x] 4.2 `src/commands/config-set.ts`：实现受影响模板查找逻辑 — 查 wizard.json 的 affectedTemplates，列出受影响的 skill/agent/hook 名称
- [x] 4.3 `src/commands/config-set.ts`：实现用户确认交互（"确认重新生成？[y/N]"），确认后调用 `renderTemplate()` + `copyVariants()` 覆盖 .claude/ 下文件
- [x] 4.4 `src/commands/config-set.ts`：静默跳过（配置值与现值相同）、用户拒绝时仅写配置不重渲染、重渲染完成后提示"请重启 Claude Code 会话生效"

## 5. CLI 清理

- [x] 5.1 删除 `src/engine/matcher.ts` 和 `src/engine/resolver.ts`
- [x] 5.2 删除 `src/engine/__tests__/matcher.test.ts` 和 `src/engine/__tests__/resolver.test.ts`
- [x] 5.3 验证删除后 CLI 编译通过且 doctor/setup/uninstall 等命令不受影响

## 6. Reef：wizard.json + SKILL.md 归属声明

- [x] 6.1 新增 `packages/reef/wizard.json`：定义前端框架（angular）和后端语言（java）两个 select 问题，每个选项包含完整的 template data（label、buildTool、fileExt、sourcePath、agentName）和 affectedTemplates 列表
- [x] 6.2 遍历 11 个 reef SKILL.md（reef-commit、reef-pr、reef-start、reef-harden、reef-migrate、reef-review、reef-gen-backend、reef-gen-frontend、reef-style-backend、reef-style-frontend、reef-testcase），在 frontmatter 中增加 `deepstorm: { tool: "reef" }` 声明

## 7. Reef：style-frontend 拆分模板 + variants

- [x] 7.1 将现有 `reef-style-frontend/SKILL.md` 转化为 `reef-style-frontend/SKILL.md.tmpl`，description 和触发条件中的 Angular 特定内容替换为 `{{reef.frontend.framework.*}}` 占位符
- [x] 7.2 创建 `reef-style-frontend/variants/angular/` 目录，将 quick-reference.md 和 examples/ 原样移入
- [x] 7.3 验证 `pnpm build` 后配置 `reef.frontend.framework=angular` 的渲染结果与原始 SKILL.md 内容一致

## 8. Reef：style-backend 拆分模板 + variants

- [x] 8.1 将现有 `reef-style-backend/SKILL.md` 转化为 `reef-style-backend/SKILL.md.tmpl`，description 和触发条件中的 Java 特定内容替换为 `{{reef.backend.language.*}}` 占位符
- [x] 8.2 创建 `reef-style-backend/variants/java/` 目录，将 quick-reference.md 和 examples/ 原样移入
- [x] 8.3 验证 `pnpm build` 后配置 `reef.backend.language=java` 的渲染结果与原始 SKILL.md 内容一致

## 9. Reef：review skill 模板化

- [x] 9.1 将 `reef-review/SKILL.md` 转化为 `reef-review/SKILL.md.tmpl`，Step 1 中的硬编码源码路径（src/main/java/、src/main/web/）替换为 `{{reef.backend.language.sourcePath}}` 和 `{{reef.frontend.framework.sourcePath}}` 占位符
- [x] 9.2 reef-review/SKILL.md.tmpl：源码路径替换为 `{{reef.backend.language.sourcePath}}` 和 `{{reef.frontend.framework.sourcePath}}` 占位符；agent 名称保持硬编码（`reef-review-backend`、`reef-review-frontend` 等）
- [x] 9.3 验证 Angular + Java 配置的渲染结果与原始 reef-review/SKILL.md 内容一致

## 10. Reef：review agent 拆分模板 + variants

- [x] 10.1 将 `agents/reef-review-frontend.md` 转化为 `agents/reef-review-frontend.md.tmpl`，description 中的 Angular 特定内容替换为 `{{reef.frontend.framework.label}}` 占位符
- [x] 10.2 创建 `agents/variants/angular/reef-review-frontend.md`，将现有 checklist 原样移入（不依赖模板渲染，直接使用）
- [x] 10.3 将 `agents/reef-review-backend.md` 转化为 `agents/reef-review-backend.md.tmpl`，description 中的 Java 特定内容替换为 `{{reef.backend.language.label}}` 占位符
- [x] 10.4 创建 `agents/variants/java/reef-review-backend.md`，将现有 checklist 原样移入

## 11. Reef：auto-format.sh 拆分模板 + variants

- [x] 11.1 将 `hooks/reef-auto-format.sh` 转化为 `hooks/reef-auto-format.sh.tmpl`，保留框架无关的通用逻辑，将 Java 特定格式化（gradle spotlessApply）部分作为占位符引用
- [x] 11.2 创建 `hooks/variants/java/reef-auto-format.sh`，将现有 auto-format.sh 的内容原样移入（含 .java 的 spotlessApply 逻辑和 .ts/.html 的 eslint --fix 逻辑）
- [x] 11.3 验证安装后 `.claude/hooks/reef-auto-format.sh` 功能与原始版本一致

## 12. 构建验证

- [x] 12.1 执行 `pnpm build` 验证 registry.json 包含所有 11 个 reef skill 条目，reef-style-frontend/reef-style-backend 等有 `hasTemplate: true`
- [x] 12.2 执行 `deepstorm doctor` 诊断验证
- [x] 12.3 执行 `pnpm test` 验证 CLI 测试和新增模板引擎测试全部通过
