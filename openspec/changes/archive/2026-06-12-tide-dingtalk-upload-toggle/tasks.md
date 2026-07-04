## 1. publish-flow.md — Step 4a Feature Toggle 核心逻辑

- [x] 1.1 在 Step 4a 入口处添加配置读取指令：先读 `${PWD}/.claude/settings.local.json` 中嵌套路径 `deepstorm → tide → dingtalkUpload → enabled`，不存在则读 `${PWD}/.claude/settings.json`
- [x] 1.2 添加默认值逻辑：两个文件均未配置该路径时视为 `true`（开启）
- [x] 1.3 添加 JSON 解析异常处理：文件格式错误或值非 boolean 时默认 `true` 并提示用户
- [x] 1.4 添加开关关闭时的流程分支：跳过 Step 4a，status 直接设为 `published`，publishChecklist[0] 记录 `{step: "dingtalk_push", done: true, skipped: true, note: "钉钉云文档上传已关闭"}`，进入 4b
- [x] 1.5 恢复会话时 publishChecklist[0] 含 `skipped: true` 视为已跳过，不重复检查 toggle

## 2. SKILL.md — Step 4a 引用更新

- [x] 2.1 Step 4a 指令中增加一句：先按 publish-flow.md 检查 dingtalkUpload enable toggle 状态，再决定是否执行钉钉上传或跳过

## 3. README.md — Feature Toggle 配置说明

- [x] 3.1 在 tide `README.md` 的 MCP 配置章节添加 toggle 说明
- [x] 3.2 在 tide `README.md` 补充嵌套 JSON 配置示例
- [x] 3.3 在**根目录 `README.md`** 的 MCP 配置章节中 dingtalk-wiki 行添加 toggle 提示
- [x] 3.4 在根目录 `README.md` 的约定表中添加 Feature Toggle 行，并补充完整配置示例

## 4. 同步 Spec 到 openspec/specs/

- [x] 4.1 将 `openspec/changes/tide-dingtalk-upload-toggle/specs/tide-core/spec.md` 同步到 `openspec/specs/tide-core/spec.md`
- [x] 4.2 将 `openspec/changes/tide-dingtalk-upload-toggle/specs/feature-toggle/spec.md` 同步到 `openspec/specs/feature-toggle/spec.md`

## 5. 验证（需运行时确认）

- [ ] 5.1 验证开关开启时（默认）Step 4a 正常执行钉钉上传
- [ ] 5.2 验证开关关闭时 Step 4a 跳过，直接进入 4b，publishChecklist[0] 正确记录 `skipped: true`
- [ ] 5.3 验证 `settings.local.json` 嵌套路径配置优先于 `settings.json`
- [ ] 5.4 验证两个文件均未配置时默认开启
- [ ] 5.5 验证 JSON 解析异常时回退到默认值
- [ ] 5.6 验证恢复 `skipped: true` 的会话时不再检查 toggle，直接进入 4b
