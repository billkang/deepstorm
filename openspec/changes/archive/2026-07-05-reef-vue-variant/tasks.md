## 1. CLI 配置注册

- [x] 1.1 在 wizard.json 的 `reef.frontend.framework` 选项中新增 Vue 框架入口（value: `"vue"`, label: `"Vue"`），包含 template（buildTool: `npx:*`, formatCmd: `npx`, fileExt: `*.vue / *.ts`, sourcePath: `src/`）和 affectedTemplates
- [x] 1.2 在 wizard.json 的 `reef.frontend.uiLibrary` 选项中新增 `antd-vue` UI 库入口（fragments: `["ui-lib/antd-vue"]`）
- [x] 1.3 在 wizard.json 的 `reef.frontend.test` Vitest 选项的 fragments 中新增 `"test/vitest-vue"`（结果变为 `["test/vitest", "test/vitest-react", "test/vitest-vue"]`）

## 2. Vue 代码生成变体

- [x] 2.1 创建 `skills/reef-gen-frontend/variants/vue/steps.md`，定义 Vue 3 编码步骤（类型定义 → 组合式函数 → Ant Design Vue 组件 → Vue Router 页面组装）和编码约束

## 3. Vue 编码规范变体

- [x] 3.1 创建 `skills/reef-style-frontend/variants/vue/quick-reference.md`，包含 Vue 3 核心规范：`<script setup lang="ts">`、组合式 API、Props/Emits 类型、Pinia、Vue Router、Ant Design Vue、Composables、Tailwind CSS、构建配置
- [x] 3.2 创建 `skills/reef-style-frontend/variants/vue/examples/entity-types.md`，包含 Vue 3 类型定义示例（接口、Props 类型、Emits 类型、泛型组件）
- [x] 3.3 创建 `skills/reef-style-frontend/variants/vue/examples/service-routing.md`，包含 Pinia store 示例和 Vue Router 路由配置示例
- [x] 3.4 创建 `skills/reef-style-frontend/variants/vue/examples/forms-layer.md`，包含 Ant Design Vue 表单示例（Form + 校验 + Select + DatePicker）
- [x] 3.5 创建 `skills/reef-style-frontend/variants/vue/examples/code-wrapping.md`，包含组合式函数（composables）封装示例和 provide/inject 模式
- [x] 3.6 创建 `skills/reef-style-frontend/variants/vue/examples/component-types-pipes.md`，包含 Vue 组件类型示例（插槽作用域、异步组件、KeepAlive、Transition）

## 4. Ant Design Vue 碎片

- [x] 4.1 创建 `fragments/ui-lib/antd-vue/quick-reference.md`，包含 Ant Design Vue 组件规范（auto-import 配置、Table/Form/Modal/Button/Select/DatePicker/message/notification 等）
- [x] 4.2 创建 `fragments/ui-lib/antd-vue/examples/ui-components.md`，包含 Ant Design Vue 实战示例（完整数据表格、表单模态框、响应式布局仪表板）

## 5. Vue 测试碎片

- [x] 5.1 创建 `fragments/test/vitest-vue/quick-reference.md`，包含 Vitest + Vue Test Utils + @testing-library/vue 测试配置和规范（jsdom 环境、mount/shallowMount、render 函数、mock 策略、覆盖率 80%）
- [x] 5.2 创建 `fragments/test/vitest-vue/examples/testing.md`，包含 Vue 组件测试示例（组件渲染、表单测试、组合式函数测试、Ant Design Vue 集成测试、路由组件测试）

## 6. Vue 审查 Agent

- [x] 6.1 创建 `agents/variants/vue/reef-review-frontend.md`，包含 Vue 3 代码审查清单（🔴 Block：响应式违规、组件设计违规；🟡 Request Changes：Props 类型、Ant Design 使用、生命周期清理；🟢 Approve：组合式函数抽取、模板优化）

## 7. 构建验证

- [x] 7.1 运行 `pnpm build` 确认构建通过，检查 registry 包含所有新增的 fragments
- [x] 7.2 验证 `pnpm build` 后 `dist/` 中 Vue 变体相关文件存在且路径正确
- [x] 7.3 确认 Angular 和 React 变体未受本次修改影响（回归验证）
