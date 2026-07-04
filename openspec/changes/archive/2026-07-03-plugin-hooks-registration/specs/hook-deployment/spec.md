## MODIFIED Requirements

### Requirement: hooks.json SHALL include before-read hook registration

The reef `hooks.json` SHALL include a `before-read` hook entry that points to the `reef-intent-detect.sh` script using a relative path valid in both standalone and plugin modes.

#### Scenario: before-read hook registered in hooks.json
- **WHEN** reef's `hooks.json` is deployed to the user's project
- **THEN** it SHALL include a hook entry with `matcher: "*"` (or equivalent to match all user messages)
- **THEN** the hook command SHALL use a relative path from the hooks directory (e.g., `./reef-intent-detect.sh`) rather than `${CLAUDE_PLUGIN_ROOT}/hooks/reef-intent-detect.sh`

#### Scenario: Hook runs before every AI processing cycle
- **WHEN** a user submits a message
- **THEN** the `before-read` hook SHALL execute before the AI processes the user's input

### Requirement: Installer SHALL handle multi-hook directory

If the user's project does not already have a `.claude/hooks/` directory or `hooks.json`, the installer SHALL create them.

#### Scenario: Hooks directory does not exist
- **WHEN** the user's project has no `.claude/hooks/` directory
- **THEN** the installer SHALL create the directory and populate it with reef's hooks.json and hook scripts

#### Scenario: Existing hooks.json with other hooks
- **WHEN** the user's project already has a `hooks.json` with existing hooks from other plugins
- **THEN** the installer SHALL merge the intent detection hook entry into the existing configuration without removing other hooks

## ADDED Requirements

### Requirement: Plugin SHALL register hooks in plugin.json

When installed as a Claude Code plugin, all hook scripts SHALL be registered via the `"hooks"` field in `.claude-plugin/plugin.json` so that Claude Code loads and executes them.

#### Scenario: Plugin build registers hooks
- **WHEN** `pnpm build:plugin` completes and the build includes hooks
- **THEN** `.claude-plugin/plugin.json` MUST have `"hooks": "./hooks/hooks.json"` set correctly

#### Scenario: Plugin loads hooks from registered path
- **WHEN** a user installs the plugin via `/plugin install deepstorm@...`
- **THEN** Claude Code SHALL load the hooks declared in `plugin.json` from the plugin's `hooks/` directory

### Requirement: setup SHALL deploy hooks to target project

When running `npx @deepstorm/cli setup`, the process SHALL ensure all selected tools' hooks scripts and `hooks.json` are deployed to `.claude/hooks/` in the target project directory.

#### Scenario: Setup deploys hooks scripts
- **WHEN** user runs `npx @deepstorm/cli setup` and selects tool suites with hooks
- **THEN** the CLI SHALL copy all hook scripts to `.claude/hooks/` in the target project
- **THEN** the CLI SHALL merge the selected tools' `hooks.json` entries into `.claude/hooks/hooks.json`
- **THEN** hook commands in the deployed `hooks.json` SHALL use paths resolvable without `${CLAUDE_PLUGIN_ROOT}`
