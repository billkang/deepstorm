## 1. CLI 核心层 — scope-detection

- [x] 1.1 创建 `packages/reef/hooks/reef-scope-check.sh`：接收 git diff 输入，调用 LLM API 分析业务领域，输出 JSON 报告
- [x] 1.2 设计并实现 LLM prompt 模板，包含领域分类指令和结构化 JSON schema 约束
- [x] 1.3 实现分支范围分析 CLI 入口：`reef scope check`，支持标准输入 diff 或自动获取当前分支 diff
- [x] 1.4 实现 diff 大小截断/采样策略，控制 API 调用成本和 token 消耗
- [x] 1.5 实现 API 调用 fallback 模式（网络不可用时告警但不阻断）

## 2. CLI 核心层 — scope-gate

- [x] 2.1 实现 `reef scope check` 的 exit code 输出逻辑：单领域返回 0，多领域返回非 0
- [x] 2.2 实现格式化阻断报告输出（包含检测领域、可信度、分类解释、拆分建议）
- [x] 2.3 实现 `reef scope gate` 命令，整合检测 + 阻断逻辑
- [x] 2.4 实现 `.deepstorm/scope-config.json` 配置文件的读写，支持 enable/disable 开关
- [x] 2.5 实现配置文件的领域对齐模式（可选：预设领域列表）

## 3. git hook 安装

- [x] 3.1 实现 `reef scope setup` 命令，安装 pre-commit hook 到 `.git/hooks/pre-commit`
- [x] 3.2 实现 chain 模式安装：追加到已有 pre-commit hook，不覆盖
- [x] 3.3 实现 `reef scope uninstall` 命令，移除 pre-commit hook
- [x] 3.4 实现 pre-commit hook 脚本本体：收集当前分支 diff → 调用 `reef scope gate` → 根据结果阻断或放行

## 4. CI 门禁集成

- [x] 4.1 创建 CI 门禁脚本：支持 `reef scope ci-check` 接受 PR diff 作为输入
- [x] 4.2 编写 CI 门禁集成文档（GitHub Actions / GitLab CI 配置示例）
- [x] 4.3 实现 CI 门禁配置项（在 scope-config.json 中区分本地 vs CI 的 enable/disable）

## 5. 拆分能力 — branch-splitting

- [x] 5.1 实现 `reef scope split` 命令：基于检测结果和用户确认，生成拆分方案
- [x] 5.2 实现拆分方案预览输出（展示每个子分支包含的文件和说明）
- [x] 5.3 实现用户确认交互（y/N 确认，支持选择性的分支排除）
- [x] 5.4 实现拆分执行逻辑：创建新分支 → 按领域整理文件 → 生成 commit message → 提交
- [x] 5.5 实现共有文件处理策略（多个领域共有的文件归入主要变更领域）
- [x] 5.6 实现拆分前自动备份（git stash）和 rollback 能力

## 6. reef skill 交互层

- [x] 6.1 创建 `packages/reef/skills/reef-scope/SKILL.md`：定义 `reef scope` 系列的 skill 文档
- [x] 6.2 在 SKILL.md 中定义 scope check、scope gate、scope split 的用户调用流程
- [x] 6.3 实现 reef agent（可选）：`packages/reef/agents/reef-scope-analysis.md`
- [x] 6.4 集成到 `reef-commit` skill：在现有提交流程中前置 scope check 检查

## 7. 测试

- [x] 7.1 编写 scope-detection 单元测试（mock LLM API 响应）
- [x] 7.2 编写 scope-gate 测试（单领域通过、多领域阻断、豁免场景）
- [x] 7.3 编写 branch-splitting 测试（拆分方案生成、执行、rollback）
- [x] 7.4 编写 hook 安装/卸载测试

## 8. 文档

- [x] 8.1 编写 `docs/reef-scope-validation.md` 用户文档（安装、配置、使用、FAQ）
- [x] 8.2 更新 `reef` README 添加本能力说明
- [x] 8.3 更新 CHANGELOG
