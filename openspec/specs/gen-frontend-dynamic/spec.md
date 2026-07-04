## ADDED Requirements

### Requirement: gen-frontend 技能使用 .tmpl 模板
`reef-gen-frontend/SKILL.md` 必须改为 `SKILL.md.tmpl` 文件，使用 Handlebars 模板语法，内容根据用户在 setup 阶段选择的框架动态生成。

#### Scenario: 模板文件存在且语法正确
- **WHEN** 用户在 setup 阶段选择了前端框架（如 Angular）
- **THEN** 安装后的 `.claude/skills/reef-gen-frontend/SKILL.md` 必须由 `SKILL.md.tmpl` 渲染生成，且 Handlebars 语法完全解析

#### Scenario: 未选择前端时技能不安装
- **WHEN** 用户在 setup 中未选择前端技术
- **THEN** `reef-gen-frontend` 技能不应被安装到 `.claude/skills/`

### Requirement: 框架特有的生成步骤从 variants/ 加载
每种框架的编码步骤顺序和指导内容必须放在 `variants/{framework}/` 目录下，由 setup 时按用户选择复制到技能目录。

#### Scenario: Angular 变体包含特有条目
- **WHEN** 用户选择了 Angular 作为前端框架
- **THEN** `variants/angular/steps.md` 必须被复制到安装后的 `reef-gen-frontend/` 目录中，包含 Angular 特有的编码顺序（类型定义 → Service → Component → 路由）和构建命令（`pnpm`）

#### Scenario: 未选中的框架变体不被复制
- **WHEN** 用户选择了 Angular
- **THEN** `variants/` 中 Angular 以外的子目录不得被复制到目标技能目录

### Requirement: 通用工作流骨架在 .tmpl 中定义
找参考实现、查阅规范、获取设计数据、运行验证、提交自检等框架无关的步骤必须保留在 `SKILL.md.tmpl` 的通用流程中。

#### Scenario: 通用步骤包含模板变量
- **WHEN** 渲染 `SKILL.md.tmpl`
- **THEN** `{{reef.frontend.framework.buildTool}}`、`{{reef.frontend.framework.sourcePath}}` 等模板变量必须正确替换为所选框架的值

#### Scenario: 框架特有约束条件显示
- **WHEN** 用户选择了 Angular
- **THEN** 渲染后的内容必须包含 Angular 特有的核心约束说明（Standalone + OnPush + inject() + Signal Forms + httpResource）

### Requirement: 支持 `wizard.json` affectedTemplates 注册
Angular（及未来其他框架）选项的 `affectedTemplates` 必须包含 `skills/reef-gen-frontend/SKILL.md.tmpl`。

#### Scenario: 重新渲染触发
- **WHEN** 用户在 setup 中选择 Angular 作为前端框架
- **THEN** `reef-gen-frontend/SKILL.md.tmpl` 必须加入渲染管线，输出为 `.claude/skills/reef-gen-frontend/SKILL.md`

### Requirement: agent 引用路径指向安装后路径
模板中所有 agent 文件引用必须使用安装后的相对路径，而非 monorepo 源码路径。

#### Scenario: 路径正确解析
- **WHEN** 渲染后的 `SKILL.md` 引用审查代理文件
- **THEN** 路径必须使用 `../../agents/` 格式（指向 `.claude/agents/`），不得使用 `../reef/agents/` 格式
