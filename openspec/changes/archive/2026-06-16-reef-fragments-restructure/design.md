## Context

DeepStorm reef 技能的 source 目录中，多个技术栈的 `quick-reference/` 内容分散在碎片小文件中。例如 spring-boot 在 `fragments/java/framework/spring-boot/quick-reference/` 下有 9 个 `.md` 文件（`_index.md`、`controller.md`、`service.md` 等），angular 在 `variants/angular/quick-reference/` 下有 8 个文件。维护时需在多个文件间跳转。

同时，CLI 部分命令（template-list、template-apply、template-upgrade、config-view、setup.ts fragment 处理）缺少单元测试。

本次变更仅做两件事：合并 `quick-reference/` 碎片文件 + 补齐 CLI 测试。

## Goals / Non-Goals

**Goals:**
- 将同一个技术栈的 `quick-reference/` 子目录碎片文件合并为单个 `quick-reference.md`
- 删除合并前的碎片源文件
- 保留原有目录前缀和路径结构不变（`fragments/java/` 前缀不动）
- 更新 `SKILL.md.tmpl` 知识文件章节（后端）
- 为 CLI 命令模块补充 TDD 单元测试

**Non-Goals:**
- ❌ 不移除 `java/` 前缀目录（结构不变，后续 change 可处理）
- ❌ 不上移 `examples/` 子目录（结构不变，后续 change 可处理）
- ❌ 不修改 `wizard.json`（路径引用不变）
- ❌ 不修改 CLI 运行时代码（renderer.ts、build-registry.ts）
- ❌ 不添加新的 CLI 命令
- ❌ 不修改测试框架配置

## Decisions

### 1. 保留 `java/` 前缀结构

**选择：** 不移动目录，仅在现有 `fragments/java/` 路径下合并文件。

**理由：** 移除 `java/` 前缀需要同步更新 `wizard.json` 中 5 处 fragmentPaths 和 7 处 styleRef，涉及跨包改动。本次先聚焦文件合并这一单一原子变更，路径扁平化留给后续 change 独立完成。

### 2. 保留 `examples/` 子目录

**选择：** `examples/` 文件不移动，保持原有嵌套结构。

**理由：** `examples/` 的上移与 `java/` 前缀移除紧密相关（都在 fragment 根目录层级操作），同样属于后续 change 范围。

### 3. 合并 quick-reference/ 碎片为单文件

**选择：** 将 `_index.md` + 各子主题碎片文件合并成单个 `quick-reference.md`，通过内部 Markdown 标题锚点导航。

**备选方案：**
- **保持分离**：文件多、导航成本高，且部分文件仅几十行。
- **合并为一个文件**（选中）：引入导航表 + 锚点链接。

**理由：** 单个文件便于整体阅读和全文搜索。用户加载 skill 后只需 Read 一个 `quick-reference.md` 而非逐一判断需要读哪个子文件。文件头部的速查清单保留了原有多文件结构的概念。

### 4. 最小化 CLI 代码修改

**选择：** 仅将 `copyFragmentsForSkill` 和 `collectFragmentsFromQuestion` 从 `function` 改为 `export function`，不修改运行时逻辑。

**理由：** 保持"数据驱动变化，代码保持稳定"原则。测试覆盖通过 exports 实现，不改变原有行为。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 合并文件后按需加载粒度变粗 | 用户需读取完整 `quick-reference.md` | 文件头保留速查清单 + 内部锚点，支持快速定位章节 |
| 合并后文件内锚点链接断裂 | 跨文件引用失效 | 合并时逐一检查所有 `file.md` 引用改为锚点 |
| 后续 `java/` 前缀移除时需再次更新文件引用 | 与本次合并工作重复 | 本次标记已合并的文件，后续变更时批量处理 |

## Migration Plan

1. 针对每个 `quick-reference/` 子目录，将 `_index.md` 及其余碎片文件内容合并为一个 `quick-reference.md`
2. 删除除 `quick-reference.md` 外的所有碎片文件和 `quick-reference/` 子目录
3. 更新合并后的文件内部引用（`../examples/` → `examples/`）
4. 更新 `packages/reef/skills/reef-style-backend/SKILL.md.tmpl` 知识文件章节
5. 修改 `setup.ts` 导出函数
6. 补充 CLI 单元测试文件
7. 运行全部测试确认无回归
