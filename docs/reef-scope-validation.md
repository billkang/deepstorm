# Reef 分支范围验证 (Branch Scope Validation)

## 概述

分支范围验证是 reef 的开发治理能力之一。它通过 AI 语义分析每次提交的 diff 内容，自动识别变更涉及的业务领域。如果发现一个分支包含多个业务领域的变更，会阻断提交并给出拆分建议。

## 安装

### 前置条件

- 已安装 DeepStorm reef （参考 `CLAUDE.md`）
- 已配置 `.env` 中的 `ANTHROPIC_API_KEY` 或 `OPENAI_API_KEY`

### 安装步骤

```bash
# 1. 安装 pre-commit hook 和配置文件
bash packages/reef/hooks/reef-scope-setup.sh install

# 2. 验证安装
bash packages/reef/hooks/reef-scope-setup.sh status
```

安装后在 `.deepstorm/scope-config.json` 生成配置文件：

```json
{
  "enabled": true,
  "ciEnabled": true,
  "domains": [],
  "description": "分支范围检查配置",
  "note": "domains 为空时使用 AI 自由分类。可在此列出项目业务领域以实现对齐。"
}
```

## 卸载

```bash
bash packages/reef/hooks/reef-scope-setup.sh uninstall
```

## 配置

### 启用/禁用

编辑 `.deepstorm/scope-config.json`：

```json
{
  "enabled": false,      # 关闭本地 commit 门禁
  "ciEnabled": true       # CI 门禁保持开启
}
```

### 业务领域对齐

默认模式为 AI 自由分类。如需精确对齐到项目业务领域：

```json
{
  "domains": ["order", "payment", "user", "inventory", "notification"]
}
```

设置后，AI 会将 diff 归类到这些领域中，而非自由创建领域名称。

## 使用

### 日常开发

安装后，每次 `git commit` 自动触发范围检查：

```bash
# 单领域 commit → 正常通过
git commit -m "fix: order calculation"

# 多领域 commit → 被阻断
git commit -m "feat: order and payment changes"
# 🚫 阻断！检测到 order + payment 两个领域
```

### 当被阻断时

```bash
# 1. 查看拆分方案
bash packages/reef/hooks/reef-scope-split.sh

# 2. 审阅方案后确认，自动创建分支
# 系统会创建 feat/order-xxx 和 feat/payment-xxx 两个分支

# 3. 切换到子分支继续工作
git checkout feat/order-xxx
```

### 手动检查

```bash
# 检查当前分支范围
bash packages/reef/hooks/reef-scope-check.sh

# 指定基准分支
bash packages/reef/hooks/reef-scope-check.sh --diff-from develop

# 原始 JSON 输出（供程序使用）
bash packages/reef/hooks/reef-scope-check.sh --raw
```

## CI 集成

### GitHub Actions

```yaml
# .github/workflows/scope-check.yml
name: Branch Scope Check
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  scope-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check branch scope
        run: |
          bash packages/reef/hooks/reef-scope-ci.sh \
            --diff-from ${{ github.base_ref }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
scope-check:
  stage: lint
  script:
    - bash packages/reef/hooks/reef-scope-ci.sh
      --diff-from $CI_MERGE_REQUEST_TARGET_BRANCH_NAME
  only:
    - merge_requests
```

## 架构

```
┌──────────────────────────────────────────────┐
│          用户交互层 (SKILL.md)                │
│  reef scope 系列命令入口                      │
├──────────────────────────────────────────────┤
│         CLI 核心层 (shell scripts)            │
│  ┌─────────────────────────────────────────┐ │
│  │ reef-scope-check.sh: AI 语义分析 + JSON  │ │
│  │ reef-scope-gate.sh: 门禁判定 + 阻断报告   │ │
│  │ reef-scope-split.sh: 分支拆分执行        │ │
│  │ reef-scope-ci.sh: CI 门禁适配            │ │
│  └─────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│           执行层                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ git hook │  │ CI 脚本  │  │  手动调用  │ │
│  │ pre-commit│  │ 门禁步骤 │  │  命令行    │ │
│  └──────────┘  └──────────┘  └────────────┘ │
└──────────────────────────────────────────────┘
```

## API Key 配置

在项目 `.env` 文件中配置：

```bash
# 推荐: Claude API
ANTHROPIC_API_KEY=sk-ant-...

# 备选: OpenAI API
OPENAI_API_KEY=sk-...
```

配置后无需重启，下次检查自动生效。

## 排障

| 问题 | 原因 | 解决 |
|------|------|------|
| "API 调用失败" | 未配置 API Key 或网络不可用 | 配置 `.env` 中的 API Key |
| 误阻断 | AI 分类不准 | 在配置中设置 `domains` 领域对齐列表 |
| 不想检查 | 临时需要跳过 | 配置 `enabled: false` 或 `git commit --no-verify` |
| hook 不生效 | 未安装或已卸载 | 运行 `scope-setup.sh install` |
