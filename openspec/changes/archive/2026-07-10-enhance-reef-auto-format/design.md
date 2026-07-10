## Context

reef 当前通过 PostToolUse hook 机制在每次 Write/Edit 后自动运行 `reef-auto-format.sh`，该脚本按文件类型分派不同的格式化工具。目前覆盖 eslint --fix（TS/JS）、ruff format/black（Python）、google-java-format（Java）、gofmt-w（Go）、rustfmt（Rust）。

实际项目中 VS Code 的 "format on save" 会额外执行 Prettier 格式化和 `source.organizeImports`，当 VS Code 的格式化行为与 ESLint --fix 不一致时，用户首次保存代码会产生 diff。

## Goals / Non-Goals

**Goals:**

- 在 `reef-auto-format.sh` 中增加 Prettier 格式化步骤
- 在 `reef-auto-format.sh` 中增加 organize imports 步骤（TypeScript `source.organizeImports` + Python `isort`）
- 新增 VS Code 配置检测能力：读取 `.vscode/settings.json` 自动决定格式化策略
- 在 wizard.json 中增加格式化相关配置项作为 fallback
- 保证格式化顺序：Prettier → ESLint --fix（避免 ESLint 修复被 Prettier 覆盖）

**Non-Goals:**

- 不修改 VS Code 自身的任何配置
- 不支持除 VS Code 外的其他 IDE 配置检测（WebStorm、Vim 等）
- 不对已有项目做迁移或重写现有格式化工具
- 暂时不引入 `gofumpt`、`gci` 等 Go 增强格式化工具

## Decisions

### Decision 1: 格式化顺序 — Prettier 先于 ESLint

**选择：** Prettier → ESLint --fix

**理由：** Prettier 是一个"固执的"格式化器，会重写代码格式（缩进、换行、括号间距等）。如果 ESLint --fix 先运行然后 Prettier 再运行，Prettier 会覆盖 ESLint 的格式化输出。反过来（Prettier 先 → ESLint --fix 后），ESLint 修复代码质量规则（类型断言风格、命名约定等），Prettier 处理纯格式，两者的职责解耦。

已有社区共识：Prettier 官方建议在 ESLint 之前运行。参见 Prettier 文档。

### Decision 2: 配置优先级 — VS Code 配置 > wizard.json > 代码检测

**选择：**

```
1. .vscode/settings.json（最高优先级 — 项目显式配置）
2. wizard.json（中优先级 — reef 安装时配置）
3. 工具自动检测（最低优先级 — prettier 检测 .prettierrc 等）
```

**理由：** VS Code 配置是最直接反映开发者意图的。wizard.json 作为 reef 安装时的约定配置。工具检测（如检测 `.prettierrc` 文件存在）是最宽松的判断方式，仅在无更高优先级配置时启用。

### Decision 3: organize imports 工具选择

**TypeScript：** `npx ts-unused-exports --organize-imports`（Node 20+ 支持 `--experimental-strip-types`），或退回到 `npx tsserver --organizeImports`。

不选择 `eslint-plugin-import` 的 `import/order` 规则：该规则配置复杂、不同项目差异大，且 React/Vue/Angular 项目对 import 顺序有不同约定。`source.organizeImports`（VS Code 原生动作）是跨框架的通用方案。

**Python：** `isort`（首选）→ `ruff check --select I --fix`（回退）

isort 是 Python 生态中最成熟的 import 排序工具，与 VS Code 的 Python 扩展行为一致。如果项目使用 ruff 做 linter，也可以使用 ruff 的 import 排序功能。

### Decision 4: 配置缓存

**选择：** 在 `/tmp/` 创建缓存文件记录 `.vscode/settings.json` 的解析结果，以 `.vscode/settings.json` 的 mtime 作为缓存失效依据。

**理由：** PostToolUse hook 在每次 Write/Edit 后触发，解析 JSON 文件的成本虽低但高频执行（一个 session 可能写入几十个文件）。缓存策略避免了不必要的 I/O。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Prettier 格式化耗时增加，Write 后的响应变慢 | 将 Prettier 设为可配置项，用户可选择关闭；hook 本身是同步执行但耗时通常 < 200ms |
| organizeImports 可能删除用户有意保留的未使用 import | TypeScript `source.organizeImports` 行为与 VS Code 完全一致，不是新问题 |
| VS Code settings.json 解析失败（格式错误等） | 捕获解析异常，静默回退到 wizard.json 配置 |
| 本机没有安装项目中配置的 Prettier 版本 | 使用 `npx prettier` 确保使用项目本地版本 |
| isort 输出与 black/ruff format 冲突（import 排序后的格式问题） | 格式化顺序：isort → ruff format，确保 isort 的格式化输出被后续格式化步骤修正 |
