## Context

DeepStorm 的 hook 机制包含两类场景：

1. **Plugin 模式**：用户通过 `/plugin install deepstorm@...` 安装，Claude Code 加载 `.deepstorm/` 插件目录。hooks 通过 `.claude-plugin/plugin.json` 的 `"hooks"` 字段注册。

2. **Standalone 模式**：用户通过 `npx @deepstorm/cli setup` 安装，CLI 将 hooks 脚本和配置部署到目标项目的 `.claude/hooks/` 目录。

当前状态：
- `plugin.json` 生成时未包含 `"hooks"` 字段，导致 plugin 模式下 Claude Code 不加载 hooks
- 源 `hooks.json` 使用 `${CLAUDE_PLUGIN_ROOT}/hooks/reef-*.sh` 路径，该变量仅在 plugin 模式下可用
- setup 流程（Step 5）已有合并 hooks.json 的代码，但在实际目标项目（如 `ai` 项目）中 `.claude/hooks/` 不存在

## Goals / Non-Goals

**Goals:**
- `plugin.json` 在 hooks 存在时声明 `"hooks": "./hooks/hooks.json"`
- 所有 `packages/*/hooks/hooks.json` 使用相对路径，兼容 standalone 和 plugin 两种模式
- `npx @deepstorm/cli setup` 确保 hooks 脚本和配置被部署到目标项目

**Non-Goals:**
- 不改变 hook 脚本的实现逻辑（`reef-intent-detect.sh`、`reef-block-dangerous.sh` 等的行为不变）
- 不涉及 scope hooks（`reef-scope-*`）的行为修改
- 不修复 `plugin.json` 中其他缺失的字段（如 `agents` 声明 — 另一项工作）

## Decisions

### Decision 1: plugin.json hooks 声明在 hooks 安装后补充

**方案：** 在 `plugin-build.ts` 中，`mergePluginHooks()` 之后新增 `updatePluginJsonHooks()` 步骤，读取已生成的 `plugin.json` 并追加 `"hooks"` 字段。

**理由：**
- `buildPlugin()` 执行时 hooks 目录还不存在（脚本和 hooks.json 尚未部署），无法判断是否有 hooks
- 采用两段式：`buildPlugin()` 生成不含 hooks 的基础 `plugin.json` → hooks 部署完成后，再更新 `plugin.json`
- 对比备选方案「在 `buildPlugin()` 中通过 registry 判断是否有 hooks」：需要传入 registry 类型信息，耦合度高

### Decision 2: 源 hooks.json 使用相对路径替代 `${CLAUDE_PLUGIN_ROOT}`

**方案：** 将 `packages/*/hooks/hooks.json` 中的 `${CLAUDE_PLUGIN_ROOT}/hooks/` 前缀改为 `./`。

**理由：**
- Claude Code 执行 hook 命令时，CWD 设置到 `hooks.json` 所在目录（即 `.claude/hooks/` 或插件目录的 `hooks/`），所以 `./reef-block-dangerous.sh` 能正确解析
- 无论在 plugin 模式（`${CLAUDE_PLUGIN_ROOT}` 可用）还是 standalone 模式（`${CLAUDE_PLUGIN_ROOT}` 未定义）都能工作
- `type: "prompt"` 的 hook 不涉及路径，无需改动

### Decision 3: setup 流程保持现有 Step 5，修复可能的问题

**方案：** 排查 setup Step 5 的 hooks 合并逻辑在 `ai` 项目中未生效的原因。代码逻辑本身看似正确（从 `dist/hooks/{tool}-hooks.json` 读取、合并），但实际目标项目中 `.claude/hooks/` 不存在说明该步骤未被执行或执行条件未满足。

**排查方向：**
- `shouldInstallGlobalHooks()` 的 gating 条件是否误判
- `dist/hooks/reef-hooks.json` 在构建时是否正确生成
- 用户是否在 setup 过程中选择了 reef 套件（hooks 只在 reef 中定义）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 相对路径在 Claude Code 未来版本中 CWD 行为改变 | 监控 Claude Code 更新日志。如果 CWD 行为变更为项目根目录，需将 hooks.json 改为使用绝对路径或 `${CLAUDE_PLUGIN_ROOT}` 回退 |
| `updatePluginJsonHooks()` 在 plugin.json 解析失败时静默忽略 | 已在错误处理中 try/catch 静默忽略，不会阻塞构建流程 |
| setup 流程的 hooks 部署无法通过 `ai` 项目的调试确认（无 `.claude/hooks/`） | 可手动运行 setup 或在测试中验证 |

## Open Questions

- `ai` 项目没有 `.claude/hooks/` 目录的原因：是 setup 从未运行过，还是 setup 运行了但 Step 5 没触发？（可在 debug 模式下重新运行 setup 观察）
