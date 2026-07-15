# claude-md-initialization Specification

## ADDED Requirements

### Requirement: init 创建 .claude/CLAUDE.md 项目信息文件

`deepstorm init` 执行完成后，SHALL 在 `.claude/CLAUDE.md` 中写入项目基础信息，使 Claude Code（或其他 AI 工具）能直接读取项目上下文。

#### Scenario: init 后生成 claude.md
- **WHEN** `deepstorm init` 完成脚手架生成
- **THEN** 系统 SHALL 在 `.claude/CLAUDE.md` 写入包含以下内容的项目信息：
  - 项目名称
  - 项目技术栈（前端框架、后端语言、UI 库、CSS 方案、ORM、数据库迁移工具、AI 框架）
  - `.deepstorm/context.md` 的引用（`> 项目事实见 .deepstorm/context.md`）
- **AND** 如果 `.claude/` 目录不存在，SHALL 自动创建

#### Scenario: 已有 claude.md 时补充而非覆盖
- **WHEN** `.claude/CLAUDE.md` 已存在
- **THEN** 系统 SHALL 不写入，保持已有内容不变

#### Scenario: 无技术栈选择时写入基本信息
- **WHEN** 用户通过 `deepstorm init` 选择了技术栈（如前端 Angular + 后端 Java）
- **THEN** `.claude/CLAUDE.md` SHALL 包含对应的技术栈描述行

### Requirement: claude.md 文件格式规范

`.claude/CLAUDE.md` SHALL 使用标准的 Markdown 格式，首行为一级标题 `# 项目名称`。

#### Scenario: claude.md 文件结构
- **WHEN** 系统生成 `.claude/CLAUDE.md`
- **THEN** 文件 SHALL 包含以下结构：
  - 标题行：`# {projectName}`
  - 空行分隔
  - 技术栈区块（若已选择技术栈）
  - 项目上下文引用行
