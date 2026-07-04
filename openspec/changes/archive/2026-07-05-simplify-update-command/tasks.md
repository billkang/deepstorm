## 1. 重构 update 命令

- [x] 1.1 移除 `--check`、`--cli`、`--skills` 子选项定义和分支逻辑
- [x] 1.2 简化 `registerUpdateCommand` 为无参数的纯 action
- [x] 1.3 清除无选项时的全量更新逻辑改为直接执行的顺序流程
- [x] 1.4 删除不再需要的导出函数 `updateSkills`、`printVersionInfo`
- [x] 1.5 更新 `index.ts` 中 `registerUpdateCommand` 调用签名

## 2. 基于已安装内容的增量同步

- [x] 2.1 保留 `getInstalledSkillIds` 函数从 settings.json 读取安装记录
- [x] 2.2 update action 中调用 `upgradeTemplates` 时传入已安装 skill IDs

## 3. 更新测试

- [x] 3.1 移除子选项相关测试（--check、--cli、--skills 的选项断言）
- [x] 3.2 移除 `updateSkills` 的测试用例
- [x] 3.3 更新 `registerUpdateCommand` 测试验证命令注册和无选项状态
- [x] 3.4 运行并确认全部测试通过

## 4. 更新文档

- [x] 4.1 README.md CLI 命令一览表新增 `update` 行，删除子选项行
- [x] 4.2 更新 `update` 命令的 `--help` 描述文案

## 5. hooks + agents 同步

- [x] 5.1 扩展 `upgradeTemplates`/新增 `syncToolAssets` 函数支持 hooks/agents 同步
- [x] 5.2 复用 `setup.ts` 的 `renderToolAssets` 逻辑
- [x] 5.3 反向映射 installedSkills → tools，获取对应的 hooks/agents 列表

## 6. 用户修改保护

- [x] 6.1 实现文件 checksum 计算与比较（SHA256，存储到 `deepstorm-checksums.json`）
- [x] 6.2 修改过的文件备份（加时间戳后缀 `.bak`）→ 覆盖系统版 → 报告用户
