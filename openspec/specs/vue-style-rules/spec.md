# Vue 样式规范

## Purpose

reef 前端代码生成套件对 Vue 3 前端框架的编码规范定义。涵盖 Vue 组件编码、响应式 API 使用、状态管理（Pinia）、路由（Vue Router）、UI 组件库（Ant Design Vue）及组合式函数规范。

## Requirements

### Requirement: Vue 组件编码规范
Vue 3 组件 MUST 使用 `<script setup lang="ts">` 语法，禁止使用 Options API。Props 使用 `defineProps<Type>()` 类型推断语法。事件使用 `defineEmits<{ event: [arg: type] }>()` 命名元组语法。

#### Scenario: 组件使用 script setup
- **WHEN** 生成 Vue 组件模板
- **THEN** MUST 使用 `<script setup lang="ts">` 而非 `export default { ... }`
- **AND** 模板中直接使用顶层绑定，无需 `return`

#### Scenario: Props 类型定义
- **WHEN** 组件需要接收 Props
- **THEN** MUST 使用 `defineProps<Props>()` 泛型语法
- **AND** Props 类型定义 MUST 使用 `interface` 而非 `type`
- **AND** 允许使用解构默认值（Vue 3.5+ 响应式解构）

#### Scenario: 事件类型定义
- **WHEN** 组件需要发送自定义事件
- **THEN** MUST 使用 `defineEmits<{ eventName: [argName: argType] }>()` 命名元组语法

### Requirement: Vue 响应式规范
响应式状态 MUST 以 `ref()` 为默认选择，`reactive()` 仅用于无需整体替换的固定结构对象。`computed()` 用于派生状态。`watch()` 用于显式监听并需要新旧值对比的场景，`watchEffect()` 用于自动跟踪依赖的副作用。

#### Scenario: ref 作为默认响应式 API
- **WHEN** 声明响应式状态
- **THEN** MUST 优先使用 `ref<T>(initialValue)`（支持原子值和引用类型）
- **AND** 在 `<script setup>` 模板中自动解包，无需 `.value`

#### Scenario: computed 派生状态
- **WHEN** 需要从现有响应式状态派生新值
- **THEN** MUST 使用 `computed(() => ...)` 只读计算属性
- **AND** 可读写计算属性使用 `computed({ get, set })`

#### Scenario: watch / watchEffect 使用
- **WHEN** 需要监听响应式变化并执行副作用
- **THEN** 需要显式指定监听源且需要对比新旧值时 MUST 使用 `watch(source, callback)`
- **AND** 无需旧值、自动跟踪依赖时 MUST 使用 `watchEffect()`

### Requirement: Pinia 状态管理规范
应用状态管理 MUST 使用 Pinia，优先使用 setup store 语法（Composition API 风格）。

#### Scenario: Pinia store 定义
- **WHEN** 定义 store
- **THEN** MUST 使用 `defineStore('storeName', () => { ... })` 函数式语法
- **AND** MUST 返回 { state, getters, actions } 对象
- **AND** store 文件 MUST 放置在 `src/stores/` 目录

#### Scenario: Pinia store 使用
- **WHEN** 组件中使用 store
- **THEN** MUST 调用 `useStoreName()` 组合式函数获取 store 实例
- **AND** store 状态在模板中直接访问（已具响应性）

### Requirement: Vue Router 路由规范
路由 MUST 使用 `vue-router@4`，使用 `createRouter` + `createWebHistory`，组件使用懒加载（动态 import）。组件内路由操作 MUST 使用 `useRouter` / `useRoute` 组合式函数。

#### Scenario: 路由配置
- **WHEN** 定义路由
- **THEN** MUST 使用 `createRouter({ history: createWebHistory(), routes: [...] })`
- **AND** 路由页面组件 MUST 使用动态 `import()` 实现懒加载
- **AND** 每个路由 SHOULD 有 `name` 字段用于命名路由导航

#### Scenario: 组件内路由
- **WHEN** 组件内需要路由导航或读取路由参数
- **THEN** MUST 使用 `useRouter()` 获取路由实例进行导航
- **AND** MUST 使用 `useRoute()` 获取当前路由信息
- **AND** 路由守卫使用 `onBeforeRouteLeave` / `onBeforeRouteUpdate`

### Requirement: Ant Design Vue 组件规范
UI 组件 MUST 使用 Ant Design Vue（`ant-design-vue` 包），推荐使用 `unplugin-vue-components` 配合 `AntDesignVueResolver` 实现自动按需导入。程序化 API（`message`、`Modal`）需手动导入。

#### Scenario: 自动导入配置
- **WHEN** 配置 Vite 构建
- **THEN** MUST 使用 `unplugin-vue-components` 的 `AntDesignVueResolver` 自动注册组件
- **AND** 模板中组件使用 `a-` 前缀（如 `<a-table>`、`<a-button>`）

#### Scenario: 常用组件规范
- **WHEN** 使用 Table 组件
- **THEN** MUST 指定 `rowKey`（禁止使用 index 作为 key）
- **AND** 空数据时 MUST 设置 `locale.emptyText`

- **WHEN** 使用 Form 组件
- **THEN** MUST 使用 `v-model:value` 绑定表单数据
- **AND** Form.Item 的 `name` MUST 与数据字段匹配
- **AND** 使用 `:rules` 属性定义校验规则

#### Scenario: 程序化 API
- **WHEN** 需要使用 `message`、`Modal`、`notification`
- **THEN** MUST 从 `ant-design-vue` 包手动导入

### Requirement: 组合式函数（Composables）规范
可复用的有状态逻辑 MUST 封装为组合式函数，命名使用 `useXxx` 驼峰格式。组合式函数 MUST 在生命周期钩子中进行清理。

#### Scenario: 组合式函数命名和结构
- **WHEN** 创建组合式函数
- **THEN** 文件名 MUST 为 `useXxx.ts`（如 `useAuth.ts`、`usePagination.ts`）
- **AND** 函数名 MUST 以 `use` 开头（如 `export function useAuth()`）
- **AND** 返回的对象 MUST 包含解构的 ref

#### Scenario: 生命周期清理
- **WHEN** 组合式函数注册了事件监听、定时器或异步操作
- **THEN** MUST 在 `onUnmounted` 中进行清理
