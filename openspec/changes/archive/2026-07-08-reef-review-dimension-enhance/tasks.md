## 1. SKILL.md — Eligibility 预检与上下文收集

- [x] 1.1 SKILL.md.tmpl 增加 eligibility 预检（lock-only/doc-only 跳过）
- [x] 1.2 SKILL.md.tmpl 增加 CLAUDE.md 上下文收集步骤
- [x] 1.3 SKILL.md.tmpl 增加 git history 摘要收集步骤
- [x] 1.4 SKILL.md.tmpl 增加代码注释标注收集步骤
- [x] 1.5 SKILL.md.tmpl 增加 false positive 抑制规则说明
- [x] 1.6 SKILL.md.tmpl 增加评分降级逻辑（无证据链的 Block→Request Changes）

## 2. Backend Agent — 维度注入（模板 + 变体）

- [x] 2.1 reef-review-backend.md.tmpl Checklist 增加 CLAUDE.md 合规/FIXME/git history 条款
- [x] 2.2 reef-review-backend.md.tmpl Workflow 增加 CLAUDE.md 阅读/代码注释阅读/git history 步骤
- [x] 2.3 reef-review-backend.md.tmpl Output 增加证据链格式
- [x] 2.4 variants/python/reef-review-backend.md 同步改动
- [x] 2.5 variants/java/reef-review-backend.md 同步改动

## 3. Frontend Agent — 维度注入（模板 + 变体）

- [x] 3.1 reef-review-frontend.md.tmpl Checklist 增加 CLAUDE.md 合规/FIXME/git history/UI 注释条款
- [x] 3.2 reef-review-frontend.md.tmpl Workflow 增加 CLAUDE.md 阅读/代码注释阅读/git history
- [x] 3.3 reef-review-frontend.md.tmpl Output 增加证据链格式
- [x] 3.4 variants/angular/reef-review-frontend.md 同步改动
- [x] 3.5 variants/react/reef-review-frontend.md 同步改动
- [x] 3.6 variants/vue/reef-review-frontend.md 同步改动

## 4. Infra Agent — 维度注入

- [x] 4.1 reef-review-infra.md Checklist 增加 CLI 步骤/CI 缓存/Dockerfile 合规条款
- [x] 4.2 reef-review-infra.md Workflow 增加 CLAUDE.md 阅读步骤
- [x] 4.3 reef-review-infra.md Output 增加证据链格式

## 5. Security Agent — 新建

- [x] 5.1 创建 reef-review-security.md，包含 P0-P5 安全 Checklist
- [x] 5.2 定义 🔴/🟡/🟢 安全维度条款（多租户/认证/注入/敏感数据/依赖安全）
- [x] 5.3 定义 workflow（7 步：CLAUDE.md → 代码注释 → diff → git history → checklist → 额外模式检查 → 证据输出）
- [x] 5.4 定义证据链输出格式
