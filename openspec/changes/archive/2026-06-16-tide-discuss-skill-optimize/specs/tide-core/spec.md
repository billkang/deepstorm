# Tide — 产品侧需求讨论与 PRD 工作流（Delta）

## MODIFIED Requirements

### Requirement: 数据存储层自动初始化

Tide SHALL 在启动时自动创建 `tide-data/{sessions,archive,prds,abandoned}` 四个子目录（相对于 `$PWD`）。会话索引文件 `tide-data/sessions/.index.json` SHALL 在首次创建会话时自动生成。

#### Scenario: 首次启动创建目录
- **WHEN** Tide 首次启动且 `tide-data/` 目录不存在
- **THEN** 系统自动创建 `tide-data/sessions/`、`tide-data/archive/`、`tide-data/prds/`、`tide-data/abandoned/` 四个目录

#### Scenario: 目录已存在不重复创建
- **WHEN** Tide 启动时 `tide-data/` 目录已存在
- **THEN** 跳过目录创建，不报错

---

### Requirement: 归档

Tide SHALL 在会话达到终态时自动归档，减少入口列表噪音。会话废弃（superseded）时，已生成的 PRD 文件 SHALL 移入 `tide-data/abandoned/` 目录。

#### Scenario: completed 自动归档
- **WHEN** 4c 全部成功（status → completed）
- **THEN** 立即将 session JSON 从 `sessions/` 移动到 `archive/`

#### Scenario: superseded 自动归档
- **WHEN** 用户选择放弃或变更需求（status → superseded）
- **THEN** 立即将 session JSON 从 `sessions/` 移动到 `archive/`

#### Scenario: superseded 时清理 PRD 文件
- **WHEN** 会话进入 superseded 状态
- **THEN** 检查 `tide-data/prds/{sessionId}-prd.md` 和 `tide-data/prds/{sessionId}-prd.json` 是否存在
- **THEN** 存在的 PRD 文件移动到 `tide-data/abandoned/`
- **AND** PRD 文件不存在时不报错（静默跳过）

#### Scenario: 归档后不展示在入口
- **WHEN** 入口扫描
- **THEN** 不读取 `archive/` 目录的会话，仅在参数查询时同时搜索两个目录

#### Scenario: 已完成会话的操作
- **WHEN** 用户通过参数查询访问到 `completed` 会话
- **THEN** 展示 PRD 内容和所有工单链接（只读）

#### Scenario: 已废弃会话的操作
- **WHEN** 用户查询到 `superseded` 会话
- **THEN** 展示原会话内容（只读），提示替代会话（如 supersededBy 有值），提供「重来」选项

#### Scenario: 会话关联展示
- **WHEN** 查看 `superseded` 会话
- **THEN** 加载关联会话信息一并展示，包含替代会话的 featureId、sessionId 和最新需求摘要

## ADDED Requirements

### Requirement: 会话索引缓存

Tide SHALL 在 `tide-data/sessions/.index.json` 维护一个轻量摘要索引，记录每个 session 的元信息（sessionId、status、brief、createdAt、featureId）。索引文件 SHALL 在 session 创建、状态更新、归档时同步维护。

#### Scenario: 启动时优先读索引
- **WHEN** Tide 启动且 `tide-data/sessions/.index.json` 存在
- **THEN** 优先加载索引文件中的 session 摘要，不再逐个读入完整 JSON
- **AND** 仅当用户选中某个 session 时才读取完整的 `{sessionId}.json`

#### Scenario: 索引不存在时降级
- **WHEN** `.index.json` 不存在（首次运行或文件丢失）
- **THEN** 降级为扫描 `sessions/*.json` 完整读取（原行为）
- **AND** 不影响任何功能

#### Scenario: 创建会话时写入索引
- **WHEN** Step 1 完成 session 创建
- **THEN** 在 `.index.json` 中追加新 session 的摘要条目

#### Scenario: 状态更新时同步索引
- **WHEN** session 状态变更（如 active → prd_ready、prd_ready → published）
- **THEN** 更新 `.index.json` 中对应条目的 status 字段

#### Scenario: 归档时删除索引条目
- **WHEN** session JSON 从 `sessions/` 移入 `archive/`（completed / superseded）
- **THEN** 从 `.index.json` 中移除对应条目

---

### Requirement: MCP 能力发现缓存

Tide SHALL 在 Step 4 MCP 能力发现后，将结果缓存到 session JSON 的 `services.capabilities` 字段。恢复已发布的 session 时优先使用缓存值，避免重复发现。

#### Scenario: 首次发现后缓存
- **WHEN** Step 4 MCP 能力发现成功完成
- **THEN** 将发现结果写入 session JSON 的 `services.capabilities`
- **AND** 包含 `knowledge_base` 和 `issue_tracker` 两域的可用性和 provider 信息

#### Scenario: 恢复时使用缓存
- **WHEN** 恢复 `published` 或 `publish_error` 状态的 session
- **THEN** 检查 `services.capabilities` 是否存在
- **THEN** 存在时直接使用缓存值执行发布流程，跳过重新发现
- **THEN** 不存在时走完整发现逻辑

#### Scenario: 用户要求刷新缓存
- **WHEN** 用户明确要求"重试"、"刷新"或"重新检查"MCP 服务
- **THEN** 忽略 `services.capabilities` 缓存，重新发现并更新

---

### Requirement: 启动依赖检查

Tide SHALL 在入口扫描完成后检查 `deepstorm.installedSkills` 中是否包含 `bmad` 和 `grill-me` 两个依赖 skill，并根据结果提醒用户。

#### Scenario: bmad 未安装时警告
- **WHEN** `deepstorm.installedSkills` 中不包含 `bmad`
- **THEN** 提醒用户 bmad 是 tide-discuss 角色讨论的必需依赖
- **AND** 建议运行 `npx @deepstorm/cli setup` 安装
- **AND** 不阻止 tide-discuss 继续运行

#### Scenario: grill-me 未安装时提示
- **WHEN** `deepstorm.installedSkills` 中不包含 `grill-me`
- **THEN** 温和提示用户安装后可获得更好的需求追问体验
- **AND** 不阻止 tide-discuss 继续运行

#### Scenario: 仅入口执行一次
- **WHEN** 同一 session 的讨论过程中再次进入入口扫描
- **THEN** 不再重复检查依赖

---
