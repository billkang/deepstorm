# Ant Design Vue 4.x 组件使用规范

## 通用原则

- Ant Design Vue 4.x 兼容 Vue 3，组件需通过 `unplugin-vue-components` 配合 `AntDesignVueResolver` 实现自动按需导入
- 模板中使用 `a-` 前缀组件：`<a-button>`、`<a-table>`、`<a-form>`
- 程序化 API（`message`、`Modal`、`notification`）需从 `ant-design-vue` 包手动导入
- 主题定制通过 `<a-config-provider>` 的 `:theme` 属性配置
- 本地化通过 `<a-config-provider>` 的 `:locale` 属性设置，导入 `ant-design-vue/es/locale/zh_CN`

### Vite 自动导入配置

```typescript
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    Components({
      resolvers: [AntDesignVueResolver()],
    }),
  ],
}
```

## 常用组件规范

### Button（按钮）
- 主要操作使用 `type="primary"`，次要操作默认
- 危险操作使用 `danger` 属性
- 异步操作必须设置 `:loading` 状态防重复提交
- 纯图标按钮必须有 `aria-label` 提供无障碍说明

```vue
<a-button type="primary" :loading="submitting" @click="handleSubmit">
  提交
</a-button>
<a-button danger @click="handleDelete">删除</a-button>
<a-button aria-label="搜索">
  <template #icon><SearchOutlined /></template>
</a-button>
```

### Table（表格）
- 始终指定 `row-key` 为唯一标识字段（如 `id`）
- 列表格使用 `:pagination` 属性控制分页
- 空数据使用 `:locale` 自定义空状态提示：`{ emptyText: '暂无数据' }`
- 后端分页使用 `@change` 事件 + `:pagination.current/pageSize` 受控

```vue
<a-table
  :data-source="users"
  :columns="columns"
  row-key="id"
  :loading="loading"
  :pagination="{
    current: page,
    pageSize: 20,
    total,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }"
  @change="(pagination: any) => {
    page = pagination.current
    pageSize = pagination.pageSize
  }"
  :locale="{ emptyText: '暂无数据' }"
/>
```

### Form（表单）
- 使用 `layout="vertical"` 默认垂直布局
- 所有校验规则集中在 `:rules` 中定义，避免使用自定义 validator（除非复杂业务）
- `<a-form-item>` 的 `name` 必须与提交数据结构的字段名一致
- 编辑表单用 `ref.value?.setFieldsValue()` 填充初始值
- 表单数据通过 `v-model:value` 双向绑定
- 获取表单引用：`const formRef = ref()`

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'

const formState = reactive({
  email: '',
  name: '',
})
const formRef = ref()

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    // 提交逻辑
  } catch (e) {
    // 校验失败
  }
}
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    @finish="handleSubmit"
  >
    <a-form-item name="email" label="邮箱">
      <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
    </a-form-item>
  </a-form>
</template>
```

### Modal（弹窗）
- 表单弹窗用 `destroy-on-close` 确保关闭后重置状态
- `@cancel` 用于关闭回调
- 确认弹窗用 `Modal.confirm()` 快捷方法

```vue
<a-modal
  title="编辑用户"
  :visible="isOpen"
  @ok="handleSave"
  @cancel="handleCancel"
  :confirm-loading="saving"
  destroy-on-close
>
  <UserForm :user="editingUser" />
</a-modal>

<!-- 程序化确认弹窗 -->
<script setup lang="ts">
import { Modal } from 'ant-design-vue'

Modal.confirm({
  title: '确认删除',
  content: '确定要删除该用户吗？此操作不可恢复。',
  okText: '确认删除',
  okType: 'danger',
  onOk: () => deleteUser(id),
})
</script>
```

### Select（选择器）
- 选项少时直接写 `<a-select-option>`；选项多时使用 `:options` 数组属性
- 远程搜索使用 `show-search` + `@search` + `:filter-option` 自定义
- 多选用 `mode="multiple"`
- 使用 `v-model:value` 双向绑定

```vue
<a-select v-model:value="formState.role" placeholder="请选择角色">
  <a-select-option value="ADMIN">管理员</a-select-option>
  <a-select-option value="EDITOR">编辑</a-select-option>
</a-select>

<!-- 远程搜索 -->
<a-select
  v-model:value="selectedUser"
  show-search
  :filter-option="false"
  @search="handleSearch"
>
  <a-select-option v-for="u in users" :key="u.id" :value="u.id">
    {{ u.username }}
  </a-select-option>
</a-select>
```

### DatePicker（日期选择器）
- 使用 `format` 指定显示格式
- 表单中配合 `<a-form-item>` 使用，值类型为 `dayjs` 对象
- 使用 `v-model:value` 双向绑定
- 范围选择用 `<a-range-picker>`

```vue
<a-date-picker v-model:value="date" format="YYYY-MM-DD" />
<a-range-picker v-model:value="dateRange" format="YYYY-MM-DD" />
```

### Space（间距）
- 组件间间距优先使用 `<a-space>` 包裹，避免手动 `margin`
- 默认间距为 `size="small"`（8px），可根据上下文调整

### message / notification（消息提示）
- 需从 `ant-design-vue` 包手动导入
- 操作反馈使用 `message.success()` / `message.error()` 轻量提示
- 重要通知使用 `notification.open()` / `notification.info()`

```vue
<script setup lang="ts">
import { message } from 'ant-design-vue'

function handleSuccess() {
  message.success('操作成功')
}

function handleError() {
  message.error('操作失败')
}
</script>
```

### Spin（加载中）
- 页面级加载使用 `<a-spin>` 包裹内容区域
- 组件级加载使用 Spin 组件的 `:spinning` 属性

```vue
<a-spin :spinning="loading">
  <div>内容区域</div>
</a-spin>
```

## 主题定制

```vue
<template>
  <a-config-provider
    :locale="zhCN"
    :theme="{
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
      },
      components: {
        Table: {
          headerBg: '#fafafa',
          rowHoverBg: '#f5f5f5',
        },
      },
    }"
  >
    <RouterView />
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')
</script>
```

## Ant Design Vue + Tailwind CSS 共存

- Ant Design Vue 负责组件内部样式，Tailwind 负责页面/组件外部的布局和间距
- 避免在 Ant Design Vue 组件上直接用 Tailwind 覆盖内联样式
- 布局使用 Tailwind 的 `flex`/`grid` 类 + `<a-row>` / `<a-col>` 搭配
- 使用 Tailwind 的 `dark:` 变体时，需同时配置 `a-config-provider` 的暗色主题

## 性能注意

- 大列表（>500 行）考虑分页或虚拟滚动
- 避免频繁调用 `message` / `notification`
