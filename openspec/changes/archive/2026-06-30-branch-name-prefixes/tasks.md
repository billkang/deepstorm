## 1. 知识准备

- [x] 1.1 阅读所有受影响 skill 文件，梳理当前分支名在各处的使用方式（输入、输出、查找、转换）
- [x] 1.2 确认各 skill 中 `git branch --show-current` 的调用位置和消费逻辑

## 2. reef-start：分支创建入口改造

- [x] 2.1 修改 Phase 2：在根据 Issue 摘要推导分支名前，增加前缀选择步骤（8 种前缀提示用户选择）
- [x] 2.2 分支名输出格式从 `{kebab-name}` 改为 `{prefix}/{kebab-name}`，约束前缀+斜杠+3-6 词 kebab
- [x] 2.3 `openspec new change` 调用参数从 `"{name}"` 改为 `"{prefix}/{name}"`，确保目录结构一致（通过 `$CHANGE` 自动继承）

## 3. deepstorm-discuss：规范文档更新

- [x] 3.1 语言映射表中"变更名/分支名"行的输出列，从"英文 kebab-case（3-6 词）"更新为"`{prefix}`/英文 kebab-case（3-6 词）"
- [x] 3.2 在前置条件或命名规范章节中，补充前缀列表和选择指导

## 4. deepstorm-commit：提交信息前缀推导

- [x] 4.1 修改提交信息生成逻辑：从 `git branch --show-current` 中提取前缀，作为 commit type 的默认值
- [x] 4.2 分支名不含 `/` 时的兜底逻辑（不应出现，但防御性处理）

## 5. reef-pr：PR 创建上下文更新

- [x] 5.1 PR 标题/描述中引用分支名的地方，确保正确解析带前缀的名称
- [x] 5.2 `openspec/changes/$(git branch --show-current)/` 路径解析——验证带斜杠的分支名能正确映射到目录

## 6. bmad-quick-dev：分支名合理性检查更新

- [x] 6.1 更新分支名有效性判断逻辑：检查是否符合 `{prefix}/{kebab}` 格式，若不合法则终止并提示
- [x] 6.2 补充无效前缀时的提示信息，列出 8 种允许的前缀
