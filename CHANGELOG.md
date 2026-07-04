# Changelog

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
