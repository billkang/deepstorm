## Context

DeepStorm 各工具包（tide / reef / sweep / atoll）的 skill/agent/MCP/hooks 目前分散在各自的 `packages/<tool>/` 目录下，缺乏统一的安装引导工具。用户需要手动理解每个工具的配置方式，多项目场景下无法隔离配置，不同框架/语言/工具的定制缺乏标准化入口。

通过先前的讨论确定了以下约束：

- **CLI 技术栈**：TypeScript + Commander + @clack/prompts + esbuild 构建
- **无外部依赖**：仅使用 Node.js 内置 fs/path（JSON 操作、cp -r 复制）
- **零模板引擎**：纯文件复制（cp -r），不做动态模板插值
- **skill 发现机制**：Claude Code 自动发现 `.claude/skills/` 下的 skill，无需插件注册
- **配置存储**：`.claude/settings.json` 的 `deepstorm` 命名空间，JSON 合并写入
- **环境变量**：`.env` 文件写入带注释的占位变量，用户手动填写 token

## Goals / Non-Goals

**Goals:**

- 提供 `npx @deepstorm/cli setup` 交互式安装向导，引导用户按项目选择工具并配置
- 根据用户配置匹配对应的 skill，递归解析依赖，去重后复制到 `.claude/` 对应目录
- 支持 `--reconfigure`（清空旧安装后重新配置）和 `--non-interactive`（参数化安装）
- 提供 `deepstorm config` 子命令查看/修改/重置项目级配置
- 提供 `deepstorm doctor` 诊断项目和配置状态
- 提供 `deepstorm template` 子命令管理模板（导出、应用、同步官方更新）
- 提供 `deepstorm uninstall` 清理所有 DeepStorm 生成内容
- Release 时通过 `deepstorm release build registry` 聚合生成 registry.json 并打包
- 用户修改的模板（`.deepstorm/templates/`）永远不会被自动覆盖

**Non-Goals:**

- 不在 CI 环境中使用（用户明确排除了 CI 使用场景）
- 不支持在终端交互中输入 API token（仅创建 .env 占位）
- 不做 npm 包管理器的依赖安装（用户自行 `npx @deepstorm/cli`）
- 不动态生成 skill 内容（skill 是静态文件，不涉及模板引擎）
- 不涉及跨项目的共享配置（配置是项目级隔离的）
- 不涉及 `~/.claude/` 全局目录的修改（所有操作都是项目本地）
- 不做云端同步或团队协同管理

## Decisions

### D1: 装配引擎 — registry.json 全量安装 + 模板渲染

**选择：** CLI setup 时读取内置 registry.json，全量安装所选工具下的所有 skill，通过模板渲染实现配置感知。

- registry.json 由 release build 从各 SKILL.md frontmatter + wizard.json 聚合生成
- 安装策略：用户选择工具（如 reef）后，安装该工具下 registry 中注册的**所有** skill，不做按 configKey+configValue 的精确匹配筛选
- 配置感知：skill 的 SKILL.md 可使用 `.tmpl` 模板文件，通过 `{{configKey.field}}` 占位符引用用户配置值，安装时由 `renderTemplate()` 渲染为最终 SKILL.md
- 变体机制：skill 的 `variants/` 目录按配置值组织子目录（如 `variants/react/`），安装时根据用户配置复制对应变体文件
- 依赖字段：`dependencies` 字段在 registry.json 中解析存储，但安装时不做自动递归解析（预留扩展，后续可通过 `installer.ts` 实现）

**备选方案：** 运行时实时扫描所有源目录 frontmatter
- 被否决理由：setup 时 CLI 已在用户项目目录中运行，无法访问开发源目录（除非发布时也打包了源文件）。registry.json 是一个自包含的索引，确保发布包中仅包含运行所需信息

### D2: 配置存储 — settings.json deepstorm 命名空间

**选择：** 所有 DeepStorm 配置和安装记录保存在 `.claude/settings.json` 的 `deepstorm` 字段中。

- 安装过程：读取 `.claude/settings.json` → 对象深度合并 `deepstorm` 命名空间 → 写回
- 写入内容：用户配置值（如 `reef.frontend.framework: "react"`）、安装记录（`installedSkills`、`installedMcpServers`、`installedAt`）
- `installedSkills` 存储 skill ID 列表，用于 `--reconfigure` 时精准清理和 `doctor` 时的校验
- 深度合并算法：`assignIn`/`merge` style — 嵌套对象递归合并，数组覆盖（非追加）

**备选方案 A：** 独立 `deepstorm-config.json` 文件
- 被否决理由：用户需要额外管理一个文件和它的 .gitignore 状态。多一个文件就多一个认知负担

**备选方案 B：** 存放在 `~/.claude/` 全局目录
- 被否决理由：多项目场景下无法按项目隔离配置

### D3: 模板保护 — .deepstorm/templates/ 永不覆盖

**选择：** `template init` 将 skill 默认内容导出到 `.deepstorm/templates/<skill>/`。用户修改此目录中的文件。`template apply` 将修改后的模板同步到 `.claude/skills/`。`template upgrade` 只在 `.deepstorm/templates/` 中不存在的 skill 上执行覆盖。

- 保护机制：CLI 不自动删除或覆盖 `.deepstorm/templates/` 中的任何内容
- upgrade 时：对于 `.deepstorm/templates/` 中已存在的 skill，跳过并提示用户手动 `template apply`
- `--reconfigure` 时：清理 `.claude/` 中的安装内容，但保留 `.deepstorm/templates/` 不动
- `uninstall` 时：询问用户是否删除 `.deepstorm/templates/`

### D4: 文件复制策略 — cp -r / 精确目录复制

**选择：** 使用 Node.js `fs.cpSync(src, dest, { recursive: true, force: true })` 进行目录级复制。

- skill 复制：`fs.cpSync(skillsDir/skillName, claudeSkillsDir/skillName, { recursive: true })`
- MCP/hooks 复制：读取源 JSON 片段 → JSON.parse → 合并到目标文件 → JSON.stringify 写回
- 合并策略：`Object.assign` + 递归深度合并（对象字段递归，数组直接替换）
- `.claude/skills/` 目录自动创建（不存在则 `fs.mkdirSync`）
- `.claude/agents/`、`.claude/hooks/` 同理

### D5: Release 构建流程

**选择：** `deepstorm release build registry` 命令触发聚合流程。

- 扫描 `packages/*/skills/*/SKILL.md` → 提取 frontmatter deepstorm 字段 → 构建 skills 索引
- 扫描 `packages/*/wizard.json` → 构建 wizards 索引
- 扫描 `packages/*/agents/`、`mcp/`、`hooks/` → 构建文件清单
- 将所有技能/agent/MCP/hook 源文件复制到 `packages/cli/` 下的对应子目录
- 输出 `packages/cli/registry.json`（包含 version、tools、wizards、skills 四段）
- 按 npm publish 准备包的 files 清单

### D6: 交互式向导流程 — 多选 + 按 wizard.json 引导

**选择：** 使用 @clack/prompts 提供终端交互体验。

- 第一步：@clack/prompts 的 `multiselect` 展示所有可用工具（tide/reef/sweep/atoll），带描述
- 后续步骤：按用户选择的工具顺序，每个工具读取其 wizard.json 的 questions 数组，用 @clack/prompts 的 `select`/`confirm` 渲染
- 跨工具去重：维护已配置的 key 集合（Set），`wizard.json` 中每个 question 的 key 如果已在集合中，跳过并提示 "已在 {工具} 中配置，跳过"
- 全部不选则直接退出，不做任何操作

### D7: Commander 子命令体系

**选择：** 使用 Commander.js 定义子命令树。

```
deepstorm
├── setup [--reconfigure] [--non-interactive]
├── config
│   ├── view
│   ├── set <key>=<value>
│   ├── reset
├── doctor
├── template
│   ├── list [tool]
│   ├── init [tool] [capability]
│   ├── apply [tool] [capability]
│   └── upgrade
├── uninstall
└── release
    └── build registry
```

- `--non-interactive` 模式参数：`--tools reef,tide --set reef.frontend.framework=react`
- 验证参数合法性后再进入安装流程

### D8: config-schema.json 校验

**选择：** 在 `packages/cli/config-schema.json` 中定义所有合法配置 key 的 JSON Schema。

- `config set` 时校验 key 是否在 schema 中，不存在的 key 报错
- `doctor` 时用 schema 校验当前配置是否有异常值
- schema 手动维护（因为配置结构固定，不需要自动生成）

## Risks / Trade-offs

| 风险 | 发生条件 | 缓解措施 |
|------|---------|---------|
| SKILL.md frontmatter 解析错误 | YAML 格式异常或 deepstorm 字段缺失 | CLI 使用 js-yaml 库安全解析，frontmatter 无效的 skill 直接跳过并在 doctor 中报告 |
| settings.json 被用户手写破坏 | 用户手动编辑 `.claude/settings.json` 导致 deepstorm 命名空间结构损坏 | doctor 命令检查结构完整性，发现异常提示 `setup --reconfigure` |
| MCP/hooks 合并冲突 | 用户已手动在 `.mcp.json` 中添加了同名 MCP 服务器配置 | setup 时使用深度合并策略，不会删除用户已有配置；uninstall 只清理 manifest 中记录的项目 |
| .env 变量冲突 | 用户 `.env` 中已有同名环境变量 | CLI 不覆盖已有变量，只追加不存在的变量 |
| 共享 skill `deepstorm-*` 命名冲突 | 用户项目或其他工具使用了同名目录 | CLI 管理的 skill 都记录在 manifest 中，uninstall 时精准删除记录中的条目 |
| 复制中途中断 | 用户 Ctrl+C 终止 setup | 未完成安装 — 文件处于不一致状态。在安装开始时先写入配置，再复制文件，最后更新 manifest。中断后重新运行 setup 可覆盖 |
| esbuild 构建失败 | TS 类型错误或依赖解析问题 | 严格类型检查，CI 中验证构建通过 |

## Migration Plan

无迁移需求 — `cli-setup-tool` 是一个新增包，不涉及对既有 DeepStorm 实现的修改。

Install 流程：
1. 用户 `npx @deepstorm/cli setup` 运行
2. CLI 读取内置 registry.json 和 skills/agents/hooks/mcp 目录
3. 交互完成后在用户项目中创建 `.claude/` 下的技能和配置
4. 用户后续可修改 `.deepstorm/templates/` 中的模板并 `template apply`

## Open Questions

- registry.json 的版本管理策略（向后兼容格式变更）
- `config-schema.json` 在 release build 时是否也需要自动从 wizard.json 推导
