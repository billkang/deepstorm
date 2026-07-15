# project-context-map Specification

## ADDED Requirements

### Requirement: claude.md 作为项目入口、context.md 作为详细上下文

`.claude/CLAUDE.md` 和 `.deepstorm/context.md` SHALL 承担不同角色：`claude.md` 是 AI 会话的快速入口，提供项目概览；`context.md` 是详细上下文地图，供 `reef-start` 按需维护。

#### Scenario: init 时只创建 claude.md 入口
- **WHEN** `deepstorm init` 执行初始化
- **THEN** CLI SHALL 在 `.claude/CLAUDE.md` 写入项目基础信息 + 技术栈概览
- **AND** SHALL 在 `.claude/CLAUDE.md` 末尾引用 `.deepstorm/context.md`
- **AND** SHALL 在 `.deepstorm/context.md` 写入详细上下文模板（已有行为）
- **AND** SHALL 在根 `CLAUDE.md` 末尾引用 `.claude/CLAUDE.md` 和 `.deepstorm/context.md`

#### Scenario: 两文件引用链路完整
- **WHEN** 用户或 AI 打开根 `CLAUDE.md`
- **THEN** SHOULD 能通过引用找到 `.claude/CLAUDE.md`
- **AND** 通过 `.claude/CLAUDE.md` 中的引用找到 `.deepstorm/context.md`
- **AND** 形成 `CLAUDE.md → .claude/CLAUDE.md → .deepstorm/context.md` 的渐进深入链路
