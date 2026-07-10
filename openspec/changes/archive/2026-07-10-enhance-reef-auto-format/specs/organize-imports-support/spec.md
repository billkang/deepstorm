## ADDED Requirements

### Requirement: TypeScript import 自动排序
reef-auto-format hook SHALL 在 Write/Edit 后对 `.ts` / `.tsx` 文件执行 import 排序，匹配 VS Code `source.organizeImports` 的行为。

#### Scenario: TypeScript 文件 write 后自动整理 import
- **WHEN** hook 检测到刚写入的文件是 `.ts` 或 `.tsx`
- **THEN** hook 执行 TypeScript import 排序，将 import 语句按字母序排列、合并重复 import、移除未使用的 import

#### Scenario: 没有 TypeScript 项目配置
- **WHEN** 项目根目录不存在 `tsconfig.json`
- **THEN** hook 跳过 TypeScript organize imports 步骤，不报错

### Requirement: Python import 自动排序
reef-auto-format hook SHALL 在 Write/Edit 后对 `.py` 文件执行 import 排序，等价于 Python 生态中的 `isort` 工具。

#### Scenario: Python 文件 write 后自动整理 import
- **WHEN** hook 检测到刚写入的文件是 `.py`
- **THEN** hook 执行 `isort "$filepath"`（优先使用 `isort`），如果 isort 不可用则回退到 `ruff check --select I --fix "$filepath"`

#### Scenario: isort 不可用
- **WHEN** hook 检测到 `.py` 文件但 `isort` 命令不存在
- **THEN** hook 尝试 `ruff check --select I --fix "$filepath"` 作为回退

#### Scenario: 既没有 isort 也没有 ruff
- **WHEN** hook 检测到 `.py` 文件但 `isort` 和 `ruff` 均不可用
- **THEN** hook 跳过 import 排序步骤，输出警告日志

### Requirement: Java import 整理
reef-auto-format hook SHOULD 在 Write/Edit 后对 `.java` 文件处理 import 排序。

#### Scenario: Java 文件 write 后整理 import
- **WHEN** hook 检测到刚写入的文件是 `.java` 且项目配置了 import 排序工具
- **THEN** hook 执行 `google-java-format -i`（已覆盖 import 整理）或项目配置的 import 排序命令

### Requirement: 禁用配置
用户 SHOULD 能通过 wizard.json 配置项禁用 organize imports 步骤。

#### Scenario: wizard.json 配置禁用 organize imports
- **WHEN** wizard.json 中 `reef.formatter.organizeImports.enabled` 为 `false`
- **THEN** hook 跳过所有语言的 import 排序步骤
