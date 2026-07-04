## ADDED Requirements

### Requirement: 参考文件按策略合并到主模板

SKILL.md.tmpl SHALL 将部分 reference 文件的内容内联到主模板中，消除 AI 加载时的额外 Read 调用。合并策略 SHALL 遵循三类划分：

- **内联文件**：`entry-details.md`、`session-ops.md`、`archive.md` — 内容合并到主模板对应章节
- **保留文件**：`data-format.md`、`prd-template.md`、`publish-flow.md` — 保留单独文件，顶部增加摘要索引块
- **独立文件**：`role-prompts.md`、`checklists.md` — 保留现状，不加摘要（按需加载）

#### Scenario: 内联文件合并到主模板
- **WHEN** SKILL.md.tmpl 完成合并重构
- **THEN** `entry-details.md` 的内容 SHALL 合并到「入口：数据扫描 + 输入解析」章节末尾
- **AND** `session-ops.md` 的内容 SHALL 合并到「会话恢复/关联」章节
- **AND** `archive.md` 的内容 SHALL 合并到「归档」章节
- **AND** 主模板中的指令 SHALL 直接引用内联内容，不再引用 `references/xxx.md`

#### Scenario: 保留文件增加摘要索引
- **WHEN** 保留文件顶部未包含摘要索引块
- **THEN** 文件顶部 SHALL 增加 3-5 行元数据摘要，格式为引用块
- **AND** 摘要 SHALL 包含：文件用途、引用时机、关键字段

### Requirement: AI 启动时自动识别内联内容

合并后 SKILL.md.tmpl SHALL 保持清晰的分级标题结构，确保 AI 能按工作流阶段定位内联内容，无需搜索关键词。

#### Scenario: 内联内容按标题定位
- **WHEN** AI 需要查找归档相关的工作流指令
- **THEN** 内联的归档内容 SHALL 出现在主模板的「归档」章节下
- **AND** 不需要额外 Read 参考文件即可获取完整归档规则

### Requirement: 保留文件可被按需加载

保留文件 SHALL 保持独立文件，AI 仅在需要时通过 Read 加载，不阻塞 skill 主流程启动。

#### Scenario: 非内联文件不影响启动
- **WHEN** AI 启动 Tide skill
- **THEN** 主 SKILL.md 内容 SHALL 包含所有关键工作流指令
- **AND** 保留文件仅在其内容被实际需要时加载
- **AND** 摘要索引帮助 AI 判断是否需要 Read 该文件
