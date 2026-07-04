## ADDED Requirements

### Requirement: plugin.json SHALL declare hooks path when hooks exist

The plugin's `.claude-plugin/plugin.json` SHALL include a `"hooks"` field pointing to the `hooks/hooks.json` path when the plugin build includes any hooks scripts.

#### Scenario: Hooks directory present declares path
- **WHEN** `pnpm build:plugin` completes and the output `.deepstorm/hooks/` directory contains hook scripts and `hooks.json`
- **THEN** `.claude-plugin/plugin.json` MUST contain `"hooks": "./hooks/hooks.json"`
- **THEN** the `"hooks"` field SHALL be a relative path from the plugin root

#### Scenario: No hooks directory omits field
- **WHEN** the user selects no tool suites that include hooks during `plugin build`
- **THEN** `.claude-plugin/plugin.json` SHALL NOT contain a `"hooks"` field

### Requirement: hooks.json SHALL use paths valid in both standalone and plugin modes

All `packages/*/hooks/hooks.json` command paths SHALL use relative paths from the hooks directory rather than `${CLAUDE_PLUGIN_ROOT}` environment variable, ensuring resolution in both standalone (`npx @deepstorm/cli setup`) and plugin (`/plugin install deepstorm@...`) modes.

#### Scenario: Standalone mode resolves relative path
- **WHEN** hooks are deployed to `.claude/hooks/hooks.json` via `npx @deepstorm/cli setup`
- **THEN** the hook command SHALL execute the script without depending on `${CLAUDE_PLUGIN_ROOT}`

#### Scenario: Plugin mode resolves relative path
- **WHEN** hooks are loaded from `.deepstorm/hooks/hooks.json` via Claude Code plugin mechanism
- **THEN** the hook command SHALL execute the script correctly with `${CLAUDE_PLUGIN_ROOT}` set to the plugin root
