## Context

DeepStorm CLI 目前有两条相互独立的安装路径：

- `deepstorm init`：项目脚手架生成器，交互式选择技术方案（Angular/Java/ORM 等），在 `init.ts` 中独立实现，不读写 `.claude/settings.json`
- `deepstorm setup`：Claude Code 插件安装器，由 `setup.ts` 驱动，使用注册表中的 `wizard.json` 定义的问题列表逐个工具展开问卷。持久状态统一存储在 `.claude/settings.json` 的 `deepstorm` 命名空间下

两条路径之间没有数据共享——`init` 选择的技术方案 `setup` 不知道，`setup` 配好的 MCP 服务 `init` 更不需要知道。此外，`setup` 每次运行都从零开始，不读取已有配置做预填。

现有基础设施中已经有一些可复用的能力：
- `readDeepStormConfig()` / `mergeDeepStormConfig()`（`merger/settings.ts`）——读写 `deepstorm` 配置
- `readExistingEnvKeys()`（`setup.ts` 内联函数）——读取 `.env` 中已有值的 KEY
- `configuredKeys`（`wizard-flow.ts`/`questionnaire.ts`）——单次运行内跨工具跳过已配键
- `parseEnvExampleFile()`（`wizard/mcp-env.ts` 内部函数）——解析 `.env-example` 文件

## Goals / Non-Goals

**Goals:**
- `init` 结束时将选定的技术方案写入 `deepstorm.reef.*`，并引导用户进入 setup
- `setup` 启动时读取已有配置跳过已配问卷（单 key 级和整组级）
- `setup` 的 MCP 选择隐藏已装且 `.env` key 完整的服务
- `setup` 二次运行时默认勾选已有工具，仅对新工具展示问卷
- `setup` 完成后的 guide 按 MCP 服务分组展示环境变量状态（✅ / ⚠️ / ❌）
- 所有改动向后兼容，不影响已有的 `.claude/settings.json` 配置

**Non-Goals:**
- 不改变 `wizard.json` 的格式或注册表结构
- 不改变 `renderToolAssets` 的安装引擎逻辑
- 不改变 `--non-interactive` 模式的行为（只改交互模式）
- 不涉及跨项目的配置共享
- 不实现 `setup` 自动卸载未勾选工具的功能（需显式 `--reconfigure`）

## Decisions

### 1. 配置写入方式：init 用 mergeDeepStormConfig 而非直接写文件

**选择：** 复用现有 `mergeDeepStormConfig()`，将 `init` 的技术方案以嵌套对象形式 deepMerge 到 `settings.json` 的 `deepstorm` 命名空间。

**理由：** 项目已存在 `.claude/settings.json` 时（即使 init 是首次运行，之前可能有其他工具写过），deepMerge 保证不覆盖已有字段。`init` 只写它问过的字段（`reef.techs`、`reef.frontend.*`、`reef.backend.*`），不主动设置 `reef.formatter` 等未问过的字段。

**备选方案：** 直接通过 `fs.writeFileSync` 写入——被否决，会丢失已有配置。

### 2. 已有配置的检测方式：拍平嵌套对象为 configuredKeys

**选择：** 从 `settings.json` 读取 `deepstorm` 配置后，递归拍平嵌套对象为 `key → value` 映射，将其中值不为 `'none'` 的所有 key 加入 `configuredKeys`。随后 `runQuestionnaire` 中遇到这些 key 时跳过。

**理由：** `configuredKeys` 的跳过逻辑已在 `questionnaire.ts` 中存在。只需要在进入 `runQuestionnaire` 之前用已有值初始化该 Set，即可复用现有跳过机制。值等于 `'none'` 表示"显式不选"，不应被视为已配置。

**补充——整组跳过：** 在遍历工具的 wizard 问题之前，检查该工具的关键配置（如 reef 的 `techs`）是否已在 `configuredKeys` 中。如果存在，打印日志后直接跳过该工具的整个 questionnaire 循环。

### 3. 已装 MCP 的检测方式：installedMcpServers + .env key 检查

**选择：** 两步检测——（1）读 `settings.json` 中 `deepstorm.installedMcpServers` 获取已装列表；（2）对列表中的每个 MCP 服务，用 `readExistingEnvKeys` 检查 `.env` 中各 key 是否有非默认值。两者兼满足的 MCP 完全隐藏；只满足（1）不满足（2）的在 guide 中标记 ⚠️。

**实现位置：** `wizard-flow.ts` 中 `runWizardFlow()` 入口处完成检测，将过滤后的 MCP 列表传入 `selectMcpTools`。

**理由：** 隐藏已装 MCP 减少用户认知负担，同时 guide 中的 ⚠️ 标记确保用户不会漏掉 key。

### 4. selectTools 默认勾选：初始值参数

**选择：** 在 `selectTools()` 函数中新增可选参数 `initialValues: string[]`。`setup` 首次运行时传空数组，二次运行时传 `installedSkills` 反推出的工具列表。`@clack/prompts` 的 `multiselect` 原生支持 `initialValues` 参数。

**理由：** 最小侵入式改动，不需要改变 UI 组件，也不需要新增专门的"已安装"标记渲染。

### 5. Guide 状态展示：按 MCP 服务分组

**选择：** 在 `guide.ts` 的 `printGuide()` 函数中新增一个 MCP 状态区块。对每个 MCP 服务，读取其 `.env-example` 文件获取所有所需 key，对照 `.env` 中的实际值，输出聚合状态。不引入新依赖。

**理由：** 现有 `parseEnvExampleFile` 可以解析 key 列表，`readExistingEnvKeys` 可以读取已填 key。组合两者即可完成状态判断，无需其他数据结构。

### 6. init → setup 引导：打印指引命令

**选择：** `init` 完成后，使用 `@clack/prompts` 的 `confirm` 询问用户是否继续。选 Yes 后打印 `deepstorm setup` 的指引命令，由用户手动执行。

**理由：** 在当前进程内调用 setup 流程的复杂度较高——需要提取 `setup.ts` 的 `runSetup` 公共函数、处理资产安装的 side effects、管理 MCP 配置的状态传递。通过指引命令可以实现同等效果，且保持 init 和 setup 两条命令的职责独立。

**实现决策变更：** 原始设计曾计划在当前进程内调用 setup 流程，但实现时评估发现 `runSetup` 的依赖链较深（涉及 `renderToolAssets`、MCP 配置写入、`.env` 文件管理等），提取公共函数的改动范围较大，不适合本次变更。最终选择了打印指引命令的轻量方案，并在 tasks.md 1.4 中明确记录了此决策。任务驱动的实现方式允许在发现设计预估不足时调整方案，只要变更理由在 artifact 链中可追溯即可。

## Risks / Trade-offs

- **[风险] init 写入配置时可能覆盖用户手动 `config set` 的修改** → 缓解：`mergeDeepStormConfig` 使用 deepMerge，只覆盖 init 涉及的字段，不主动覆盖用户单独设置的值
- **[风险] guide 中展示的 MCP 状态可能不准确** → 缓解：`readExistingEnvKeys` 已经能判断 `your_`、`_here` 结尾的占位值，误报率低。极端情况下用户填了占位值也会被视为"已配"，但这个边界情况影响不大
- **[风险] 二次运行时默认勾选的已有工具可能让用户误以为必须全选** → 缓解：工具选择提示中补充说明文字"已有工具默认勾选，取消勾选不会卸载"
- **[风险] init → setup 的指引命令可能被用户忽略** → 缓解：指引命令在 init 完成时立即打印，且 Yes/No 的强制选择确保用户至少看到一次"可以运行 deepstorm setup"的提示。如果用户选 No，也会打印提示后续可自行运行
