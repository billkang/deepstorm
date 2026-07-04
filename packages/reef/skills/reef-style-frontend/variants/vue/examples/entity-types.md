# Vue 实体类型定义示例

## 基础实体层次

```typescript
// shared/types/entity.ts
export interface ImmutableEntity {
  readonly id: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface Entity extends ImmutableEntity {
  version: number
}

export interface Auditable<T> extends Entity {
  createdBy: T
  updatedBy: T
}

export interface ImmutableAuditable<T> extends ImmutableEntity {
  createdBy: T
}
```

## API 响应类型

```typescript
// shared/types/api.ts
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}
```

## 业务实体示例

```typescript
// shared/types/user.ts
export interface User extends Auditable<string> {
  username: string
  email: string
  displayName: string
  avatar?: string
  role: UserRole
  active: boolean
}

export enum UserRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER',
}

export interface CreateUserRequest {
  username: string
  email: string
  displayName: string
  role: UserRole
}

export interface UpdateUserRequest {
  email?: string
  displayName?: string
  role?: UserRole
}
```

## 组件 Props 类型（Vue 方式）

```vue
<!-- components/UserAvatar.vue -->
<script setup lang="ts">
import type { User } from '@/shared/types/user'

interface UserAvatarProps {
  user: Pick<User, 'username' | 'avatar'>
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: 'md',
})

const emit = defineEmits<{
  click: [user: User]
}>()

function handleClick() {
  if (props.onClick) {
    props.onClick()
  }
}
</script>

<template>
  <a-avatar
    :src="user.avatar"
    :alt="user.username"
    :size="size === 'sm' ? 24 : size === 'md' ? 32 : 48"
    :style="{ cursor: onClick ? 'pointer' : 'default' }"
    @click="handleClick"
  />
</template>
```

```vue
<!-- views/UserListPage.vue — 页面组件：默认导出 -->
<script setup lang="ts">
import { useUsers } from '@/composables/useUsers'

const { users, loading } = useUsers()
</script>

<template>
  <UserTable :users="users" :loading="loading" />
</template>
```

## Discriminated Union 类型

```typescript
// 用于多状态组件
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationConfig {
  type: NotificationType
  title: string
  message: string
  duration?: number
}
```
