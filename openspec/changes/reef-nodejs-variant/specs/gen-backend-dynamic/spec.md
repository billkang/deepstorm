# gen-backend-dynamic Delta

## MODIFIED Requirements

### Requirement: 语言特有的生成步骤从 variants/ 加载
每种语言的编码步骤顺序和指导内容必须放在 `variants/{lang}/` 目录下，由 setup 时按用户选择复制到技能目录。**更新：增加 Node.js（NestJS）语言变体。**

#### Scenario: Node.js 变体包含特有条目
- **WHEN** 用户选择了 Node.js 作为后端语言
- **THEN** `variants/nodejs/steps.md` 必须被复制到安装后的 `reef-gen-backend/` 目录中，包含 Node.js 特有的编码顺序（Prisma Schema → DTO → Entity → Service → Controller → Module）和构建命令（`pnpm`/`npm`/`yarn`）

#### Scenario: Java/Python/Node.js 互斥
- **WHEN** 用户选择了 Node.js
- **THEN** `variants/` 中 Java、Python 及其他语言的子目录不被复制到目标技能目录

## ADDED Requirements

### Requirement: Node.js 特有的模板变量
`SKILL.md.tmpl` SHALL 支持 `{{reef.backend.nodejs.*}}` 模板变量命名空间。

#### Scenario: Node.js 模板变量注入
- **WHEN** 渲染 `SKILL.md.tmpl` 且用户后端语言为 Node.js
- **THEN** `{{reef.backend.nodejs.buildTool}}` SHALL 替换为用户选择的包管理器
- **THEN** `{{reef.backend.nodejs.sourcePath}}` SHALL 替换为 `src/`
- **THEN** `{{reef.backend.nodejs.testFramework}}` SHALL 替换为 `jest` 或空

### Requirement: Node.js 变体的 affectedTemplates 注册
Node.js 语言选项的 `affectedTemplates` 必须包含 `skills/reef-gen-backend/SKILL.md.tmpl`。

#### Scenario: Node.js 触发的重新渲染
- **WHEN** 用户在 setup 中选择了 Node.js 作为后端语言
- **THEN** `reef-gen-backend/SKILL.md.tmpl` 必须加入渲染管线，输出为 `.claude/skills/reef-gen-backend/SKILL.md`
