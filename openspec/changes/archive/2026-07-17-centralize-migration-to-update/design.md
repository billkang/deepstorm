# Design: 旧数据源迁移集中化

## Context

DeepStorm 的配置数据源原本分散在多个位置：`.claude/settings.json`（deepstorm 字段）、`.env`（BASE_URL 变量）、`.sweep-init`（标记文件）、`.deepstorm/scope-config.json`。v0.9.0 将这些配置统一收口到 `.deepstorm/settings.json`，但旧数据源的兼容读取逻辑仍保留在各消费代码中。

本 change 将兼容逻辑统一迁移到 `deepstorm update` 命令，使消费代码无需再做兼容判断。

## Goals / Non-Goals

### Goals

- `deepstorm update` 能检测并迁移 4 类旧数据源
- 消费代码不再包含旧数据源的 fallback 读取逻辑
- 旧数据源迁移后自动删除/清理
- 迁移过程不阻塞主流程（warning 级别容错）
- 已有代码（`update.ts` 中的迁移逻辑 + `env-manager.mjs` 清理）保留不动

### Non-Goals

- 新增其他数据源的收口能力（scope-config.json 是最后一块，已覆盖）
- 修改数据格式或内容（迁移保持原有语义）
- 自动检测新增旧数据源（仅覆盖已知的 4 类）
- 不修改 `.mcp.json`、`context.md`、`pilot-state.json` 等文件（它们不属于"配置收口"范畴）

## Decisions

| 决策 | 选择 | 备选方案 | 理由 |
|------|------|---------|------|
| 迁移时机 | `deepstorm update` 执行时 | 独立 migrate 命令 / 构建时自动迁移 | update 已是升级入口，用户主动运行；独立命令多一个学习成本 |
| 迁移策略 | Watermark（不覆盖） | 覆盖优先 / 总是覆盖 | 已有配置的用户不应被旧数据冲掉；但不保留旧数据源（避免混淆） |
| 数据合并 | deepMerge | 单层覆写 / 手动逐字段复制 | settings.json 是深层对象，deepMerge 保证不丢失已有层级 |
| 消费代码清理 | 一个 PR 全部清理 | 分批逐步清理 | 用户在同一个 change 中要求完成所有清理，且规模不大（6 个文件） |
| .env 清理 | 仅移除 BASE_URL/DEFAULT_ENV 行，保留其他行 | 整个 .env 文件迁移 | .env 中还可能包含 API Key 等秘钥，不属于 DeepStorm 配置范畴 |
| 测试模式 | temp dir（mkdtemp）+ chdir 隔离 | mock 文件系统 / 注入路径参数 | 无需改动函数签名，测试隔离性好 |
| 已有代码保留 | 已实现的 `update.ts` + `env-manager.mjs` 保留不动 | 重新按 TDD 流程实现 | 用户明确要求"已写代码保留" |

### 迁移优先级

迁移顺序按影响范围从小到大排列：
1. `.claude/settings.json` deepstorm 字段 — 只影响 CLI 自身
2. `.sweep-init` — 标记文件，清理最简单
3. `.env` BASE_URL — 可能包含秘钥，需要谨慎处理
4. `.deepstorm/scope-config.json` — 最后清理，有独立的文件

### Watermark 详细规则

```
if 旧数据源存在:
    if 目标字段在 settings.json 中已存在:
        不写 settings.json
        删除旧数据源
        log "XX 已删除（目标已存在，未覆盖）"
    else:
        deepMerge 旧数据 → settings.json
        删除/清理旧数据源
        log "✔ 已迁移 XX → YY"
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 迁移过程中断（如 update 命令被杀） | 可能处于半迁移状态（部分旧数据源被删、部分未删） | 迁移不从旧数据源读取数据，断开前后数据完整；update 可重复执行，已迁移项不再重做（旧文件已删） |
| .env 文件写入竞争 | 多个进程同时修改 .env | 非并发场景（CLI 单进程）；文件写操作使用 writeFileSync 保证原子性 |
| 用户手动还原旧数据源 | 与新 settings.json 数据不一致 | 不可恢复的设计收益：用户再运行一次 update 即可重新迁移 |
| scope-config.json 迁移后，用户恢复该文件 | 旧文件被删后 update 不再检测 | 不覆盖场景本身合理——scope-config.json 已明确不再使用 |
