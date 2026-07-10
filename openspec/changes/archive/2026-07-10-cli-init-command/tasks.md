## 1. Setup

- [x] 1.1 在 `packages/cli/src/commands/` 下创建 `init.ts` 命令文件
- [x] 1.2 模板内嵌在 `init.ts` 中（通过 `renderAngularTemplate()` / `renderJavaTemplate()` / `renderCommonFiles()` 函数直接生成，无需独立的 `.tmpl` 文件）
- [x] 1.3 在 `packages/cli/src/index.ts` 中注册 `init` 子命令

## 2. Init 命令核心实现

- [x] 2.1 定义 `InitOptions` 接口
- [x] 2.2 实现命令行参数解析（`parseInitArgs()`）
- [x] 2.3 实现交互式问答流程（`runInteractiveMode()`）
- [x] 2.4 实现模板渲染逻辑（`renderAngularTemplate()`、`renderJavaTemplate()`、`renderCommonFiles()`）
- [x] 2.5 实现输出目录创建 + 已存在检测
- [x] 2.6 实现完成提示 + 目录树输出

## 3. Angular 前端模板

- [x] 3.1 `angular.json`（`sourceRoot` 指向 `src/main/web`，含 PrimeNG 样式条件配置）
- [x] 3.2 TypeScript 配置（`tsconfig.json`、`tsconfig.app.json`、`tsconfig.spec.json`，含 strict 模式）
- [x] 3.3 `package.json`（含 Angular 21 + pnpm + PrimeNG 条件依赖）
- [x] 3.4 `src/main/web/index.html`
- [x] 3.5 `src/main/web/main.ts`
- [x] 3.6 `src/main/web/styles.css`（含 Tailwind 条件 import）
- [x] 3.7 `src/main/web/app/app.ts` + `app.config.ts` + `app.routes.ts`
- [x] 3.8 PrimeNG 条件集成（`angular.json` 样式 + package.json 依赖）
- [x] 3.9 Tailwind CSS 条件集成（`postcss.config.json` + CSS directives）
- [x] 3.10 `eslint.config.mjs`
- [x] 3.11 `proxy.conf.json`

## 4. Java (Spring Boot + Gradle) 后端模板

- [x] 4.1 `build.gradle.kts`（Spring Boot + Web/JPA/Validation + Liquibase/Spring AI 条件依赖）
- [x] 4.2 `settings.gradle.kts`
- [x] 4.3 Gradle wrapper（`gradlew`、`gradlew.bat`、`gradle/wrapper/gradle-wrapper.properties`）
- [x] 4.4 `gradle.properties`
- [x] 4.5 `Application.java` 入口类
- [x] 4.6 `application.yml`（含数据源/Liquibase 条件配置）
- [x] 4.7 基础控制器（`HealthController.java`）+ 服务目录
- [x] 4.8 Hibernate 条件集成（`BaseEntity.java` + JPA 依赖 + 数据源配置）
- [x] 4.9 Liquibase 条件集成（`db/changelog/db.changelog-master.xml`）
- [x] 4.10 Spring AI 条件集成（BOM + starter 依赖 + milestone 仓库）
- [x] 4.11 测试骨架（`ApplicationTests.java` + `junit-platform.properties`）

## 5. 跨项目公共文件

- [x] 5.1 `.gitignore`
- [x] 5.2 `.env.example`
- [x] 5.3 `README.md`（含条件性内容：技术栈、启动步骤、目录结构）

## 6. 集成验证

- [x] 6.1 验证 `deepstorm --help` 正确显示 `init` 命令
- [x] 6.2 验证交互式流程（选择 Angular + Java → 生成完整项目）— init.test.ts 覆盖
- [x] 6.3 验证仅 Angular 模式（后端选 None → 无 Gradle 文件）— init.test.ts 覆盖
- [x] 6.4 验证仅 Java 模式（前端选 None → 无 Angular 配置）— init.test.ts 覆盖
- [x] 6.5 验证命令行参数模式（`--name my-app --frontend angular --backend java` → 跳过交互）— init.test.ts 覆盖
- [x] 6.6 验证目录已存在时的覆盖提示 — init.test.ts 覆盖
- [x] 6.7 验证生成的项目结构是否与 chatbi 一致 — init.test.ts `verify-structure` 测试覆盖
- [x] 6.8 验证生成的 `.gitignore`、`.env.example`、`README.md` 存在且内容正确 — init.test.ts 覆盖
