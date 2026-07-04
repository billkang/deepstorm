# Vue 数据获取层 + 路由配置示例

## 组合式函数（数据获取层）

```typescript
// composables/useUsers.ts
import { ref, computed, watch } from 'vue'
import type { User, PageResponse } from '@/shared/types/user'

interface UseUsersOptions {
  page?: number
  size?: number
  search?: string
  role?: string
}

// 使用 URLSearchParams 构建查询参数
function buildQuery(params: UseUsersOptions): string {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.size !== undefined) searchParams.set('size', String(params.size))
  if (params.search) searchParams.set('search', params.search)
  if (params.role) searchParams.set('role', params.role)
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export function useUsers(options: UseUsersOptions = {}) {
  const users = ref<User[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const refreshKey = ref(0)

  async function fetchUsers() {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(`/api/v1/users${buildQuery(options)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: PageResponse<User> = await res.json()
      users.value = data.content
      total.value = data.totalElements
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  watch([() => options.page, () => options.size, () => options.search, () => options.role, refreshKey], () => {
    fetchUsers()
  }, { immediate: true })

  function refresh() {
    refreshKey.value++
  }

  return { users, total, loading, error, refresh }
}

// 写操作组合式函数
export function useCreateUser() {
  const loading = ref(false)

  async function create(data: CreateUserRequest): Promise<User> {
    loading.value = true
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } finally {
      loading.value = false
    }
  }

  return { create, loading }
}
```

## Pinia Store 示例

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/shared/types/user'

export const useAuthStore = defineStore('auth', () => {
  // state
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)

  // getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // actions
  async function login(username: string, password: string) {
    loading.value = true
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      token.value = data.token
      user.value = data.user
      localStorage.setItem('auth_token', data.token)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  return { user, token, loading, isAuthenticated, isAdmin, login, logout }
})
```

## 路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UserList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users/new',
      name: 'create-user',
      component: () => import('@/views/CreateUser.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users/:id',
      name: 'user-detail',
      component: () => import('@/views/UserDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

// 导航守卫
router.beforeEach((to, from) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
```

## 主应用入口

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')
</script>

<template>
  <ConfigProvider
    :locale="zhCN"
    :theme="{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }"
  >
    <RouterView />
  </ConfigProvider>
</template>
```

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```
