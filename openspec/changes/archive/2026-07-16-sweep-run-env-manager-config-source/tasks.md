## 1. 修改 env-manager.mjs 核心逻辑

- [x] 1.1 `readFramework()` 改为只从 `.deepstorm/settings.json` 读取 `sweep.e2eFramework`，移除 `.claude/settings.json` 回退
- [x] 1.2 移除未使用的 `getSettingsPath()` 辅助函数
- [x] 1.3 精简 `source` 返回值枚举：`"deepstorm-settings"` / `"missing-file"` / `"not-configured"` / `"parse-error"`

## 2. 更新测试

- [x] 2.1 更新 `env-manager.test.mjs` 中 `readFramework` 的全部测试，仅覆盖 `.deepstorm/settings.json` 源
- [x] 2.2 替换回退测试用例为纯 `.deepstorm/settings.json` 场景（missing-file / not-configured / parse-error）
- [x] 2.3 移除所有 `.claude/settings.json` 回退相关测试用例
- [x] 2.4 运行测试套件确认全部通过（41 tests, 0 failures）

## 3. 更新 merger/settings.ts 删除向后兼容性代码

- [x] 3.1 删除 `readDeepStormConfig()` 中的 `.claude/settings.json` deepstorm 命名空间迁移逻辑
- [x] 3.2 删除已废弃的 `mergeDeepStormConfig()` 和 `readDeepStormConfigFromPath()` 函数
- [x] 3.3 更新 `settings.test.ts` 移除对应测试用例
- [x] 3.4 检查 unused import 并清理

## 4. 更新 SKILL.md 文档

- [x] 4.1 sweep-run/SKILL.md 移除回退表述
- [x] 4.2 sweep-init/SKILL.md 移除回退表述
- [x] 4.3 playground 副本同步更新
- [x] 4.4 MCP skill 文档引用改为 `.deepstorm/settings.json`
- [x] 4.5 tide-discuss references 文档更新
