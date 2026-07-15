# BMAD / grill-me 自动安装 — 需求讨论

- **日期：** 2026-07-15
- **参与角色：** 用户（billkang）
- **类型：** Tide 套件增强

## 讨论内容

Tide 安装时，自动帮用户安装 bmad-method 和 grill-me 两个前置依赖，避免用户手动操作。

## 关键决策

| 问题 | 决策 |
|------|------|
| 安装时机 | 安装向导结束时统一执行 |
| bmad 安装方式 | `npx bmad-method install` |
| grill-me 安装方式 | git clone 对应仓库，将 SKILL.md 复制到 `.claude/skills/grill-me/` |
| 是否可选 | **必须**安装；失败时提示用户手动安装，或提示使用重新安装命令重试 |
| 影响范围 | `packages/cli/src/commands/setup.ts`（安装流程）、`packages/tide/wizard.json`（Tide 配置标识） |

## 后续步骤

1. 创建 OpenSpec change → `feat/tide-auto-install-bmad-grill`
2. 产出 proposal → specs → design → tasks
3. TDD apply 实现
