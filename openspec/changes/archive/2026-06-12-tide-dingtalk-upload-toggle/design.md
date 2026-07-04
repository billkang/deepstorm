## Context

Tide 的 Step 4a 发布流程（推送到钉钉云文档）已在 spec 和 skill 中有定义，但钉钉集成的实际能力尚未完全打通。部分项目不需要钉钉集成（如个人项目、暂未配置钉钉 MCP 的环境），需要一个全局开关来控制是否启用该能力。

Tide 是纯 skill 插件，没有运行时进程。所有逻辑通过 SKILL.md 中的指令驱动 AI 执行。因此 feature toggle 的读取和判断需要落在 SKILL.md 的指令层面，通过 Bash/Read 工具读取配置文件。

配置文件 `.claude/settings.json` 和 `.claude/settings.local.json` 是 Claude Code 原生支持的配置机制，`settings.local.json` 优先级高于 `settings.json`，且通常被 `.gitignore` 忽略，适合作为本地自定义配置入口。

## Goals / Non-Goals

**Goals:**
- 提供 `deepstorm.tide.dingtalkUpload.enabled` 配置项来控制钉钉上传能力
- 默认开启（`true`），向后兼容
- 支持通过 `.claude/settings.json` 或 `.claude/settings.local.json` 配置
- `settings.local.json` 优先级高于 `settings.json`
- 修改 Tide Step 4a 逻辑：钉钉上传前检查开关状态
- 更新 publish-flow.md 和 SKILL.md 文档

**Non-Goals:**
- 不引入新的配置文件或环境变量
- 不改动钉钉 MCP 的配置方式（仍通过 `.env` 中的 `DINGTALK_APP_KEY`/`DINGTALK_APP_SECRET` 配置）
- 不涉及 Jira 发布流程的开关（仅影响 Step 4a）
- 不实现运行时动态热加载（配置在 Claude Code 会话启动时确定）

## Decisions

**Decision 1：配置路径 — 嵌套 JSON 结构**

配置采用嵌套 JSON 结构，路径为 `deepstorm → tide → dingtalkUpload → enabled`：

```json
{
  "deepstorm": {
    "tide": {
      "dingtalkUpload": {
        "enabled": true
      }
    }
  }
}
```

- 命名空间 `deepstorm.tide.*` 避免与 Claude Code 内置配置或其他插件冲突
- `dingtalkUpload` 使用 camelCase，与 JSON 约定一致
- `enabled` 值为 boolean 类型（`true` / `false`），避免字符串解析歧义

**Decision 2：配置读取优先级 — `settings.local.json` 优先于 `settings.json`**

参考 Claude Code 的配置优先级规则，`settings.local.json` 用于本地覆盖，不应提交到 Git。Tide 读取时：
1. 先尝试读取 `.claude/settings.local.json` 中嵌套路径 `deepstorm → tide → dingtalkUpload → enabled`
2. 若未找到，回退到 `.claude/settings.json` 的同路径
3. 若两者均未配置，默认 `true`（开启）

**Decision 3：读取时机 — 在 Step 4a 开始时读取**

- 不在启动时读取（避免不必要的 I/O）
- 在进入 Step 4a 流程的第一步读取配置值
- 如果关闭，直接告知用户该能力未开启，建议配置 MCP 后开启，然后进入 4b Jira 任务拆分
- 如果开启但 MCP 未配置（缺少环境变量），按现有流程处理（引导用户配置 → 上传 → 失败处理）

**Decision 4：通过 SKILL.md 指令实现配置读取**

由于 Tide 是纯 skill 插件，在 SKILL.md 的 Step 4a 指令中添加：
- "检查 `${PWD}/.claude/settings.local.json` 和 `${PWD}/.claude/settings.json` 中嵌套路径 `deepstorm → tide → dingtalkUpload → enabled` 的值"
- 用 Read 工具或 Bash 读取配置文件内容，AI 自行解析 JSON 取值
- 读取顺序：先读 `settings.local.json`，若该嵌套路径不存在再读 `settings.json`

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 用户手动编辑 settings.json 导致 JSON 格式错误 | SKILL.md 中要求 AI 使用 `jq` 或 Python json 模块安全解析；解析失败时默认 `true` 并提示用户 |
| 配置路径拼写错误（如 `dingtalk_upload` 而非 `dingtalkUpload`） | SKILL.md 中明确指定精确路径，并在 publish-flow.md 中给出完整示例 |
| settings.local.json 不在项目根目录（如 monorepo 子包） | Tide 的工作目录始终相对于 `$PWD`，与 tide-data/ 一致 |
| 用户期望无需重启即可切换开关 | Claude Code 配置本身是会话级，每次新对话读取最新配置；当前对话中可通过显式指令要求 AI 重新读取 |
