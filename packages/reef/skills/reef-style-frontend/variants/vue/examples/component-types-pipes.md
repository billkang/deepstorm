# Vue 组件模式示例

Vue 3 中不直接存在 Pipe 的概念，通过 computed 或工具函数实现数据转换。

## 数据转换（替代 Pipe）

```vue
<script setup lang="ts">
// ✅ 方案1: 纯工具函数（无状态转换）
function formatDate(date: string | Date, style: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (style === 'short') {
    return d.toLocaleDateString('zh-CN')
  }
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount)
}

// ✅ 方案2: computed 属性（有状态转换 — 如搜索/过滤）
const props = defineProps<{ users: User[] }>()
const search = ref('')

const filteredUsers = computed(() => {
  if (!search.value.trim()) return props.users
  const q = search.value.toLowerCase()
  return props.users.filter(
    u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
})
</script>

<template>
  <a-table
    :data-source="filteredUsers"
    :columns="[
      { title: '创建时间', dataIndex: 'createdAt', customRender: ({ text }) => formatDate(text) },
      { title: '金额', dataIndex: 'amount', customRender: ({ text }) => formatCurrency(text) },
    ]"
  />
</template>
```

## 插槽模式（Slots）

### 命名插槽 + 默认内容

```vue
<!-- components/Card.vue -->
<template>
  <div class="card">
    <header v-if="$slots.header">
      <slot name="header" />
    </header>
    <main>
      <slot />
    </main>
    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
```

### 作用域插槽

```vue
<!-- components/DataList.vue -->
<script setup lang="ts">
interface Item {
  id: number
  name: string
  email: string
}

defineProps<{ items: Item[] }>()
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot name="item" :item="item">
        <!-- 默认内容：显示名称 -->
        {{ item.name }}
      </slot>
    </li>
  </ul>
</template>
```

```vue
<!-- 使用作用域插槽 -->
<DataList :items="users">
  <template #item="{ item }">
    <strong>{{ item.name }}</strong>
    <span class="text-gray-500">({{ item.email }})</span>
  </template>
</DataList>
```

## 动态组件

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import UserList from '@/views/UserList.vue'
import UserDetail from '@/views/UserDetail.vue'
import Settings from '@/views/Settings.vue'

const currentView = shallowRef(UserList)

function switchView(view: 'list' | 'detail' | 'settings') {
  const views = { list: UserList, detail: UserDetail, settings: Settings }
  currentView.value = views[view]
}
</script>

<template>
  <KeepAlive>
    <component :is="currentView" />
  </KeepAlive>
</template>
```

## KeepAlive 缓存组件

```vue
<template>
  <!-- 缓存已激活的视图，避免切换时重新渲染 -->
  <KeepAlive :include="['UserList', 'Dashboard']" :max="10">
    <RouterView />
  </KeepAlive>
</template>
```

## Transition 动画

```vue
<template>
  <a-button @click="show = !show">
    {{ show ? '隐藏' : '显示' }}
  </a-button>

  <Transition name="fade" mode="out-in">
    <div v-if="show" key="content">
      内容区域
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## 异步组件

```typescript
// components/AsyncWidget.ts
import { defineAsyncComponent } from 'vue'
import { Spin } from 'ant-design-vue'

export default defineAsyncComponent({
  loader: () => import('./HeavyWidget.vue'),
  loadingComponent: Spin,
  delay: 200,
  timeout: 8000,
})

// 路由中的异步组件 — 通过动态 import 实现
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },
]
```

## Provide/Inject 模式

```typescript
// injection-keys.ts
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<{
  theme: Ref<'light' | 'dark'>
  toggleTheme: () => void
}> = Symbol('theme')
```

```vue
<!-- 祖先组件：provide -->
<script setup lang="ts">
import { provide, ref } from 'vue'
import { ThemeKey } from '@/injection-keys'

const theme = ref<'light' | 'dark'>('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide(ThemeKey, { theme, toggleTheme })
</script>

<template>
  <slot />
</template>
```

```vue
<!-- 后代组件：inject -->
<script setup lang="ts">
import { inject } from 'vue'
import { ThemeKey } from '@/injection-keys'

const { theme, toggleTheme } = inject(ThemeKey)!
</script>

<template>
  <div :class="theme">
    当前主题: {{ theme }}
    <a-button @click="toggleTheme">切换主题</a-button>
  </div>
</template>
```

## 权限控制（导航守卫 + 组件封装）

```vue
<!-- components/AuthGuard.vue -->
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

if (!auth.isAuthenticated) {
  router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}
</script>

<template>
  <slot v-if="auth.isAuthenticated" />
</template>
```

```vue
<!-- 使用 -->
<AuthGuard>
  <Dashboard />
</AuthGuard>
```
