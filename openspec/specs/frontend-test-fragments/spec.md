# frontend-test-fragments Specification

## Purpose

Defines the requirements for frontend test code-style fragments, covering Vitest (L2) as the primary frontend testing framework.

## ADDED Requirements

### Requirement: 前端测试 fragment 通用结构

前端测试 fragment SHALL 遵循与后端测试 fragment 相同的通用结构规范。

#### Scenario: 目录结构
- **WHEN** 创建前端测试 fragment
- **THEN** 其目录 SHALL 位于 `fragments/test/{option}/` 下
- **THEN** 文件结构 SHALL 包含 `quick-reference.md` 及可选的 `examples/` 目录

#### Scenario: quick-reference.md 结构
- **WHEN** 创建或更新前端测试 fragment 的 quick-reference.md
- **THEN** 文件 SHALL 以标题和简短概述开头
- **THEN** 内容 SHALL 以完整代码示例为主，规则说明为辅

### Requirement: vitest fragment 增强（L2）

现有的 vitest fragment SHALL 被增强，保留已有内容基础上补充新章节。

#### Scenario: L1 语言相关约定
- **WHEN** vitest fragment 加载
- **THEN** 顶部 SHALL 包含 TypeScript/Angular 测试的通用约定：
  - 测试文件命名：`Xxx.test.ts`，放在 `__tests__/` 目录下与被测文件同层级
  - 测试文件后缀使用 `.test.ts` 优先于 `.spec.ts`
  - describe/it 描述使用中文，说明被测功能，不使用英文短语
  - `import { describe, it, expect, vi, beforeEach } from 'vitest'`

#### Scenario: 基础模式
- **WHEN** 编写 vitest quick-reference.md
- **THEN** SHALL 包含 describe/it/expect 的基本结构
- **THEN** SHALL 包含 beforeEach/afterEach 生命周期使用说明
- **THEN** SHALL 包含异步测试的写法（async/await + expect）

#### Scenario: Mock 规范
- **WHEN** 编写 vitest mock 部分
- **THEN** SHALL 展示 `vi.fn()`、`vi.spyOn()`、`vi.mock()` 的用法
- **THEN** SHALL 区分模块级 mock 和函数级 mock 的使用场景
- **THEN** SHALL 展示 `mockResolvedValue` / `mockRejectedValue` / `mockImplementation`

#### Scenario: 组件测试
- **WHEN** 编写组件测试部分
- **THEN** SHALL 展示 `@testing-library/angular` 的 render/screen/fireEvent 用法
- **THEN** SHALL 覆盖组件渲染验证、用户交互验证、事件验证
- **THEN** SHALL 包含 Signal 组件和传统组件的测试方式

#### Scenario: 覆盖率要求
- **WHEN** 编写覆盖率要求
- **THEN** SHALL 保留现有门槛：
  - 语句覆盖率: ≥80%
  - 分支覆盖率: ≥75%
  - 函数覆盖率: ≥85%
  - 行覆盖率: ≥80%

#### Scenario: 示例代码
- **WHEN** 编写 examples/
- **THEN** SHALL 提供以下示例：
  - 纯函数单元测试
  - 组件渲染测试
  - 带依赖注入的 Service 测试
  - 异步操作测试
  - Mock 外部依赖示例
