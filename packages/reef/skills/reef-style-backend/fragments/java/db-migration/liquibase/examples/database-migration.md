# 数据库迁移（Liquibase）

## ChangeSet 格式

- ID：`YYYYMMDDHHMM-NNN`（如 `202405231200-001`）
- 添加新变更：在 `changelogs/` 目录创建新 XML 文件，无需修改 master changelog（`<includeAll>` 自动扫描）
- 文件按时间命名排序以控制执行顺序

## 属性替换

主 changelog 定义了数据库类型变量以支持多数据库（H2 开发/测试，MySQL/PG/MSSQL 生产）：

| 变量 | 用途 |
|------|------|
| `${boolean.type}` | 布尔类型 |
| `${string.type}(255)` | 字符串 VARCHAR/NVARCHAR |
| `${date.time.type}` | 日期时间 TIMESTAMP/DATETIME/DATETIME2 |
| `${clob.type}` | 大文本 CLOB/LONGTEXT/TEXT/NVARCHAR(MAX) |
| `${enum.ordinal.type}` | 枚举序号类型 |

枚举类型在不同数据库中处理方式不同：H2/MySQL 用 `ENUM(...)` 原生枚举，PG/MSSQL 用 `${string.type}(255)`。枚举属性命名规则：`${<module>.<enum-name>.type}`。

## 完整示例

### 建表（序列 + 表 + 外键，省略 XML namespace）

```xml
<!-- 序列（H2/PG/MSSQL 用序列，MySQL 用序列表模拟） -->
<changeSet author="lgong" id="202604062320-004" dbms="h2,postgresql,mssql">
  <createSequence sequenceName="my_entity_seq" startValue="1" incrementBy="50" />
</changeSet>
<changeSet author="lgong" id="202604062320-004" dbms="mysql">
  <createTable tableName="my_entity_seq">
    <column name="next_val" type="BIGINT" />
  </createTable>
  <insert tableName="my_entity_seq"><column name="next_val" value="1" /></insert>
</changeSet>

<changeSet author="developer" id="202604062320-005">
  <createTable tableName="my_entity">
    <column name="id" type="BIGINT"><constraints nullable="false" primaryKey="true" primaryKeyName="myEntityPK" /></column>
    <column name="created_at" type="${date.time.type}" />
    <column name="name" type="${string.type}(255)"><constraints nullable="false" /></column>
    <column name="enabled" type="${boolean.type}"><constraints nullable="false" /></column>
    <column name="dtype" type="${string.type}(31)"><constraints nullable="false" /></column>
  </createTable>
</changeSet>

<changeSet author="developer" id="202604062320-006">
  <addColumn tableName="my_entity"><column name="app_id" type="BIGINT" /></addColumn>
</changeSet>
<changeSet author="developer" id="202604062320-007">
  <addForeignKeyConstraint constraintName="FKmyentity_app"
    baseTableName="my_entity" baseColumnNames="app_id"
    referencedTableName="application" referencedColumnNames="id" />
</changeSet>
```

### 新增字段 / 修改字段类型

```xml
<changeSet author="developer" id="202605111000-01">
  <addColumn tableName="my_entity"><column name="new_field" type="${string.type}(255)" /></addColumn>
</changeSet>
<!-- 可空→非空需先填充数据 -->
<changeSet author="developer" id="202605111000-02">
  <addNotNullConstraint tableName="my_entity" columnName="new_field"
    columnDataType="${string.type}(255)" defaultNullValue="默认值" />
</changeSet>
<changeSet author="developer" id="202604281406">
  <modifyDataType tableName="my_entity" columnName="choices" newDataType="${string.list.type}" />
</changeSet>
```

### 索引 / 唯一约束 / 外键

```xml
<changeSet author="developer" id="202605081601">
  <createIndex indexName="IDXm64b01r9rj9aco9it9puvg9tb" tableName="my_entity">
    <column name="app_id" />
  </createIndex>
</changeSet>

<changeSet author="developer" id="202604062320-028" dbms="h2,mysql,postgresql">
  <addUniqueConstraint constraintName="UC_MYENTITYSLUG_COL"
    tableName="my_entity" columnNames="slug" />
</changeSet>

<changeSet author="developer" id="202604211125-10">
  <addForeignKeyConstraint constraintName="FKhoumjjymjhbu0oiwh6ynyio6u"
    baseTableName="my_entity" baseColumnNames="app_id"
    referencedTableName="application" referencedColumnNames="id" />
</changeSet>
```

### 删除操作 / 自定义 SQL

```xml
<changeSet author="developer" id="202604211125-03">
  <dropColumn tableName="my_entity" columnName="old_column" />
</changeSet>
<changeSet author="developer" id="202604211125-02">
  <dropUniqueConstraint constraintName="UC_APPLICATIONNAVIGATION_MENU_ID_COL" tableName="application" />
</changeSet>
<changeSet author="developer" id="202605081101">
  <dropForeignKeyConstraint constraintName="FKjr9mly7obkthhxdr0hk29r88t" baseTableName="my_entity" />
</changeSet>
<changeSet author="developer" id="202605210012-03">
  <sql>UPDATE form_revision SET revisions_order = (SELECT COUNT(*) FROM (SELECT id, form_id FROM form_revision) AS fr2 WHERE fr2.form_id = form_revision.form_id AND fr2.id &lt; form_revision.id)</sql>
</changeSet>
```

## SQL Server 特殊处理

可空列的唯一约束使用过滤索引：

```xml
<changeSet author="developer" id="..." dbms="mssql">
  <createIndex indexName="UC_TABLENAME_COL" tableName="table" unique="true">
    <column name="column_name" />
  </createIndex>
  <modifySql><append value=" WHERE column_name IS NOT NULL" /></modifySql>
</changeSet>
```

## 最佳实践

- 新增字段必须设为可空（默认），若需非空则先填充数据再 `addNotNullConstraint`
- 序列命名 `<table_name>_seq`，`startValue=1, incrementBy=50`（匹配 Hibernate 默认序列优化）
- 同一 table 的多次 `addColumn` 合并到一个 changeset
- 先 `dropForeignKeyConstraint` 再 `createIndex` 是常见模式
