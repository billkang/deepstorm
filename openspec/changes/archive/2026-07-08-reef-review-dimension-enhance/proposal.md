## Why

DeepStorm 的 reef-review skill 使用 3 个独立 agent（backend/frontend/infra）进行代码审查，但每个 agent 仅做了「bug 检查」单一维度。相比之下，Claude 官方 code-review 使用了 5 个独立认识论维度的 agent（CLAUDE.md 合规、明显 bug、git blame 历史、PR 评论、代码注释合规），覆盖更全面。需要在**不增加 agent、不增加 token 开销**的前提下，将缺失的审查维度注入现有 agent 的 workflow 中，让 reef-review 能发现更多代码问题。

## What Changes

- **CLAUDE.md 合规审查维度注入**：每个 agent 的 workflow 新增「阅读 CLAUDE.md」步骤，Checklist 增加 CLAUDE.md 合规条款
- **代码注释合规审查维度注入**：检查变更是否触及 `FIXME`/`HACK`/`WARNING`/`NOTE`/`SECURITY`/`accessible` 注释标注区域
- **Git history 上下文维度注入**：通过 `git log` 和 `git blame` 识别反复修改的脆弱区域
- **证据链输出格式**：所有 issue 附带来源符号（🧾📜📝📚🛠），无证据链的 Block 自动降级
- **新建 security agent**：此前缺失的 reef-review-security agent，覆盖多租户隔离、权限、注入、敏感数据等安全维度
- **SKILL.md.tmpl 增强**：增加 eligibility 预检（lock-only/doc-only 跳过）、上下文收集（CLAUDE.md/git history/代码注释）、false positive 规则、评分降级逻辑

## Capabilities

### New Capabilities
- `review-dimension-injection`: 在现有 agent workflow 中注入额外审查维度的机制，包括 CLAUDE.md 合规、代码注释合规、git history 上下文
- `review-evidence-chain`: 审查报告的证据链输出格式，每个 issue 附带来源追溯符号
- `review-security-agent`: 专门的安全审查 agent，覆盖 P0-P5 安全维度
- `review-eligibility-precheck`: SKILL.md 层的变更 eligibility 预检和上下文收集

### Modified Capabilities
<!-- no existing spec-level requirements changed -->

## Impact

- **packages/reef/agents/** 下 9 个文件修改/新建（8 个 agent 定义 + 1 个 SKILL.md.tmpl）
- 无新 agent 创建，不影响 token 用量和审查时间
- 证据链格式向后兼容（原有输出格式可继续使用）
- security agent 为独立新增，不破坏现有审查流程
