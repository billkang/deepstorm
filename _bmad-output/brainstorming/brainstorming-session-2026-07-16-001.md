# Sweep-run env-manager 配置读取源修正

**日期：** 2026-07-16
**来源：** deepstorm-discuss 需求讨论

---

## 讨论总结

### 问题

`sweep-run` 的 `env-manager.mjs:readFramework()` 当前从 `.claude/settings.json` 读取 `deepstorm.sweep.e2eFramework` 配置值。

但 DeepStorm 自身配置的规范位置是 `.deepstorm/settings.json`。早期配置嵌套在 `.claude/settings.json` 的 `deepstorm` 命名空间下，后来已迁移到独立的 `.deepstorm/settings.json`（见 `readDeepStormConfig()` 迁移逻辑），但 sweep-run 脚本未同步更新。

### 影响范围

| 文件 | 当前读取源 | 应读取源 |
|------|-----------|---------|
| `packages/sweep/skills/sweep-run/scripts/env-manager.mjs` — `readFramework()` | `.claude/settings.json` → `deepstorm.sweep.e2eFramework` | `.deepstorm/settings.json` → `sweep.e2eFramework`（回退 `.claude/settings.json`） |
| 同上 — `checkMcpAvailable()` | `.mcp.json` ✅ 无需修改 | — |
| 同上 — `readSettingsPath()` | `.claude/settings.json`（仅用于 framework 读取） | 改为读 `.deepstorm/settings.json` |

### 决定

1. `readFramework()` 优先读 `.deepstorm/settings.json`（结构 `sweep.e2eFramework`），找不到则回退 `.claude/settings.json`（结构 `deepstorm.sweep.e2eFramework`）
2. `checkMcpAvailable()` 读 `.mcp.json` 不变
3. 同步更新 `env-manager.test.mjs` 中的测试用例
4. 向后兼容：保留 `.claude/settings.json` 读源作为 fallback，不主动清理旧数据
