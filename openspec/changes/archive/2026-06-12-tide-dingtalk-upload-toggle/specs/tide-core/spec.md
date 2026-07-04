## MODIFIED Requirements

### Requirement: 发布流程（Step 4）

Tide SHALL 分三步完成发布：4a 推送到钉钉（可选） → 4b 拆分 Jira 任务 → 4c 创建 Jira Issue，每步记录 publishChecklist 支持断点续传。Step 4a 的执行受 feature toggle 控制，路径为 `deepstorm → tide → dingtalkUpload → enabled`。

#### Scenario: 4a 钉钉上传已开启
- **WHEN** `deepstorm.tide.dingtalkUpload.enabled` 为 `true`（或未配置）
- **THEN** 按现有流程执行钉钉上传

#### Scenario: 4a 钉钉上传已关闭
- **WHEN** `deepstorm.tide.dingtalkUpload.enabled` 为 `false`（即嵌套路径下值明确为 `false`）
- **THEN** 跳过 Step 4a，直接进入 Step 4b Jira 任务拆分，publishChecklist[0] 记录 `{step: "dingtalk_push", done: true, skipped: true, note: "钉钉云文档上传已关闭"}`

#### Scenario: 4a 推送到钉钉成功
- **WHEN** PRD Markdown 成功上传到钉钉云文档
- **THEN** 保存 dingtalkUrl，publishChecklist[0].done = true，status 变为 published

#### Scenario: 4a 推送到钉钉失败
- **WHEN** 上传到钉钉失败
- **THEN** publishChecklist[0].done = false，status 变为 publish_error，提示用户错误信息
