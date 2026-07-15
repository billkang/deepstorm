## Context

当前 `deepstorm setup` 的安装流程（Steps 1-8）覆盖了 MCP 配置、skill/agent/hook 安装、`.env` 生成和向导输出。但各套件（Tide、Sweep）依赖的外部工具——BMAD Method、grill-me、Playwright 浏览器——需要用户手动安装，体验断裂。

本设计在安装流程末尾新增 Step 9，根据用户所选套件自动安装对应前置依赖。

## Goals / Non-Goals

**Goals:**
- Tide 被选中时自动安装 bmad-method 和 grill-me
- Sweep 被选中且 E2E 框架为 Playwright 时自动安装浏览器
- 已安装时跳过（幂等）
- 安装失败仅警告，不中断向导
- 独立的安装步骤，便于后续扩展其他套件的自动安装

**Non-Goals:**
- 不处理项目级 devDependencies 的安装（如前端构建工具、lint 工具）
- 不涉及 MCP 服务级别的依赖
- 不修改用户已安装的工具（仅新增，不覆盖/升级）

## Decisions

### 1. 安装步骤位置：Step 9（向导末尾，Step 8 guide 之后）

**方案对比：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| Step 9，Step 8 guide 之后 | 所有 DeepStorm 自身配置完成后再触发外部安装，流程清晰 | 外部安装的输出在 guide 之后展示 |
| Step 8 guide 之前 | guide 可包含安装结果 | guide 会因安装输出而中断连贯性 |
| Hook 方式（post-setup hook） | 解耦 | 额外复杂性，不值 |

**决策：** Step 9，在 Step 8 输出 guide 之后执行。因为 guide 展示的是 DeepStorm 自身安装摘要，外部工具安装是独立的附加步骤。

### 2. 命令执行方式：`child_process.execSync`

使用 `child_process.execSync` 而非 `exec`/`spawn`，因为：
- 安装是同步操作，setup 流程本身是同步的
- 需要阻塞直到安装完成以报告成功/失败
- `stdio: 'inherit'` 让用户能看到安装进度输出

### 3. 幂等检测

| 工具 | 检测方式 |
|------|---------|
| bmad-method | `npx bmad-method status` 退出码 + 输出判断 |
| grill-me | `.claude/skills/grill-me/SKILL.md` 文件是否存在 |
| Playwright | `npx playwright install --dry-run` 或检查浏览器路径 |

### 4. 错误处理

所有安装步骤使用 try-catch 包裹，失败时打印警告但不抛出异常，确保不影响安装向导的整体流程。

### 5. 模块化

每个工具的安装逻辑封装为独立函数，统一在 Step 9 中按顺序调用：

```
step9AutoInstallDeps()
├── installBmadMethod()    // Tide → npx bmad-method install
├── installGrillMe()       // Tide → git clone / curl 到 .claude/skills/
└── installPlaywright()    // Sweep + Playwright → npx playwright install
```

### 6. grill-me 获取方式

grill-me 来自 GitHub 仓库 `https://github.com/mattpocock/skills`，无需 git clone 整个仓库，直接通过 `curl` 或 `wget` 获取对应的 SKILL.md 文件到 `.claude/skills/grill-me/` 目录。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| `npx bmad-method install` 没有 `--yes` 标记，可能交互等待 | 检查是否有 `--yes` 或 `--non-interactive` 参数；如无可通过 pipe 或环境变量 |
| `npx playwright install` 需要下载数百 MB 浏览器 | 显示进度信息，失败时清晰提示手动安装 |
| 用户无网络连接 | 所有步骤 try-catch，失败仅警告，不阻塞 |
| grill-me 仓库结构变更 | 错误信息提示用户手动从 GitHub 安装 |
| 安装耗时过长 | 同步执行，单个步骤超时控制（timeout 参数） |

## Migration Plan

本 change 无破坏性变更。已安装的用户下次运行 `deepstorm setup`（`reconfigure` 模式）时自动生效。存量用户的 bmad/grill-me/Playwright 不受影响。

## Open Questions

- `npx bmad-method install --yes` 是否有非交互模式？需要实际测试。（如无，考虑 `echo "" | npx bmad-method install`）
- grill-me SKILL.md 的精确 GitHub raw URL 是什么？
