# Brainstorming Session — 2026-07-08-01

## Title
借鉴 Claude 官方 code-review skill 的审查维度增强 reef-review

## Participants
- User (需求方)
- Claude (协作方)

## Discussion Summary

### 背景
DeepStorm 的 reef-review skill 已支持多 agent 审查（backend/frontend/infra 三个方向），但在审查覆盖面上存在盲区——每个 agent 只做了「bug 检查」单一维度，而 Claude 官方 code-review 使用了 5 个不同认识论维度的并行 agent。

### 需求
在不增加 agent、不增加 token 开销的前提下，让 reef-review 发现更多代码问题。借鉴官方 skill 的"多种维度"思路，但采用注入式方案而非官方并行 agent 方案。

### 关键决策
1. ❌ 拒绝多 agent 方案（"多agent太耗token了"）
2. ✅ 采用「维度注入」方案：在现有 agent 的 workflow 中插入检查步骤，利用已有上下文顺带完成额外检查
3. 新增 4 个审查维度：CLAUDE.md 合规、代码注释合规、git history 上下文、证据链输出
4. 新建此前缺失的 security agent

### 具体改动方向
- SKILL.md.tmpl：增加 eligibility 预检 + 上下文收集 + false positive 规则 + 评分降级
- 所有 agent 定义文件：workflow 增加 2-3 步（阅读 CLAUDE.md、阅读代码注释、检查 git history）
- Checklist：为每个 agent 增加 CLAUDE.md 合规、FIXME/HACK 等相关条款
- Output Format：引入证据链符号（🧾📜📝📚🛠）
- 新建 reef-review-security.md

## 产出物
- 9 个文件已修改（8 个 agent 定义 + 1 个 SKILL.md.tmpl），~300 行增量
- 详情见 git status

## 下一步
创建 OpenSpec change，产出 proposal → specs → design → tasks，然后验证 → 归档
