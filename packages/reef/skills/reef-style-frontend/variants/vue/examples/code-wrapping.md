# Vue 模板/脚本代码折行规则

遵循 90 列限制，以下是 Vue 专有的折行场景。

## 模板属性换行

单个属性保持在行内；3 个及以上属性每个占一行：

```vue
<template>
  <!-- ✅ 单属性行内 -->
  <a-button type="primary">提交</a-button>

  <!-- ✅ 2 个属性行内 -->
  <a-button type="primary" :loading="submitting">提交</a-button>

  <!-- ✅ 3+ 属性换行排列 -->
  <a-table
    :data-source="users"
    :columns="columns"
    row-key="id"
    :loading="loading"
    :pagination="{ pageSize: 20 }"
    @change="handlePageChange"
  />
</template>
```

## 指令换行

```vue
<template>
  <!-- ✅ 短指令行内 -->
  <div v-if="loading">加载中...</div>

  <!-- ✅ 多指令或长表达式适当换行 -->
  <a-form-item
    v-if="!isReadonly"
    label="邮箱"
    name="email"
    :rules="[
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '无效的邮箱格式', trigger: 'blur' },
    ]"
  >
    <a-input v-model:value="formState.email" />
  </a-form-item>
</template>
```

## 自闭合标签

无子元素时使用自闭合标签，属性换行规则同上：

```vue
<template>
  <!-- ✅ 无属性 -->
  <a-divider />

  <!-- ✅ 多属性 -->
  <a-date-picker
    v-model:value="date"
    format="YYYY-MM-DD"
  />
</template>
```

## 条件渲染换行

```vue
<template>
  <!-- ✅ 简单的 v-if/v-else 保持紧凑 -->
  <div>{{ loading ? '加载中...' : users.length + ' 条记录' }}</div>

  <!-- ✅ 复杂条件使用多个 v-if 换行 -->
  <a-alert
    v-if="error"
    type="error"
    :message="error.message"
    closable
    @close="clearError"
  />
  <a-table v-else-if="!loading" :data-source="users" />
</template>
```

## Script setup 声明

```vue
<script setup lang="ts">
// ✅ ref/computed 连续排列，按逻辑分组
const users = ref<User[]>([])
const loading = ref(true)
const search = ref('')

const filteredUsers = computed(() =>
  users.value.filter(u => u.username.includes(search.value))
)

// ✅ watch 短依赖行内
watch(search, () => {
  fetchUsers(search.value)
})

// ✅ 多源 watch 换行
watch(
  [search, role, status],
  ([newSearch, newRole, newStatus]) => {
    fetchFilteredUsers({ search: newSearch, role: newRole, status: newStatus })
  }
)
</script>
```

## 事件处理函数换行

```vue
<template>
  <!-- ✅ 短表达式行内 -->
  <a-button @click="isOpen = true">打开</a-button>

  <!-- ✅ 多行函数体：提取到 script setup 中 -->
  <a-modal
    title="确认删除"
    :open="isOpen"
    @ok="handleDelete"
    @cancel="isOpen = false"
  >
    <p>确定要删除该用户吗？</p>
  </a-modal>
</template>

<script setup lang="ts">
async function handleDelete() {
  await deleteUser(id)
  message.success('删除成功')
  isOpen.value = false
  onDeleted?.()
}
</script>
```

## Props / Emits 类型定义换行

```typescript
// ✅ 每个属性一行
interface UserFormProps {
  user?: User
  onSubmit: (values: CreateUserRequest) => Promise<void>
  onCancel: () => void
}

// ✅ emits 命名元组每个事件一行
const emit = defineEmits<{
  success: [userId: string]
  close: []
  error: [message: string]
}>()

// ✅ 联合类型换行
type UserStatus = 'active' | 'inactive' | 'locked' | 'pending'
```
