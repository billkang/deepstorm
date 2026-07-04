# Ant Design Vue 实战示例

## 完整数据表格（搜索 + 分页 + 操作列）

```vue
<!-- components/UserTable.vue -->
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { User } from '@/shared/types/user'

interface Filters {
  search: string
  role: string | undefined
}

const props = defineProps<{
  users: User[]
  total: number
  loading: boolean
}>()

const emit = defineEmits<{
  search: [filters: Filters]
  pageChange: [page: number, pageSize: number]
  edit: [user: User]
  delete: [userId: string]
}>()

const filters = reactive<Filters>({
  search: '',
  role: undefined,
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
})

// 列定义
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  {
    title: '操作',
    key: 'action',
    customRender: ({ record }: { record: User }) => (
      <span>
        <a onClick={() => emit('edit', record)}>编辑</a>
        <a-divider type="vertical" />
        <a-popconfirm title="确定删除？" onConfirm={() => emit('delete', record.id)}>
          <a>删除</a>
        </a-popconfirm>
      </span>
    ),
  },
]

// 搜索
let searchTimer: ReturnType<typeof setTimeout>
function handleSearch(value: string) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.search = value
    pagination.current = 1
    emit('search', { ...filters })
  }, 300)
}

// 分页变化
function handleTableChange(pag: { current: number; pageSize: number }) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  emit('pageChange', pag.current, pag.pageSize)
}

// 批量删除
const selectedRowKeys = ref<string[]>([])

function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的用户')
    return
  }
  Modal.confirm({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 名用户吗？`,
    onOk: async () => {
      // 批量删除逻辑
      message.success(`已删除 ${selectedRowKeys.value.length} 名用户`)
      selectedRowKeys.value = []
    },
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- 搜索栏 -->
    <div class="flex justify-between items-center">
      <a-input-search
        placeholder="搜索用户名/邮箱"
        style="width: 300px"
        @search="handleSearch"
      />
      <div class="flex gap-2">
        <a-button
          danger
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </a-button>
        <a-button type="primary">新增用户</a-button>
      </div>
    </div>

    <!-- 表格 -->
    <a-table
      :data-source="users"
      :columns="columns"
      :loading="loading"
      :pagination="{
        ...pagination,
        total,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 条`,
      }"
      :row-selection="{
        selectedRowKeys,
        onChange: (keys: string[]) => { selectedRowKeys = keys },
      }"
      row-key="id"
      :locale="{ emptyText: '暂无用户数据' }"
      @change="handleTableChange"
    />
  </div>
</template>
```

## 表单模态框（创建/编辑）

```vue
<!-- components/UserFormModal.vue -->
<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { User } from '@/shared/types/user'

interface FormData {
  username: string
  email: string
  displayName: string
  role: string
  active: boolean
}

const props = defineProps<{
  visible: boolean
  user: User | null  // null 表示创建模式
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const formRef = ref()
const loading = ref(false)
const isEdit = ref(false)

const formData = reactive<FormData>({
  username: '',
  email: '',
  displayName: '',
  role: 'EDITOR',
  active: true,
})

// 编辑模式填充数据
watch(() => props.user, (user) => {
  isEdit.value = !!user
  if (user) {
    formData.username = user.username
    formData.email = user.email
    formData.displayName = user.displayName
    formData.role = user.role
    formData.active = user.active
  } else {
    formData.username = ''
    formData.email = ''
    formData.displayName = ''
    formData.role = 'EDITOR'
    formData.active = true
  }
}, { immediate: true })

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输理有效的邮箱地址', trigger: 'blur' },
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
}

async function handleOk() {
  try {
    await formRef.value?.validate()
    loading.value = true

    const url = isEdit.value ? `/api/v1/users/${props.user!.id}` : '/api/v1/users'
    const method = isEdit.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (!res.ok) throw new Error(isEdit.value ? '更新失败' : '创建失败')

    message.success(isEdit.value ? '更新成功' : '创建成功')
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
    :title="isEdit ? '编辑用户' : '新建用户'"
    :confirm-loading="loading"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <a-form-item label="用户名" name="username">
        <a-input
          v-model:value="formData.username"
          :disabled="isEdit"
          placeholder="请输入用户名"
        />
      </a-form-item>

      <a-form-item label="邮箱" name="email">
        <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
      </a-form-item>

      <a-form-item label="显示名称" name="displayName">
        <a-input v-model:value="formData.displayName" placeholder="请输入显示名称" />
      </a-form-item>

      <a-form-item label="角色" name="role">
        <a-select v-model:value="formData.role">
          <a-select-option value="ADMIN">管理员</a-select-option>
          <a-select-option value="EDITOR">编辑</a-select-option>
          <a-select-option value="VIEWER">查看者</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="状态" name="active">
        <a-switch v-model:checked="formData.active" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
```

## 响应式布局仪表板

```vue
<!-- views/Dashboard.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = ref([
  { title: '用户总数', value: 1284, icon: 'users' },
  { title: '今日活跃', value: 356, icon: 'activity' },
  { title: '待处理工单', value: 23, icon: 'clock' },
  { title: '系统消息', value: 7, icon: 'message' },
])
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :lg="6" v-for="stat in stats" :key="stat.title">
        <a-card hoverable>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">{{ stat.title }}</p>
              <p class="text-2xl font-bold mt-1">{{ stat.value }}</p>
            </div>
            <div class="text-3xl text-blue-500">
              <!-- 根据 stat.icon 渲染对应图标 -->
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="16">
        <a-card title="访问趋势">
          <div style="height: 300px">
            <!-- 图表组件 -->
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="最近操作">
          <a-timeline>
            <a-timeline-item color="green">新建用户 alice</a-timeline-item>
            <a-timeline-item color="blue">更新配置</a-timeline-item>
            <a-timeline-item color="red">删除过期数据</a-timeline-item>
            <a-timeline-item>系统备份完成</a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>
```
