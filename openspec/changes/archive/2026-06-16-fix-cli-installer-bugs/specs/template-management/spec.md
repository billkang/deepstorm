# template-management Specification

This is a delta spec for the `template-management` capability. Only modified requirements are listed below; all other requirements from the base spec remain unchanged.

## ADDED Requirements

### Requirement: Template-based skill installation MUST preserve references/

The installer's template-based code path SHALL copy the `references/` subdirectory (if present) from the source skill directory to the target, in addition to the existing `variants/` and `fragments/` copying behavior.

#### Scenario: references/ copied alongside variants/ and fragments/
- **WHEN** installing a template-based skill that has `references/`, `variants/`, and `fragments/` subdirectories
- **THEN** all three subdirectories SHALL be present under the target `.claude/skills/<skillId>/` after installation
- **THEN** each subdirectory SHALL contain the same files as the source

#### Scenario: template export preserves references/
- **WHEN** exporting a template-based skill via `deepstorm template init`
- **THEN** the `references/` subdirectory SHALL be included in the exported template
- **THEN** the exported template SHALL be usable standalone with all reference files intact
