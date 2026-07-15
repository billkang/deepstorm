## 1. 目录检测 — runInteractiveMode 改造

- [x] 1.1 在 `runInteractiveMode` 中 `intro` 之后、`projectName` 询问之前，添加 `confirm` 提示"当前路径是否为项目目录？"
- [x] 1.2 用户回答"是"时，跳过项目名称询问，走原地初始化路径（`opts.projectName` 为空）
- [x] 1.3 用户回答"否"时，走原有流程（询问项目名称 → 创建子目录）
- [x] 1.4 用户取消时正常退出

## 2. runInit 支持原地初始化

- [x] 2.1 修改 `runInit`：`projectName` 为空时使用 `baseDir` 作为项目目录，跳过 `mkdirSync`
- [x] 2.2 原地初始化模式跳过 `projectName` 格式校验（因为此时没有用户输入的项目名）
- [x] 2.3 原地初始化模式跳过"目录已存在则报错"的检查（因为当前目录必然存在）
- [x] 2.4 原地初始化模式下不输出 `cd {projectName}` 的下一步提示

## 3. 文件不覆盖逻辑

- [x] 3.1 原地初始化模式下，对每个要生成的文件先检查 `fs.existsSync`，已存在则跳过
- [x] 3.2 跳过的文件打印提示信息（如"ℹ 跳过已有文件: {文件名}"）
- [x] 3.3 创建子目录模式保持原有行为（目录已存在则报错）

## 4. 生成 .claude/claude.md

- [x] 4.1 新增 `initClaudeMd(targetDir, opts)` 函数，在 `.claude/claude.md` 写入项目名 + 技术栈信息
- [x] 4.2 函数内部检查 `.claude/claude.md` 是否已存在，已存在则跳过
- [x] 4.3 在 `writeInitTechStack` 中 `initContextMap` 之后同步调用 `initClaudeMd`
- [x] 4.4 在 `runInit` 原地初始化模式末尾也调用 `initClaudeMd`（兜底保护）

## 5. 根 CLAUDE.md 引用更新

- [x] 5.1 修改 `appendClaudeMdRef`：除了 `.deepstorm/context.md`，同时添加 `.claude/claude.md` 引用
- [x] 5.2 引用行格式：在 `CLAUDE.md` 首行写入 `# {projectName}`（如有项目名），紧接引用行

## 6. 测试

- [x] 6.1 新增测试：`runInteractiveMode` 中目录确认提示被正确处理
- [x] 6.2 新增测试：`runInit` 以空 `projectName` 调用时在当前目录生成
- [x] 6.3 新增测试：原地初始化时已有文件被跳过
- [x] 6.4 新增测试：`initClaudeMd` 生成正确的 `.claude/claude.md` 内容
- [x] 6.5 新增测试：`initClaudeMd` 在文件已存在时跳过
- [x] 6.6 新增测试：根 `CLAUDE.md` 同时引用 `.claude/claude.md` 和 `.deepstorm/context.md`
- [x] 6.7 更新现有测试：确保 `runInit` 签名变更后已有测试仍通过
