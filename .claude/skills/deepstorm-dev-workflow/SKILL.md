---
name: deepstorm-dev-workflow
description: DeepStorm 日常开发循环 — 构建 → 测试 → 提交。区别于 deepstorm-discuss（BMAD/OpenSpec）和 deepstorm-release（版本发布）。用户说「开始开发」「dev flow」时激活。
---

# DeepStorm 日常开发工作流

聚焦 **构建→测试→提交** 循环，不包含 BMAD/OpenSpec 或正式发布。

## 定位

| Skill | 定位 |
|-------|------|
| `deepstorm-discuss` | BMAD → OpenSpec → writing-skills → verify → archive |
| `deepstorm-dev-workflow` | build → test → commit |
| `deepstorm-release` | changeset → version bump → npm publish → tag |

## 工作流

```mermaid
flowchart LR
    STATUS["1. 状态检查"] --> BUILD["2. pnpm build"]
    BUILD --> TEST["3. pnpm test"]
    TEST --> COMMIT["4. deepstorm-commit"]
    COMMIT --> PUSH["5. git push (可选)"]
```

### 步骤
1. **状态检查** — 分支、变更文件、OpenSpec 上下文
2. **构建** — `pnpm build`（失败则询问是否修复）
3. **测试** — `pnpm test`（失败则询问跳过或修复）
4. **提交** — 委托 `/deepstorm-commit`
5. **推送（可选）** — 仅用户明确要求

## 约束
- 不包含 BMAD→OpenSpec（用 /deepstorm-discuss）
- 不包含发布（用 /deepstorm-release）
- 推送非自动
