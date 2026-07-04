## Why

DeepStorm 工具套件（tide / reef / sweep / atoll）需要根据不同项目的技术栈和工具链进行差异化配置。目前各套件的 skill 集合是静态的，无法按项目需求裁剪能力（如 tide 选择 Jira 或钉钉、reef 选择 React 或 Vue）。缺乏统一的工具来引导用户按项目配置和安装所需能力，导致：

- 用户需要手动理解每个工具的配置方式
- 多项目场景下无法按项目隔离配置
- 不同框架/语言/工具的定制缺乏标准化入口

需要一个统一的 CLI 工具来解决这些问题。

## What Changes

### 新增

**`@deepstorm/cli` npm 包（TypeScript 编写）**

通过 `npx @deepstorm/cli` 使用。纯文件操作（cp + JSON merge），零模板引擎、零动态生成。

**子命令：**

| 命令 | 用途 |
|------|------|
| `setup` | 交互式安装向导，选择工具 → 逐个引导配置 → 生成到 `.claude/` |
| `setup --non-interactive` | 非交互模式，通过参数传配置（`--tools reef,tide --set reef.frontend.framework=react`） |
| `setup --reconfigure` | 清空旧 skill 后重新运行向导 |
| `config get/set/reset/view` | 精准修改项目级 DeepStorm 配置 |
| `doctor` | 诊断 CLI 版本、配置完整性、目录结构状态 |
| `template list [工具]` | 列出可用模板 |
| `template init [工具] [能力]` | 导出默认模板到 `.deepstorm/templates/` 供用户修改 |
| `template apply [工具] [能力]` | 应用（修改后的）模板到 `.claude/skills/` |
| `template upgrade` | 同步官方更新到 `.claude/skills/`，但不覆盖用户修改 |
| `uninstall` | 清理所有 DeepStorm 生成的 skill、配置、MCP |

**`setup-wizard` 流程**

① **工具选择** — 空格多选，全部不选则什么都不做直接退出
② **逐个引导** — 每个工具读取各自 `wizard.json` 的问答链，已在前置工具中配过的公共能力跳过不重复问
③ **全量安装** — 安装所选工具下所有注册的 skill（不做按 configKey+configValue 的精确匹配），通过模板渲染（SKILL.md.tmpl）和 variants 变体目录实现配置感知
④ **复制 skill** — `cp -r` 所有 skill 目录到 `.claude/skills/`
⑤ **复制 agents** — `cp -r` agent 目录到 `.claude/agents/`
⑥ **合并 hooks** — 读取 `.claude/hooks/hooks.json`（存在则合并，不存在则创建）
⑦ **合并 MCP** — 用户选择 MCP 外部服务 → 读取 `.mcp.json`（存在则合并，不存在则创建），MCP 以 `deepstorm-{name}` 命名避免冲突
⑧ **写入配置** — 读取 `.claude/settings.json` → 注入 `deepstorm` 命名空间（合并配置 + 安装记录 `installedSkills`/`installedMcpServers`）→ 写回（不破坏已有字段）
⑨ **创建/追加 `.env`** — 写入 DeepStorm 所需环境变量占位，注释说明获取方式，**不要求用户终端中输入 token**，提示后续手动填值
⑩ **输出引导** — 显示已安装的 skill 列表 + "下一步：运行 Claude Code 后用 `/help` 查看所有命令" + 交互式询问是否提交到 Git

`--reconfigure` 时，读取 `.claude/settings.json` 中 `deepstorm.installedSkills` 记录，清理对应 skill 和 MCP 后再按新配置重新生成。`.deepstorm/templates/` 中用户的修改原封不动。

**`deepstorm uninstall` 流程**

① 删除 `.claude/skills/` 中 `deepstorm.installedSkills` 记录的 skill
② 清理 `.mcp.json` 中 `deepstorm.installedMcpServers` 对应的 MCP（以 `deepstorm-` 前缀匹配删除）
③ 清理 `.claude/settings.json` 中的 `deepstorm` 命名空间
④ 交互式询问是否删除 `.deepstorm/templates/` 目录，根据用户选择删除或保留
⑤ agent 和 hooks 不做精准清理（当前实现不追踪 installedAgents/installedHooks）

**团队共享**

Setup 完成后交互式询问是否将 `.claude/` 配置提交到 Git（仅当 `.git` 存在时）。检查 `.gitignore` 中是否有 `.claude/` 忽略规则并输出对应提示。

### 源目录结构

各工具包 `packages/<tool>/` 下直接包含 skills/agents/hooks 等目录，CLI 构建时聚合到 dist/：

```
packages/
├── cli/                   # CLI 工具包（发布到 npm）
│   ├── src/               # TypeScript 源码
│   ├── scripts/           # 构建/发布脚本
│   │   ├── build-registry.mjs  # 聚合 registry + 复制运行时数据
│   │   └── release.mjs        # 发布脚本
│   ├── build.mjs          # esbuild 配置
│   ├── config-schema.json # JSON Schema 校验配置
│   ├── package.json       # scripts: build / test / release
│   └── dist/              # 构建产物（gitignored）
│       ├── cli.js
│       ├── registry.json
│       ├── config-schema.json
│       ├── skills/
│       ├── agents/
│       └── hooks/
│
├── reef/                  # 开发侧
│   ├── skills/            # 按 reef-{name} 命名
│   │   ├── reef-react-lint/SKILL.md
│   │   ├── reef-react-hooks/SKILL.md
│   │   ├── reef-java-orm/SKILL.md
│   │   └── reef-java-test/SKILL.md
│   ├── agents/
│   ├── hooks/
│   ├── .mcp.json
│   └── wizard.json        # 该工具的问答流程定义
│
├── tide/                  # 产品侧（结构同上）
├── sweep/                 # 测试侧（结构同上）
└── atoll/                 # 运维侧（结构同上）
```

**SKILL.md frontmatter**

配置映射放在 YAML frontmatter 中，不再使用独立的 manifest.json：

```yaml
---
name: reef-react-lint
description: React 代码规范检查
allowed-tools: Bash(node:*)
deepstorm:
  tool: reef
  configKey: reef.frontend.framework
  configValue: react
  dependencies:
    - deepstorm-jira-parser
---
```

**wizard.json**

每个工具定义自己的问答流程：

```json
{
  "tool": "reef",
  "label": "开发侧工具",
  "description": "代码规范、审查、lint",
  "questions": [
    {
      "key": "reef.frontend.framework",
      "label": "选择前端框架",
      "type": "select",
      "options": [
        { "value": "react", "label": "React" },
        { "value": "vue", "label": "Vue" },
        { "value": "none", "label": "不使用前端框架" }
      ]
    }
  ]
}
```

**registry.json**

`pnpm build` 时由 `scripts/build-registry.mjs` 自动聚合生成（扫描各 package 的 SKILL.md frontmatter 和 wizard.json）：

```json
{
  "version": "1",
  "tools": {
    "reef": {
      "label": "开发侧",
      "description": "规范生成、代码实现"
    }
  },
  "wizards": { ... },
  "skills": {
    "reef-react-lint": {
      "tool": "reef",
      "configKey": "reef.frontend.framework",
      "configValue": "react",
      "dependencies": ["deepstorm-jira-parser"]
    }
  }
}
```

产物放到 `dist/registry.json`，随 npm publish 一起打包。用户运行 `npx @deepstorm/cli setup` 时 CLI 从 `dist/registry.json` 读取所有配置和技能映射信息。

### 分阶段说明

本 Change（`cli-setup-tool`）仅覆盖阶段 A。阶段 B~F 未启动。

## Capabilities

### New Capabilities

- `setup-wizard`: 交互式安装向导。用户先多选工具套件 → 逐个引导每个工具的配置（重复配置跳过）→ 递归解析依赖 → 复制 skill/agents 到 `.claude/` → 合并 MCP/hooks → 写入配置 → 创建 `.env` → 输出指引。支持 `--reconfigure` 清空重来
- `config-management`: 配置管理能力。`deepstorm config` 子命令查看和修改项目级配置，`deepstorm doctor` 诊断 CLI 和项目状态，`deepstorm uninstall` 清理所有 DeepStorm 生成内容。配置存储在 `.claude/settings.json` 的 `deepstorm` 命名空间，由 `config-schema.json` 定义结构和校验规则
- `template-management`: 模板管理能力。`deepstorm template list` 查看可用模板，`template init` 导出默认模板到 `.deepstorm/templates/` 供用户修改，`template apply` 应用模板到 `.claude/skills/`，`template upgrade` 同步官方更新但不覆盖用户修改。用户修改永远最高优先级，工具的升级不会覆盖用户改动
- `capability-assembly`: 定义包的目录结构标准和装配机制。SKILL.md frontmatter 的 `deepstorm:` 字段声明配置映射和依赖。wizard.json 定义每个工具的问答流程。registry.json 由 release build 自动聚合 frontmatter + wizard 生成，随 CLI 发布。setup 时 CLI 读 registry.json 匹配用户选择，纯文件操作（cp + JSON merge），零模板引擎、零动态生成

### Modified Capabilities

- 无既有 spec 需要修改

## Impact

- **新增包**: `packages/cli/` — TypeScript CLI 工具包，含 `src/`、`scripts/`、`build.mjs`
- **构建产出**: `packages/cli/dist/` — `cli.js` + `registry.json` + `config-schema.json` + skills/agents/hooks（gitignored，随 npm 包发布）
- **调整包结构**: `packages/<tool>/` 下 skills/agents/hooks 各自独立，CLI 构建时聚合并复制到 `dist/`
- **新增配置文件**: `packages/cli/config-schema.json`、`packages/cli/build.mjs`、`packages/cli/scripts/build-registry.mjs`
- **对外分发**: 通过 npm 发布 `@deepstorm/cli`（`"files": ["dist/"]`）
- **无外部依赖** — 仅使用 Node.js 内置文件操作（fs、path）
- **不修改现有 skill 文件** — 现有 `.claude/skills/deepstorm-*` 不动，它们是 DeepStorm 内部维护工具
