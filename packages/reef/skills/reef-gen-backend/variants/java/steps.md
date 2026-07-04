# Java 后端编码步骤

按以下顺序逐块编写，依赖关系由前向后：

1. **Entity** — 实体类，定义表结构（JPA 注解、表名、字段映射）
2. **DTO** — 数据传输对象，匹配实体层次
3. **Mapper** — MapStruct 映射，连接 Entity ↔ DTO
4. **Repository** — 数据访问（Spring Data JPA），多租户安全查询
5. **Service** — 业务逻辑，事务管理
6. **Controller** — REST API，请求/响应

每完成一块对照 `reef:reef-style-backend` 中对应章节检查。

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
