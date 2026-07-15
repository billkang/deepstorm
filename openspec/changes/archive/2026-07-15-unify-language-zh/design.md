## Context

DeepStorm 生成的 SDD 文档和 commit message 存在语言不一致的问题。OpenSpec schema 的 `instruction` 字段全部为英文，LLM 收到英文指令后倾向用英文输出。虽然 `deepstorm-discuss` skill 已有「中文正文 + 英文专有名词」的语言规范章节，但它并未被 SDD 生成流程引用。

此外，`deepstorm-release` skill 和 `release.ts` 硬编码了 `"RELEASING: Releasing v{version}"` 的英文 commit message，`reef-pr` skill 的 PR 模板存在英文/中文标题混排。

## Goals / Non-Goals

**Goals:**
- SDD 文档（proposal/specs/design/tasks）正文统一使用中文
- release commit message 从英文改为中文
- PR 模板标题统一为中文
- 语言约束在 SDD 生成流程中可传递

**Non-Goals:**
- 不影响 BMAD 技能的英文指令（bmad-spec 是外部项目，使用配置化语言方案）
- 不改动 OpenSpec schema.yaml 本身（外部依赖，通过指令覆盖实现语言约束）
- 不修改 .env-example 文件（开发参考文档，优先级较低）

## Decisions

### 决策 1：通过 opsx:continue 注入语言约束

**方案对比：**

| 方案 | 说明 | 评价 |
|------|------|------|
| ✅ 修改 opsx:continue.md 指令 | 在命令文件的 artifact 创建指导中加入「SDD 文档正文使用中文」 | 直接有效，每次生成 artifact 时 LLM 都能感知 |
| ❌ 修改 schema.yaml | 但 schema.yaml 是外部 npm 包，不可直接修改 | 不可行 |
| ❌ 仅依赖 skill 层约束 | deepstorm-discuss 已有语言规范但未被引用 | 目前失效 |

**决定：** 在 `opsx:continue.md` 的 Artifact Creation Guidelines 中加入语言约束规则，同时在 `reef-start/SKILL.md.tmpl` 的 SDD 流程描述中加入语言约束。双重保障。

### 决策 2：release commit 改为 `chore: 发布 v{version}`

**理由：** 与 `deepstorm-commit` skill 的「conventional commit 前缀 + 中文描述」规范保持一致。`chore:` 最贴切（发版属于工程维护）。两处需要修改：
- `deepstorm-release/SKILL.md` — 步骤 7 的 commit message 模板
- `release.ts` — `git commit -m` 的硬编码字符串

### 决策 3：PR 模板标题统一为中文

**理由：** `reef-pr/SKILL.md` 中 PR 正文模板的英文标题（`## Summary`、`## Test plan`）与中文标题（`## 关联`、`## 变更清单`）混排，需要统一。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| opsx:continue.md 修改可能被 openspec 更新覆盖 | 用户需在 openspec 升级后重新检查。不影响功能，仅语言偏好 |
| 部分开发者习惯英文输出 | 语言约束为指令性要求，LLM 生成的最终输出仍可通过用户确认调整 |
| 已归档的旧 spec 英文不改，新旧不一致 | 归档内容不修改。仅影响后续新生成的文档 |
