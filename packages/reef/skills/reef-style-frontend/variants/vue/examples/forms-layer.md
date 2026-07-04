# Vue 表单处理示例（Ant Design Vue）

## 创建用户表单

```vue
<!-- components/CreateUserForm.vue -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { UserRole } from '@/shared/types/user'

interface FormState {
  username: string
  email: string
  displayName: string
  role: UserRole | undefined
}

const emit = defineEmits<{
  success: [userId: string]
}>()

const formState = reactive<FormState>({
  username: '',
  email: '',
  displayName: '',
  role: undefined,
})

const loading = ref(false)
const formRef = ref()

// 校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    })

    if (!res.ok) throw new Error('创建失败')
    const user = await res.json()

    message.success('用户创建成功')
    emit('success', user.id)
    formRef.value?.resetFields()
  } catch (e) {
    if (e instanceof Error) {
      message.error(e.message)
    }
  } finally {
    loading.value = false
  }
}

function handleReset() {
  formRef.value?.resetFields()
}
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    :label-col="{ span: 6 }"
    :wrapper-col="{ span: 16 }"
    @finish="handleSubmit"
  >
    <a-form-item label="用户名" name="username">
      <a-input v-model:value="formState.username" placeholder="请输入用户名" />
    </a-form-item>

    <a-form-item label="邮箱" name="email">
      <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
    </a-form-item>

    <a-form-item label="显示名称" name="displayName">
      <a-input v-model:value="formState.displayName" placeholder="请输入显示名称" />
    </a-form-item>

    <a-form-item label="角色" name="role">
      <a-select v-model:value="formState.role" placeholder="请选择角色">
        <a-select-option value="ADMIN">管理员</a-select-option>
        <a-select-option value="EDITOR">编辑</a-select-option>
        <a-select-option value="VIEWER">查看者</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
      <a-button type="primary" html-type="submit" :loading="loading">
        {{ loading ? '创建中...' : '创建' }}
      </a-button>
      <a-button style="margin-left: 8px" @click="handleReset">
        重置
      </a-button>
    </a-form-item>
  </a-form>
</template>
```

## 编辑用户信息 Modal

```vue
<!-- components/EditUserModal.vue -->
<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { User } from '@/shared/types/user'

interface EditForm {
  email: string
  displayName: string
  active: boolean
}

const props = defineProps<{
  visible: boolean
  user: User | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const formState = reactive<EditForm>({
  email: '',
  displayName: '',
  active: true,
})

const formRef = ref()
const loading = ref(false)

// 监听 user 变化填充表单
watch(() => props.user, (user) => {
  if (user) {
    formState.email = user.email
    formState.displayName = user.displayName
    formState.active = user.active
  }
}, { immediate: true })

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
  ],
}

async function handleOk() {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await fetch(`/api/v1/users/${props.user!.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formState.email,
        displayName: formState.displayName,
      }),
    })

    if (!res.ok) throw new Error('更新失败')
    message.success('更新成功')
    emit('saved')
  } catch (e) {
    if (e instanceof Error) {
      message.error(e.message)
    }
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <a-modal
    :visible="visible"
    title="编辑用户"
    :confirm-loading="loading"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <a-form-item label="邮箱" name="email">
        <a-input v-model:value="formState.email" />
      </a-form-item>

      <a-form-item label="显示名称" name="displayName">
        <a-input v-model:value="formState.displayName" />
      </a-form-item>

      <a-form-item label="状态" name="active">
        <a-switch v-model:checked="formState.active" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
```
