## Context

`deepstorm template init` (在 `commands/template-init.ts` 中) 和 `deepstorm template apply` (在 `commands/template-apply.ts` 中) 都使用 `utils/fs.ts` 中的 `copyDir(src, dest)` 函数进行递归复制。`copyDir` 底层使用 `fs.cpSync(src, dest, { recursive: true, force: true })`，当前行为已正确复制 `references/` 子目录。

本次变更的目标不是修改生产代码行为（当前行为已正确），而是：
1. 为 `initTemplate()` 和 `applyTemplate()` 增加测试覆盖，显式验证 `references/` 的保留
2. 增加 `copyDir` 自身的单元测试，确认递归复制行为

## Goals / Non-Goals

**Goals:**
- 为 `template-init.ts` 的 `initTemplate()` 添加 `references/` 相关测试
- 为 `template-apply.ts` 的 `applyTemplate()` 添加 `references/` 相关测试
- 为 `utils/fs.ts` 的 `copyDir()` 添加递归复制测试
- 覆盖正常路径（references/ 存在）和边界路径（references/ 不存在）

**Non-Goals:**
- 不修改 `initTemplate()`、`applyTemplate()` 或 `copyDir()` 的生产代码
- 不改动 template 命令的其他功能（list、upgrade）
- 不涉及 `deepstorm setup` 安装链路

## Decisions

### D1: 测试策略 — 按命令独立测试

**选中的方案：** 在 `template.test.ts` 中为 `initTemplate` 和 `applyTemplate` 分别增加 describe block，使用临时目录模拟文件系统。

`template.test.ts` 已存在，遵循其测试模式（`fs.mkdtempSync` + `beforeEach`/`afterEach`）。每个 describe block 覆盖一个命令，测试存在和不存在 references/ 两种场景。

### D2: copyDir 测试位置

**选中的方案：** 在 `src/utils/__tests__/fs.test.ts` 中增加 `copyDir` 的单元测试。

鉴于 `copyDir` 是一个独立的工具函数，其测试不应与命令测试耦合。如果 `fs.test.ts` 不存在则新建。

## Risks / Trade-offs

- **无风险：** 本次变更只新增测试文件，不修改生产代码。测试失败不影响已安装用户的正常使用。
- **测试隔离：** 每个测试用例使用 `mkdtempSync` 创建独立临时目录，`afterEach` 中清理，不会产生文件系统污染。
