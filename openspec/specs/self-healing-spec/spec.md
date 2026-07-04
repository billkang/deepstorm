# self-healing-spec Specification

## Purpose
TBD - created by archiving change sweep-run-hybrid-execution. Update Purpose after archive.
## Requirements
### Requirement: AI 自愈引擎 SHALL 在 spec.ts 失败时介入诊断

当原生 Playwright 执行 `.spec.ts` 出现失败时，Self-Healing Spec 引擎 SHALL 由 AI 驱动进行失败诊断，判断失败原因是页面元素变更还是真正的功能 Bug。

#### Scenario: 触发自愈流程
- **WHEN** `npx playwright test` 执行 `.flow.spec.ts` 出现一个或多个失败
- **THEN** 自愈引擎 SHALL 读取 Playwright 的失败输出日志
- **AND** 自愈引擎 SHALL 提取失败的定位器信息和错误类型
- **AND** 自愈引擎 SHALL 记录具体哪个 Flow、哪个步骤、哪个验证点失败
- **AND** 自愈引擎 SHALL 进入 AI 诊断流程

#### Scenario: 多个失败并发处理
- **WHEN** 一次执行有多个 test 块失败
- **THEN** 自愈引擎 SHALL 按 Flow 分组逐一诊断
- **AND** 每个失败的 test 块独立诊断和修复

#### Scenario: AI 诊断流程
- **WHEN** 自愈引擎进入 AI 诊断流程
- **THEN** AI SHALL 通过 Playwright MCP 打开浏览器，导航到目标页面
- **AND** AI SHALL 检查实际页面上的元素状态与 spec 中的定位器是否匹配
- **AND** AI SHALL 判断：失败原因是元素选择器失效（元素变了），还是页面行为不符合预期（真 Bug）

#### Scenario: 判断为元素变更
- **WHEN** AI 确认页面元素存在但选择器失效（如 CSS class 变更、DOM 结构微调）
- **THEN** AI SHALL 自动更新 `.flow.spec.ts` 中的定位器
- **AND** AI SHALL 在 spec 文件中添加注释 `// auto-repaired: {timestamp} - {old selector} → {new selector}`
- **AND** AI SHALL 重新执行该 test 块确认修复有效

#### Scenario: 判断为真 Bug
- **WHEN** AI 确认页面元素不存在或行为不符合预期（页面功能改变或出错）
- **THEN** 自愈引擎 SHALL 不修改 spec 文件
- **AND** 在测试报告中标注该失败为「确认的 Bug」，而非「疑似定位器失效」

---

### Requirement: 自愈后的二次验证

自愈引擎 SHALL 在修改 spec 后重新执行该 test 块，确认修复有效。如果二次执行仍然失败，SHALL 放弃修复并保留原始失败报告。

#### Scenario: 修复后重跑
- **WHEN** AI 已更新 `.flow.spec.ts` 中的定位器
- **THEN** 自愈引擎 SHALL 单独执行该 test 块（非全量）
- **AND** 如果该 test 块通过，SHALL 在报告中标注为该 Flow 自愈成功

#### Scenario: 修复无效回滚
- **WHEN** AI 更新定位器后重新执行 test 块仍然失败
- **THEN** 自愈引擎 SHALL 放弃本次修复
- **AND** SHALL 在报告中保留原始失败信息
- **AND** SHALL 不修改 `.flow.spec.ts`（保留失败状态供人工排查）

#### Scenario: 修复循环保护
- **WHEN** 自愈引擎对同一个 Flow 重试了 3 次
- **THEN** 自愈引擎 SHALL 停止继续修复
- **AND** 报告中标注该 Flow 为「自愈放弃」
- **AND** 保留第 3 次执行后的 `.flow.spec.ts` 状态

---

### Requirement: 自愈引擎操作可追溯

所有自愈操作 SHALL 在测试报告中留下可追溯的记录。

#### Scenario: 自愈记录格式
- **WHEN** 自愈引擎完成对一个 Flow 的诊断（无论是否修复）
- **THEN** 报告中 SHALL 记录：诊断时间、Flow ID、失败原因分析、判定结果（元素变更/真 Bug）、是否修复
- **AND** 如果修复，记录旧选择器和新选择器
- **AND** 如果放弃，记录放弃原因（如修复无效/超过重试限制）

#### Scenario: 自愈不影响其他 Flow
- **WHEN** 自愈引擎处理某个 Flow 的失败
- **THEN** 其他通过或未执行的 Flow SHALL 不受影响
- **AND** 自愈引擎不改变其他 Flow 的 spec 文件

