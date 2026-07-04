# DeepStorm 插件开发工作流

## 定位

本文档描述 **DeepStorm 自身的插件开发流程**（即开发 tide、reef、sweep、atoll 这四个套件时的规范），与 DeepStorm 提供给外部产品的工具能力是两个层面。

---

## 环境搭建

在开始 DeepStorm 插件开发前，需先完成以下环境配置。

### 前置条件

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | ≥ 20.12 | 运行 BMAD 及 DeepStorm 插件 |
| **pnpm** | ≥ 9 | DeepStorm 项目依赖管理 |
| **Python** | ≥ 3.10 | BMAD 依赖 |
| **uv** | 最新 | Python 包管理器，`curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **Claude Code CLI** | 最新 | DeepStorm 插件运行环境，建议在项目根目录打开 |

### 1. 安装项目依赖

```bash
pnpm install
```

### 2. 安装 BMAD Method

BMAD Method 是 DeepStorm 开发工作流的底层框架，在**项目根目录**下执行：

```bash
npx bmad-method install
```

安装后会在项目根目录生成以下内容：

| 路径 | 内容 | Git 策略 | 说明 |
|------|------|---------|------|
| `_bmad/` | BMAD 工具框架（配置、workflows、scripts） | ❌ 不提交 | 工具本身，不同机器版本可能不同 |
| `_bmad-output/` | BMAD 讨论产出（PRD、规划文档） | ✅ **提交** | 项目决策记录，类似 `openspec/specs/` |
| `.claude/skills/bmad-*` | BMAD skill 文件（供 Claude Code 自动加载） | ❌ 不提交 | 运行时自动生成 |

> **注意：** `_bmad-output/` 是项目需求文档的原始产出，应提交到仓库供团队查阅。
> `_bmad/` 和 `.claude/skills/bmad-*` 已在 `.gitignore` 中忽略，不会误提交。
> 如需重新安装 BMAD，删除 `_bmad/` 后重新执行 `npx bmad-method install` 即可。

### 3. 安装 DeepStorm 套件

通过 CLI 安装向导一键安装套件的 skills/agents，以及对应工具的 hooks（仅在工具包声明了 hooks 时安装，当前仅 reef 包含 hooks）：

```bash
# 从本地构建和安装（开发用）
pnpm build
npx @deepstorm/cli setup
```

### 4. 构建与测试 CLI（涉及 CLI 变更时）

如果开发工作涉及 `@deepstorm/cli` 的变更，需要构建和测试：

```bash
# 构建（esbuild + registry 聚合）
pnpm build

# 运行单元测试
pnpm test

# 发布到 npm（仅 DeepStorm 维护者）
pnpm release              # 仅构建，验证打包正常
pnpm release:publish      # 构建 + 发布到 npm（默认 patch）
pnpm release:publish minor
pnpm release:publish -- --dry-run
```

> CLI 的 build 输出在 `packages/cli/dist/`，包含 `cli.js`、`registry.json`、skills/agents/hooks/mcp/mcp-skills 等运行时数据。发布时通过 `"files": ["dist/"]` 包含全部内容。

### 5. 验证环境

确认所有命令已注册：

```
/help
```

应看到 `/tide`、`/opsx:new`、`/opsx:apply`、`/opsx:verify`、`/opsx:archive` 等命令可用。

### 环境就绪检查清单

完成以上步骤后，你的环境已具备 DeepStorm 插件开发的完整能力：

- [x] `pnpm install` 完成
- [x] `npx bmad-method install` 完成
- [x] 四个插件均已注册
- [x] `/help` 确认命令可用

---

## 核心原则

DeepStorm 自身插件开发使用 **BMAD → OpenSpec → writing-skills** 三阶段协作。

### 一个链路，不重复

DeepStorm 插件开发的核心产出是 skill、hook、agent 逻辑。CLI（`@deepstorm/cli`）是例外——它有 TypeScript 源码和单元测试，属于独立的工具链开发。

### 主要工具

| 工具 | 角色 | 核心产出 |
|------|------|---------|
| **OpenSpec** | 变更管理工作流 | spec + tasks + verify + archive |
| **writing-skills** | skill 内容生成 | 基于 spec/tasks 生成 SKILL.md |
| **@deepstorm/cli** | 安装入口 | `pnpm build` / `pnpm test` 构建测试 CLI |

> 其他 superpowers（brainstorming、writing-plans、TDD、debugging、code review 等）在 DeepStorm 插件开发中均不使用，其能力已被 BMAD + OpenSpec 覆盖。CLI 的 TypeScript 代码使用标准单元测试（vitest），不属于 skill 开发流程。

---

## 完整工作流

```mermaid
flowchart LR
    BMAD["BMAD（可选）<br>需求讨论，输出 PRD"]
    OPSX["/opsx:new<br>生成 spec + tasks"]
    WS["writing-skills<br>基于 spec 生成 SKILL.md"]
    APPLY["/opsx:apply<br>逐个完成任务"]
    VERIFY["/opsx:verify<br>验证实现"]
    ARCHIVE["/opsx:archive<br>归档变更"]

    BMAD --> OPSX
    OPSX --> WS
    WS --> APPLY
    APPLY --> VERIFY
    VERIFY --> ARCHIVE
```

### 各步骤详解

#### 1. BMAD（可选）— 需求讨论

当需求不明确时使用 BMAD 进行需求讨论，输出 PRD。

- 如果是简单明确的变更，可直接跳过，从 OpenSpec 开始
- BMAD 产出（PRD）作为 OpenSpec New 的输入

#### 2. OpenSpec New — 生成 spec + tasks

```
/opsx:new featureId
```

基于 BMAD 产出的 PRD 或自然语言描述，生成：

- **Technical Spec** — 定义 skill 行为、输入输出、边界条件、文件组织
- **Tasks** — 可执行的实现步骤清单

> **OpenSpec 的 tasks 是唯一的实现清单**，不需要任何其他工具（如 writing-plans、subagent-driven-development）再次拆解。

#### 3. writing-skills — 生成 SKILL.md

基于 spec 和 tasks，调用 **Writing Skills** superpower 生成 SKILL.md 内容：

- 遵循 SKILL.md 格式规范（metadata、checklist、steps、tools 引用）
- 按 tasks 逐条生成对应内容
- 保持和 spec 的一致性

#### 4. OpenSpec Apply — 逐个完成任务

```
/opsx:apply
```

逐项实现 tasks 中的内容，每个 task 对应一次实现原子操作：

- 写入 SKILL.md
- 编辑 skill 配置（如需）
- 注册 hook
- 编辑 README 等

#### 5. OpenSpec Verify — 验证实现

```
/opsx:verify
```

检查实现是否符合 spec：

- skill 能正常加载
- 注册成功，/command 可用
- 行为与 spec 定义一致

#### 6. OpenSpec Archive — 归档

```
/opsx:archive
```

变更完成，归档记录。每个 OpenSpec change 在独立会话中完成。

---

## 已裁剪的工具（及其替代方案）

| superpower | 为什么裁掉 | 替代方案 |
|-----------|-----------|---------|
| **brainstorming** | BMAD + OpenSpec Explore 已覆盖需求澄清 | 直接使用 BMAD 或 OpenSpec Explore |
| **writing-plans** | OpenSpec tasks 已是可靠的实现计划 | OpenSpec tasks 直接消费 |
| **subagent-driven-development** | 多个 task 通过 OpenSpec Apply 逐个完成，无需并行 agent | OpenSpec Apply |
| **executing-plans** | 跨会话执行场景少，单次会话 OpenSpec Apply 即可 | OpenSpec Apply |
| **test-driven-development** | skill = markdown，没有传统单元测试（注：CLI 的 TypeScript 代码使用 vitest，不在此列） | OpenSpec Verify |
| **systematic-debugging / code-review** | skill 没有代码层面的 bug，不需要 | — |

---

## Code-Style 多维架构

Reef 的 code-style 采用多维可组合架构，支持用户在 setup 时选择不同维度的技术选项，并自动组合为完整的 SKILL.md。

### 架构设计

```
packages/reef/skills/reef-style-frontend/
  SKILL.md.tmpl              # 主模板，使用 {{#if}} 条件引用各维度的 styleRef
  fragments/
    framework/angular/       # 前端框架维度
    ts-config/strict/        # TypeScript 配置维度
    css/tailwind/            # CSS 方案维度
    test/jest/               # 测试框架维度
```

每个维度 = 一个独立目录，包含 `quick-reference.md`（规范文档）和可选的 `examples/`（示例代码）。

### 添加新维度的步骤

以添加前端「状态管理」维度为例：

#### 1. 定义配置类型

```typescript
// packages/cli/src/types/config.ts
interface ReefConfig {
  frontend?: {
    framework?: 'react' | 'vue' | 'angular' | 'none'
    stateManagement?: 'ngrx' | 'signal' | 'none'  // 新增
    // ...
  }
}
```

#### 2. 更新配置 Schema

```json
// packages/cli/config-schema.json
"stateManagement": {
  "type": "string",
  "enum": ["ngrx", "signal", "none"],
  "description": "状态管理方案"
}
```

#### 3. 添加 wizard 问题

在 `wizard.json` 的 `questions` 数组中添加新问题。`wizard.json` 顶层必须包含 `tool`、`label`、`description` 三个字段：

```json
// packages/reef/wizard.json
{
  "tool": "reef",
  "label": "开发侧",                         // ← 向导标题（必填）
  "description": "规范生成、代码实现",       // ← 向导描述（必填）
  "mcpSkills": ["deepstorm-mcp-jira-read"],
  "questions": [
    // ... 已有问题 ...
    {
      "key": "reef.frontend.stateManagement", // ↑ 在已有问题后追加
      "label": "状态管理",
      "description": "前端状态管理方案",
      "type": "select",
      "options": [
        {
          "value": "ngrx",
          "label": "NgRx",
          "template": {
            "styleRef": "→ 参考 [NgRx 规范](dimensions/state-management/ngrx/quick-reference.md)"
          },
          "affectedTemplates": ["skills/reef-style-frontend/SKILL.md.tmpl"],
          "fragments": ["state-management/ngrx"]
        },
        {
          "value": "none",
          "label": "不使用",
          "template": { "styleRef": "" },
          "affectedTemplates": ["skills/reef-style-frontend/SKILL.md.tmpl"]
        }
      ]
    }
  ]
}
```

> **注意：** 顶层 `label` 和 `description` 在 `setup` 运行时通过 `p.intro()` 展示给用户。缺少这两个字段会导致显示 `"undefined — undefined"`。

#### 4. 创建 fragment 文件

```
packages/reef/skills/reef-style-frontend/fragments/state-management/ngrx/
  quick-reference.md     # NgRx 规范文档
```

#### 5. 更新 SKILL.md.tmpl

```handlebars
{{#if reef.frontend.stateManagement.styleRef}}
---
## 状态管理
{{reef.frontend.stateManagement.styleRef}}
{{/if}}
```

#### 6. 运行测试验证

```bash
pnpm test
```

> **关键原则：**
> - 每个维度独立产生 markdown 片段，互不干扰
> - 模板中使用 `{{#if}}` + 裸变量名（如 `styleRef`）条件渲染
> - `"none"` 默认值的 `styleRef` 为空字符串，`{{#if}}` 自动识别为假
> - `dependsOn` 用于条件显示（如 Java 子问题仅在 language=java 时出现）

### Fragment 说明

`wizard.json` 中 `options[].fragments` 字段指定该选项对应的 fragment 路径。在 setup 安装时，`copyFragmentsForSkill()` 将 fragment 文件从 `fragments/` 复制到 `<skill-dir>/dimensions/` 目录，以供 SKILL.md 中的 styleRef 链接引用。

---

## 和产品开发流程的关系

```
产品开发流程（用 DeepStorm 工具）：
  BMAD → OpenSpec → Superpowers → Code → Test

DeepStorm 自身开发流程：
  BMAD → OpenSpec → writing-skills → OpenSpec Apply → Verify → Archive
```

两者共享 BMAD + OpenSpec，区别在于实现环节：

- **产品开发**：产出代码，需要 TDD、debugging、code review 等
- **DeepStorm 开发**：产出 skill markdown，只需 writing-skills + OpenSpec Apply
