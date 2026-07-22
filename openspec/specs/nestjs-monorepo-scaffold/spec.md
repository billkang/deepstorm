## ADDED Requirements

### Requirement: Monorepo workspace scaffold
The system SHALL generate a pnpm workspace monorepo structure when creating a new Node.js (NestJS) project. The root directory SHALL contain a `package.json` declaring the workspace and a `pnpm-workspace.yaml` defining the workspace packages.

#### Scenario: Root workspace package.json created
- **WHEN** generating a new NestJS backend project
- **THEN** a root `package.json` SHALL be created with `private: true` and a `scripts.dev` entry that starts all workspace apps

#### Scenario: pnpm-workspace.yaml created
- **WHEN** generating a new NestJS backend project
- **THEN** a `pnpm-workspace.yaml` SHALL be created with `packages: ['server', 'client']`

### Requirement: Server subdirectory for NestJS backend
The system SHALL place all NestJS backend source code and configuration files inside a `server/` subdirectory instead of the project root.

#### Scenario: NestJS files in server directory
- **WHEN** generating a new NestJS backend project
- **THEN** the `package.json`, `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, and all `src/` source files SHALL be generated under `server/`

#### Scenario: Templates reference server paths
- **WHEN** rendering feature templates (Prisma, Agent SDK)
- **THEN** all `src/` path prefixes SHALL be resolved to `server/src/`, and `prisma/` SHALL be resolved to `server/prisma/`

### Requirement: Common skeleton directory
The system SHALL generate a `server/src/common/` skeleton directory with five subdirectories representing standard NestJS cross-cutting concerns.

#### Scenario: Common directories created
- **WHEN** generating a new NestJS backend project
- **THEN** the following directories SHALL exist under `server/src/common/`: `guards/`, `interceptors/`, `filters/`, `pipes/`, `decorators/`

#### Scenario: Common directories contain placeholder
- **WHEN** generating a new NestJS backend project
- **THEN** each subdirectory under `server/src/common/` SHALL contain at least one file (either a `.gitkeep` or a commented skeleton) to ensure the directory is tracked by git

### Requirement: Config skeleton directory
The system SHALL generate a `server/src/config/` skeleton directory with an `app.config.ts` file.

#### Scenario: Config directory created with app.config.ts
- **WHEN** generating a new NestJS backend project
- **THEN** a `server/src/config/` directory SHALL exist with an `app.config.ts` file that provides a `ConfigModule.forRoot()` usage skeleton

### Requirement: Frontend source path normalization
The system SHALL use `client/` as the default frontend source directory path for Angular projects instead of `src/main/web/`.

#### Scenario: Angular sourcePath updated
- **WHEN** browsing the wizard options and selecting Angular as the frontend framework
- **THEN** the Angular `sourcePath` in wizard.json SHALL be `client/`

#### Scenario: Client directory not in scaffold
- **WHEN** generating a new NestJS backend project
- **THEN** the `client/` directory SHALL NOT be created by the scaffolding template; it is the developer's responsibility to run `ng new client`

### Requirement: Build command path alignment
The system SHALL update all build and verification command paths in the nodejs gen-backend steps to reflect the `server/` subdirectory structure.

#### Scenario: Build commands reference server directory
- **WHEN** reading the nodejs gen-backend steps
- **THEN** commands such as `pnpm --filter server build`, `npx jest` (run from `server/`) SHALL correctly reference the `server/` directory scope
