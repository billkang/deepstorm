## ADDED Requirements

### Requirement: gen-backend 技能使用 .tmpl 模板
`reef-gen-backend/SKILL.md` 必须改为 `SKILL.md.tmpl` 文件，使用 Handlebars 模板语法，内容根据用户在 setup 阶段选择的语言动态生成。

#### Scenario: 模板文件存在且语法正确
- **WHEN** 用户在 setup 阶段选择了后端语言（如 Java）
- **THEN** 安装后的 `.claude/skills/reef-gen-backend/SKILL.md` 必须由 `SKILL.md.tmpl` 渲染生成，且 Handlebars 语法完全解析

#### Scenario: 未选择后端时技能不安装
- **WHEN** 用户在 setup 中未选择后端技术
- **THEN** `reef-gen-backend` 技能不应被安装到 `.claude/skills/`

### Requirement: 语言特有的生成步骤从 variants/ 加载
每种语言的编码步骤顺序和指导内容必须放在 `variants/{lang}/` 目录下，由 setup 时按用户选择复制到技能目录。

#### Scenario: Java 变体包含特有条目
- **WHEN** 用户选择了 Java 作为后端语言
- **THEN** `variants/java/steps.md` 必须被复制到安装后的 `reef-gen-backend/` 目录中，包含 Java 特有的编码顺序（Entity → DTO → Mapper → Repository → Service → Controller）和构建命令（`./gradlew`）

#### Scenario: 未选中的语言变体不被复制
- **WHEN** 用户选择了 Java
- **THEN** `variants/` 中 Java 以外的子目录不得被复制到目标技能目录

### Requirement: 通用工作流骨架在 .tmpl 中定义
找参考实现、查阅规范、运行验证、提交自检等语言无关的步骤必须保留在 `SKILL.md.tmpl` 的通用流程中。

#### Scenario: 通用步骤包含模板变量
- **WHEN** 渲染 `SKILL.md.tmpl`
- **THEN** `{{reef.backend.language.buildTool}}`、`{{reef.backend.language.sourcePath}}` 等模板变量必须正确替换为所选语言的值

### Requirement: 数据库迁移工作流合并为条件块
`reef-migrate` 的生成工作流必须合并到 `reef-gen-backend` 中，作为数据库迁移维度的条件块存在。

#### Scenario: 选择了数据库迁移工具时显示迁移步骤
- **WHEN** 用户在 setup 中选择了后端数据库迁移工具（如 Liquibase）
- **THEN** `SKILL.md.tmpl` 渲染后必须包含数据库迁移章节，指导用户创建迁移文件

#### Scenario: 未选择迁移工具时隐藏迁移步骤
- **WHEN** 用户未选择任何数据库迁移工具
- **THEN** 渲染后的 `SKILL.md` 不得包含数据库迁移章节

### Requirement: 支持 `wizard.json` affectedTemplates 注册
Java 语言选项的 `affectedTemplates` 必须包含 `skills/reef-gen-backend/SKILL.md.tmpl`。

#### Scenario: 重新渲染触发
- **WHEN** 用户在 setup 中选择了 Java 作为后端语言
- **THEN** `reef-gen-backend/SKILL.md.tmpl` 必须加入渲染管线，输出为 `.claude/skills/reef-gen-backend/SKILL.md`

### Requirement: agent 引用路径指向安装后路径
模板中所有 agent 文件引用必须使用安装后的相对路径，而非 monorepo 源码路径。

#### Scenario: 路径正确解析
- **WHEN** 渲染后的 `SKILL.md` 引用代理文件
- **THEN** 路径必须使用 `../../agents/reef-review-backend.md` 格式（指向 `.claude/agents/`），不得使用 `../reef/agents/` 格式

### Requirement: `reef-migrate` 整包删除
`packages/reef/skills/reef-migrate/` 目录必须完整删除，包含 `SKILL.md` 及所有相关文件。

#### Scenario: 包结构不含迁移技能
- **WHEN** 构建 registry
- **THEN** `dist/skills/` 中不得包含 `reef-migrate` 目录

#### Scenario: 已有安装用户升级不受影响
- **WHEN** 已安装 reef-migrate 的用户运行 `setup --reconfigure`
- **THEN** 清理步骤应删除旧的 `reef-migrate` 目录
