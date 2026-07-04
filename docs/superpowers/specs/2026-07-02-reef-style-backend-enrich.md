# reef-style-backend 跨维度能力丰富

## 背景

CLAUDE.md 中已记录了项目级后端规范（日志框架、Error Prune 配置、CVE 扫描等），但这些规范缺少对应的技能级别支持。现有 reef-style-backend 技能只覆盖了 Controller/Service/Repository/ORM 等编码层面的规范，缺少以下跨维度能力：

1. **API 规范** — RESTful 命名习惯、统一响应体、错误码格式
2. **依赖管理** — Version Catalog、版本一致性、CVE 扫描
3. **异常处理深度** — 业务异常层次、错误码枚举约定
4. **安全红线** — 禁止明文密码、SQL 拼接、硬编码密钥

## 设计

### 方案

在 reef-style-backend 技能中新增 4 个独立 fragment，每个 fragment 包含自己的 `quick-reference.md` + 可选示例文件。Java 和 Python 各一套。

### 文件结构

```
fragments/
├── java/
│   ├── api-spec/quick-reference.md
│   ├── dependency-management/quick-reference.md
│   ├── exception-handling/quick-reference.md
│   ├── exception-handling/examples/error-code-enum.md
│   └── security-redlines/quick-reference.md
└── python/
    ├── api-spec/quick-reference.md
    ├── dependency-management/quick-reference.md
    ├── exception-handling/quick-reference.md
    └── security-redlines/quick-reference.md
```

### Wizard 集成

这些能力按语言自动安装（用户无需额外勾选）：

- `wizard.json` Java 语言级选项新增 `fragments` 数组
- `wizard.json` Python 语言级选项新增 `fragments` 数组
- `SKILL.md.tmpl` 新增 4 个维度的条件引用区块（Java 和 Python 各一套）

### 安装路径

CLI 的 `setup.ts` 中 `copyFragmentsForSkill` 负责将 fragment 文件展开到技能根目录：

```
fragments/java/api-spec/quick-reference.md → {skill_root}/api-spec.md
fragments/java/security-redlines/quick-reference.md → {skill_root}/security-redlines.md
```

变体文件 `variants/java/quick-reference.md` 被安装为 `{skill_root}/quick-reference.md`，因此 fragment 引用使用 `api-spec.md` 相对路径（不需要 `../`）。

### 每个能力覆盖

| 能力 | Java | Python |
|------|------|--------|
| API 规范 | 速查表 + 统一响应体代码 + OpenAPI 注解 + 版本策略 + 分页 + 错误码命名 | 速查表 + FastAPI 统一响应 + OpenAPI + 分页 |
| 依赖管理 | Gradle Version Catalog + 禁止硬编码 + 一致性 + Gradle Versions Plugin + CVE | pyproject.toml + uv + 禁止通配符 + uv audit |
| 异常处理深度 | BusinessException 层次 + ErrorCode 枚举 + GlobalExceptionHandler | AppError(HTTPException) 层次 + ErrorCode 枚举 + exception_handler |
| 安全红线 | 6 条 P0/P1 红线（BCrypt + SQL 注入 + @PostConstruct + 密钥 + 脱敏 + 文件上传） | 7 条 P0/P1 红线（bcrypt + SQL + 密钥 + 脱敏 + 输入验证 + CORS + 调试接口） |

## 未讨论范围

- CLAUDE.md 本身的更新（项目特有的日志/Error Prune 配置项属于用户自行决定的范围）
- reef-review-backend agent 的 review 维度更新（在审查 agent 中增加这些维度的专项检查）
- reef-gen-backend 生成流程中自动引用新 fragment

## 关键决策

| 决策 | 选项 | 选择理由 |
|------|------|---------|
| fragment vs 直接更新 spring-boot | 独立 fragment | 这些能力是跨维度的（不依赖特定框架），独立后 Java/Python 共用同一入口 |
| always-on vs 可选勾选 | always-on | 这些是后端项目的通用规范，无理由不加载 |
| 现有内容是否删除 | 保留 | 避免破坏已有依赖；新 fragment 提供深度补充 |
