# DeepStorm Playground

> DeepStorm 四个套件（Tide · Reef · Sweep · Atoll）的统一验证工程。
> 按以下步骤逐步安装、启动、验证各工具功能。

---

## 目录结构

```
playground/
├── app/                   # 被测系统 — Express CRUD 全栈任务管理应用
├── e2e/                   # Sweep E2E 测试项目 — .flow.md + topology
├── guides/                # Tide / Reef / Atoll 工具能力演示文档（参考）
├── scripts/
│   ├── setup-all.sh        # 一键全量初始化（构建 CLI + 全部工具 + E2E + app）
│   ├── setup-tide.sh       # Tide 产品侧
│   ├── setup-reef.sh       # Reef 开发侧
│   ├── setup-sweep.sh      # Sweep 测试侧
│   ├── setup-atoll.sh      # Atoll 运维侧
│   └── _common.sh          # 公共配置
├── .gitignore
├── .claude/               # 安装后生成（skills / agents / hooks）
├── .env                   # 安装后生成（MCP 环境变量）
├── .mcp.json              # 安装后生成（MCP 服务器配置）
└── tide-data/             # 安装后生成（Tide 会话记录）
```

---

## Phase 1：环境准备

### Step 1 — 一键初始化（推荐）

```bash
bash scripts/setup-all.sh
```

这一个命令完成三件事：
1. `pnpm build` — 构建 CLI
2. 非交互安装全部工具（tide / reef / sweep / atoll）
3. `npm install` — 安装 app 依赖

**预期结果：**
- `packages/cli/dist/cli.js` 已构建
- `.claude/skills/` 包含 20 个 skill
- `.env` + `.mcp.json` 已生成

> 仅供工具安装：`bash scripts/setup-tide.sh` / `setup-reef.sh` / `setup-sweep.sh` / `setup-atoll.sh`
> 仅构建+安装工具（跳过 app）：`bash scripts/setup-all.sh && cd app && npm start`

### 替代方案 — 手动执行 CLI 安装

如果想一步步手动体验 `deepstorm setup` 的安装过程，也可以直接调用 CLI：

#### Step 1a — 构建 CLI

在仓库根目录下执行：

```bash
pnpm build
```

**预期结果：** `packages/cli/dist/cli.js` 生成。

#### Step 1b — 进入 Playground

```bash
cd playground
```

CLI 的 `setup` 命令以当前工作目录为安装目标（`process.cwd()`），因此必须进入 `playground/` 后再执行。

#### Step 1c — 交互式安装

```bash
node ../packages/cli/dist/cli.js setup
```

安装向导会依次提示：
1. **工具选择** — 用空格选中 Tide / Reef / Sweep / Atoll 等套件，回车确认
2. **MCP 服务选择** — 勾选需要的外部服务（如 Context7、GitHub、Jira 等）
3. **配置问答** — 根据选中工具询问前端框架、后端语言等技术选型
4. **自动生成** — 在 `.claude/` 下产出 skills / agents / hooks，生成 `.mcp.json` + `.env`

> 如果已有旧配置需重装，先执行 `node ../packages/cli/dist/cli.js setup --reconfigure` 清理。

#### Step 1d — 非交互式安装（自动化/CI）

如果已知要安装的套件和配置，可以跳过向导直接指定参数：

```bash
node ../packages/cli/dist/cli.js setup --non-interactive \
  --tools reef,tide,sweep,atoll \
  --mcp-tools context7,github,jira,figma,playwright \
  --set "reef.techs=frontend,backend" \
  --set "reef.frontend.framework=angular" \
  --set "reef.backend.language=java"
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `--non-interactive` | 跳过向导，所有配置通过参数传递 | 无值 |
| `--tools` | 安装的套件（逗号分隔） | `reef,tide` |
| `--mcp-tools` | 安装的 MCP 服务（逗号分隔） | `context7,playwright` |
| `--set` | 配置项（可多次出现） | `reef.frontend.framework=angular` |

#### Step 1e — 清理旧配置重装

```bash
node ../packages/cli/dist/cli.js setup --reconfigure --non-interactive \
  --tools reef \
  --mcp-tools context7
```

`--reconfigure` 会先清空已有 `.claude/`、`.mcp.json` 和 `.env`，再重新安装。

#### Step 1f — 连接 node_modules

CLI 构建时 commander 等依赖是 external 打包的，需要 CLI 包的 `node_modules`：

```bash
ln -sf ../packages/cli/node_modules node_modules
```

### Step 2 — 启动被测系统

```bash
cd app
npm start
# → http://localhost:3000
```

**预期结果：** 访问 http://localhost:3000 看到登录页面。

<details>
<summary>App 功能速览</summary>

- 用户注册/登录（Session 认证）
- 任务 CRUD（创建、查看、编辑、删除）
- 状态管理（完成/待办）
- 筛选搜索（按状态、关键字）
</details>

---

## Phase 2：Sweep — E2E 测试验证

> 依赖：app 已启动（端口 3000）。

### Step 3 — 检查预置测试

```bash
ls e2e/flows/user-system/ e2e/flows/tasks/
```

**预期结果：** 看到 `login.flow.md`、`register.flow.md`、`task-crud.flow.md`、`task-filter.flow.md`。

### Step 4 — 执行 E2E 测试

在 Claude Code 会话中（当前目录为 `playground/`）：

```bash
/sweep-run --path user-system
```

**预期结果：** Playwright MCP 依次操作浏览器，逐步执行登录和注册测试，实时输出 ✅/❌ 结果。

也可以全量执行：

```bash
/sweep-run --all
```

**预期结果：** 所有 4 个 .flow.md 执行完毕，`e2e/flows/reports/` 下生成 `.report.md` 报告。

### Step 5 — 创建新测试（可选）

```bash
/sweep-plan
```

**预期结果：** AI 引导输入需求→挖掘场景→生成 `.flow.md`，可立即可用 `/sweep-run` 执行。

---

## Phase 3：Tide — 产品需求讨论验证

> 依赖：无需 app，全在 Claude Code 对话中完成。

### Step 6 — 触发 BMAD 讨论

在 Claude Code 中直接输入：

```
给任务管理系统加一个截止日期功能，用户创建任务时可以设置到期时间，到期没完成的标红提醒。
```

**预期结果：** Tide 自动激活 BMAD 多角色讨论流程（分析师 → PM → 架构师 → UX → 产品负责人），逐步收敛需求。

### Step 7 — 检查 PRD 产出

讨论完成后：

```bash
ls tide-data/prds/
```

**预期结果：** 目录下生成 PRD 文件（`.json` + `.md`）。

### Step 8 — 完整发布流程（需 Jira + 飞书 MCP）

配置 `.env` 中的 Token 后可在 `deepstorm-discuss` 发布阶段执行：
- Jira Issue 创建 — 自动拆分为 Task/Sub-task
- 飞书知识库发布 — PRD 推送到知识库

---

## Phase 4：Reef — 开发侧工具验证

> 依赖：以下除 git-pr 外无需 Token。

### Step 9 — 测试用例生成

```bash
/reef:reef-testcase
```

输入一个功能描述（如"用户注册功能"），观察 AI 生成四维覆盖的测试用例清单。

**预期结果：** 输出结构化的测试用例，包含正常流程、边界条件、异常场景、验收标准。

### Step 10 — Spec 加固

```bash
/reef:reef-harden
```

提供 `e2e/flows/user-system/login.flow.md` 作为输入。

**预期结果：** 四道筛检查（完整性、一致性、可测试性、技术可行性），输出加固建议。

### Step 11 — Git Commit 辅助

创建一个简单修改后：

```bash
/reef:reef-commit
```

**预期结果：** AI 审查变更文件，生成规范的提交信息。

### Step 12 — Git PR 创建（需 GitHub Token）

推到远程分支后：

```bash
/reef:reef-pr
```

**预期结果：** AI 读取变更上下文，构建 PR 描述并创建 PR。

### Step 13 — 代码审查

```bash
/reef:reef-review
```

**预期结果：** 自动检测当前分支变更范围，派发对应审查代理并行审查。

### Step 14 — 代码生成（需对应对应技术栈）

`reef-gen-backend` 和 `reef-gen-frontend` 需要 Spring Boot + Angular 技术栈。Playground 的 app 是 Express + Vanilla JS，此场景不适合。如需体验，在外部 Spring Boot 项目中运行对应命令。

---

## Phase 5：Atoll — 运维侧验证

### Step 15 — 触发 Atoll 运维技能

```bash
/atoll:atoll-ops
```

**预期结果：** 触发 Atoll 运维工作流。

> 当前 `atoll-ops` skill 已就绪，深度集成的 MCP 服务在规划中。

---

## 验证总览

| Phase | Steps | 工具 | 验证内容 | Token 依赖 |
|-------|-------|------|---------|-----------|
| 准备 | 1-2 | `scripts/setup-all.sh` 或手动 CLI | 环境初始化 + app 启动 | 无 |
| Sweep | 3-5 | `/sweep-run` | E2E 测试执行与创建 | 无 |
| Tide | 6-8 | `deepstorm-discuss` | BMAD 讨论 → PRD 生成 | Jira / 飞书（可选） |
| Reef | 9-14 | `/reef:*` | 测试用例 / commit / PR / 审查 | GitHub（仅 PR） |
| Atoll | 15 | `/atoll:atoll-ops` | 运维技能触发 | 无 |

---

## 环境依赖

| 依赖 | 用途 | 必需？ |
|------|------|--------|
| Node.js ≥ 20.12 | app + CLI 运行 | ✅ |
| Playwright MCP | Sweep 浏览器自动化 | Phase 2 |
| Jira MCP | Tide 发布 / Reef PR | 可选 |
| GitHub Token | Reef PR/Commit | 可选 |
| 飞书 MCP | Tide 知识库发布 | 可选 |

> MCP Token 配置见 `.env` 文件中的说明。

---

## 常见问题

**Q：`/sweep-run --all` 报找不到命令？**
A：未安装 Sweep 套件。运行 `bash scripts/setup-all.sh`，或手动执行 CLI 安装。

**Q：`deepstorm setup` 报找不到 registry.json？**
A：CLI 需先构建。在仓库根目录执行 `pnpm build`。

**Q：手动安装后没有 `node_modules`？**
A：CLI 的 `commander`、`@clack/prompts` 等依赖是 external 打包的，需链接 CLI 包的 node_modules：
```bash
ln -sf ../packages/cli/node_modules node_modules
```

**Q：app 启动后无法访问？**
A：确认端口 3000 未被占用：`lsof -i :3000`。

**Q：Jira MCP 报错？**
A：检查 `.env` 中 `JIRA_INSTANCE_URL`、`JIRA_USER_EMAIL`、`JIRA_API_KEY` 是否正确。

**Q：Playwright MCP 连接失败？**
A：确认 playwright-mcp 服务已启动，`.mcp.json` 中 `deepstorm-playwright` 的 `url` 地址正确（默认 `http://localhost:54321/sse`）。
