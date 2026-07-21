## Context

目前 reef-commit、reef-pr、reef-harden 三个技能的 SKILL.md 中内嵌了大量 bash 命令和 LLM 推理规则。每次 LLM 执行时都要读取这些文本命令并重新执行，存在以下问题：

- **Token 浪费**：同样的 git 操作序列（`git merge-base`、`git diff --stat`、`git log`）在不同 SKILL.md 中被多次描述
- **执行不一致**：同一操作在不同 context 窗口中的执行细节可能走样（如 grep 正则差异）
- **LLM 模糊判断**：有些逻辑明确的规则（分支名是否含 temp/wip）本应由代码决定，却让 LLM "自行推理"
- **维护成本高**：修改一个 git 命令需要在多个 SKILL.md 中同步更新

Sweep 套件（sweep-run、sweep-init）已展示了正确的模式：将机械逻辑抽取到 `scripts/` 目录下的 `.mjs` 文件，SKILL.md 只描述"何时调用哪个脚本"。

## Goals / Non-Goals

**Goals:**
- 将 reef-commit、reef-pr、reef-harden、sweep-init、sweep-run 中的确定性机械操作抽取为独立脚本
- 抽取后的脚本遵循现有的 `.mjs` + Node.js run 模式（POSIX 兼容，与 sweep 保持一致）
- 每段机械逻辑只维护一份代码，多个 SKILL.md 可引用同一脚本
- SKILL.md 中不再内嵌可执行的 bash 长序列

**Non-Goals:**
- 不改动纯 LLM 推理驱动的内容（reef-harden 的五道筛逻辑、reef-testcase 整体、reef-commit 的提交信息智能生成）
- 不改动已完全脚本化的技能（reef-scope）
- 不引入新的第三方依赖或构建步骤
- 不改变技能对外暴露的行为或接口

## Decisions

### 决策 1：脚本语言使用 `.mjs`（Node.js）而非纯 `.sh`

**选项：**
| 方案 | 优势 | 劣势 |
|------|------|------|
| `.sh`（bash） | 零依赖，原生 POSIX | JSON 处理需要 jq，跨平台兼容问题（macOS vs Linux），缺乏结构化 API |
| `.mjs`（Node.js） | JSON 原生支持，`fs` 直接操作文件，`child_process` 执行命令，可导出 API 给其他 mjs 引用 | 需要 Node.js |

**选择：`.mjs`（Node.js）**，原因：
1. Sweep 套件已经使用此模式，5 个脚本 + 对应测试，有既有实践可沿用
2. 每个脚本的 CLI 入口模式已标准化（`if (import.meta.filename === process.argv[1])`）
3. 脚本需要输出 JSON 供下游使用，`.sh: jq` 方案不如 `.mjs: JSON.stringify` 可靠
4. 需要导出的 API 函数可在多个脚本间复用（如 `findChangeDir()` 被 collect-commit-context 和 collector-pr-context 共用）

极少数不需要 JSON 输出的简单操作（如 `run-tests.sh`、`stash-and-switch.sh`）保留 `.sh`。

### 决策 2：脚本位置与组织结构

每个技能下的 `scripts/` 目录存放该技能的抽取脚本。跨技能复用的脚本放在 `packages/reef/scripts/` 或 `packages/sweep/scripts/` 顶层。

```
packages/reef/skills/
├── reef-commit/
│   ├── SKILL.md
│   └── scripts/
│       ├── collect-git-context.mjs    # git 上下文收集
│       ├── branch-check.mjs           # 分支名合法性检查
│       ├── stash-and-switch.sh        # stash/checkout/pop
│       ├── run-tests.sh               # 运行单元测试
│       └── check-openspec-status.mjs  # OpenSpec 状态检查
├── reef-pr/
│   ├── SKILL.md
│   └── scripts/
│       └── create-pr.mjs              # PR 上下文收集 + 创建
├── reef-harden/
│   ├── SKILL.md
│   └── scripts/
│       └── find-change-dir.mjs        # change 目录发现
└── scripts/                           # 跨技能共用
    └── shared-find-change.js          # (暂不实现，等实际需要时)
```

sweep 保持已有结构，新增脚本：
```
packages/sweep/skills/sweep-run/scripts/
├── env-manager.mjs      # 已有
├── flow-parser.mjs       # 已有
├── ...                   # 已有
└── generate-report.mjs   # 新增
```

### 决策 3：每个脚本的 IO 契约

脚本的输入/输出约定统一为：

| 类型 | 约定 |
|------|------|
| 输入 | CLI 参数（`process.argv`）或 stdin |
| 输出（成功） | stdout 输出 JSON，exit code 0 |
| 输出（失败） | stderr 输出错误信息，exit code 非 0 |
| 纯净约束 | 不产生侧效应 stdout 日志（用 stderr） |

例：
```bash
# SKILL.md 中调用
CONTEXT=$(node scripts/collect-git-context.mjs)
BRANCH=$(echo "$CONTEXT" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).branch")
```

### 决策 4：复用优先——不复制，合并到已有脚本

sweep-run 的 env-manager.mjs 已经实现了路径检测功能，新增路径导航直接扩展该脚本的方法，不另建新文件。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 脚本在所有使用场景被正确调用 | 每个脚本加 `--help` 参数；SKILL.md 标明调用示例 |
| 脚本修改后 SKILL.md 不同步 | 所有脚本和其 SKILL.md 在同一 change 中修改，一起 code review |
| macOS vs Linux 兼容性 | 用 Node.js child_process 而非 bash 管道可避免大部分兼容问题 |
| reef 已有 hooks 是 .sh，不一致 | .mjs 用于新的脚本化抽取，已有 .sh hooks 保持不动（仅增量，不改存量） |

## Open Questions

（无——方案已通过现有 sweep-run 脚本验证，技术栈已成熟）
