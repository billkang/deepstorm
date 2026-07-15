## Context

当前 `deepstorm init` 的交互模式（`runInteractiveMode`）固定先询问项目名称，然后将 `runInit` 的目标目录设为 `{baseDir}/{projectName}`，若该目录已存在则直接报错退出。

`runInit` 内部在当前模式下：
1. 校验 `projectName` 为必填
2. 检查目标子目录是否已存在（存在则抛错）
3. `fs.mkdirSync` 创建子目录
4. 渲染脚手架文件到子目录

`.claude/claude.md` 方面：当前仅在根 `CLAUDE.md` 末尾追加一行 `> 项目事实见 .deepstorm/context.md`，没有独立的 `.claude/claude.md` 文件。

影响范围：`packages/cli/src/commands/init.ts`（约 1179 行），测试文件 `packages/cli/src/commands/__tests__/init.test.ts`。

## Goals / Non-Goals

**Goals:**
- 交互模式新增「当前路径是否为项目目录」判断步骤
- `runInit` 支持「原地初始化」（`projectName` 为空，直接在当前目录生成）
- 在已有目录中 init 时不覆盖已有文件
- 生成 `.claude/claude.md` 写入项目基础信息 + 技术栈
- 根 `CLAUDE.md` 同时引用 `.claude/claude.md` 和 `.deepstorm/context.md`
- 非交互模式（`--name`）行为不受影响

**Non-Goals:**
- 不修改 `setup` 命令的行为（setup 已独立调用 `initContextMap`）
- 不新增 CLI 选项
- 不实现文件 diff/merge 算法（仅简单跳过已有文件）
- 不实现自动检测当前目录是否为项目目录（靠用户确认）

## Decisions

### Decision 1: 目录判断使用 confirm 而非 select

选用 `@clack/prompts` 的 `confirm` 提示用户"当前路径是否为项目目录？"，而非 `select` 提供多个选项。

- **备选 A（选中的）**：`confirm` — 更简洁，只有"是/否"两个选择
- **备选 B**：`select` 提供"是/否/取消" — 额外的取消选项在 confirm 中已通过 Ctrl+C 支持，无需重复

### Decision 2: runInit 内部对 projectName 做分支处理

`runInit` 内部对 `opts.projectName` 做空值检查：

```
if (!opts.projectName) {
  // 原地初始化模式：baseDir 即项目目录
  projectDir = baseDir
} else {
  // 创建子目录模式：沿用现有逻辑
  projectDir = path.join(baseDir, opts.projectName)
  fs.mkdirSync(projectDir, { recursive: true })
}
```

- **备选 A（选中的）**：统一入口 + 内部 switch — 改动最小，不影响其他调用方
- **备选 B**：拆分 `runInit` 为 `runInitAtDir` 和 `runInitAtSubDir` — 过度设计，当前变更不需要两个函数

### Decision 3: 文件不覆盖策略

原地初始化时，对每个要生成的文件先检查 `fs.existsSync`，已存在则 `continue` 跳过：

- **备选 A（选中的）**：逐个文件 `existsSync` 检查 — 简单可靠
- **备选 B**：使用临时目录 + 差异合并 — 复杂度高，当前场景不需要

注意：此策略仅适用于原地初始化模式。创建新子目录时仍保持"目录已存在则报错"的现有行为（此时预期是空目录）。

### Decision 4: claude.md 生成作为独立函数

新增 `initClaudeMd(targetDir, opts)` 函数，与现有的 `initContextMap` 平级：

```
export function initClaudeMd(targetDir: string, opts: InitOptions): void {
  const claudeDir = path.join(targetDir, '.claude')
  const claudeMdPath = path.join(claudeDir, 'claude.md')
  if (fs.existsSync(claudeMdPath)) return

  ensureDir(claudeDir)
  // 写入项目名称 + 技术栈信息
  // 末尾引用 .deepstorm/context.md
}
```

- **备选 A（选中的）**：独立函数，与 `initContextMap` 并列调用 — 职责清晰，可测试
- **备选 B**：合并到 `initContextMap` — 职责混合，违反单一职责原则

### Decision 5: 调用时机

`writeInitTechStack` 中在 `initContextMap` 之后同步调用 `initClaudeMd`：

```typescript
export function writeInitTechStack(baseDir: string, opts: InitOptions): void {
  // ... 写入 settings.json ...
  initContextMap(baseDir, opts)
  initClaudeMd(baseDir, opts)  // 新增
}
```

同时在 `runInit` 的原地初始化模式末尾也调用 `initClaudeMd`（确保即使不经过 `writeInitTechStack` 也有 claude.md）。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 用户误答"是"（当前路径并非项目目录）→ 生成不完整的脚手架 | 这是用户主动选择。脚手架只添加不存在的文件，不会破坏已有内容 |
| 已有 `.claude/claude.md` 被覆盖 | 有 `fs.existsSync` 保护，已存在时不写入 |
| 根 `CLAUDE.md` 被重复追加引用行 | 追加前检查是否已包含引用内容 |
| 原地初始化时模板渲染目标路径变化可能引入 bug | `renderCommonFiles` 等函数已接受 `baseDir` 参数，原地模式下 `baseDir === projectDir`，路径计算不受影响 |
