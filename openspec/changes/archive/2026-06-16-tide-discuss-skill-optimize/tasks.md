## 1. SKILL.md 文本压缩（功能零变更）

- [x] 1.1 上下文隔离段去重合并——Step 1 入口处和下方备注块重复表述了同一套逻辑，合并为一个精简段落
- [x] 1.2 Step 2 规则段与 Checklist 段去重——"一次只扮演一个角色/一次只问一个问题"在规则段保留精简版，Checklist 段不再重复
- [x] 1.3 Step 4 MCP 能力映射 JSON 示例删除——纯说明性的示例 JSON 块（行 328-339），运行时 AI 看到的是实际渲染值
- [x] 1.4 参考文件使用说明行精简——`> **用途:**` 和 `> **引用时机:**` 注释精简为单行
- [x] 1.5 通篇措辞紧凑化——表格列缩紧、移除冗余修饰语，保留所有业务约束
- [x] 1.6 Mermaid 核心流程图、所有 5 处真实 references 引用保持不动

## 2. 废弃 PRD 文件夹逻辑

- [x] 2.1 数据存储约定表中新增 `tide-data/abandoned/` 路径说明行（与 archive/、prds/ 同级）
- [x] 2.2 目录自动创建列表中加入 `abandoned`
- [x] 2.3 归档段增加 PRD 清理操作描述：检查 prd.md/prd.json 存在性 → mv 到 tide-data/abandoned/
- [x] 2.4 会话流程图 LINK 节点和归档段中提及 PRD 文件清理

## 3. Hook 预加载（settings.json 配置）

- [x] 3.1 在 `.claude/settings.json` 的 `sessionStart` hook 中添加脚本：扫描 `tide-data/sessions/` 目录，提取 session 摘要（sessionId、status、brief、createdAt、featureId），格式化为 `TIDE_SESSIONS:N` + 逐行 JSON
- [x] 3.2 Hook 中处理 `.index.json` 不存在、JSON 解析错误等异常，确保不阻塞启动

## 4. 会话索引缓存（SKILL.md）

- [x] 4.1 数据存储约定表中新增 `.index.json` 说明行（位于 `tide-data/sessions/.index.json`）
- [x] 4.2 入口扫描段增加优先级逻辑：`.index.json` 存在时直接加载，不存在时降级扫目录
- [x] 4.3 Step 1 创建 session 时写入索引
- [x] 4.4 session 状态更新时（prd_ready、published、publish_error）同步索引
- [x] 4.5 归档时（completed / superseded）删除索引条目

## 5. MCP 能力发现缓存（SKILL.md）

- [x] 5.1 Step 4 MCP 发现段增加缓存检查：`services.capabilities` 存在时跳过重新发现
- [x] 5.2 首次发现后将结果写入 `services.capabilities`
- [x] 5.3 用户要求"重试"时忽略缓存，重新发现

## 6. 启动依赖检查（SKILL.md）

- [x] 6.1 入口扫描完成后增加依赖检查步骤：检查必要的外部 skill 是否存在
- [x] 6.2 bmad 未安装时：警告提醒，建议 `npx bmad-method install`，不阻止技能运行
- [x] 6.3 grill-me 未安装时：温和提示可安装以提升追问体验，不阻止技能运行
- [x] 6.4 仅入口执行一次，讨论过程中不再重复检查

## 7. 验证

- [x] 7.1 确认 SKILL.md.tmpl 压缩后体积（目标 ~24KB）
- [x] 7.2 通读确认所有业务逻辑、角色流程、checklist 约束、发布流程未丢失
- [x] 7.3 确认 `tide-data/abandoned/` 路径和清理语义正确
- [x] 7.4 确认 `sessionStart` hook 配置正确
- [x] 7.5 确认 `.index.json` 维护覆盖全部 CRUD 场景
- [x] 7.6 确认 `services.capabilities` 缓存的写/读/过期语义
- [x] 7.7 确认依赖检查在入口执行且不重复
