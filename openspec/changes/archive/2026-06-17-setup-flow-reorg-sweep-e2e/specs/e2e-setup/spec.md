# e2e-setup Specification

## MODIFIED Requirements

### Requirement: Skill 初始化 E2E 测试项目骨架（框架可配置）

Sweep Setup skill（`/sweep:init`）SHALL 根据用户在 setup 问卷中选择的 E2E 框架，初始化对应的 E2E 测试项目结构。

#### Scenario: 创建项目目录结构
- **WHEN** 用户执行 `/sweep:init`
- **THEN** skill SHALL 创建以下目录结构：
  - `flows/` — 测试意图文档目录（按模块层级组织）
  - `flows/reports/` — 执行报告持久化目录

#### Scenario: 生成框架配置文件（Playwright）
- **WHEN** E2E 框架配置为 `playwright`
- **THEN** skill SHALL 创建 `playwright.config.ts`，包含 `baseURL` 配置项，读取自环境变量 `BASE_URL`
- **AND** skill SHALL 创建 `package.json`，包含 `@playwright/test` 及其依赖声明、`@inquirer/checkbox` 依赖

#### Scenario: 框架未知时降级
- **WHEN** E2E 框架配置为未知值或未配置
- **THEN** skill SHALL 输出警告："未知的 E2E 框架：{framework}，请检查 setup 配置"
- **AND** skill SHALL 仅创建目录结构，不生成框架特定配置
- **AND** 后续 skill（sweep-plan、sweep-run）提示框架未配置

#### Scenario: 生成基础依赖声明
- **WHEN** skill 初始化项目
- **THEN** skill SHALL 创建 `tsconfig.json`，包含 TypeScript 基础配置

#### Scenario: 项目已初始化
- **WHEN** 用户执行 `/sweep:init`
- **AND** 当前目录已存在 `.sweep-init` 标记文件
- **THEN** skill SHALL 提示"项目已初始化"并退出，不做重复操作

---

### Requirement: Skill 配置 Playwright MCP（从 CLI 配置读取）

Setup skill SHALL 在初始化过程中检查 `.mcp.json` 中是否存在 Playwright MCP 配置，如不存在则输出提示。

#### Scenario: 检查 MCP 配置（更新）
- **WHEN** skill 初始化项目
- **AND** E2E 框架为 `playwright`
- **THEN** skill SHALL 检查 `.mcp.json` 中是否存在 `deepstorm-playwright` 服务配置
- **AND** 如不存在，SHALL 输出提示："Playwright MCP 未配置，请运行 deepstorm setup 并选择 Playwright MCP 服务"
- **AND** 如存在，SHALL 输出 "Playwright MCP 已就绪"
- **AND** skill SHALL **不再**在 `.claude/settings.json` 中独立配置 Playwright MCP

---

### Requirement: Skill 确认初始化完成（更新）

Setup skill SHALL 在全部初始化完成后写入 `.sweep-init` 标记文件，并输出初始化报告，包含所选框架信息。

#### Scenario: 创建初始化标记（更新）
- **WHEN** 所有初始化步骤完成
- **THEN** skill SHALL 在项目根目录创建 `.sweep-init` 文件
- **AND** skill SHALL 创建 `flows/topology.yaml`，包含基础功能模块拓扑模板（初始为空的模块结构）
- **AND** skill SHALL 输出初始化完成信息，包含项目结构概览和所选 E2E 框架
- **AND** skill SHALL 输出下一步引导，包含对应框架的使用说明

## ADDED Requirements

### Requirement: Sweep wizard.json 提供 E2E 框架选择

Sweep 的 `wizard.json` SHALL 包含 `e2eFramework` 问卷问题，让用户在 setup 流程中选择 E2E 框架。

#### Scenario: 框架选择问题
- **WHEN** 用户在 setup 流程中选择了 Sweep 工具
- **THEN** CLI 在问卷中展示 E2E 框架选择问题
- **AND** 当前唯一选项为 `playwright`（label: "Playwright"）
- **AND** 选项预留扩展点，后续可新增框架选项

#### Scenario: 框架选择持久化
- **WHEN** 用户选择了 Playwright
- **THEN** 配置写入 `deepstorm.sweep.e2eFramework: "playwright"` 到 `.claude/settings.json`
- **AND** SKILL.md 模板中 `{{deepstorm.sweep.e2eFramework}}` 变量为 `"playwright"`
