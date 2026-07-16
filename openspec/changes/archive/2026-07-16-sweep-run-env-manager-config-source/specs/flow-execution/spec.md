## ADDED Requirements

### Requirement: env-manager 从 .deepstorm/settings.json 读取 E2E 框架配置

`env-manager.mjs` 的 `readFramework()` SHALL 从 `.deepstorm/settings.json` 读取 `sweep.e2eFramework` 确定当前项目使用的 E2E 测试框架，不再回退到 `.claude/settings.json`。

#### Scenario: .deepstorm/settings.json 中存在配置
- **WHEN** `.deepstorm/settings.json` 中存在 `sweep.e2eFramework` 字段
- **THEN** `readFramework()` SHALL 返回该字段的值
- **AND** source SHALL 标记为 `"deepstorm-settings"`

#### Scenario: .deepstorm/settings.json 不存在
- **WHEN** `.deepstorm/settings.json` 不存在
- **THEN** `readFramework()` SHALL 返回 `{ framework: null, source: "missing-file" }`

#### Scenario: 配置未设置
- **WHEN** `.deepstorm/settings.json` 存在但 `sweep.e2eFramework` 字段缺失
- **THEN** `readFramework()` SHALL 返回 `{ framework: null, source: "not-configured" }`

#### Scenario: 配置文件格式错误
- **WHEN** `.deepstorm/settings.json` 格式非法
- **THEN** `readFramework()` SHALL 返回 `{ framework: null, source: "parse-error" }`

#### Scenario: 配置值为 playwright
- **WHEN** `readFramework()` 返回 `{ framework: "playwright" }`
- **THEN** sweep-run SHALL 通过 Playwright MCP（`deepstorm-playwright`）执行浏览器操作

#### Scenario: 配置值为 null
- **WHEN** `readFramework()` 返回 `{ framework: null }`
- **THEN** sweep-run SHALL 提示"E2E 框架未配置，请运行 deepstorm setup 重新配置"并退出
