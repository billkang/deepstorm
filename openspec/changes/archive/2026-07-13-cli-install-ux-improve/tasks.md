## 1. init 写入配置与引导

- [x] 1.1 在 `init.ts` 中创建 `writeInitTechStack()` 函数，将 init 的技术方案转换为扁平 key-value 映射（如 `reef.frontend.framework: "angular"`）
- [x] 1.2 在 `init.ts` 中调用 `mergeDeepStormConfig()` 将转换后的配置写入 `settings.json`，确保只写 init 问过的字段，不覆盖无关字段
- [x] 1.3 在 `init.ts` 的 `runInteractiveMode` 和直接参数模式中，init 全部完成后使用 `@clack/prompts` 的 `confirm` 询问"是否继续安装 DeepStorm 开发环境？"
- [x] 1.4 用户选 Yes 时，打印指引命令让用户手动运行 `deepstorm setup`（在当前进程内调用的复杂度较高，通过指引方式实现同等效果）
- [x] 1.5 用户选 No 时打印提示"你可以稍后运行 `deepstorm setup` 来配置开发环境"

## 2. setup 读取已有配置跳过问卷

- [x] 2.1 在 `wizard-flow.ts` 中创建 `loadExistingConfigKeys()` 函数
- [x] 2.2 在 `runWizardFlow()` 中传入 `targetDir`，用返回的 key 集合初始化 `configuredKeys`
- [x] 2.3 实现整组跳过逻辑：仅对新增工具执行问卷

## 3. MCP 选择过滤已装服务

- [x] 3.1 在 `wizard-flow.ts` 中创建 `getInstalledMcpServices()` 函数
- [x] 3.2 导出 `parseEnvExampleFile`，新增 `isMcpFullyConfigured()` 函数
- [x] 3.3 修改 `selectMcpTools()` 支持 `installedMcpServices` 过滤
- [x] 3.4 在 `runWizardFlow()` 中组合步骤 3.1 + 3.3

## 4. selectTools 默认勾选

- [x] 4.1 `selectTools()` 新增 `initialValues` 参数
- [x] 4.2 含初始值时的提示文字
- [x] 4.3 从 `installedSkills` 反向推导工具列表

## 5. 二次运行增量感知

- [x] 5.1 确定已安装工具和本次选择，计算新增集合
- [x] 5.2 仅对新增工具执行问卷
- [x] 5.3 确认 MCP 过滤与增量安装协同

## 6. Guide 环境变量状态展示

- [x] 6.1 在 `guide.ts` 中新增 `printMcpEnvStatus()` 函数，遍历所有选中的 MCP 服务（含之前安装的 `installedMcpServers`），对每个服务读取 `.env-example` 获得所需 key 列表，对照 `.env` 中的现有值输出状态
- [x] 6.2 状态为 ✅ 时输出绿色标记，⚠️ 时列出缺失 key 名称，ℹ 时说明无需配置
- [x] 6.3 在 `setup.ts` 中调用 `printMcpEnvStatus()` 展示环境变量配置状态，无 MCP 时不显示

## 7. 测试

- [x] 7.1 为 `loadExistingConfigKeys()`、`getInstalledMcpServices()` 和 `getInstalledTools()` 编写单元测试
- [x] 7.2 为 `isMcpFullyConfigured()` 编写单元测试（覆盖 key 完整、key 不完整、无 `.env-example`、无 `.env` 四种场景）
- [x] 7.3 为修改后的 `selectTools()`（含 `initialValues`）编写测试
- [x] 7.4 为修改后的 `selectMcpTools()`（含 `installedMcpServices` 过滤）编写测试
- [x] 7.5 为 `printMcpEnvStatus()` 编写测试
