# init-config-share Specification

## ADDED Requirements

### Requirement: init 将技术方案同步写入 .claude/CLAUDE.md

`deepstorm init` 将技术方案写入 `.claude/settings.json` 的同时，SHALL 将技术方案同步写入 `.claude/CLAUDE.md`，确保两种配置入口（AI 读取的 `claude.md` 和工具读取的 `settings.json`）信息一致。

#### Scenario: 技术方案同时写入两个文件
- **WHEN** 用户通过 `deepstorm init` 完成技术栈选择（如前端 Angular + 后端 Java）
- **THEN** 系统 SHALL 将技术方案写入 `.claude/settings.json` 的 `deepstorm.reef.*` 命名空间（已有行为）
- **AND** 系统 SHALL 将相同的技术方案信息写入 `.claude/CLAUDE.md`

#### Scenario: 选择"不需要后端"时 claude.md 只写前端信息
- **WHEN** 用户选择前端 Angular + "不需要后端"
- **THEN** `.claude/CLAUDE.md` SHALL 仅写入前端相关技术栈描述
- **AND** SHALL NOT 包含后端相关字段
