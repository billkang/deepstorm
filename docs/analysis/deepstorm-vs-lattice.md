# DeepStorm vs Lattice：全面对比

> 分析日期：2026-07-14

参考文档：[Lattice 项目分析](lattice-analysis.md)

---

## 定位差异

| 维度 | DeepStorm | Lattice |
|------|-----------|---------|
| 定位 | 全链路 AI 协同工具集（产品→开发→测试→运维） | Repo-local AI Coding Control Plane |
| 一句话 | "Spec 驱动的 AI 协同软件工程实践工具集" | "面向团队的 repo-local 工程控制面" |
| 语言/运行时 | TypeScript + pnpm monorepo → npm 包 | Bash 3.2+ + yq → 拷贝进业务仓库 |
| 安装方式 | `npx @deepstorm/cli setup` | `bash install.sh /path/to/project --init` |
| 依赖 | Node.js + npm | Bash + yq + git |
| 作者 | billkang | zdolphin07-dotcom |

## 架构范式差异

**Lattice：repo-local harness 范式**
- 拷贝脚本进业务仓库，变成 `.git` 的一部分
- 路径如 `lattice/kernel/delivery/pipeline.sh`
- 框架代码和项目资产分离在同一仓库

**DeepStorm：CLI tool + npm 包范式**
- 发布为 npm 包，通过 `deepstorm setup` 命令初始化
- 逻辑在 `packages/*/` 下，通过 skills + agents + hooks 实现协同
- 六套件覆盖全链路

## 工作流差异

| | DeepStorm (BMAD → OpenSpec) | Lattice (PrismSpec) |
|---|---|---|
| 需求讨论 | BMAD（多 agent 角色讨论） | Clarify → Grilling mode |
| Spec 规范 | OpenSpec 格式（MODULE-FEATURE-SUBFEATURE） | 目录化 spec（lattice/specs/\<spec-id\>/） |
| 任务推进 | /opsx:new → /opsx:apply → /opsx:verify → /opsx:archive | /prismspec → guide.sh --json 路由 |
| 实现模式 | 无显式 plan/tdd 档位 | risk-adaptive：plan 或 tdd |
| 变更粒度 | 每个 change 独立 Claude Code 会话 | 每个 spec 为一个原子交付单元 |
| 验证 | Sweep 套件（E2E Playwright） | pipeline.sh + 6 个 gates |

## 覆盖范围

```
DeepStorm 全链路:                    Lattice 聚焦:
┌─────────────────────┐             ┌─────────────────┐
│ Tide   — 产品侧     │             │ PrismSpec       │
│         BMAD + PRD  │             │  (Spec Coding)  │
├─────────────────────┤             ├─────────────────┤
│ Reef   — 开发侧     │             │ Orchestrator    │
│         规范+代码    │             │  (状态路由)      │
├─────────────────────┤             ├─────────────────┤
│ Sweep  — 测试侧     │             │ Context         │
│         生成+CI      │             │  (知识治理)      │
├─────────────────────┤             ├─────────────────┤
│ Atoll  — 运维侧     │             │ Verification    │
│         部署+监控    │             │  (Gates/Pipe)   │
├─────────────────────┤             ├─────────────────┤
│ Pilot  — 自动领航   │             │ Evidence/Eval   │
│         Harness Agent│             │  (证据闭环)      │
└─────────────────────┘             └─────────────────┘
```

## Lattice 值得 DeepStorm 借鉴的设计

1. **风险自适应的 execution mode（plan vs tdd）** — DeepStorm 目前没有类似档位
2. **证据闭环**（verify.md + 结构化 eval JSON + 历史 dashboard）
3. **Manifest 自动检测**（init.sh 自动检测项目框架并生成配置）
4. **最小必要契约哲学** — 不是每件事都需要完整流程
5. **后置验证门禁** — Agent 说完成了还不够，命令必须证明

## 直白比喻

> DeepStorm 像 AI 协同的"全栈框架" — 定义整套方法、工具和流程
> Lattice 像 AI 协同的"eslint + jest + CI config" — 在仓库里加一层契约、验证和证据
