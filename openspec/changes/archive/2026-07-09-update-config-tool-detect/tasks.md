# Tasks: Config Tool Detection

## 1. 新增配置检测函数

- [x] 1.1 在 `template-upgrade.ts` 中实现 `detectToolsFromConfig()` 函数
  - 接收扁平配置 `Record<string, string>` 和 `Registry`
  - 提取 key 前缀与 `registry.tools` 比对
  - 返回匹配的 tool 名称列表

- [x] 1.2 在 `syncToolAssets()` 中集成配置检测
  - 调用 `readSettingsConfig()` 获取当前配置（已有，但尚未连接）
  - 调用 `detectToolsFromConfig()` 获得配置端 tool
  - 与 `skillIdsToTools()` 结果合并去重形成 `allTools`
  - 后续所有操作（backup、render、merge、store）使用 `allTools`

## 2. 验证

- [x] 2.1 构建并确认无编译错误
- [x] 2.2 单元测试通过
- [x] 2.3 在 playground 项目上验证 `deepstorm update` 能正确同步 reef hooks
