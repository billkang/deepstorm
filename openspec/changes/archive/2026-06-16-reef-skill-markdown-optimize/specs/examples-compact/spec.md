## ADDED Requirements

### Requirement: 精简 examples 代码示例

examples/ 目录下的代码示例文件 SHALL 通过省略样板代码（imports、完整类声明等）来减少行数。

#### Scenario: service-entity.md 精简完成
- **WHEN** 优化完成
- **THEN** `service-entity.md` 行数不超过 240 行
- **THEN** 每个示例的 imports/std 注解用 `// ...` 省略
- **THEN** 保留完整的核心业务逻辑和 mermaid 图表
- **THEN** 事件驱动示例保留发布方和监听方各一个

#### Scenario: testing.md 精简完成
- **WHEN** 优化完成
- **THEN** `testing.md`（vitest）行数不超过 180 行
- **THEN** 保留组件测试、Service 测试、Testing Library、异步测试四类
- **THEN** Pipe/Signal/E2E 测试合并为一个简短章节

#### Scenario: database-migration.md 精简完成
- **WHEN** 优化完成
- **THEN** `database-migration.md`（Liquibase）行数不超过 190 行
- **THEN** XML namespace boilerplate 用 `<!-- ... -->` 省略
- **THEN** 建表+序列+外键合并为一个复合 changeset 示例

#### Scenario: entity-types.md 精简完成
- **WHEN** 优化完成
- **THEN** `entity-types.md`（前端 Angular）行数不超过 170 行
- **THEN** 实体层次用更紧凑的文字列表表达
- **THEN** Discriminated Union 模式每种类型只保留 1 个示例
