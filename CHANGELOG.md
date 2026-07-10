# Changelog

## [0.6.1] - 2026-07-10

### Features

- deepstorm-release 新增 release 分支、PR 及 GitHub Release (`152d07b`)

### Documentation

- 将 ASCII 流程图改造成 Mermaid (`5d54396`)

## [0.6.0] - 2026-07-10

### Features

- 新增 @deepstorm/pilot Harness Agent — 自动读取 OpenSpec 并 spawn claude CLI 进程独立完成代码实现，支持 daemon 守护进程后台运行、状态持久化、断点恢复、运行时监控、token 预算控制、自动重试 (`acf4414`)
- 新增 CLI pilot 子命令组：run（支持 --detach 后台模式）、status、log、stop、resume、list (`acf4414`)
- 集成 pilot 到 monorepo 构建流水线和 npm 发布流程 (`acf4414`)
- 新增 playground pilot E2E 测试项目和 setup-pilot.sh (`acf4414`)

### Documentation

- README 和 CLAUDE.md 更新 pilot 套件信息 (`acf4414`)

## [0.5.0] - 2026-07-10

### Features

- 新增 `deepstorm init` 项目脚手架命令，支持 Angular + Java Spring Boot 全栈项目骨架一键生成，包含交互式向导和 CLI 参数双模式、PrimeNG/Tailwind 条件集成、Hibernate/Liquibase/Spring AI 条件集成 (`386e16e`)
- 增强 reef-auto-format，集成 Prettier 自动格式化、TypeScript/TSX organize imports、VS Code 配置检测自动决策格式化策略 (`8a6ef7c`)

### Documentation

- README 适配 npm 全局安装，CLI 命令表从 `npx @deepstorm/cli` 改为 `deepstorm` 前缀，新增全局/按需双列快速参考 (`da295f7`)
- 重新组织 README 结构，新增「安装」章节和「快速参考」表格，区分普通用户安装流程和开发者构建流程 (`34d441b`)

## [0.4.1] - 2026-07-10

### Features

- reef-style-backend Java quick-reference.md 新增三条 LLM 编码风格规则：控制流必须使用大括号、禁止未使用的局部变量、变量声明靠近首次使用且使用 final var (`c72ba89`)

## [0.4.0] - 2026-07-09

### Features

- deepstorm update 新增配置驱动 tool 检测：`detectToolsFromConfig()` 从 `deepstorm.*` 配置前缀中识别已安装但未注册的 tool，确保资产同步完整 (`2fd9cf7`)
- deepstorm-commit 技能新增 Step 5.5（提交前自动完成 verify/archive 门禁），reef-commit 同步对齐，deepstorm-discuss 新增 `.discuss-apply-active` 标记生命周期管理 (`2b26d1d`)
- 新增 skill 文件硬拦截机制（`deepstorm-protect-files.sh`），阻止未经授权的 skill 文件写入 (`2b26d1d`)

### Bug Fixes

- 修复 reef-code-style-verify 脚本中 TS_LINT 空字符串时 npx 执行文件路径的安全问题（`[ -n "$TS_LINT" ]` 守卫 + 双引号）(`2fd9cf7`)

### Documentation

- 修复 Jackson 多态规范中 5.6 节标题 Decoder → DTO 笔误 (`2fd9cf7`)
- CLAUDE.md 新增套件-CLI 联动约束，修复 MD032/MD060 格式问题 (`2fd9cf7`)

## [0.3.3] - 2026-07-09

### Code Refactoring

- 合并 code-style-verify 脚本与模板，删除冗余和孤儿 hook 文件，确保 .tmpl 为唯一事实源 (`1961024`)

### Documentation

- 新增 Jackson 多态序列化编码规范文档，整合 Lombok 使用规范 (`ce597b5`)

## [0.3.1] - 2026-07-08

### Features

- 注入 CLAUDE.md 合规、代码注释合规、git history 上下文三个审查维度到 reef-review 的所有 agent workflow 中 (`0bff708`)
- 新增 reef-review-security agent，覆盖多租户隔离、OWASP、越权、注入等 P0-P5 安全维度 (`0bff708`)
- 在 commit 和 release 技能中集成文档同步检查机制 (`6b255cf`)

## [0.3.0] - 2026-07-08

### Features

- deepstorm-commit 同步 reef-commit 分支管理能力，新增分支名检测和自动创建新分支，明确声明继承关系 (6148e5b)
- reef-commit 新增提交分支自动管理：main/master 自动建分支、临时分支提示、OpenSpec 任务匹配 (729f955)

### Bug Fixes

- 修复 CLI setup 中 hooks.json 目标路径错误，添加 DeepStorm 开发环境 hooks（intent-detect、block-dangerous、protect-files、run-tests）(5049e22)

## [0.2.4] - 2026-07-05

### Features

- 添加 CLI 构建物 E2E 验证流程，新增 `playground/scripts/verify-cli.sh`，支持 L0 冒烟（每次 build 后必跑）和 L1 全量（手动 `--full` 触发）(2b06dc4)
- `package.json` 新增 `playground:verify` 快捷入口 (2b06dc4)
- `deepstorm update` 运行时退化路径保护（registry 不可达时不影响模板同步）(2b06dc4)

### Bug Fixes

- 改进 `update`/`setup` 命令的配置保护机制，SHA256 校验含异常退出回滚 (2b06dc4)

## [0.2.3] - 2026-07-05

### Features

- 简化 `deepstorm update` 为无选项全量更新，自动检查 CLI 版本、同步已安装 skill + hooks + agents (5ac1a83)

### Code Refactoring

- 移除 `--check`/`--cli`/`--skills` 子选项，update 变为纯 action (5ac1a83)
- 新增用户修改保护机制（SHA256 校验 + 时间戳备份）(5ac1a83)

## [0.2.2] - 2026-07-05

### Bug Fixes

- 修复 `deepstormm` → `deepstorm` 拼写错误，确保 registry 注册流程正确 (4ad3457)
- `deepstorm update` 无选项时自动安装最新 CLI 版本，提升升级体验 (4ad3457)

### Maintenance

- 添加 `-v, --version` 选项描述，提升 CLI 一致性 (4ad3457)
- CLAUDE.md 新增需求讨论优先约定，保证需求讨论环节不被跳过 (4ad3457)

## [0.2.1] - 2026-07-05

### Bug Fixes

- 在 release skill 中添加构建时效性检查，防止发版漏执行 pnpm build (e8bf752)

### Code Refactoring

- 基于 v0.2.0 发版实践优化 deepstorm-release skill (d63f9b1)

## [0.2.0] - 2026-07-05

### Features

- 新增 React + Vue 前端变体支持，扩展 DeepStorm 前端技术栈覆盖 (55c08f0)

## [0.1.0] - 2026-07-04

### Initial Release

- DeepStorm Spec 驱动的 AI 协同软件工程实践工具集初始版本
- 覆盖产品（Tide）、开发（Reef）、测试（Sweep）、运维（Atoll）全链路
- CLI 一键安装向导：`npx @deepstorm/cli setup`
- 四套件按需安装，互动式配置引擎（wizard.json）
- Claude Code skills + agents + hooks 自动部署
- 模板引擎（Handlebars）驱动安装渲染
- Plugin build 系统：esbuild 打包 + registry 聚合
- AI 驱动发版流程：`/deepstorm-release`
- 支持 Java (Spring Boot) 和 Python (FastAPI) 双后端变体
