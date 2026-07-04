## ADDED Requirements

### Requirement: 合并紧密相关的小文件

同一 examples/ 目录下、主题紧密关联、每文件少于 80 行的 markdown 文件 SHALL 合并，减少文件总数。

#### Scenario: service-layer 和 template-routing 合并
- **WHEN** 优化完成
- **THEN** `angular/examples/service-layer.md` 和 `angular/examples/template-routing.md` 合并为 `angular/examples/service-routing.md`
- **THEN** 原文件 `service-layer.md` 和 `template-routing.md` 被删除

#### Scenario: types-pipes 和 component-patterns 合并
- **WHEN** 优化完成
- **THEN** `angular/examples/types-pipes.md` 和 `angular/examples/component-patterns.md` 合并为 `angular/examples/component-types-pipes.md`
- **THEN** 原文件 `types-pipes.md` 和 `component-patterns.md` 被删除

#### Scenario: 合并后内容完整
- **WHEN** 任意合并操作完成
- **THEN** 合并后的文件包含所有原文件的规则和示例
- **THEN** 合并后的文件内部结构清晰，用分隔线或标题区分不同主题
