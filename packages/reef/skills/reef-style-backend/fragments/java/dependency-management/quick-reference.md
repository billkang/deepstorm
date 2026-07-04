# 依赖管理规范

## 速查

| 场景 | 决策 |
| --- | --- |
| 声明依赖 | 全部在 `gradle/libs.versions.toml` 的 `[libraries]` 中声明 |
| 版本声明 | 全部在 `gradle/libs.versions.toml` 的 `[versions]` 中声明 |
| 引入新依赖 | 先查 version catalog 是否已有，无则按模块 + 版本号格式添加 |
| 临时排除 | 在 catalog 中使用 `exclude` 而非 `build.gradle.kts` 中排除 |
| 版本升级 | 同步升级相关依赖（如 Liquibase + Spring Boot 一起升级） |
| CVE 检查 | 配合 Dependabot / Renovate + Gradle Versions Plugin |
| 许可限制 | 禁止引入 AGPL / 需商业许可的依赖 |

## 核心规范

### Gradle Version Catalog 结构

```toml
# gradle/libs.versions.toml
[versions]
spring-boot = "3.5.0"
spring-dependency-management = "1.1.7"
mapstruct = "1.6.3"
liquibase = "4.31.0"
testcontainers = "1.20.6"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web" }
spring-boot-starter-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa" }
mapstruct = { module = "org.mapstruct:mapstruct", version.ref = "mapstruct" }
mapstruct-processor = { module = "org.mapstruct:mapstruct-processor", version.ref = "mapstruct" }

[bundles]
spring-web = ["spring-boot-starter-web", "spring-boot-starter-validation"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
```

**规范：**
- 所有依赖的**版本号**必须声明在 `[versions]` 中，不得在 `[libraries]` 中使用 `version = "1.0.0"` 字面量
- `[libraries]` 中使用 `version.ref` 引用版本
- 同一生态的依赖使用同一个版本变量（如所有 Spring Boot starter 共享 `spring-boot` 版本）
- 多个 artifact 共享版本的依赖组（如 mapstruct + mapstruct-processor）用同一 `version.ref`
- 关联依赖使用 `[bundles]` 分组

### 禁止硬编码版本号

```kotlin
// ✅ 好：build.gradle.kts
dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.mapstruct)
    annotationProcessor(libs.mapstruct.processor)
}

// ❌ 坏：build.gradle.kts — 硬编码版本号
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:3.5.0")  // ← 硬编码
    implementation("org.mapstruct:mapstruct:1.6.3")                           // ← 硬编码
}
```

### 版本一致性规则

升级一个依赖时，检查同一生态链的其他依赖是否需要同步升级：

| 升级场景 | 需同步升级的关联依赖 |
|---------|-------------------|
| Spring Boot 升级 | Spring Cloud、spring-dependency-management、相关 starter |
| Liquibase 升级 | 验证与 Spring Boot 版本兼容性 |
| MapStruct 升级 | mapstruct-processor 必须保持同一版本 |
| Hibernate 升级 | Spring Boot 提供的 Hibernate 版本（随 Boot 版本） |
| Testcontainers 升级 | 验证与 JUnit 5 兼容性 |

### Gradle Versions Plugin

```kotlin
// build.gradle.kts
plugins {
    id("com.github.ben-manes.versions") version "0.52.0"
}
```

```bash
# 检查可用升级
./gradlew dependencyUpdates -Drevision=release

# 输出示例：
# The following dependencies have newer versions:
#   com.google.guava:guava [32.1.3 -> 33.4.0]
```

**规范：**
- 每个 Major 版本升级前先在本地验证兼容性
- 升级依赖必须作为独立 PR/commit，附 changelog 摘要
- Minor/Patch 升级可随功能 PR 一起提交

### 已知 CVE 管理

```bash
# 配合 Gradle Versions Plugin 使用 OWASP Dependency Check（可选）
./gradlew dependencyCheckAnalyze
```

**规范：**
- Dependabot 或 Renovate 的 CVE PR 在 7 天内处理
- 紧急 CVE（CVSS >= 7.0）：1 天内升级并验证
- 无法立即升级时，记录在安全看板中，加 `@SuppressWarnings("CVE-XXXX")` 并附缓解说明

### 禁止使用的依赖

| 依赖 | 禁止原因 | 替代方案 |
|------|---------|---------|
| Apache Commons Lang 2 | 有已知 CVE，已被 lang3 取代 | `org.apache.commons:commons-lang3` |
| Log4j 1.x | EOL，有已知 CVE | Spring Boot 内置 Logback 或 Log4j 2 |
| Guava 旧版 < 30.0 | 已知 CVE | 最低 32.x |
| Joda-Time | 已被 java.time 取代 | `java.time.*` / `ThreeTen-Extra`（如需要） |
