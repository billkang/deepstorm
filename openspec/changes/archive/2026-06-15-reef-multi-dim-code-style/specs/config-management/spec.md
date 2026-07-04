## ADDED Requirements

### Requirement: 配置模型支持嵌套结构

`deepstorm` 命名空间的配置模型 SHALL 支持从扁平结构扩展为嵌套多维结构。

#### Scenario: 新配置结构
- **WHEN** 用户完成多维配置
- **THEN** `.claude/settings.json` 中的 `deepstorm.reef` 存储为:
  ```json
  {
    "deepstorm": {
      "reef": {
        "frontend": {
          "framework": "angular",
          "tsConfig": "strict",
          "css": "tailwind",
          "test": "playwright"
        },
        "backend": {
          "language": "java",
          "java": {
            "framework": "spring-boot",
            "orm": "hibernate",
            "dbMigration": "liquibase",
            "ai": "spring-ai"
          }
        }
      }
    }
  }
  ```

#### Scenario: config set 支持嵌套路径
- **WHEN** 用户运行 `deepstorm config set reef.frontend.css=scss`
- **THEN** CLI SHALL 正确解析嵌套路径 `reef.frontend.css`
- **THEN** 按路径创建嵌套对象结构
- **THEN** `deepstorm.reef.frontend.css` 的值更新为 `"scss"`

### Requirement: 旧配置自动迁移

CLI SHALL 在读取旧配置时自动检测并迁移到新结构。

#### Scenario: 检测旧格式
- **WHEN** `.claude/settings.json` 中的 `deepstorm.reef` 为:
  ```json
  {
    "frontend": { "framework": "angular" },
    "backend": { "language": "java" }
  }
  ```
- **THEN** CLI SHALL 检测到缺少 `frontend.tsConfig`、`frontend.css`、`frontend.test`、`backend.java.*` 等字段
- **THEN** CLI SHALL 自动填充缺失字段为默认值 `"none"`
- **THEN** CLI SHALL 写回 `.claude/settings.json`

#### Scenario: setup reconfigure 后写入新结构
- **WHEN** 用户运行 `setup --reconfigure`
- **THEN** CLI SHALL 写出新结构的完整配置（包含所有默认值）

### Requirement: 版本标记

CLI SHALL 在配置中标记配置格式版本，便于未来结构变更时的迁移判断。

#### Scenario: 配置版本
- **WHEN** 首次写入或迁移配置
- **THEN** SHALL 写入 `deepstorm.configVersion` 字段，值为 `1`
- **THEN** 后续结构变更时版本号递增
- **THEN** CLI 读取时检查版本号，旧版本自动触发迁移逻辑
