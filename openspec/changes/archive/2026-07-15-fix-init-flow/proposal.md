## Why

当前 `deepstorm init` 只支持「创建全新项目目录」一种场景，无法在已有项目目录中原地初始化；同时生成的 `.claude/claude.md` 内容过于简单，仅有一行引用，缺少项目基础信息（技术选型等），导致 AI 协同时缺乏必要的上下文。

## What Changes

- **新增项目目录检测流程**：交互模式中首先询问用户当前路径是否为项目目录，是则跳过项目名询问，直接在当前目录生成脚手架；否则沿用原有逻辑帮助用户创建项目目录
- **修改 `runInit`**：支持 `projectName` 为空（已在目标目录中）或为有值（创建子目录）两种模式
- **新增 `.claude/claude.md` 生成**：在 `.claude/` 目录下创建 `claude.md`，写入项目名称、技术栈、框架版本等基础信息，替代原来在根 `CLAUDE.md` 追加的引用行
- **根 `CLAUDE.md` 内容增强**：保持引用 `.deepstorm/context.md` 的同时增加对 `.claude/claude.md` 的交叉引用

## Capabilities

### New Capabilities
- `project-directory-detection`: 交互模式中的项目目录判断流程，决定是否询问项目名以及在何位置生成脚手架
- `claude-md-initialization`: 在 `.claude/claude.md` 中写入项目基础信息（项目名、技术栈、框架选型等）

### Modified Capabilities
- `init-config-share`: 当前 spec 定义了 init 将技术方案写入配置的行为。本变更新增了 `.claude/claude.md` 的内容生成，需补充相关 requirement
- `project-context-map`: 当前 spec 定义了 `.deepstorm/context.md` 的生成。本变更新增了 `.claude/claude.md` 的生成，需补充 `claude.md` 与 `context.md` 的关系说明

## Impact

- **`packages/cli/src/commands/init.ts`** — 核心修改：`runInteractiveMode` 增加目录判断流程，`runInit` 支持目录内初始化，新增 `.claude/claude.md` 生成逻辑
- **`packages/cli/src/commands/__tests__/init.test.ts`** — 测试需覆盖新场景
- **`openspec/specs/init-config-share/spec.md`** — 补充 `.claude/claude.md` 相关 requirement
- **`openspec/specs/project-context-map/spec.md`** — 补充 `claude.md` 与 `context.md` 关系说明
