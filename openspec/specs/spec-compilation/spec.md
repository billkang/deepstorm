# spec-compilation Specification

## Purpose
TBD - created by archiving change sweep-run-hybrid-execution. Update Purpose after archive.
## Requirements
### Requirement: 编译器 SHALL 从解析结果生成可执行的 Playwright .spec.ts

Spec Compiler SHALL 接收 flow-parser 的结构化输出，生成标准的 Playwright `.spec.ts` 测试文件，保持语义等价。

#### Scenario: 生成基本 spec 结构
- **WHEN** 编译器接收 flow-parser 输出的解析结果
- **THEN** 编译器 SHALL 生成包含 `import { test, expect } from '@playwright/test'` 的文件
- **AND** 每个 Flow 对应一个 Playwright `test(...)` 块
- **AND** 测试名称格式为 `{flow.id} - {flow.title}`

#### Scenario: 按步骤生成操作和验证
- **WHEN** 编译器处理 flow 中的执行步骤
- **THEN** 编译器 SHALL 为每个步骤生成对应的 Playwright 操作代码
- **AND** 为每个验证点生成对应的 `expect(...)` 断言
- **AND** `describe(...)` 块包装同文件的所有 Flow

#### Scenario: 步骤操作到 Playwright API 的映射
- **WHEN** 编译器遇到导航步骤
- **THEN** 生成 `page.goto(url)` 
- **WHEN** 编译器遇到点击操作
- **THEN** 生成 `page.click(selector)`
- **WHEN** 编译器遇到输入操作
- **THEN** 生成 `page.fill(selector, value)`
- **WHEN** 编译器遇到选择操作
- **THEN** 生成 `page.selectOption(selector, value)`
- **WHEN** 编译器遇到等待操作
- **THEN** 生成 `page.waitForSelector(selector)` 或 `page.waitForTimeout(ms)`

#### Scenario: 带 AI_REQUIRED 标记的步骤跳过原生执行
- **WHEN** .flow.md 中的某个步骤标记为 `<!-- AI_REQUIRED -->`
- **THEN** 编译器 SHALL 在该步骤前生成 `// AI_REQUIRED` 注释
- **AND** 该 `test` 块 SHALL 在原生执行阶段被跳过（不执行、不失败），交由 AI 驱动模式处理

#### Scenario: 验证点的 Playwright 断言映射
- **WHEN** 验证点检查页面标题
- **THEN** 生成 `await expect(page).toHaveTitle(expectedTitle)`
- **WHEN** 验证点检查 URL
- **THEN** 生成 `await expect(page).toHaveURL(expectedUrl)`
- **WHEN** 验证点检查元素可见
- **THEN** 生成 `await expect(page.locator(selector)).toBeVisible()`
- **WHEN** 验证点检查文本内容
- **THEN** 生成 `await expect(page.locator(selector)).toHaveText(expectedText)`

---

### Requirement: 编译器输出位置与命名约定

编译器 SHALL 将生成的 `.spec.ts` 文件写入与源 `.flow.md` 同目录，文件名按规则派生。

#### Scenario: 输出文件名
- **WHEN** 编译器处理 `flows/user-system/login/login.flow.md`
- **THEN** 输出 SHALL 写入 `flows/user-system/login/login.flow.spec.ts`
- **AND** 保持 `.gitignore` 中包含 `*.flow.spec.ts`（视为生成产物）

#### Scenario: 跳过编译条件
- **WHEN** 目标 `.flow.spec.ts` 已存在且最近修改时间晚于对应的 `.flow.md`
- **THEN** 编译器 SHALL 跳过生成（视为最新）
- **AND** 在日志中标记为 `SKIP (up-to-date)`

---

### Requirement: 编译器在 plan 阶段首次生成 spec.ts

编译器 SHALL 在 `/sweep-plan` 阶段首次生成 `.spec.ts`，在 `/sweep-run` 阶段按需更新。

#### Scenario: plan 时首次生成
- **WHEN** `/sweep-plan` 完成 `.flow.md` 的编写并写入文件
- **THEN** plan skill SHALL 调用编译器，从刚写入的 `.flow.md` 解析并编译生成 `.flow.spec.ts`
- **AND** 生成的 spec.ts 与 .flow.md 保持在同一目录
- **AND** 用户不感知生成过程（后台自动完成）

#### Scenario: run 时检查 freshness
- **WHEN** `/sweep-run` 开始执行一个 Flow
- **THEN** run skill SHALL 检查 `.flow.spec.ts` 的修改时间是否晚于对应的 `.flow.md`
- **AND** 如果最新，SHALL 直接执行（跳过解析 + 编译）
- **AND** 如果过时或不存在，SHALL 重新解析并编译后执行

#### Scenario: 自愈时更新 spec.ts
- **WHEN** 自愈引擎确认页面元素变更并需要更新定位器
- **THEN** 自愈引擎 SHALL 直接修改 `.flow.spec.ts` 中的对应定位器
- **AND** 不经过解析器 + 编译器全流程（避免改变未修改部分）
- **AND** 在 spec.ts 中添加 `// auto-repaired` 注释记录

---

### Requirement: 编译器支持宽松模式和严格模式

编译器 SHALL 提供两种编译模式，以应对不同的解析完整度。

#### Scenario: 严格模式
- **WHEN** 编译器运行在严格模式（默认）
- **THEN** 如果解析结果中缺少必要字段（如 steps 为空），SHALL 拒绝生成并报错

#### Scenario: 宽松模式
- **WHEN** 编译器运行在宽松模式
- **THEN** 对缺少操作描述的步骤，SHALL 使用占位符注释 `// TODO: missing operation detail`
- **AND** 对无法映射到 Playwright API 的操作，SHALL 用 `// UNSUPPORTED: {raw text}` 注释保留原始描述

