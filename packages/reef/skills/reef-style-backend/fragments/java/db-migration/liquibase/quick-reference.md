# Liquibase 数据库迁移规范

## 概述

使用 Liquibase 进行数据库版本管理，所有 Schema 变更通过 changelog 文件管理。

## 文件结构

```
src/main/resources/db/changelog/
  db.changelog-master.yaml     // 主入口文件
  v1.0.0/
    v1.0.0-001-create-users.yaml
    v1.0.0-002-create-orders.yaml
    v1.0.0-003-add-email-index.yaml
  v1.1.0/
    v1.1.0-001-add-profile-table.yaml
```

## 主入口文件

```yaml
# db.changelog-master.yaml
databaseChangeLog:
  - include:
      file: db/changelog/v1.0.0/v1.0.0-001-create-users.yaml
  - include:
      file: db/changelog/v1.0.0/v1.0.0-002-create-orders.yaml
  - include:
      file: db/changelog/v1.1.0/v1.1.0-001-add-profile-table.yaml
```

## Changeset 示例

```yaml
# v1.0.0-001-create-users.yaml
databaseChangeLog:
  - changeSet:
      id: v1.0.0-001
      author: developer
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
                    nullable: false
              - column:
                  name: name
                  type: VARCHAR(100)
                  constraints:
                    nullable: false
              - column:
                  name: email
                  type: VARCHAR(255)
                  constraints:
                    unique: true
                    nullable: false
              - column:
                  name: created_at
                  type: TIMESTAMP
                  defaultValueComputed: CURRENT_TIMESTAMP
```

## changeset 命名

```
格式: {version}-{seq}-{description}
示例: v1.0.0-003-add-email-index
```

## 回滚

```yaml
# 每个 changeset 应可回滚
- changeSet:
    id: v1.2.0-001
    author: developer
    changes:
      - addColumn:
          tableName: users
          columns:
            - column:
                name: phone
                type: VARCHAR(20)
    rollback:
      - dropColumn:
          tableName: users
          columnName: phone
```

## 最佳实践

- ✅ 每个 changeset 有唯一 ID
- ✅ 每个 changeset 只做单一变更（创建表、加索引、加字段）
- ✅ 变更不可修改已发布的 changeset（追加新 changeset）
- ✅ 生产环境使用 `context` 标签控制不同环境数据
- ❌ 不在 changeset 中使用存储过程
- ❌ 不修改已合并到主干的 changeset
