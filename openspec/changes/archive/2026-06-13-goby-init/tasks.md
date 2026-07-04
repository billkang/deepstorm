## 1. 基础结构

- [x] 1.1 创建 `skills/` 目录（setup/、flow-create/、flow-run/）
- [x] 1.3 更新 README.md，补充 Sweep 完整使用说明

## 2. Setup Skill 实现

- [x] 2.1 编写 `skills/setup/SKILL.md`：项目目录创建逻辑（flows/ 按模块层级 + flows/reports/）
- [x] 2.2 编写 setup 的配置生成逻辑：playwright.config.ts、package.json（含 @inquirer/checkbox）、tsconfig.json
- [x] 2.3 编写 setup 的多环境交互式输入 + .env 写入逻辑
- [x] 2.4 编写 setup 的 Playwright MCP 配置逻辑
- [x] 2.5 编写 setup 的初始化标记（.sweep-init）和重复初始化防护逻辑
- [x] 2.6 编写 setup 的 topology.yaml 初始模板创建逻辑

## 3. Flow-Creation Skill 实现

- [x] 3.1 编写 `skills/flow-create/SKILL.md`：Jira MCP 读取 Issue + 钉钉 MCP 读取 PRD 逻辑
- [x] 3.2 编写 flow-create 的 topology.yaml 读取与放置位置推荐逻辑（AI 推荐 + 用户确认/选择）
- [x] 3.3 编写 flow-create 的结构化场景挖掘对话流程（正常流程 → 边界条件 → 异常场景）
- [x] 3.4 编写 flow-create 的 grill-me 遗漏场景挑战环节
- [x] 3.5 编写 flow-create 的 .flow.md 生成与写入逻辑（含文件名按模块/任务命名）
- [x] 3.6 编写 flow-create 的初始化状态检查逻辑

## 4. Flow-Execution Skill 实现

- [x] 4.1 编写 `scripts/flow-selector.mjs`：基于 @inquirer/checkbox 的层级选择工具
- [x] 4.2 编写 `skills/flow-run/SKILL.md`：topology.yaml 解析与调用 flow-selector 的交互式层级选择逻辑（空格勾选 + 回车确认，逐级深入）
- [x] 4.3 编写 flow-run 的直接参数指定逻辑（--all / --path / 文件路径 / --flow）
- [x] 4.4 编写 flow-run 的 .flow.md 解析逻辑
- [x] 4.5 编写 flow-run 的 Playwright MCP 逐步骤执行与验证逻辑
- [x] 4.6 编写 flow-run 的多环境切换（--env 参数 + .env 读取）逻辑
- [x] 4.7 编写 flow-run 的终端实时输出 + 报告持久化逻辑
- [x] 4.8 编写 flow-run 的初始化状态检查逻辑

## 5. 验证

- [x] 5.1 验证 setup skill：新目录中运行 /sweep:init，确认项目结构 + topology.yaml 已生成
- [x] 5.2 验证重复初始化防护：已初始化目录中运行 /sweep:init，确认提示"项目已初始化"
- [x] 5.3 验证未初始化拦截：未初始化目录中运行 /sweep:plan，确认提示引导执行 setup
- [x] 5.4 验证未初始化拦截：未初始化目录中运行 /sweep:run，确认提示引导执行 setup
- [x] 5.5 验证拓扑放置：flow-create 时确认 topology.yaml 读取和位置推荐功能
- [x] 5.6 验证交互选择：flow-run 无参数时确认模块层级展示和逐级选择功能
