## Context

CLI installer (`packages/cli/src/commands/setup.ts`) 负责将 skill、agent、hook 资产从 `dist/` 复制到用户项目的 `.claude/` 目录。另外，构建脚本 (`packages/cli/src/build-registry.ts`) 在 `pnpm build` 时会合并各包的 `hooks.json` 到 `dist/hooks/hooks.json`。

当前存在三个 bug：

1. **Bug A — references/ 缺失**：`setup.ts` 中模板技能分支（SKILL.md.tmpl 存在时）只渲染 `SKILL.md`、复制 `variants/` 和 `fragments/`，完全忽略 `references/` 子目录。影响 `tide-discuss`、`sweep-plan`、`reef-start` 三个模板技能。

2. **Bug B — hooks.json 重复**：`build-registry.ts` 的 `mergeHooksJson()` 用简单 `concat` 合并 hook handler 数组，不执行去重。`pnpm build` 多次调用同一包时 handler 自增追加，最终 `dist/hooks/hooks.json` 每条规则出现 14x 重复。

3. **Bug C — mergeHooks 未接入**：`setup.ts` Step 5 用 `fs.cpSync` + 文件存在性检查复制 `hooks.json`。`merger/hooks.ts` 中已有 `mergeHooks()` 函数（含单元测试），但安装流程从未调用它。导致多工具安装时后续工具的 hook 注册丢失。

## Goals / Non-Goals

**Goals:**
- Bug A: 模板技能安装时 `references/` 目录被正确复制
- Bug B: `dist/hooks/hooks.json` 无重复 hook 条目
- Bug C: `setup.ts` 安装 hooks 时调用 `mergeHooks()`，多工具安装 hook 正确合并
- 修复后 `test-project` 重新安装应验证全部修复

**Non-Goals:**
- 不改动 hook 脚本本身的逻辑（reef-block-dangerous.sh 等保持不变）
- 不改动 `merger/hooks.ts` 中 `mergeHooks()` 的现有行为（该函数已有测试覆盖）
- 不改动非安装流程的代码

## Decisions

### D1: Bug A — references/ 拷贝方式

**Option A（选中的方案）：在 setup.ts 模板分支中增加 `copyReferencesForConfig()` 函数**

在 `setup.ts` 的 `installAllToolAssets()` 函数中，模板技能分支的 `copyFragmentsForSkill()` 调用之后，增加 `copyReferencesForSkill(srcDir, targetDirPath)` 调用。逻辑简单：检测 `srcDir/references/` 是否存在，存在则 `fs.cpSync` 递归复制。

实现位置：`setup.ts` 第 298 行之后。
代码量：~10 行。

**Option B：将所有模板技能改为「先全量复制再覆盖 SKILL.md」**

优点是一劳永逸地解决所有遗漏子目录问题（variants/、fragments/、references/ 以及其他未来可能出现的子目录一次性复制完）。但缺点是会复制 `variants/` 中未选中的框架变体、`fragments/` 中未选中的代码片段，造成冗余和混淆。

**结论：选 Option A。** 精确控制仅复制 references/ 目录，与其他子目录处理方式一致，不影响现有变体和片段复制逻辑。

### D2: Bug B — 去重策略

**Option A（选中的方案）：在 mergeHooksJson concat 后按三元组去重**

每条 hook handler 由 `(event, matcher, command)` 唯一标识。在 `mergedHooks[event] = mergedHooks[event].concat(handlers)` 之后，用 Set 按 `{matcher}::{command}` 指纹去重。

实现位置：`build-registry.ts` 第 443 行。
代码量：~5 行。

**Option B：在写入前整体去重**

一次性扫描整个 merged 对象，对所有事件类型去重。更系统化但当前场景不需要——目前只有一个重复来源（concat 自增）。Option A 更精准。

**结论：选 Option A。** 轻量、精确、刚好解决当前问题。

### D3: Bug C — mergeHooks 接入方式

**Option A（选中的方案）：替换 setup.ts Step 5 的 cpSync 为 mergeHooks 调用**

将 `setup.ts` 第 119-131 行的 hook 安装逻辑改为：
1. 读取 `dist/hooks/hooks.json` 作为 incoming hooks
2. 调用 `mergeHooks(targetHooksPath, incomingHooks)`
3. `mergeHooks` 内部处理「文件不存在→创建」「文件已存在→合并」两种场景

`mergeHooks()`（在 `merger/hooks.ts` 中）使用 `deepMerge` 合并，数组级别用替换而非追加，自然避免重复。

**Option B：修改 shouldInstallGlobalHooks 的逻辑**

当前 `shouldInstallGlobalHooks` 只在第一轮工具安装时触发，后续工具的 hooks 不会再次进入该分支。但这不是根因——根因是进了分支也只用 cpSync。修改这个函数逻辑复杂且收益有限。

**结论：选 Option A。** 直接调用已有函数，改动量最小。

## Risks / Trade-offs

- **Bug A 的风险：** 如果 references/ 中包含 `.tmpl` 文件（当前没有，但未来可能有），则不会进行模板渲染。当前已知的 references/ 全部是纯 `.md` 文件，不需要渲染。风险低。
- **Bug C 的风险：** `deepMerge` 的数组行为是替换而非追加，这与当前 `mergeHooksJson` 的 concat 行为不同。但安装时 hooks.json 来源只有一个（`dist/hooks/hooks.json` 已是构建时合并产物），所以替换语义正确。如果未来改为分批次安装 hook，需要调整 `deepMerge` 使用 `concat` 或自定义合并函数。当前无此需求。
- **Bug B 的 trade-off：** 去重会略微增加构建时间，但构建只运行一次且数据量极小（~50 条），影响可忽略。
