# Tasks — reef-start Lattice Adaptation

> 按依赖顺序排列，每组内任务可并行。

## 1. 风险路由卡与 mode 选择

- [x] 1.1 新增 `packages/reef/skills/reef-start/references/risk-routing-card.md` — 风险路由卡参考文档，包含：
      - 风险因子 → plan/tdd 对照表（文档/配置 → plan，新增业务逻辑 → tdd 等）
      - 执行策略差异表（plan vs tdd 的验证要求、失败重试、代码审查）
      - 规则说明（plan→tdd 允许升级，tdd→plan 禁止降级）
      - plan mode 的决定性特征标记

- [x] 1.2 修改 SKILL.md 的 superpowers 门禁段（行 365-421），增加：
      - 风险路由卡引用和风险判断流程
      - mode 选择输出模板（风险判断表 + 推荐 mode + 推荐理由）
      - 用户确认等待机制
      - plan mode 的 rigid 纪律模板（与 tdd 共享现有 rigid 声明）

- [x] 1.3 修改 SKILL.md 的阶段四入口流程图，增加 plan mode 分支：
      - 门闸通过后增加模式判断节点
      - plan mode 分支：直接实现 → build/lint/test 验证 → 标记完成
      - tdd mode 分支：保持现有 RED→GREEN→REFACTOR 不变

- [x] 1.4 修改 SKILL.md 的阶段四核心原则段，补充 plan mode 原则：
      - "plan mode 下先直接实现，再后置验证"
      - "plan mode 中复杂度超预期时主动升级为 tdd mode"

- [x] 1.5 修改 SKILL.md 的 4.2 逐 task 实现段，增加 plan mode 执行路径：
      - plan mode 的直接实现流程
      - plan mode 的验证门禁（引用 2.1 的验证步骤）
      - plan→tdd 升级逻辑

## 2. 后置验证门禁

- [x] 2.1 修改 SKILL.md 的阶段四"完成一个 task 后"段，增加验证门禁步骤：
      - 在"标记 tasks.md"之前插入 build + lint + test 强制验证
      - 验证失败处理流程（输出错误 → 修复 → 重新验证 → 通过才标完成）
      - step-by-step 验证模板

- [x] 2.2 在 SKILL.md 中补充框架自适应验证命令说明（Java→mvn，Python→ruff+pytest，Node→npm run build/lint/test）
      - 验证命令推断逻辑
      - 兜底机制（无法推断时询问用户）

## 3. 项目上下文地图

- [x] 3.1 新增 `.deepstorm/context.md` 模板文件 — 包含四个区块：技术栈、关键模块、历史踩坑、外部引用

- [x] 3.2 修改 `packages/cli/src/commands/init.ts` + `packages/cli/src/commands/setup.ts` — CLI init/setup 执行时：
      - 初始化 `.deepstorm/context.md` 模板
      - 在 CLAUDE.md 末尾追加一行 `> 项目事实见 .deepstorm/context.md`

- [x] 3.3 修改 SKILL.md 的阶段一（Path A），在 1.5 获取设计稿后增加：
      - 对比当前 `.deepstorm/context.md` 与阶段一采集的项目信息
      - 有实质性变化时更新 context.md
      - 输出更新摘要

- [x] 3.4 修改 SKILL.md 的阶段一（Path B），在 B1.4 产出 brainstorming 文件后增加：
      - 同样的 context.md 检测更新逻辑

## 4. AC-to-Test Trace

- [x] 4.1 修改 SKILL.md 的 4.3 code-audit 段，在检查清单中增加：
      - 描述：显式回溯每个 AC 到对应的测试文件+方法
      - AC Coverage 输出格式模板
      - 高风险 AC 遗漏要求补测，低风险 AC 可豁免但记录

## 5. 统一证据收敛

- [x] 5.1 修改 SKILL.md，在 4.3 code-audit 和 4.5 分支结束之间，新增 4.4 验证报告生成步骤：
      - 定义 verify-report.json 格式（引用 `specs/verification-report/spec.md`）
      - 汇总后置验证结果、AC trace 结果、code-audit 结果
      - 写入 `openspec/changes/<change>/verify-report.json`
      - 确认后再进入分支结束处理

- [x] 5.2 修改 SKILL.md 的 4.5 分支结束段，提及 verify-report.json 随 change 目录归档

## 6. 验证与新功能可用性确认

- [x] 6.1 确认所有 SKILL.md 修改完整一致，无冲突或矛盾
      - 检查流程图的 superpowers 门禁 → 阶段四 → code-audit → verify-report → 分支结束的完整性
      - 检查 mode 选择不会影响现有 Path A/Path B 的分支路由逻辑
      - 检查 plan mode 与 tdd mode 的分支合并后流程一致性

- [x] 6.2 确认 CLI setup 修改可用
      - `pnpm build` 通过
      - `pnpm --filter @deepstorm/cli test` 530 测试全部通过

- [x] 6.3 检查 context.md 模板初始化逻辑与 SKILL.md 阶段一的更新逻辑一致
