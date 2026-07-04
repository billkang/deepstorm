## ADDED Requirements

### Requirement: plugin.json SHALL declare non-standard hooks path when hooks exist

Claude Code auto-loads the standard `hooks/hooks.json` path. To avoid a "Duplicate hooks file detected" error, plugin hooks MUST use a different filename (`deepstorm-hooks.json`) and the `plugin.json` SHALL declare the explicit path.

#### Scenario: Hooks directory present
- **WHEN** `pnpm build:plugin` completes and the output `.deepstorm/hooks/` directory contains hook scripts and a hooks config file
- **THEN** the hooks config file SHALL be named `deepstorm-hooks.json` (not `hooks.json`) to avoid Claude Code auto-load collision
- **THEN** `.claude-plugin/plugin.json` MUST contain `"hooks": "./hooks/deepstorm-hooks.json"` to declare the path
- **THEN** the `"hooks"` field SHALL be a relative path from the plugin root

#### Scenario: No hooks directory
- **WHEN** the user selects no tool suites that include hooks during `plugin build`
- **THEN** `.claude-plugin/plugin.json` SHALL NOT contain a `"hooks"` field

### Requirement: hooks.json SHALL use paths valid in both standalone and plugin modes

All `packages/*/hooks/hooks.json` command paths SHALL use relative paths from the hooks directory rather than `${CLAUDE_PLUGIN_ROOT}` environment variable, ensuring resolution in both standalone (`npx @deepstorm/cli setup`) and plugin (`/plugin install deepstorm@...`) modes.

#### Scenario: Standalone mode resolves relative path
- **WHEN** hooks are deployed to `.claude/hooks/hooks.json` via `npx @deepstorm/cli setup`
- **THEN** the hook command SHALL execute the script without depending on `${CLAUDE_PLUGIN_ROOT}`

#### Scenario: Plugin mode resolves relative path
- **WHEN** hooks are loaded from `.deepstorm/hooks/deepstorm-hooks.json` via Claude Code plugin mechanism (declared in `plugin.json`)
- **THEN** the hook command SHALL execute the script correctly with `${CLAUDE_PLUGIN_ROOT}` set to the plugin root
