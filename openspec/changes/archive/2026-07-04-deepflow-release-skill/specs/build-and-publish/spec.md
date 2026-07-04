## ADDED Requirements

### Requirement: 更新版本号

DeepStorm Release SHALL 将确认后的版本号写入所有 `package.json` 文件，确保 monorepo 中各包版本统一。

#### Scenario: 更新根 package.json

- **WHEN** 版本号已确认
- **THEN** Skill SHALL 将 `package.json` 根目录的 `version` 字段更新为确认后的版本号

#### Scenario: 更新子包

- **WHEN** 子包（`packages/*/package.json`）存在独立的 `version` 字段
- **THEN** Skill SHALL 将所有子包的 `version` 字段同步更新为相同版本号

### Requirement: 执行构建

DeepStorm Release SHALL 在版本号更新后执行构建，确保发布的包是最新的编译产物。

#### Scenario: 构建成功

- **WHEN** Skill 执行构建命令（`pnpm build`）且退出码为 0
- **THEN** Skill SHALL 继续进入下一步（创建 release commit）

#### Scenario: 构建失败

- **WHEN** 构建命令退出码非 0
- **THEN** Skill SHALL 中止流程，展示构建错误信息，提示用户修复后重新开始。版本号变更尚未提交，不受影响

### Requirement: 创建 Release Commit 和 Tag

DeepStorm Release SHALL 在构建成功后自动创建一个 release commit 和 git tag。

#### Scenario: 正常创建

- **WHEN** 版本号已写入、构建通过
- **THEN** Skill SHALL 依次执行：`git add .` → `git commit -m "RELEASING: Releasing v{version}"` → `git tag v{version}`

### Requirement: npm 身份验证

DeepStorm Release SHALL 在 publish 前验证 npm 登录状态，确保有发布权限。

#### Scenario: 未登录

- **WHEN** `npm whoami` 返回非零退出码或空字符串
- **THEN** Skill SHALL 提示用户运行 `npm login` 进行身份验证，验证通过后再继续

#### Scenario: 已登录

- **WHEN** `npm whoami` 返回有效的 npm 用户名
- **THEN** Skill SHALL 继续发布流程

### Requirement: 发布前确认

DeepStorm Release SHALL 在执行 `npm publish` 前展示发布摘要并等待用户确认。

#### Scenario: 用户确认发布

- **WHEN** 展示摘要（版本号、包名、dist-tag）后用户输入 y/Y 确认
- **THEN** Skill SHALL 执行 `npm publish`（或 `pnpm publish`）推送包到 npm registry

#### Scenario: 用户取消发布

- **WHEN** 展示摘要后用户输入 n/N 取消
- **THEN** Skill SHALL 不执行发布操作，保留版本号变更和 tag，提示用户后续可手动发布

### Requirement: 推送 git tag 到远程

DeepStorm Release SHALL 在 npm publish 成功后推送 commit 和 tag 到远程仓库。

#### Scenario: 推送成功

- **WHEN** npm publish 执行成功
- **THEN** Skill SHALL 执行 `git push origin main --tags`（或当前分支）

#### Scenario: 推送失败

- **WHEN** `git push` 因权限或网络原因失败
- **THEN** Skill SHALL 提示用户手动执行 `git push origin main --tags`，并提供恢复命令

### Requirement: 跳过私有包

DeepStorm Release SHALL 在 monorepo 中跳过 `"private": true` 的包。

#### Scenario: 私有包过滤

- **WHEN** monorepo 中存在 `package.json` 中声明 `"private": true` 的包
- **THEN** Skill SHALL 不尝试发布该包，仅在摘要中注明已跳过

### Requirement: 支持 dist-tag

DeepStorm Release SHOULD 支持通过参数指定 npm dist-tag。

#### Scenario: 指定发布标签

- **WHEN** 用户指定 dist-tag（如 `--tag next`）
- **THEN** Skill SHALL 在 `npm publish` 命令中附加 `--tag <tag>` 参数

#### Scenario: 默认 latest

- **WHEN** 用户未指定 dist-tag
- **THEN** Skill SHALL 使用默认的 `latest` 标签
