## Context

`@deepstorm/cli` 使用 `commander` 作为 CLI 框架，命令通过 `index.ts` 统一注册。目前的 `template upgrade` 实现在 `template-upgrade.ts` 中作为独立子命令，与用户期望的"更新"体验分离。同时 `index.ts` 中版本号硬编码为 `0.1.0`，与 `package.json` 实际版本不同步。

CLI 发布到 npm 公共 registry（`@deepstorm/cli`），通过 `npx @deepstorm/cli setup` 或 `npm install -g @deepstorm/cli` 安装。用户环境可能使用 npm、pnpm 或 yarn，操作系统可能为 macOS / Linux / Windows，权限模型各异。

## Goals / Non-Goals

**Goals:**
- 提供 `deepstorm update` 命令作为统一的更新入口
- 支持通过 `--check` 仅查看版本信息，不执行更新
- 支持通过 `--cli` 检查 npm 最新版本并引导更新
- 支持通过 `--skills` 同步 skill 模板（继承 `template upgrade` 行为）
- `template upgrade` 保持 deprecation 过渡期，功能无缝迁移
- 修复 `--version` 输出的版本号与实际不同步的问题

**Non-Goals:**
- 不实现自动静默更新（用户需确认后才能更新 CLI）
- 不处理除 npm registry 以外的更新来源（GitHub Release、CDN 等）
- 不修改 skill 模板的同步逻辑本身，仅迁移入口

## Decisions

### Decision 1：CLI 更新采用「仅检查，引导用户手动执行」策略

检查 npm registry (`https://registry.npmjs.org/@deepstorm/cli/latest`) 获取最新版本，与本地版本比对后输出提示，由用户自行执行 `npm install -g @deepstorm/cli@latest`。

**理由：**
- 避免 `sudo` / 权限问题——全局 npm install 在不同系统上权限模型不同
- 避免包管理器差异——用户可能用 npm / pnpm / yarn 安装，自动检测不可靠
- 安全——不在用户不知情的情况下执行安装脚本
- 简洁——`update --cli` 只需一次 HTTP GET + 版本字符串比较，无副作用

### Decision 2：版本号从 `package.json` 运行时读取

复用 `doctor.ts` 中的 `getCliVersion()`，在 `index.ts` 中调用 `program.version(getCliVersion())`。

**理由：**
- `doctor.ts` 已有成熟实现，直接复用
- 避免构建时注入增加打包复杂度
- 运行时读 `dist/` 同级的 `package.json` 开销极低（一次 `JSON.parse`）

### Decision 3：`template upgrade` 保留 deprecation 提示并桥接到 `update --skills`

```typescript
// template.ts 中不注册 upgrade 子命令
// 而是在 update.ts 中实现所有逻辑
// 用户输入 deepstorm template upgrade 时 commander 报错 "unknown command"
```

**理由：**
- 这是一个尚未对外发布的内部命令，用户基数小
- 直接移除比保留 deprecation 桥接更干净，减少维护负担
- 如果后续需要 deprecation，可以通过 commander 的 `.command('upgrade').action(...)` 添加提示

### Decision 4：`update.ts` 模块结构

```typescript
src/commands/update.ts
├── checkNpmVersion(): Promise<{ latest: string | null; error?: string }>
│   // fetch npm registry, parse version, 返回 { latest: "0.2.0" } 或错误
├── updateSkills(cliDir, targetDir, skillIds)
│   // 委托 upgradeTemplates() 执行
└── registerUpdateCommand(program, registry)
    // 注册 update 及子选项
```

### Decision 5：`--check` 输出格式

```
# 有更新时
✔ 当前版本: v0.1.2
✔ 最新版本: v0.2.0
→ 有新版本可用！运行 "deepstorm update --cli" 更新

# 已是最新
✔ 当前版本: v0.1.2
✔ 最新版本: v0.1.2
✓ 已是最新版本

# 联网失败
⚠ 无法检查更新：npm registry 连接失败
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| npm registry 不可达（内网环境、防火墙） | fetch 设置超时（5s），失败时显示友好提示，不中断其他流程 |
| 本地版本号读取失败（`package.json` 缺失或损坏） | 回退到 "未知"，不影响命令执行 |
| `--cli` 引导的 `npm install` 命令在不同 shell 环境下可能不可用 | 仅输出提示文本，不自动执行，用户自行选择更新方式 |
| semver 解析错误（npm registry 返回非标准版本号） | 使用 Node.js 内置 `semver.compare()` 或简单字符串比较，异常时做 graceful 降级 |

## Open Questions

- 是否需要在 `doctor` 命令中也显示最新版本信息？（用户已确认「好」）
