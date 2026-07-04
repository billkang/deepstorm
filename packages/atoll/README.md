# Atoll — 运维侧套件

**Atoll**（环礁）是 DeepStorm 运维侧套件，提供部署辅助、监控查询、故障排查等运维能力。

> 🏝️ 环礁为珊瑚礁生态系统提供保护屏障——Atoll 保障服务的稳定运行。

> 当前为规划阶段，功能待实现。

---

## 规划中的核心功能

- CI/CD 集成与流水线管理
- 监控平台查询与告警分析
- 云平台操作与资源管理
- 故障响应与排查辅助

---

## 组件

| 组件 | 说明 | 状态 |
|------|------|------|
| **Skill: `atoll-ops`** | 运维工作流指南 | ✅ 就绪 |
| **MCP Server: `atoll`** | 运维工具后端（规划中） | ⏳ 规划 |

---

## 开发指南

```bash
# 从 monorepo 根目录
pnpm install

# 验证语法
pnpm run validate

# 通过 CLI 安装
npx @deepstorm/cli setup
```

### 项目结构

```
packages/atoll/
├── skills/
│   └── atoll-ops/
│       └── SKILL.md         # 运维工作流 skill
├── wizard.json              # 向导配置（预留）
├── README.md
└── package.json
```

> 注意：MCP 服务器配置统一集中在 `packages/cli/mcp/`。`.mcp.json` 已从各 package 中移除。

---

## 相关套件

| 套件 | 定位 | 类型 |
|------|------|------|
| [Tide](../tide/README.md) | 产品侧 — BMAD 需求、PRD | 套件 |
| [Reef](../reef/README.md) | 开发侧 — 代码实现、架构合规 | 套件 |
| [Sweep](../sweep/README.md) | 测试侧 — 测试生成、覆盖率、CI | 套件 |

---

## 许可

MIT &copy; 2026 DeepStorm Team
