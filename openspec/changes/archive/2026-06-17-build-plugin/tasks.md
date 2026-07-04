## 1. 命令脚手架

- [x] 1.1 创建 `src/commands/plugin-build.ts`，定义 `registerPluginBuildCommand()` 函数
- [x] 1.2 在 `src/index.ts` 中注册 `plugin build` 子命令

## 2. 向导 — 市场名输入

- [x] 2.1 创建 `src/commands/plugin-build-wizard.ts`，实现市场名输入引导（使用 `@clack/prompts` 的 text 输入）
- [x] 2.2 实现输入校验（不允许为空、建议 kebab-case 格式）

## 3. 构建引擎 — 核心逻辑

- [x] 3.1 创建 `src/engine/plugin-builder.ts`，实现 `buildPlugin()` 主函数
- [x] 3.2 实现向导流程编排：市场名 → 复用 MCP 选择 → 复用工具选择 → 复用问卷配置
- [x] 3.3 实现输出目录管理：检查 `.deepstorm/plugins/deepstorm/` → 存在则删除 → 重新创建
- [x] 3.4 对每个选中的工具套件，调用 `renderToolAssets()` 将 skills/agents/hooks 渲染到 plugin 目录

## 4. Plugin 元数据生成

- [x] 4.1 创建 `.claude-plugin/plugin.json`
- [x] 4.2 创建 `.claude-plugin/marketplace.json`
- [x] 4.3 创建 `.mcp.json`
- [x] 4.4 创建 `settings.json`
- [x] 4.5 创建 `.env.example`

## 5. 文档生成

- [x] 5.1 README.md 动态生成（buildPlugin 内置）
- [x] 5.2 README.md 包含 DeepStorm 介绍、所选工具套件、MCP 服务、安装说明
- [x] 5.3 创建 CHANGELOG.md

## 6. 集成与收尾

- [x] 6.1 构建完成后检查 `.gitignore`，追加 `.deepstorm/`
- [x] 6.2 构建完成后打印总结信息
