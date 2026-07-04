## Why

`packages/reef/skills/` 下 47 个 markdown 文件共约 5,782 行，当 LLM 同时加载 quick-reference 和 examples 时总行数显著膨胀。最大的单文件（`code-wrapping.md`）达 416 行，quick-reference 与 examples 之间存在明显的代码重复。

精简后 LLM 上下文消耗更少，加载速度更快，且不影响任何规则或规范点的完整性。

## What Changes

1. **精简 code-wrapping.md**：每个规则只保留 1-2 个精炼示例，删除不必要的正反对比
2. **精简 examples/**：移除 imports、完整类声明等冗余样板代码，用 `// ...` 或 `...` 省略
3. **精简 quick-reference**：删除与 examples/ 重复的完整代码块，改为引用 examples/ 目录
4. **合并小文件**：将紧密相关的小文件合并（如 service-layer.md + template-routing.md）

## Capabilities

### New Capabilities
- `code-wrapping-trim`: 精简前端和后端的 code-wrapping.md，减少冗余示例
- `examples-compact`: 精简 examples/ 目录下的代码示例，移除不必要的样板代码
- `quickref-redundancy`: 消除 quick-reference 与 examples 之间的内容重复
- `small-files-merge`: 合并紧密相关的 markdown 小文件

### Modified Capabilities
无（本次不修改任何功能的 spec 级别行为）

## Impact

- 仅修改 `packages/reef/skills/` 目录下的 markdown 文件
- 无代码逻辑变更
- 无 API/接口变更
- 无外部依赖变更
- 预计总行数减少约 30%
