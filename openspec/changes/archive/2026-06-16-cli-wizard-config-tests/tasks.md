## 1. selectMcpTools 单元测试

- [x] 1.1 创建 createMockReader 工厂函数
- [x] 1.2 空工具列表提示测试
- [x] 1.3 正常多选服务测试
- [x] 1.4 context7 排序测试
- [x] 1.5 domain 标签展示测试
- [x] 1.6 全部不选返回空数组测试
- [x] 1.7 取消操作 exit 测试
- [x] 1.8 undefined entry 测试
- [x] 1.9 required false 测试
- [x] 1.10 initialValues 传递测试

## 2. config 命令单元测试

- [x] 2.1 Mock config 子命令模块
- [x] 2.2 config set 正确解析 key=value 测试
- [x] 2.3 config set 无等号报错测试
- [x] 2.4 config set 等号在开头报错测试
- [x] 2.5 config reset 确认后清除测试
- [x] 2.6 config reset 拒绝取消测试
- [x] 2.7 config reset ctrl+c 取消测试
- [x] 2.8 config refresh 成功刷新测试
- [x] 2.9 config refresh 部分失败测试
- [x] 2.10 config refresh 无刷新内容测试

## 3. config-set 边缘情况测试

- [x] 3.1 值无变更提示测试
- [x] 3.2 无 affected templates 时不提示测试
- [x] 3.3 affected templates 确认流程测试
- [x] 3.4 用户拒绝后提示 manual update 测试
- [x] 3.5 未知 config key 不写入测试
- [x] 3.6 损坏 settings.json 恢复测试

## 4. Registry 查询测试

- [x] 4.1 getToolEntry 正常/不存在测试
- [x] 4.2 getMcpTools 返回所有工具名测试
- [x] 4.3 getMcpToolEntry 正常/不存在测试
- [x] 4.4 findSkillIds 匹配/不匹配测试

## 5. guide MCP 输出测试

- [x] 5.1 MCP 工具数量展示测试
- [x] 5.2 MCP env stubs 展示测试
- [x] 5.3 GitHub Docker 警告测试
- [x] 5.4 非 GitHub 无 Docker 警告测试

## 6. guide git prompt 场景测试

- [x] 6.1 .git 存在时显示 confirm 测试
- [x] 6.2 无 .git 时不显示 confirm 测试
- [x] 6.3 .gitignore 含 `.claude/` warning 测试
- [x] 6.4 .gitignore 含 `.claude`（无斜杠） warning 测试
- [x] 6.5 .gitignore 含 `.claude/**` warning 测试
- [x] 6.6 .gitignore 无 `.claude/` 手动提交提示测试
- [x] 6.7 用户拒绝 Git 提交测试

## 7. questionnaire 条件依赖测试

- [x] 7.1 dependsOn 条件满足显示子问题测试
- [x] 7.2 dependsOn 条件不满足跳过测试
- [x] 7.3 dependsOn 父 key 已配置跳过测试
- [x] 7.4 dependsOn with not 标志满足测试
- [x] 7.5 dependsOn not 不满足跳过测试

## 8. questionnaire multiselect/group 类型测试

- [x] 8.1 multiselect 无分组测试
- [x] 8.2 multiselect 单选测试
- [x] 8.3 group 类型子问题显示测试

## 9. release build / fragment 边缘情况

- [x] 9.1 release build 指定 root 测试
- [x] 9.2 release dry-run 测试
- [x] 9.3 fragment .DS_Store 跳过测试
- [x] 9.4 fragment 目录不存在测试
- [x] 9.5 fragment 无匹配 config 值测试

## 10. template 子命令 action 测试

- [x] 10.1 template list 无/有工具筛选测试
- [x] 10.2 template init 无工具名报错测试
- [x] 10.3 template init 指定工具名测试
- [x] 10.4 template init 指定工具+capability 测试
