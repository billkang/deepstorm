## Why

DeepStorm reef 技能的 source 目录中，多个技术栈的 `quick-reference/` 内容分布在碎片小文件中（spring-boot 9 个文件、angular 变体 8 个文件），导致维护时需要在多个文件间跳转，增加理解成本和维护负担。此外，CLI 部分模块缺少单元测试覆盖，存在回归风险。

需要将同一个技术栈的 `quick-reference/` 子目录碎片文件合并为单个 `quick-reference.md`，降低维护成本，同时补齐 CLI 测试覆盖。

## What Changes

- **后端 fragments 文件合并**：spring-boot 和 hibernate 的 `quick-reference/` 下碎片文件合并为 `quick-reference.md`，删除碎片源文件。新增 junit5 占位文件
- **前端 fragments 文件合并**：primeng 和 vitest 的 `quick-reference/` 下碎片文件合并为 `quick-reference.md`，删除碎片源文件
- **Variants 文件合并**：后端 java 变体和前端 angular 变体的 `quick-reference/` 下碎片文件合并为 `quick-reference.md`，删除碎片源文件
- **SKILL.md.tmpl 更新**：后端模板的知识文件段落反映新的扁平结构
- **CLI 单元测试补充**：为 `setup.ts`（fragment 处理）、`template-list`、`template-apply`、`template-upgrade`、`config-view`、`mcp-select` 新增测试文件

## Capabilities

### New Capabilities
- `fragment-file-merging`: 将 `quick-reference/` 子目录下的碎片文件合并为单个 `quick-reference.md`，保留原有 `fragments/java/` 前缀结构不变
- `cli-unit-test-coverage`: 为 CLI 命令模块补充单元测试，确保 setup.ts 的 fragment 处理逻辑、模板命令、配置查看等功能有充分的测试覆盖

### Modified Capabilities
- 无（本次不修改已有 spec）

## Impact

- **`packages/reef/skills/reef-style-backend/`** — fragments 下 spring-boot、hibernate 的 `quick-reference/` 子目录文件合并；variants/java 的 `quick-reference/` 子目录文件合并
- **`packages/reef/skills/reef-style-frontend/`** — fragments 下 primeng、vitest 的 `quick-reference/` 子目录文件合并；variants/angular 的 `quick-reference/` 子目录文件合并
- **`packages/reef/skills/reef-style-backend/SKILL.md.tmpl`** — 知识文件章节更新
- **`packages/cli/`** — 新增测试文件，setup.ts 导出 copyFragmentsForSkill/collectFragmentsFromQuestion
- **无破坏性变更** — 目录前缀和路径引用不变，CLI 运行时逻辑不变
