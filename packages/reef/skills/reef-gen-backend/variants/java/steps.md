# Java 后端编码步骤

按以下顺序逐块编写，依赖关系由前向后：

1. **Entity** — 实体类，定义表结构（JPA 注解、表名、字段映射）
2. **DTO** — 数据传输对象，匹配实体层次
3. **Mapper** — MapStruct 映射，连接 Entity ↔ DTO
4. **Repository** — 数据访问（Spring Data JPA），多租户安全查询
5. **Service** — 业务逻辑，事务管理
6. **Controller** — REST API，请求/响应

每完成一块对照 `reef:reef-style-backend` 中对应章节检查。

## 注释要求

每类文件必须包含以下注释（缺少则视为未完成）：

| 文件类型 | 注释要求 |
|---------|---------|
| **Entity** | 类 Javadoc `/** 实体描述 */`；每个字段 `/** 字段含义 */` |
| **DTO / Record** | 类 Javadoc `/** 用途说明 */`；字段按 `reef-style-backend` 规范不加注释 |
| **Repository** | 自定义查询方法加 `/** 查询意图、参数含义 */`；简单 CRUD 方法可不加 |
| **Service** | 每个 public 方法加 Javadoc `/** 功能、@param、@return */`；复杂逻辑内联注释说明 |
| **Controller** | 每个端点加 `@Operation(summary=, description=)` 或等价 Javadoc |

## 多租户红线

- 所有数据库查询用 `findByIdAndAppId`，禁止裸 `findById`
- 禁止 `createNativeQuery`
- 禁止手动拼接 SQL

## 构建命令

```bash
# 快速编译验证
./gradlew compileJava

# 完整检查（测试 + 风格）
./gradlew check
```
