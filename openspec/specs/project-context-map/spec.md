# project-context-map Specification

## Purpose
TBD - created by archiving change reef-start-lattice-adaptation. Update Purpose after archive.
## Requirements
### Requirement: 上下文地图文件

项目 SHALL 在 `.deepstorm/context.md` 维护一份轻量级上下文索引文件，记录项目的技术栈、关键模块、历史踩坑和外部引用。

#### Scenario: CLI setup 时初始化模板
- **WHEN** `deepstorm setup` 执行初始化
- **THEN** CLI SHALL 在 `.deepstorm/context.md` 写入模板结构，含技术栈、关键模块、历史踩坑、外部引用四个空节
- **AND** `.claude/CLAUDE.md` 末尾附加一行 `> 项目事实见 .deepstorm/context.md`

### Requirement: 上下文更新时机

上下文地图 SHALL 由 reef-start 在阶段一（需求获取）结束时按需更新。

#### Scenario: 阶段一结束时检测更新
- **WHEN** reef-start 阶段一完成需求获取（读取 Issue、PRD、Figma、代码探索后）
- **THEN** Agent SHALL 对比当前 `.deepstorm/context.md` 与阶段一采集的项目信息
- **AND** 仅在存在实质性变化时（新增模块、发现高风险链路、更新技术栈等）才执行写入
- **AND** 输出更新摘要供用户知晓

#### Scenario: 无实质变化时跳过
- **WHEN** 阶段一采集的信息与现有 context.md 内容一致
- **THEN** Agent SHALL NOT 修改文件，避免无意义的 git 变动

### Requirement: claude.md 作为项目入口、context.md 作为详细上下文

`.claude/CLAUDE.md` 和 `.deepstorm/context.md` SHALL 承担不同角色：`claude.md` 是 AI 会话的快速入口，提供项目概览；`context.md` 是详细上下文地图，供 `reef-start` 按需维护。

#### Scenario: init 时只创建 claude.md 入口
- **WHEN** `deepstorm init` 执行初始化
- **THEN** CLI SHALL 在 `.claude/CLAUDE.md` 写入项目基础信息 + 技术栈概览
- **AND** SHALL 在 `.claude/CLAUDE.md` 末尾引用 `.deepstorm/context.md`
- **AND** SHALL 在 `.deepstorm/context.md` 写入详细上下文模板（已有行为）

#### Scenario: 单入口引用链路
- **WHEN** Claude Code 读取项目信息
- **THEN** SHALL 直接读取 `.claude/CLAUDE.md`（Claude Code 自动加载）
- **AND** 通过 `.claude/CLAUDE.md` 中的引用找到 `.deepstorm/context.md`
- **AND** 形成 `.claude/CLAUDE.md → .deepstorm/context.md` 的单向引用链路

### Requirement: 上下文地图内容结构

`.deepstorm/context.md` SHALL 包含以下四个区块：

#### Scenario: 技术栈区块
- **WHEN** 项目技术栈发生变化（如新增框架、更换数据库）
- **THEN** Agent SHALL 更新技术栈区块，记录前端、后端、数据库、CI/CD 等关键信息

#### Scenario: 关键模块区块
- **WHEN** 发现新的模块或模块边界变化
- **THEN** Agent SHALL 更新关键模块表格，每行包含模块名、简要说明、高风险标记
- **AND** 高风险标记 SHALL 使用 `权限｜安全｜资金｜幂等` 标签

#### Scenario: 历史踩坑区块
- **WHEN** 发现新的重要故障或架构决策
- **THEN** Agent SHALL 更新历史踩坑区块，记录概要 + 引用文档路径
- **AND** 每条记录 SHALL 包含指向详细文档的链接

#### Scenario: 外部引用区块
- **WHEN** 发现依赖的外部 API 文档、设计系统或业务规范
- **THEN** Agent SHALL 更新外部引用区块，记录名称 + URL 或路径

