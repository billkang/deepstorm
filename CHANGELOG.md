# Changelog

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
