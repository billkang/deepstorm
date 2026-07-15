# Tasks — reef-start SKILL.md.tmpl 移植 + 文件拆分

> 按依赖顺序排列，每组内任务可并行。

---

## Phase 0：移植 lattice-adaptation 到 SKILL.md.tmpl

> 从 SKILL.md 逐段移植到 SKILL.md.tmpl，保持原文不缩写不改写。
> 文件路径：`packages/reef/skills/reef-start/`

### 0.1 上下文地图更新

- [ ] 0.1a 在 SKILL.md.tmpl 的 Path A 阶段一末尾（1.5 后）插入 1.6 更新上下文地图段，内容与 SKILL.md 第 187-197 行一致
- [ ] 0.1b 在 SKILL.md.tmpl 的 Path B 阶段一末尾（B1.4 后）插入 B1.5 更新上下文地图段，内容与 SKILL.md 第 266-276 行一致

### 0.2 风险路由 + Mode 切换

- [ ] 0.2a 在 SKILL.md.tmpl 的 superpowers 门禁阶段（阶段三→四过渡），将现有"Rigid 技能声明模板"替换为完整风险路由判断流程，内容与 SKILL.md 第 421-460 行一致
      - 变更特征分析方法（4 步）
      - 风险路由卡引用
      - 输出模板（判定表 + 推荐模式 + 理由 + 用户确认）
      - plan→tdd 升级规则 + tdd→plan 禁止降级规则
- [ ] 0.2b 在风险路由判断流程后插入 Plan Mode 和 TDD Mode 两套声明模板，内容与 SKILL.md 第 462-510 行一致

### 0.3 阶段四核心原则更新

- [ ] 0.3a 将 SKILL.md.tmpl 阶段四开头的核心原则从单一 TDD 原则替换为 dual-mode 原则（plan mode + tdd mode），内容与 SKILL.md 第 597-603 行一致

### 0.4 阶段四 Mermaid 流程图

- [ ] 0.4a 将 SKILL.md.tmpl 的阶段四入口流程图替换为双分支流程图（Plan Mode subgraph + TDD Mode subgraph），内容与 SKILL.md 第 543-595 行一致

### 0.5 阶段四实现细节增强

- [ ] 0.5a 将 SKILL.md.tmpl 的 4.2 逐 task 实现替换为双路径版本（plan mode + tdd mode），含后置验证门禁三步流程，内容与 SKILL.md 第 630-709 行一致
- [ ] 0.5b 在 4.2 末尾插入框架自适应验证命令表（Java/Python/Node/Go + 兜底），内容与 SKILL.md 第 692-702 行一致

### 0.6 阶段四检查清单增强

- [ ] 0.6a 将 SKILL.md.tmpl 的 4.3 code-audit 替换为含 AC-to-test 回溯检查项的版本，内容与 SKILL.md 第 711-739 行一致

### 0.7 验证报告 + 分支结束

- [ ] 0.7a 在 SKILL.md.tmpl 的 code-audit 与分支结束之间插入 4.4 验证报告生成段，内容与 SKILL.md 第 741-782 行一致
- [ ] 0.7b 更新 SKILL.md.tmpl 的 4.5 分支结束段，添加 verify-report.json 归档说明，内容与 SKILL.md 第 784-793 行一致

### 0.8 删除过时的 SKILL.md

- [ ] 0.8a 删除 `packages/reef/skills/reef-start/SKILL.md`（过时的构建产物）
      - 确认 build-registry.ts 不依赖 SKILL.md
      - 确认 tmpl 的 frontmatter 格式可以被 build-registry 正确解析

### 0.9 Phase 0 验证

- [ ] 0.9a 逐段对比 SKILL.md 与移植后的 SKILL.md.tmpl，确认无遗漏
- [ ] 0.9b `pnpm build` 通过，registry.json 正确包含 reef-start

---

## Phase 1：文档结构拆分

> 在 Phase 0 完成后的完整版 SKILL.md.tmpl 上执行。
> 文件路径：`packages/reef/skills/reef-start/`

## 1. 外置 superpowers-gate.md

- [ ] 1.1 从 SKILL.md.tmpl 提取两个模式的声明模板（Plan Mode + TDD Mode）、安全检查清单和 Red Flags，写入 `packages/reef/skills/reef-start/references/superpowers-gate.md`
      - 文件头部声明 `> 内容从 SKILL.md.tmpl 阶段三→四门闸段提取，按需读取`

- [ ] 1.2 从 SKILL.md.tmpl 中删除上述内容，替换为一行引用指令：
      ```
      执行[门闸声明]时，SEE: references/superpowers-gate.md
        - 声明模板 → 见该文件"Plan Mode / TDD Mode 声明模板"
        - 安全检查清单 → 见该文件"安全检查清单"
        - Red Flags → 见该文件"Red Flags"
      AI SHALL 在完成风险路由判断、输出 mode 声明前读取该文件。
      ```

## 2. 外置 stage-4-implementation.md

- [ ] 2.1 从 SKILL.md.tmpl 提取阶段四实现细节，写入 `packages/reef/skills/reef-start/references/stage-4-implementation.md`，包含：
      - 4.1 准备工作（获取 change 名、创建分支、记录计划文件路径）
      - 4.2 逐 task 实现（plan mode 和 tdd mode 两条路径的详细指令 + plan→tdd 升级逻辑 + mode 风险预警）
      - 框架自适应验证命令表（Java/Python/Node/Go + 兜底逻辑）
      - "完成一个 task 后"的后续步骤
      - 4.3 code-audit 检查清单（含 AC-to-test 回溯和 AC Coverage 格式）
      - 4.4 生成验证报告（JSON 格式定义 + 数据源映射表 + 摘要字段逻辑）
      - 4.5 分支结束处理（提交/PR/保留/丢弃 + verify-report 归档）

- [ ] 2.2 从 SKILL.md.tmpl 中删除上述内容，在对应位置替换为引用指令：
      ```
      执行阶段四时，SEE: references/stage-4-implementation.md
        - 4.2 逐 task 实现 → 见该文件"4.2 逐 task 实现"
        - 验证命令表 → 见该文件"框架自适应验证命令表"
        - 4.3 code-audit → 见该文件"4.3 code-audit"
        - 4.4 验证报告 → 见该文件"4.4 验证报告"
        - 4.5 分支结束 → 见该文件"4.5 分支结束"
      AI SHALL 在进入阶段四前读取 references/stage-4-implementation.md 了解实现细节。
      ```

## 3. MCP JSON 示例外置

- [ ] 3.1 将运行时 MCP 服务发现的 JSON 结构示例从 SKILL.md.tmpl 中删除
      - 保留流程描述："AI SHALL 读取 .claude/settings.json 确定可用 provider"
      - 删除 inline JSON 示例
      - 无需另建文件——JSON 示例不长，不影响流程理解

## 4. 关键原则段落精简

- [ ] 4.1 检查 SKILL.md.tmpl 末尾的"关键原则"和"注意事项"段落，确认是否有与正文重复的内容，如有则去重精简

## 5. 验证

- [ ] 5.1 确认外置文件内容完整：superpowers-gate.md 和 stage-4-implementation.md 的内容与被删除的原文一致
      - 逐段对比，确保无遗漏
      - 确保 markdown 格式正确（标题层级、列表缩进、代码块）

- [ ] 5.2 确认 SKILL.md.tmpl 流程图和行为逻辑不变
      - 阶段四入口 Mermaid 流程图拓扑不变
      - 风险路由卡（risk-routing-card.md）未被修改
      - 核心原则、mode 切换规则、门禁规则不变

- [ ] 5.3 `pnpm build` 通过，dist/ 目录包含新的 references 文件
