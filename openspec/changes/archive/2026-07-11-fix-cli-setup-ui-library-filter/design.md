## Context

当前 `renderAsSingleGroup` 渲染 group 内子问题时，选项列表是静态的——全部在 `p.group()` 创建时确定。对于 `reef.frontend.uiLibrary` 这种"选项需根据用户在其他子问题中的选择动态过滤"的场景，缺少支持。

现有 `WizardQuestion.dependsOn` 控制的是**整题显示/隐藏**（如后端 Java 详情仅在语言选 Java 后显示），不适用于**选项级过滤**。

## Goals / Non-Goals

**Goals:**
- 框架选择后，UI 组件库选项仅显示所选框架支持的组件库
- 提供通用的选项级过滤机制，供未来其他类似场景复用

**Non-Goals:**
- 不重构整个 wizard 渲染系统
- 不改变已有 question 级 `dependsOn` 的语义
- 不支持多条件组合过滤（AND/OR）

## Decisions

### Decision 1: 选项级 `dependsOn` vs question 级条件

选择了在 `WizardOption` 上新增 `dependsOn?: string` 字段。

**考虑过的替代方案：**
- **Question 级 `dependsOn`**：在 `reef.frontend.uiLibrary` 加 `dependsOn: { key: "reef.frontend.framework", value: "angular" }`。但这种方式只能隐藏/显示整题，无法实现"题始终显示但选项不同"的效果。
- **拆分为多个 question**：Angular 一个 UI 库 question、React 一个、Vue 一个。过于冗余且配置膨胀。

**选择理由**：选项级 `dependsOn` 语义清晰——每个选项声明自己属于哪个驱动值，渲染时自动过滤。对现有行为零影响（不设置则行为不变）。

### Decision 2: 过滤机制 — 隐式匹配 vs 显式 key

选择了 `Object.values(results).includes(o.dependsOn)` 的隐式匹配方式，而非显式指定驱动 question 的 key。

**考虑过的替代方案：**
- **显式 key**：在 question 上加 `optionFilterKey: "reef.frontend.framework"`，然后用 `results[optionFilterKey] === o.dependsOn` 匹配。更精确但引入了新字段。
- **在 option 的 `dependsOn` 中同时指定 key 和 value**：如 `"dependsOn": { "key": "reef.frontend.framework", "value": "angular" }`。也精确但更 verbose。

**选择理由**：隐式匹配利用了两点事实：(1) `renderAsSingleGroup` 中所有子问题共享同一个表单域，各 question 的选项 value 不会冲突；(2) `p.group()` 按序求值，framework 在 uiLibrary 之前，results 已包含 framework 值。实现最简单，代码最少。

**风险缓解**：如果未来 group 内不同 question 的选项 value 可能相同（如两个 question 都有 `"none"` 值），`dependsOn: "none"` 可能误匹配。为此，"不使用" 类通用选项不设置 `dependsOn`（始终可见），避免此问题。

## Risks / Trade-offs

- **[低风险] `p.group()` 不支持动态重求值**：用户若回头修改框架选择，已渲染的组件库选项不会自动更新。但 @clack/prompts 的 group 组件基于顺序渲染，先选框架再选组件库，正常流程不受影响
- **[低风险] 隐式匹配未来可能冲突**：如果同一 group 内新增 question 的 value 与框架名相同（如 `"angular"`），会误触发过滤。缓解措施：新增 question 时避免与框架名重复的 value
