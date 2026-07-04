---
name: spec-consistency-checker
description: 验证 OpenSpec spec 格式一致性、跨引用正确性和约定合规性。spec 文件修改时自动触发，或由 opsx:verify skill 按需调用。
---

# Spec 一致性检查器

## 检查项

### 1. 格式合规
- featureId 格式: MODULE-FEATURE-SUBFEATURE（全大写 + 连字符，可含数字）
- sessionId 格式: tide-YYYYMMDD-NNN
- 流程图使用 Mermaid 语法（```mermaid），禁止 ASCII 字符画流程图

### 2. 结构完整性
- spec 包含必要的 sections（WHEN/THEN 约束）
- 引用其他 spec 的路径存在且格式正确
- 无残缺 TODO 或占位符标记

### 3. 跨引用一致性
- 引用的 featureId 在目标 spec 中存在
- 引用的 sessionId 格式正确
- spec 中提到的 capability 在 registry 中有对应实现

## 输出格式
每项附带：文件路径、行号（如适用）、修复建议
