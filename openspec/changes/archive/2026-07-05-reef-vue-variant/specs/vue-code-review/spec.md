## ADDED Requirements

### Requirement: Vue 响应式规则审查
代码审查 Agent MUST 检查 Vue 响应式相关的常见错误，包括 ref/reactive 使用不当、直接修改响应式对象、watch 依赖遗漏等。

#### Scenario: ref/reactive 违规检测
- **WHEN** 审查代码发现直接修改 `reactive` 对象整体赋值（如 `state = newVal`）
- **THEN** MUST 标记为 🔴 Block，建议使用 `Object.assign()` 或改用 `ref()`

#### Scenario: watch 依赖遗漏
- **WHEN** `watch()` 的回调中使用了未在依赖数组中声明的响应式值
- **THEN** MUST 标记为 🔴 Block

#### Scenario: 响应式状态直接修改
- **WHEN** `ref` 值在模板外直接赋值而未使用 `.value`（仅限于非 `<script setup>` 场景）
- **THEN** MUST 标记为 🔴 Block

### Requirement: Vue 组件设计审查
代码审查 Agent MUST 检查 Vue 组件设计规范，包括 Props 类型定义、事件类型安全、组件命名、模板指令使用。

#### Scenario: Props 类型检查
- **WHEN** 组件 Props 使用运行时声明而非类型推断（如 `defineProps(['name'])`）
- **THEN** MUST 标记为 🟡 Request Changes，建议使用 `defineProps<Props>()` 泛型语法

#### Scenario: 组件命名合规
- **WHEN** 组件文件名或组件名使用单次单词（如 `List.vue`、`Profile.vue`）
- **THEN** MUST 标记为 🟡 Request Changes，建议使用多单词命名（如 `UserList.vue`、`UserProfile.vue`）

#### Scenario: v-for 缺少 key
- **WHEN** `v-for` 指令未绑定 `:key`
- **THEN** MUST 标记为 🔴 Block

### Requirement: Ant Design Vue 使用规范审查
代码审查 Agent MUST 检查 Ant Design Vue 组件使用是否符合规范，包括 Table rowKey、Form 校验、组件按需导入。

#### Scenario: Table rowKey 遗漏
- **WHEN** `<a-table>` 未指定 `rowKey` 或使用 index 作为 key
- **THEN** MUST 标记为 🟡 Request Changes

#### Scenario: 表单校验不完整
- **WHEN** `<a-form>` 的必填字段缺少对应的 `:rules` 校验定义
- **THEN** MUST 标记为 🟡 Request Changes

### Requirement: Vue 组合式函数规范审查
代码审查 Agent MUST 检查组合式函数的使用和设计，包括生命周期清理、命名规范和复用性。

#### Scenario: 生命周期清理遗漏
- **WHEN** 组合式函数中注册了全局事件监听、定时器或 WebSocket 连接，但未在 `onUnmounted` 中清理
- **THEN** MUST 标记为 🟡 Request Changes

#### Scenario: 重复逻辑未抽取
- **WHEN** 两个以上组件包含相同的响应式逻辑代码
- **THEN** MUST 标记为 🟢 Suggestion，建议抽取为组合式函数

### Requirement: Vue 审查 Agent 注册
Vue 代码审查 Agent MUST 在 `agents/variants/vue/reef-review-frontend.md` 中定义，遵循 React 变体的独立文件模式。

#### Scenario: Agent 文件存在
- **WHEN** 用户选择 Vue 作为前端框架
- **THEN** `agents/variants/vue/reef-review-frontend.md` MUST 存在且包含 Vue 专用的审查清单
- **AND** Agent 的 model、color、permissionMode 配置 MUST 与 React 变体一致
