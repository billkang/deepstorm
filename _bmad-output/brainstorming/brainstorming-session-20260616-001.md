# BMAD Brainstorming Session

- **Date:** 2026-06-16
- **Session:** 001
- **Topic:** Reef 技能片段目录扁平化
- **Mode:** 自然对话讨论（非正式 BMAD 命令）

## 讨论内容

### 问题陈述

DeepStorm reef 技能的 source 目录层级过深、文件碎片化严重：
- `fragments/java/framework/spring-boot/quick-reference/` → 6 层深度，9 个碎片文件
- 输出目录同样 6 层（`dimensions/java/...`）
- 前端 angular 变体 16 个碎片文件
- 维护成本高、导航困难

### 关键决策

| 决策 | 选择 | 备选 |
|------|------|------|
| 目录深度 | source ≤4 层，output ≤3 层 | 保持现状（否）|
| java/ 前缀 | 移除 | 保留（否），过早抽象（否）|
| quick-reference/ 碎片 | 合并为单文件 | 保留分离（否）|
| examples/ 位置 | 上移到 fragment 根 | 保持子目录（否）|
| CLI 代码 | 不修改（路径驱动） | 修改（否）|

### 变更范围

1. **后端 fragments**：spring-boot、hibernate 的碎片合并，示例上移；java/ai、java/db-migration 路径移除 java 前缀；新增 junit5 占位
2. **前端 fragments**：primeng、vitest 的碎片合并，示例上移
3. **Variants**：java/angular 的碎片合并，示例上移
4. **配置文件**：wizard.json 路径更新、SKILL.md.tmpl 更新
5. **CLI 测试**：补充 setup.ts 等命令的单元测试

### 明确不做的

- 不修改 CLI 运行时代码（renderer.ts、setup.ts、build-registry.ts）
- 不修改测试框架配置
- 不添加新 CLI 命令
- 不引入语言通用层

### 产出

- [x] BMAD brainstorming 文件（本文档）
- [ ] → /opsx:new reef-fragments-restructure

## Session Summary

讨论了 reef 技能目录结构深、文件碎片化的问题。确定重构目标是扁平化到 ≤4 层，文件合并为单文件，移除 java/ 前缀，补齐 CLI 测试。不修改 CLI 运行时代码。
