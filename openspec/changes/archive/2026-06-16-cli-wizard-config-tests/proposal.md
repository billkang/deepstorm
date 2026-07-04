## Why

CLI 包多个模块缺少完善的单元测试覆盖。现有 CLI 单元测试 coverage spec 只覆盖了 setup.ts fragment 处理和模板命令，需要补充 selectMcpTools、config 各子命令、registry 查询、guide MCP 输出、questionnaire 条件依赖、release build、config-set 边缘情况、template action 等模块的测试要求。

## What Changes

- 为 `packages/cli/src/wizard/mcp-select.ts` 中的 `selectMcpTools()` 添加完整单元测试（覆盖空工具列表、排序逻辑、取消流程、initialValues 等场景）
- 为 `packages/cli/src/commands/config.ts` 及其子命令添加完整单元测试（覆盖 action 级别测试：格式校验、确认/取消、成功/失败等）
- 为 `packages/cli/src/wizard/questionnaire.ts` 的 `runQuestionnaire()` 添加完整单元测试（覆盖 dependsOn 含 not 标志、multiselect、group 等类型）
- 为 `packages/cli/src/wizard/guide.ts` 的 `printGuide()` 添加完整单元测试（覆盖 MCP 摘要、GitHub Docker 警告、git prompt 多场景）
- 为 `packages/cli/src/commands/release.ts` 的 build action 添加 `buildRegistry` 断言
- 为 `packages/cli/src/commands/config-set.ts` 的 `setConfigValue()` 添加边缘情况测试（值不变、模板提示、未知 key、corrupt 恢复）
- 为 `packages/cli/src/commands/setup.ts` 的 `copyFragmentsForSkill()` 添加边缘情况测试（.DS_Store 过滤、目录不存在、无匹配 fragment）
- 为 `packages/cli/src/commands/template.ts` 的 action 处理添加 commander 参数解析测试
- 为 `packages/cli/src/engine/registry.ts` 的 `RegistryReader` 添加 getToolEntry / getMcpTools / getMcpToolEntry / findSkillIds 测试

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `cli-unit-test-coverage`: 补充 selectMcpTools、config、config-set、registry、guide、questionnaire、release、setup fragment、template action 的测试要求

## Impact

- `packages/cli/src/wizard/__tests__/mcp-select.test.ts` — 新增测试
- `packages/cli/src/commands/__tests__/config.test.ts` — 重写测试
- `packages/cli/src/commands/__tests__/config-set.test.ts` — 新增测试
- `packages/cli/src/commands/__tests__/release.test.ts` — 补充断言
- `packages/cli/src/commands/__tests__/setup.test.ts` — 新增测试
- `packages/cli/src/commands/__tests__/template.test.ts` — 重写测试
- `packages/cli/src/engine/__tests__/registry.test.ts` — 新增测试
- `packages/cli/src/wizard/__tests__/guide.test.ts` — 新增测试
- `packages/cli/src/wizard/__tests__/questionnaire.test.ts` — 重写测试
