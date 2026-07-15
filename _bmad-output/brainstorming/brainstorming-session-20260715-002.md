# Brainstorming Session — 2026-07-15-002

## 议题：DeepStorm 内容语言统一为中文

### 参与角色

- **用户（PM/Dev）**：报告 DeepStorm 生成的 SDD 文档和 commit message 经常使用英文
- **AI（Agent）**：排查范围并设计修复方案

### 讨论记录

1. **问题描述**：生成的 spec 文档（proposal/specs/design/tasks）和代码提交的 commit message 经常使用英文，而非中文
2. **范围确认**：
   - 排除 BMAD 技能（外部项目 bmad-spec，使用配置化语言方案）
   - 排除 OpenSpec schema.yaml（外部 npm 依赖，不可直接修改）
   - 主要影响范围：SDD 文档、release commit、PR 模板
3. **根因分析**：
   - OpenSpec schema.yaml 的 instruction 字段全部为英文 → LLM 默认英文输出
   - deepstorm-release skill 和 release.ts 硬编码英文 commit message
   - reef-pr skill 的 PR 模板英文/中文标题混排
   - deepstorm-discuss skill 已有中文语言规范但未被 SDD 生成流程引用
4. **修复策略**：
   - 修改 opsx:continue.md 在 artifact 生成指令中注入语言约束
   - 修改 reef-start/SKILL.md.tmpl 在 SDD 流程中加入语言规范引用
   - 修改 deepstorm-release/SKILL.md + release.ts 的 commit message
   - 修改 reef-pr/SKILL.md 的 PR 模板标题

### 决策

- 新建 OpenSpec change：`unify-language-zh`
- 使用 spec-driven 模式
- 新增 capability：`sdd-language-constraint`
