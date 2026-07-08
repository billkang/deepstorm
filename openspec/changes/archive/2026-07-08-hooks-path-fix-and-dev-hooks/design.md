## Context

### 问题现状

1. **hooks.json 路径问题**：Claude Code 的 hooks 加载机制只读取项目根目录下的 `.claude/hooks.json`（单个文件），hook 脚本放在 `.claude/hooks/` 目录下。但 DeepStorm CLI 自 v0.1.0 以来的 setup 流程 Step 5 将 hooks 配置写入 `.claude/hooks/hooks.json`（嵌套路径），这个路径 Claude Code 从未读取。这意味着所有通过 `deepstorm setup` 或 `deepstorm update` 安装的 hooks 配置实际上从未生效过。

2. **套件 hooks.json 路径问题**：各套件（reef/sweep/tide）在 `packages/*/hooks/hooks.json` 中定义 hook 命令路径时使用了 `./reef-*.sh` 格式。当构建工具将这些 hooks.json 复制到目标项目的 `.claude/hooks/` 下时，`./reef-*.sh` 路径是相对于 `.claude/hooks/` 目录解析的——但脚本实际上不在那里。脚本在套件包的 `hooks/` 目录中，通过构建流程安装到目标项目的 `.claude/hooks/` 下。这意味着路径应该是 `.claude/hooks/reef-*.sh`（从项目根出发）。

3. **DeepStorm 自身开发缺乏约束**：作为一套 AI 协同工具的开发平台，DeepStorm 自身开发反而没有流程约束机制。开发者（AI 助手）可能跳过需求讨论直接写代码，导致沟通-实现脱节。需要借鉴 reef 套件的 hooks 模式，为 `.claude/` 开发环境增加护栏。

### 已有基础设施

- reef 套件已有成熟的 hook 体系（intent-detect、block-dangerous、protect-files、auto-format、run-tests），位于 `packages/reef/hooks/`
- Claude Code 支持 5 种 hook 事件：UserPromptSubmit、PreToolUse、PostToolUse、Stop、Notification
- DeepStorm 自 v0.2.0 开始支持通过 setup 流程安装 hooks

## Goals

- **修复 hooks 路径错误**：确保 `deepstorm setup` 和 `deepstorm update` 写入的 hooks.json 可被 Claude Code 加载
- **规范套件 hook 路径**：确保 reef/sweep/tide 套件的 hooks.json 命令路径正确
- **建立 DeepStorm 自身开发约束**：通过 hooks 确保任何 DeepStorm 代码变更前先走 deepstorm-discuss
- **安全护栏**：拦截危险命令，保护关键配置文件

## Non-Goals

- 不修改各套件 hook 脚本内部的业务逻辑
- 不修改 DeepStorm 的构建/发布流程（`pnpm build`、`pnpm publish` 等）
- 不修改 playground 的 hooks 配置（相关废弃文件已直接删除）
- 不修改 Notification 类型 hook
- 不引入新的测试框架或 CI 变更
- 不改动 `.gitignore`

## Decisions

### Decision 1：hooks.json 目标路径统一为 `.claude/hooks.json`

- **选项 A（选中的方案）**：将路径统一为 `.claude/hooks.json`（项目根目录）
- **选项 B**：保留 `.claude/hooks/hooks.json` 并发 PR 要求 Claude Code 支持读取该路径
- **理由**：选项 A 是遵循 Claude Code 现有机制的修正方案，不依赖外部变更；选项 B 需要等待 Claude Code 团队接受，时间不可控

### Decision 2：hook 命令路径格式从 `./xxx.sh` 改为 `.claude/hooks/xxx.sh`

- **选项 A（选中的方案）**：使用 `.claude/hooks/` 前缀（相对于项目根目录的绝对引用语义）
- **选项 B**：使用 `./hooks/xxx.sh`（相对于 `.claude/` 目录的相对路径）
- **理由**：hooks.json 位于 `.claude/hooks.json`，Claude Code 在解析命令路径时，相对路径是相对于 hooks.json 所在目录（`.claude/`）解析的。但为了可读性和一致性，选择更长的 `.claude/hooks/` 路径——它明确表达了"从项目根出发"的语义。

### Decision 3：reconfigure 路径清理策略

- cleanup 逻辑同时处理 `.claude/hooks.json`（根路径）和 `.claude/hooks/` 目录
- `.claude/hooks/` 目录保留（可能包含用户自定义 hook 脚本），只清理 hooks.json 配置
- **理由**：不能假设 `.claude/hooks/` 下的所有文件都是 DeepStorm 安装的，用户可能手动添加了自定义 hook 脚本

### Decision 4：借鉴 reef 模式但独立实现

- DeepStorm 自身的开发 hooks 借鉴 reef 的模式（不同类型的 hook 组合），但独立实现 shell 脚本
- 与 reef 共享的只有理念和模式，不共享代码实现
- **理由**：DeepStorm 自身的开发约束与 reef 面向终端用户项目的约束，关注点不同（前者关注"开发流程纪律"，后者关注"代码质量与安全"）

### Decision 5：Write/Edit 使用双重门禁

- PreToolUse 阶段同时配置了 `command` hook（protect-files.sh）和 `prompt` hook
- `prompt` hook 负责提示开发流程纪律（不会阻断，超时 5 秒）
- `command` hook 负责技术层面拦截（对保护文件返回 deny）
- **理由**：两层防护——prompt 是行为引导，command 是技术强控，互补不冗余

### Decision 6：run-tests 使用异步模式

- PostToolUse 的 run-tests 配置为 `async: true`
- 30 秒超时
- **理由**：异步测试不阻塞编码流程，超时后自动放行，确保开发者体验不受影响。测试结果通过 stderr 输出供参考

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `run-tests` 测试失败但不阻塞，可能导致破坏未被立刻发现 | 代码质量下降 | Stop 事件也会跑测试，且测试结果通过 stderr 输出到会话记录 |
| `intent-detect` 关键词匹配可能误触发 | 误报提示，影响流畅性 | 设置了排除规则（查询类不触发）；关键词范围谨慎定义 |
| 新 hooks 引入后工作流有额外开销 | token/时间消耗增加 | prompt hook 仅 5 秒 timeout；run-tests 异步执行 |
| 用户可能绕过 hooks（通过其他工具直接修改文件） | 约束失效 | hooks 是 Claude Code 层面的约束，无法防止外部修改；属于接受的风险 |
