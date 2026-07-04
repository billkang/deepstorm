# config-management Specification

## Purpose

This is a delta spec for the existing `config-management` capability. Updates add the backend test dimension to the configuration model and introduce auto-derivation rules for test fragments.

## MODIFIED Requirements

### Requirement: 配置模型支持嵌套结构

`deepstorm` 命名空间的配置模型 SHALL 支持从扁平结构扩展为嵌套多维结构。

#### Scenario: 新配置结构
- **WHEN** 用户完成多维配置
- **THEN** `.claude/settings.json` 中的 `deepstorm.reef` 存储为嵌套结构，包含 `frontend.{framework, tsConfig, css, test}` 和 `backend.{language, java.{framework, orm, dbMigration, ai, test}}`
- **THEN** `backend.java.test` SHALL 支持嵌套结构，包含 `testFramework`, `framework`, `orm` 等自动推导字段

## ADDED Requirements

### Requirement: 测试 fragment 自动推导配置

CLI SHALL 在 setup --reconfigure 时根据用户选中的框架组合自动推导测试 fragment 配置。

#### Scenario: 后端测试自动推导
- **WHEN** 用户后端配置包含 `testFramework: "junit5"` 且 `framework: "spring-boot"` 且 `orm: "hibernate"`
- **THEN** CLI SHALL 自动设置 `backend.java.test.testFramework.styleRef` = `java/test/junit5`
- **THEN** CLI SHALL 自动设置 `backend.java.test.framework.styleRef` = `java/test/spring-mvc-test` 和 `java/test/spring-service-test`
- **THEN** CLI SHALL 自动设置 `backend.java.test.orm.styleRef` = `java/test/data-jpa-test`

#### Scenario: 前端测试自动推导
- **WHEN** 用户前端配置包含 `test: "vitest"`
- **THEN** CLI SHALL 自动设置 `frontend.test.styleRef` = `test/vitest`

#### Scenario: 不满足条件时不推导
- **WHEN** 用户后端配置中 `orm: "mybatis"` 但没有对应的测试 fragment
- **THEN** CLI SHALL 跳过该维度的自动推导，不报错
- **THEN** 对应 `styleRef` 保持为空字符串

### Requirement: 版本迁移

已配置的用户运行 setup --reconfigure 后 SHALL 自动补全后端测试维度配置。

#### Scenario: 升级自动补全
- **WHEN** 用户升级后运行 `deepstorm setup --reconfigure`
- **THEN** CLI SHALL 检测到缺失 `backend.java.test` 配置
- **THEN** CLI SHALL 根据现有 `backend.java.framework` 和 `backend.java.orm` 自动推导并补全 `backend.java.test` 子配置
- **THEN** 用户已有的其他配置 SHALL NOT 被修改
