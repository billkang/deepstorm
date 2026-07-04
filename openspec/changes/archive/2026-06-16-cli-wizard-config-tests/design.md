## Context

CLI 包现有单元测试覆盖了 setup.ts fragment 处理和模板命令（template-list/template-apply/template-upgrade），但以下两个模块缺少测试：

1. **`mcp-select.ts`** — `selectMcpTools()` 函数负责 setup 流程中的 MCP 工具选择交互，涉及 @clack/prompts 交互、排序逻辑、取消流程
2. **`config.ts`** — config 子命令（view/set/reset/refresh）各自有 action 处理逻辑，需要 mock 子模块来测试 CLI 参数解析、确认流程、错误处理

## Goals / Non-Goals

**Goals:**
- 对 `selectMcpTools()` 实现全覆盖测试（空列表、排序、选择、取消、undefined entry、required、initialValues）
- 对 config 各子命令实现 action 级别覆盖（格式校验、确认/取消、刷新成功/失败、空结果处理）

**Non-Goals:**
- 不涉及集成测试或 e2e 测试
- 不改动生产代码逻辑

## Decisions

- **Mock 策略**：`@clack/prompts` 整体 mock，`RegistryReader` 用工厂函数 `createMockReader` 构造
- **Config 测试**：各子命令模块（`config-view`、`config-set`、`config-reset`、`config-refresh`）各自 mock，`commander` 用真实 parseAsync 来验证参数解析
- **测试框架**：使用 vitest（与项目现有一致）

## Risks / Trade-offs

- Mock @clack/prompts 后测试不验证 UI 表现，但 CLI 交互测试重点在逻辑正确性而非 UI
