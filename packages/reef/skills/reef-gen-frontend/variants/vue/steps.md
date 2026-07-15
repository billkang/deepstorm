# Vue 3 前端编码步骤

按以下顺序逐块编写，依赖关系由前向后：

1. **类型定义** — 实体接口/类型、Props 类型（`defineProps<Props>()`）、Emits 类型（`defineEmits<{...}>()`）、API 响应类型
2. **组合式函数** — 自定义 Composables 封装数据获取和业务逻辑（loading / error / data 三态），使用 `use` 前缀命名
3. **组件** — `<script setup lang="ts">` + Ant Design Vue 组件 + 组合式 API 状态管理
4. **页面组装** — Vue Router 路由配置（`createRouter` + `createWebHistory`）、懒加载、Layout 页面布局

每完成一块对照 `reef:reef-style-frontend` 中对应章节检查。

## 注释要求

| 文件类型 | 注释要求 |
|---------|---------|
| **类型定义** | 复杂类型加行内注释说明字段含义 |
| **组合式函数** | 简要说明该函数的功能和返回值 |
| **组件** | 关键组件加注释说明用途；复杂逻辑行内注释 |
| **页面** | 无需额外注释 |

## 核心约束

- `<script setup lang="ts">` 语法（禁止 Options API）
- Props 使用 `defineProps<Props>()` 类型推断语法（公共 API），联合类型使用 `type`
- 事件使用 `defineEmits<{ event: [arg: type] }>()` 命名元组语法
- 组合式函数使用 `use` 前缀命名（`useAuth`、`usePagination`）
- 响应式状态优先使用 `ref()`，`reactive()` 仅用于不需要整体替换的固定结构
- 数据获取层与 UI 渲染层分离（组合式函数封装业务逻辑）
- Ant Design Vue 组件通过 `unplugin-vue-components` 自动按需导入（`<a-button>`、`<a-table>`）
- 页面组件使用动态 `import()` 实现懒加载
- 状态管理使用 Pinia（setup store 语法）
- 生命周期钩子中注册的监听器/定时器必须在 `onUnmounted` 中清理

## 构建命令

```bash
# 快速验证
npx vue-tsc --noEmit
npx lint

# 完整检查
npx vue-tsc --noEmit && npx lint && npx vitest run
```
