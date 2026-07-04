## 1. 准备工作

- [x] 1.1 完整阅读 deepstorm-discuss/SKILL.md，标记所有可替换的文字流程段落
- [x] 1.2 完整阅读 reef-start/SKILL.md.tmpl，标记所有可替换的文字流程段落

## 2. deepstorm-discuss/SKILL.md — 入口门禁路由

- [x] 2.1 将「入口门禁」路由表（当前 L63-79）替换为 `flowchart TD` 决策树，保留紧邻的简短说明文字
- [x] 2.2 将「三条铁律」部分精简，保留核心规则但移除不再需要的过渡描述

## 3. deepstorm-discuss/SKILL.md — BMAD 讨论后步骤

- [x] 3.1 将「BMAD 讨论完成后的下一步」正误路径对比（当前 L157-183）替换为 `flowchart LR` 双列子图
- [x] 3.2 移除被替代的正误对比代码块和过渡说明文字

## 4. deepstorm-discuss/SKILL.md — Apply 前置条件门禁

- [x] 4.1 将 Apply 前置条件门禁判定（当前 L443-461）替换为 `flowchart TD` 判定流程图
- [x] 4.2 将「未通过后的操作指引」表格保留为参考表（非流程部分）
- [x] 4.3 移除被替代的文字步骤列表

## 5. deepstorm-discuss/SKILL.md — 逐 task 执行流程

- [x] 5.1 将「逐 task 执行」步骤列表（当前 L506-515）替换为 `flowchart TD` 循环流程图
- [x] 5.2 移除被替代的文字步骤列表

## 6. deepstorm-discuss/SKILL.md — 数据流清理

- [x] 6.1 确认底部数据流（当前 L605-617）已被已有总览 Mermaid 图覆盖，删除冗余文字箭头

## 7. reef-start/SKILL.md.tmpl — 阶段过渡优化

- [x] 7.1 将分散的阶段过渡文字（`→ 阶段二` / `→ 阶段三` / `→ ⛔ 检查清单`）合并到已有的功能概述 Mermaid 图中
- [x] 7.2 移除被替代的过渡文字行

## 8. reef-start/SKILL.md.tmpl — Task 类型判断

- [x] 8.1 将 Task 类型判断表（当前 L360-369）以决策分支形式整合到已有的 TDD 流程图（L329-343）中

## 9. 验证

- [x] 9.1 逐条对照 spec 的 Scenario，确认每个替换的 Mermaid 图与原文字流程逻辑等价
- [x] 9.2 确认所有被替代的文字段落已移除或精简，无残留的双源描述
- [x] 9.3 通读两个文件的最终版本，确认上下文连贯性
