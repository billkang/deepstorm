# @deepstorm/cli

## [0.1.0] - 2026-07-04

### Initial Release

- 一键项目环境安装向导（`npx @deepstorm/cli setup`）
- 交互式配置引擎（wizard）：工具选择、MCP 服务配置、环境变量管理
- 四套件按需安装：tide（产品）/ reef（开发）/ sweep（测试）/ atoll（运维）
- Claude Code hooks 自动部署（PreToolUse / PostToolUse / UserPromptSubmit / Stop）
- 模板引擎（Handlebars）驱动安装渲染
- Plugin build 系统：esbuild 打包 + registry 聚合
- 诊断命令：`deepstorm doctor`
- 配置管理：config view / set / reset / refresh
- 模板管理：template list / init / apply
