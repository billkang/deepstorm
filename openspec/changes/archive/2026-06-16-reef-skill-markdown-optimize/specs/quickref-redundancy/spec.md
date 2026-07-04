## ADDED Requirements

### Requirement: 消除 quick-reference 与 examples 的代码重复

quick-reference.md 文件中的完整代码块 SHALL 替换为引用 examples/ 目录，避免同一套代码在两个被同时加载的文件中重复出现。

#### Scenario: Spring Boot quick-reference 精简完成
- **WHEN** 优化完成
- **THEN** `spring-boot/quick-reference.md` 行数不超过 140 行
- **THEN** 保留速查表、规则列表和核心决策表
- **THEN** Controller/Service/Repository 完整代码块替换为 `详见 examples/` 引用
- **THEN** 异常处理、安全配置等完整代码块用更紧凑的代码片段代替

#### Scenario: 前端 angular quick-reference 精简完成
- **WHEN** 优化完成
- **THEN** `angular/quick-reference.md` 行数不超过 120 行
- **THEN** 保留速查表和规则列表
- **THEN** 完整代码块替换为引用 `examples/` 目录
