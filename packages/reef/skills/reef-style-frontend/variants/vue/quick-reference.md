# 前端编码快速参考 (Vue 3)

按需加载。仅当你需要编写对应组件类型时阅读相关章节。

> **完整示例代码见 `examples/` 目录。** 已安装子维度的规范，通过该维度的 `{value}.md` 文件阅读。

## 速查

| 场景 | 决策 |
| --- | --- |
| 新建组件 | `<script setup lang="ts">` + `defineProps<Props>()` + 组合式 API |
| 新建表单 | Ant Design Vue `<a-form>` + `v-model` + `:rules` 校验 |
| 读数据 | 组合式函数（`useUsers`）封装 fetch/axios |
| 写数据 | 组合式函数 + `ref()` loading/error/data 三态 |
| 组合式函数职责 | 只负责业务逻辑和数据获取，不管理 UI 渲染 |
| 路由 | 动态 `import()` + `createRouter` 懒加载 |

## 新建组件

```vue
<script setup lang="ts">
interface UserTableProps {
  users: User[]
  loading?: boolean
  onSelect?: (user: User) => void
}

const props = defineProps<UserTableProps>()
const emit = defineEmits<{
  select: [user: User]
}>()

function handleClick(user: User) {
  emit('select', user)
}
</script>

<template>
  <a-table
    :data-source="props.users"
    :loading="props.loading"
    row-key="id"
    @click="handleClick"
  />
</template>
```

| 规则 | 要求 |
| --- | --- |
| `<script setup lang="ts">` | 禁止 Options API，使用组合式 API |
| `defineProps<Type>()` | 使用泛型语法定义 Props，`type` 定义联合类型 |
| 状态提升 | 组件间共享状态提升到最近公共父组件，或使用 Pinia |
| 默认导出 | 页面级组件使用 `export default`（路由组件），通用组件使用具名导出 |

## 组合式 API 规则

- **顶层调用**：`ref()`、`computed()`、`watch()` 等组合式 API 在 `<script setup>` 顶层调用，禁止在条件/循环中
- **ref 默认首选**：优先使用 `ref()`，`reactive()` 仅用于不需要整体替换的固定结构对象
- **生命周期**：注册的监听器和定时器必须在 `onUnmounted` 中清理
- **组合式函数**：以 `use` 开头命名，返回值为对象

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const users = ref<User[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/users')
    users.value = await res.json()
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
})
</script>
```

## Ant Design Vue 组件

- **自动按需导入**：通过 `unplugin-vue-components` 配合 `AntDesignVueResolver` 实现，模板中使用 `a-` 前缀（`<a-button>`、`<a-table>`）
- **Form**：`<a-form-item>` 的 `name` 必须与数据模型字段一致，使用 `:rules` 定义校验
- **Table**：必须指定 `row-key`，空数据时设置 `locale.emptyText`
- **Modal**：关闭时使用 `destroyOnClose` 或 `@afterClose` 重置内部状态
- **布局**：使用 `<a-row>` / `<a-col>` 栅格系统或 Flex 布局
- **程序化 API**：`message.success()`、`Modal.confirm()` 等从 `ant-design-vue` 手动导入

## 错误处理

- 错误边界使用 `onErrorCaptured` 生命周期钩子捕获子组件异常
- API 错误在组合式函数层捕获并暴露错误状态，UI 层通过 Ant Design Vue 组件展示反馈
- 表单校验使用 Ant Design Vue Form 内置校验规则，非必要不自定义 validator
- Error Boundary 组件使用 `<script setup>` + `onErrorCaptured` 实现

## 路由

- 所有页面组件使用动态 `import()` 实现懒加载
- 路由配置集中定义在路由文件中，不在组件内嵌路由
- 权限通过导航守卫（`beforeEach`）控制
- 组件内路由操作使用 `useRouter()` / `useRoute()` 组合式函数

```vue
<script setup lang="ts">
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UserList.vue'),
    },
    {
      path: '/users/:id',
      name: 'user-detail',
      component: () => import('@/views/UserDetail.vue'),
    },
  ],
})
</script>
```

## 代码风格

- 控制流语句必须使用大括号，禁止无大括号的早期返回
- 代码折行规则（90 列限制）详见 `examples/code-wrapping.md`
- 模板属性超过 3 个时换行排列
- 自闭合标签：无子元素时使用 `<Component />` 而非 `<Component></Component>`
- 模板表达式保持简洁，复杂逻辑提取到 `<script setup>` 中

## 注释规则

| 文件类型 | 注释要求 |
|---------|---------|
| **类型定义** | 复杂类型加行内注释说明字段含义 |
| **组合式函数** | 简要说明该函数的功能和返回值 |
| **组件** | 关键组件加注释说明用途；复杂逻辑行内注释 |

## 常见坑

| 场景 | 问题 | 正确做法 |
|------|------|---------|
| `reactive` 整体赋值 | 直接 `state = newVal` 破坏响应式 | 使用 `Object.assign()` 或改用 `ref()` |
| `v-for` 缺少 `:key` | 列表渲染异常/性能下降 | 绑定唯一 `:key="item.id"` |
| 响应式解构丢失 | `const { name } = reactive(obj)` 解构后 `name` 失去响应性 | 使用 `toRefs()` 或保持 `obj.name` 访问 |
| 生命周期清理遗漏 | 事件监听/定时器在组件卸载后仍然运行 | `onUnmounted` 中清理 |
| `watch` 旧值误用 | 以为 `watch` 第一个回调参数是新值 | 签名是 `watch(source, (newVal, oldVal) => ...)` |
| Ant Design Vue 手动导入遗漏 | `message` / `Modal` 等程序化 API 未导入 | 从 `ant-design-vue` 包手动导入 |
