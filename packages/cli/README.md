# @deepstorm/cli

DeepStorm CLI — 一键配置项目开发环境。

## 本地开发

在 monorepo 中本地调用（无需发包）：

```bash
# 方式一：通过根目录 script（推荐）
pnpm cli [command]

# 示例
pnpm cli setup
pnpm cli doctor

# 方式二：直接执行
node dist/cli.js [command]
# 或从仓库根目录
node packages/cli/dist/cli.js [command]
```

### 前置步骤

1. 确保已安装依赖：`pnpm install`
2. 确保已构建：`pnpm build`（或 `cd packages/cli && pnpm build`）
3. 如果改了源码，记得重新构建后再调用

## 本地打包测试 / 分享给同事

构建完成后，可以用 `npm pack` 将 CLI 打包成 `.tgz` 文件，发给同事或用于本地测试安装：

```bash
cd packages/cli

# 确保已构建
pnpm build

# 打包（跳过 prepack hook，因为 dist 已是最新）
npm pack --ignore-scripts
```

这会生成 `@deepstorm/cli-0.1.0.tgz`（仅包含 `dist/` 目录，约 400KB）。

### 安装使用

拿到 `.tgz` 文件后，对方按需安装：

```bash
# 全局安装（推荐，获得 deepstorm 命令）
npm install -g ./@deepstorm/cli-0.1.0.tgz

# 或项目内安装
npm install ./@deepstorm/cli-0.1.0.tgz
```

`npm` 会自动处理 `@clack/prompts`、`commander`、`handlebars`、`js-yaml` 这些运行时依赖，安装后即可使用 `deepstorm` 命令。

## 命令

| 命令 | 说明 |
|------|------|
| `setup` | 安装向导，自动安装 skills/agents/hooks |
| `config` | 配置管理 |
| `template` | 模板管理 |
| `plugin build` | 构建 DeepStorm Claude Code 插件（交互式向导） |
| `doctor` | 诊断项目 DeepStorm 配置状态 |
| `uninstall` | 卸载所有 DeepStorm 生成的内容 |

## 构建插件

DeepStorm 支持将工具集打包为 Claude Code 插件，详见根目录 README 的「构建 DeepStorm Claude Code 插件」章节。
