## Why

reef-start SKILL.md.tmpl 现状有两个问题：

**问题 1：之前的 lattice-adaptation 变更改动错了文件。**
上回实现的 5 个新能力（风险路由、后置验证门禁、上下文地图、AC-to-test trace、验证报告）被写入了 build 产物 `SKILL.md`，而非源文件 `SKILL.md.tmpl`。`deepstorm setup` 渲染时只读 `.tmpl`，所以这 5 个能力在安装后**实际不可用**。

**问题 2：SKILL.md.tmpl 超标。**
当前 562 行 / ~24KB，加上待移植的 lattice 内容后预计增长到 ~800 行。长文档的 Agent 阅读完整性、上下文消耗和维护成本都已到需要优化的程度。

本 change 分两阶段解决：
1. 将 lattice-adaptation 的改动从 `SKILL.md` 移植到 `SKILL.md.tmpl`
2. 在移植后的 `SKILL.md.tmpl` 上做结构拆分，将重参考内容外置到 `references/`

## What Changes

### Phase 0：移植 lattice-adaptation 到源文件

- 将 `SKILL.md` 中的以下段落移植到 `SKILL.md.tmpl`：
  - Path A 1.6 更新上下文地图
  - Path B B1.5 更新上下文地图
  - 风险路由判断流程（含 Mode 切换规则）
  - Plan Mode 和 TDD Mode 声明模板
  - 核心原则中的 dual-mode 原则
  - 4.2 逐 task 实现（plan mode + tdd mode 双路径）
  - 框架自适应验证命令表
  - 4.3 code-audit 检查清单（含 AC-to-test 回溯）
  - 4.4 验证报告生成
  - 4.5 分支结束处理（含 verify-report 归档）
- 删除过时的 `SKILL.md`（不再需要构建产物）

### Phase 1：文档结构拆分

- 将 `packages/reef/skills/reef-start/references/superpowers-gate.md`（新建）从 SKILL.md.tmpl 拆分出去，包含：
  - Plan Mode 和 TDD Mode 两个模式的声明模板
  - 安全检查清单
  - Red Flags 表格
- 将 `packages/reef/skills/reef-start/references/stage-4-implementation.md`（新建）从 SKILL.md.tmpl 拆分出去，包含：
  - 逐 task 实现的详细指令
  - 框架自适应验证命令表
  - code-audit 检查清单
  - verify-report 生成指令
  - 分支结束处理
- SKILL.md.tmpl 精简为 ~400 行：保留入口路由、前置条件、6 个阶段流程路由、Mermaid 流程图、核心原则。去掉的段落改为引用指令
- 运行时 MCP 服务发现的 JSON 示例从 inline 外置，流程描述保留

## Capabilities

### New Capabilities

- `lattice-porting`: 将 lattice-adaptation 的五项能力从 SKILL.md 移植到 SKILL.md.tmpl
- `skill-restructure`: reef-start SKILL.md.tmpl 的文档结构重组——将重参考内容外置到 references/ 目录

## Impact

- `packages/reef/skills/reef-start/SKILL.md.tmpl` — 核心改动，先移植后精简
- `packages/reef/skills/reef-start/SKILL.md` — 删除（过时的构建产物）
- `packages/reef/skills/reef-start/references/superpowers-gate.md` — 新建，~80 行
- `packages/reef/skills/reef-start/references/stage-4-implementation.md` — 新建，~100 行
- 无 CLI/API/DB/测试影响（纯文档变更，不改变行为逻辑）
