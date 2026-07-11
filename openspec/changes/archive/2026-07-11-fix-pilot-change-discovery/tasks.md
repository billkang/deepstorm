## 1. 重构查找策略 — 去掉 archive/root fallback

- [ ] 1.1 修改 `findFirstActiveChange()` — 删除 archive 扫描逻辑和 root `tasks.md` fallback，仅保留 active changes 扫描
- [ ] 1.2 修改 `findChangeByName()` — 删除 archive fallback，仅查 active changes
- [ ] 1.3 删除 `scanChangeDir()` 辅助函数（不再需要）

## 2. 新增 archive 能力

- [ ] 2.1 实现 `archiveChange(projectDir, change)` 函数 — 将 change 目录从 `openspec/changes/<name>/` 移至 `openspec/changes/archive/<YYYY-MM-DD>-<name>/`
- [ ] 2.2 在 `runPilot` 末尾调用 `archiveChange()` — 所有 task 为 completed 时自动归档，有 failed/skipped 时跳过

## 3. 更新测试

- [ ] 3.1 更新 `findFirstActiveChange` 测试 — 删除 archive fallback 和 root fallback 相关用例，新增不扫描 archive 的断言
- [ ] 3.2 更新 `findChangeByName` 测试 — 删除 archive 相关用例，确认仅查 active
- [ ] 3.3 新增 `archiveChange` 测试 — 全部 completed 时归档成功、有 failed 时跳过、目录不存在时安全处理

## 4. 编译验证

- [ ] 4.1 TypeScript 编译通过
- [ ] 4.2 全部单元测试通过
- [ ] 4.3 运行 playground setup 脚本验证目录结构正确
