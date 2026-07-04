## ADDED Requirements

### Requirement: Skill 初始化 E2E 测试项目骨架

Sweep Setup skill（`/sweep:init`）SHALL 初始化一个结构化的 E2E 测试项目目录，包含必要的配置文件、目录结构和依赖声明。

#### Scenario: 创建项目目录结构
- **WHEN** 用户执行 `/sweep:init`
- **THEN** skill SHALL 创建以下目录结构：
  - `flows/` — 测试意图文档目录（按模块层级组织）
  - `flows/reports/` — 执行报告持久化目录

#### Scenario: 生成 Playwright 配置文件
- **WHEN** skill 初始化项目
- **THEN** skill SHALL 创建 `playwright.config.ts`，包含 `baseURL` 配置项，读取自环境变量 `BASE_URL`

#### Scenario: 生成依赖声明
- **WHEN** skill 初始化项目
- **THEN** skill SHALL 创建 `package.json`，包含 Playwright 及其依赖声明、`@inquirer/checkbox` 依赖
- **AND** skill SHALL 创建 `tsconfig.json`，包含 TypeScript 基础配置

#### Scenario: 项目已初始化
- **WHEN** 用户执行 `/sweep:init`
- **AND** 当前目录已存在 `.sweep-init` 标记文件
- **THEN** skill SHALL 提示"项目已初始化"并退出，不做重复操作

---

### Requirement: Skill 收集多环境配置信息

Setup skill SHALL 在初始化过程中询问用户被测系统的三个环境地址，并将其写入项目配置文件。

#### Scenario: 交互式输入环境地址
- **WHEN** skill 初始化项目骨架后
- **THEN** skill SHALL 依次询问用户输入：
  - 测试环境（test）baseURL
  - 预发布环境（staging）baseURL
  - 生产环境（prod）baseURL
- **AND** skill SHALL 询问用户设置默认目标环境

#### Scenario: 写入环境配置
- **WHEN** skill 收集完环境信息
- **THEN** skill SHALL 将收集的信息写入 `.env` 文件（加入 `.gitignore`）
- **AND** skill SHALL 创建 `.env.example` 作为模板（提交 Git）

---

### Requirement: Skill 配置 Playwright MCP

Setup skill SHALL 配置 Playwright MCP 服务，使 flow-execution 能通过 MCP 操作浏览器。

#### Scenario: 配置 MCP 服务
- **WHEN** skill 初始化项目
- **THEN** skill SHALL 在 `.claude/settings.json` 中注册 Playwright MCP 服务配置
- **AND** skill SHALL 验证 MCP 配置是否成功

---

### Requirement: Skill 确认初始化完成

Setup skill SHALL 在全部初始化完成后写入 `.sweep-init` 标记文件，并输出初始化报告。

#### Scenario: 创建初始化标记
- **WHEN** 所有初始化步骤完成
- **THEN** skill SHALL 在项目根目录创建 `.sweep-init` 文件
- **AND** skill SHALL 创建 `flows/topology.yaml`，包含基础功能模块拓扑模板（初始为空的模块结构）
- **AND** skill SHALL 输出初始化完成信息，包含项目结构概览和下一步引导

#### Scenario: 验证初始化状态
- **WHEN** flow-create 或 flow-execution 被调用
- **THEN** skill SHALL 检查项目是否存在 `.sweep-init` 标记文件
- **AND** 如不存在 SHALL 提示"当前目录尚未初始化为 Sweep 测试项目。请先运行 /sweep:init 初始化。"并退出
