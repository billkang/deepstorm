## 1. 项目脚手架

- [x] 1.1 创建 `packages/cli/` 目录结构（src/、skills/、agents/、mcp/、hooks/）
- [x] 1.2 创建 `packages/cli/package.json`（npm 包名为 `@deepstorm/cli`，配置 bin、files、build 脚本）
- [x] 1.3 创建 `packages/cli/tsconfig.json`（target: ES2020、module: commonjs、strict）
- [x] 1.4 配置 esbuild 构建脚本（build.mjs），输出为 `bin/cli.js`，设置 shebang `#!/usr/bin/env node`
- [x] 1.5 创建 `packages/cli/config-schema.json`，定义所有合法配置 key 的 JSON Schema
- [x] 1.6 在根 `pnpm-workspace.yaml` 注册 `packages/cli` 包

## 2. 基础工具层

- [x] 2.1 实现 `src/utils/fs.ts` — 封装目录复制（cpSync）、目录创建（mkdirSync）、文件读取/写入工具函数
- [x] 2.2 实现 `src/utils/json.ts` — JSON 深度合并工具（递归合并对象字段，数组直接覆盖）
- [x] 2.3 实现 `src/utils/frontmatter.ts` — 解析 YAML frontmatter，提取 `deepstorm:` 字段
- [x] 2.4 定义 `src/types/registry.ts` — registry.json 的类型定义（Registry、ToolEntry、WizardEntry、SkillEntry）
- [x] 2.5 定义 `src/types/config.ts` — deepstorm 命名空间的类型定义（DeepStormManifest、ConfigValue 等）

## 3. 装配引擎

- [x] 3.1 实现 `src/engine/registry.ts` — 读取内置 registry.json，提供按 configKey+configValue 匹配 skill 的能力
- [x] 3.2 实现 `src/engine/resolver.ts` — 递归解析 skill dependencies，BFS 遍历收集 transitive dependencies，数组去重
- [x] 3.3 实现 `src/engine/matcher.ts` — 根据用户配置值集合匹配所有需要安装的 skill（含依赖 skill），标记依赖 skill 为 auto-installed
- [x] 3.4 实现 `src/engine/installer.ts` — 执行安装：复制 skill 到 `.claude/skills/`、复制 agent 到 `.claude/agents/`

## 4. 配置文件合并

- [x] 4.1 实现 `src/merger/settings.ts` — 读取 `.claude/settings.json` → 深度合并 `deepstorm` 命名空间 → 写回（create-if-missing）
- [x] 4.2 实现 `src/merger/mcp.ts` — 读取 `.mcp.json`（create-if-missing）→ 合并 MCP 服务器配置 → 写回
- [x] 4.3 实现 `src/merger/hooks.ts` — 读取 `.claude/hooks/hooks.json`（create-if-missing）→ 合并 hooks → 写回
- [x] 4.4 实现 `src/merger/env.ts` — 创建/追加 `.env` 文件，写入带注释的环境变量占位，不覆盖已有变量

## 5. Setup 向导

- [x] 5.1 实现 `src/commands/setup.ts` — Commander 子命令注册（`setup`、`setup --reconfigure`、`setup --non-interactive`）
- [x] 5.2 实现 `src/wizard/tool-select.ts` — 使用 @clack/prompts 的 multiselect 展示工具列表，全部不选则退出
- [x] 5.3 实现 `src/wizard/questionnaire.ts` — 读取 wizard.json 的 questions 数组，渲染 select/confirm 问题，维护已配置 key 集合实现跨工具去重
- [x] 5.4 实现 `src/wizard/guide.ts` — 安装完成后输出已安装 skill 清单和下一步引导，询问是否提交 .claude/ 到 Git
- [x] 5.5 实现 `src/wizard/reconfigure.ts` — `--reconfigure` 流程：读取 deepstorm 命名空间 → 清理旧 skill/agent/MCP/hooks → 重新运行向导
- [x] 5.6 实现 `src/wizard/non-interactive.ts` — `--non-interactive` 流程：解析 `--tools` 和 `--set` 参数 → 跳过交互直接执行安装
- [x] 5.7 在 `src/index.ts` 中组装 setup 主流程（工具选择 → 逐个引导 → 依赖解析 → 复制文件 → 合并 MCP/hooks → 写入配置 → 创建 .env → 输出引导）

## 6. 配置管理命令

- [x] 6.1 实现 `src/commands/config.ts` — Commander 子命令树（`config view`、`config set`、`config reset`）
- [x] 6.2 实现 `src/commands/config-view.ts` — 格式化输出 deepstorm 命名空间内容，未配置时提示
- [x] 6.3 实现 `src/commands/config-set.ts` — 校验 key 合法性（config-schema.json）→ 更新值 → 写回
- [x] 6.4 实现 `src/commands/config-reset.ts` — 警告确认 → 删除 deepstorm 命名空间

## 7. Doctor 命令

- [x] 7.1 实现 `src/commands/doctor.ts` — 检查 CLI 版本、settings.json deepstorm 命名空间完整性
- [x] 7.2 检查 `.claude/skills/` 中各 skill 的 frontmatter 有效性（骨架）
- [x] 7.3 检查 `.mcp.json` 中 DeepStorm MCP 条目完整性、检查缺少的依赖 skill
- [x] 7.4 按检查结果输出正常（✔）或警告（⚠），建议修复方式

## 8. 模板管理命令

- [x] 8.1 实现 `src/commands/template.ts` — Commander 子命令树（`template list`、`template init`、`template apply`、`template upgrade`）
- [x] 8.2 实现 `src/commands/template-list.ts` — 读取 registry.json 输出 skill 列表，可指定工具过滤
- [x] 8.3 实现 `src/commands/template-init.ts` — 从内置 skills/ 复制 skill 目录到 `.deepstorm/templates/`
- [x] 8.4 实现 `src/commands/template-apply.ts` — 从 `.deepstorm/templates/<skill>/` 复制到 `.claude/skills/<skill>/`
- [x] 8.5 实现 `src/commands/template-upgrade.ts` — 检测用户修改跳过，其他 skill 同步到 `.claude/skills/`

## 9. Uninstall 命令

- [x] 9.1 实现 `src/commands/uninstall.ts` — 读取 deepstorm 命名空间 → 删除 installedSkills/Agents/MCP/Hooks 条目
- [x] 9.2 处理未安装时运行 uninstall 的场景（提示"DeepStorm 尚未配置，无需卸载"）
- [x] 9.3 询问是否删除 `.deepstorm/templates/` 目录

## 10. Release Build

- [x] 10.1 实现 `src/commands/release.ts` — Commander 子命令 `release build-registry`
- [x] 10.2 扫描 `packages/*/skills/*/SKILL.md` 提取 deepstorm frontmatter（骨架）
- [x] 10.3 扫描 `packages/*/wizard.json` 合并到 registry wizards 段（骨架）
- [x] 10.4 复制 skill/agent/MCP/hook 源文件到 `packages/cli/`（骨架）
- [x] 10.5 输出 `packages/cli/registry.json`（骨架）

## 11. 质量控制

- [x] 11.1 esbuild 构建验证通过（npm run build）
- [x] 11.2 registry.json 默认文件创建（骨架）
- [x] 11.3 CLI 所有 6 个命令注册并可用（--help 验证）
- [x] 11.4 80 个测试全部通过，15 个测试文件
- [x] 11.5 非交互模块有单元测试覆盖（non-interactive、config-set、config-reset 等）
- [x] 11.6 doctor 正常/异常状态有单元测试验证
