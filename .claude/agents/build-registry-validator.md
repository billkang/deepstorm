---
name: build-registry-validator
description: 验证构建后的 registry 与实际文件系统一致。扫描 packages/ 各套件的 skills/agents/hooks，与 registry.json 对比标记差异。
---

# Build Registry 校验器

## 检查维度

### Skills 完整性
- 扫描 packages/*/skills/ 下所有 SKILL.md
- 与 registry.json 的 skills 条目对比
- 标记：缺失条目（文件存在未注册）和孤立条目（已注册文件不存在）

### Agents 完整性
- 扫描 packages/*/agents/ 下 .md / .md.tmpl
- 与 registry.json 的 agents 条目对比
- 标记：缺失 / 孤立

### Hooks 完整性
- 扫描 packages/*/hooks/hooks.json + 对应 .sh 脚本
- 验证引用关系一致
- 标记：脚本引用不存在 / 存在未引用的脚本

## 输出格式
```
Build Registry 校验报告
=======================

✅ Skills: X/Y 通过
  - 缺失条目: (无)
  - 孤立条目: (无)

⚠️ Agents: X/Y 通过
  - 缺失: agent-foo → 文件存在未注册
  - 孤立: agent-ghost → 已注册但文件不存在

✅ Hooks: 全部一致
```

## 触发时机
- pnpm build 完成后自动触发（通过 PostToolUse hook）
- 用户手动调用
