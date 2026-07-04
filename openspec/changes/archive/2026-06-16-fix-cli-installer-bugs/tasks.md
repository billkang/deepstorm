## 1. 修复构建时 hooks.json 重复（Bug B）

- [x] 1.1 在 `build-registry.ts` 的 `mergeHooksJson()` 中，在 concat 之后增加去重逻辑：按 (event, matcher, command) 三元组指纹去重
- [x] 1.2 运行 `pnpm build` 验证 `dist/hooks/hooks.json` 中无重复条目（应 <= 5 条 event 规则）

## 2. 修复模板技能 references/ 目录缺失（Bug A）

- [x] 2.1 在 `setup.ts` 的 `installAllToolAssets()` 中，`copyFragmentsForSkill()` 之后增加 `copyReferencesForSkill()` 函数：检测 `srcDir/references/` 是否存在，存在则 `fs.cpSync` 递归复制
- [x] 2.2 验证：重新安装后 `tide-discuss`（8 文件）、`reef-start`（1 文件）、`sweep-plan`（1 文件）三个技能的 `.claude/skills/<skillId>/references/` 目录存在且文件完整

## 3. 修复安装时 mergeHooks 未调用（Bug C）

- [x] 3.1 在 `setup.ts` 中 `import { mergeHooks } from '../merger/hooks'`
- [x] 3.2 将 Step 5（~line 119-131）的 `fs.cpSync` 存在性检查逻辑替换为：读取 `dist/hooks/hooks.json` → 调用 `mergeHooks(targetHooksPath, incomingHooks)`
- [x] 3.3 验证：重新安装后 `.claude/hooks/hooks.json` 中 `SessionStart` event 包含 `tide-session-preload.sh` 条目（1 entry），且其他 event 均无重复

## 4. 集成验证

- [x] 4.1 在 `packages/cli/test-project/` 重新运行安装，确认三条 fix 全部生效
- [x] 4.2 确认 `hooks.json` 每条 event 规则出现 1 次（无重复）
- [x] 4.3 确认 `tide-discuss` skill 的 `references/` 目录含 8 个 `.md` 文件
- [x] 4.4 确认 `SessionStart` event 已注册 `tide-session-preload.sh`
