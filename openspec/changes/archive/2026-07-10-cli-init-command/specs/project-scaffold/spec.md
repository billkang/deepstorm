## ADDED Requirements

### Requirement: 项目目录结构

生成的脚手架 SHALL 采用单一根目录结构，参照 chatbi 项目的布局风格。

#### Scenario: 全栈项目（Angular + Java）
- **WHEN** 用户选择了 Angular 和 Java
- **THEN** 生成的目录结构 SHALL 为：
  ```
  {project-name}/
  ├── src/
  │   ├── main/
  │   │   ├── java/{groupId}/{app}/    # Java 后端源码
  │   │   ├── resources/                # Spring Boot 配置
  │   │   └── web/                      # Angular 前端源码
  │   │       ├── app/                  # Angular 组件
  │   │       ├── main.ts
  │   │       ├── index.html
  │   │       └── styles.css
  │   └── test/
  │       ├── java/{groupId}/{app}/     # Java 测试
  │       └── resources/                # 测试配置
  ├── gradle/                           # Gradle wrapper
  │   └── wrapper/
  ├── angular.json                      # Angular 配置（指向 src/main/web/）
  ├── build.gradle.kts                  # Gradle 构建脚本
  ├── settings.gradle.kts               # Gradle 设置
  ├── gradlew / gradlew.bat             # Gradle wrapper 脚本
  ├── gradle.properties                 # Gradle 属性
  ├── package.json                      # 前端依赖（Angular + pnpm）
  ├── tsconfig.json / tsconfig.app.json / tsconfig.spec.json
  ├── proxy.conf.json                   # 开发代理配置
  ├── .gitignore
  ├── .env.example
  └── README.md
  ```

#### Scenario: 仅 Angular 前端
- **WHEN** 用户仅选择了 Angular（后端选 None）
- **THEN** 生成的项目 SHALL 包含 Angular 配置文件和 `src/main/web/` 目录，无 `build.gradle.kts`、`gradle/` 等后端文件

#### Scenario: 仅 Java 后端
- **WHEN** 用户仅选择了 Java（前端选 None）
- **THEN** 生成的项目 SHALL 为纯 Gradle + Spring Boot 项目，不包含 Angular 相关的配置

### Requirement: Angular 前端模板

Angular 前端模板 SHALL 生成在 `src/main/web/` 目录下。

#### Scenario: Angular 基础骨架
- **WHEN** 用户选择 Angular 作为前端
- **THEN** SHALL 在 `src/main/web/` 下生成：
  - `main.ts` — Angular 应用入口
  - `index.html` — HTML 入口
  - `app/` 目录 — 包含 `app.ts` 根组件、`app.config.ts`、`app.routes.ts`
  - `styles.css` — 全局样式
- 同时在根目录生成 `angular.json` 配置，其中 `projects.*.architect.build.options.outputPath` 指向 `build/`，`projects.*.architect.build.options.index` 指向 `src/main/web/index.html`，`projects.*.sourceRoot` 指向 `src/main/web`

#### Scenario: UI 库集成（PrimeNG）
- **WHEN** 用户选择了 PrimeNG
- **THEN** SHALL 在 `package.json` 中添加 `primeng` 依赖，在 `angular.json` 中添加 PrimeNG 样式配置

#### Scenario: CSS 方案（Tailwind）
- **WHEN** 用户选择了 Tailwind CSS
- **THEN** SHALL 安装 Tailwind CSS 依赖，生成 `postcss.config.json` 和 Tailwind 配置，并在 `styles.css` 中添加 Tailwind directives

### Requirement: Java Spring Boot 后端模板

Java 后端 SHALL 使用 Gradle (Kotlin DSL) 构建，参照 chatbi 项目的构建风格。

#### Scenario: Gradle + Spring Boot 骨架
- **WHEN** 用户选择 Java 作为后端
- **THEN** SHALL 生成包含以下内容的 Gradle 项目：
  - `build.gradle.kts` — Spring Boot 3.x + Java 21+，含 `spring-boot-starter-web`、`spring-boot-starter-data-jpa`、`spring-boot-starter-validation` 起步依赖
  - `settings.gradle.kts` — `rootProject.name = "{projectName}"`
  - `gradlew` / `gradlew.bat` — Gradle Wrapper 脚本
  - `gradle/wrapper/gradle-wrapper.properties` — Gradle 8.x
  - `gradle.properties` — JVM 参数等
  - `src/main/java/{groupId}/{app}/` — 应用入口类、基础控制器、服务、仓库骨架
  - `src/main/resources/application.yml` — 基础配置（数据源、服务器端口）
  - `src/test/java/{groupId}/{app}/` — 测试骨架
  - `src/test/resources/junit-platform.properties`

#### Scenario: Java ORM 集成
- **WHEN** 用户选择了 Hibernate
- **THEN** SHALL 在 `build.gradle.kts` 中确保 JPA 依赖包含 Hibernate 实现，并生成基础实体、`application.yml` 中的数据源配置

#### Scenario: Java DB 迁移
- **WHEN** 用户选择了 Liquibase
- **THEN** SHALL 在 `build.gradle.kts` 中添加 Liquibase 插件和依赖，生成 `src/main/resources/db/changelog/` 目录结构及初始 changelog 文件

#### Scenario: Java AI 集成
- **WHEN** 用户选择了 Spring AI
- **THEN** SHALL 在 `build.gradle.kts` 中添加  Spring AI BOM 和起步依赖

#### Scenario: Java 测试框架
- **WHEN** 用户选择了 JUnit5
- **THEN** SHALL 确保测试骨架配置 JUnit5 依赖并生成基础测试类

### Requirement: 模板引擎

项目模板 SHALL 使用 Handlebars 模板引擎渲染，与现有 `setup` 命令的技术栈一致。

#### Scenario: 变量替换
- **WHEN** 渲染模板时
- **THEN** SHALL 替换模板中的 Handlebars 变量（如 `{{projectName}}`、`{{packageName}}`、`{{groupId}}` 等）

#### Scenario: 条件渲染
- **WHEN** 用户选择/不选择特定选项时
- **THEN** SHALL 使用 Handlebars 条件语法（`{{#if}}`）控制文件或代码块的生成

### Requirement: 跨项目文件

所有生成的项目 SHALL 包含基础的跨项目配置。

#### Scenario: .gitignore
- **WHEN** 项目生成时
- **THEN** SHALL 生成 `.gitignore` 文件，排除 `node_modules/`、`target/`、`__pycache__/`、`.env`、`dist/` 等常见目录

#### Scenario: .env.example
- **WHEN** 项目生成时
- **THEN** SHALL 生成 `.env.example` 文件，包含常见环境变量占位符（数据库连接、API key 等）

#### Scenario: README
- **WHEN** 项目生成时
- **THEN** SHALL 生成 `README.md`，包含项目简介、技术栈说明、启动步骤
