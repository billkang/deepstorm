#!/usr/bin/env node

/**
 * Env Manager — 测试环境配置管理
 *
 * 读取 .env 文件，解析目标环境的 BASE_URL，输出结构化结果。
 * 支持检查 E2E 框架配置和 MCP 可用性。
 *
 * Usage:
 *   node env-manager.mjs --env test                   # 解析指定环境
 *   node env-manager.mjs --env test --print            # 输出 export 语句
 *   node env-manager.mjs --framework                   # 读取 E2E 框架配置
 *   node env-manager.mjs --check-mcp                   # 检查 MCP 服务可用性
 *   node env-manager.mjs --list                        # 列出所有可用环境
 *
 *   import { resolveEnv, listEnvs, readFramework, checkMcpAvailable } from './env-manager.mjs'
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Path helpers (lazy, respect process.cwd() changes) ────────────

function getEnvPath() {
  return resolve(process.cwd(), '.env');
}
function getMcpPath() {
  return resolve(process.cwd(), '.mcp.json');
}

// ── .env parsing ──────────────────────────────────────────────────

/**
 * Parse .env file content into a key-value map.
 * Handles `KEY=VALUE` lines, ignores comments and blank lines.
 */
export function parseDotEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sepIdx = trimmed.indexOf('=');
    if (sepIdx === -1) continue;
    const key = trimmed.slice(0, sepIdx).trim();
    let value = trimmed.slice(sepIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * Read and parse .env file. Returns empty object if file doesn't exist.
 */
export function readDotEnv() {
  if (!existsSync(getEnvPath())) return {};
  try {
    const content = readFileSync(getEnvPath(), 'utf-8');
    return parseDotEnv(content);
  } catch {
    return {};
  }
}

/**
 * Get the default environment name.
 * Falls back to 'test' if not configured.
 */
export function getDefaultEnv(envMap) {
  return envMap.DEFAULT_ENV || 'test';
}

/**
 * List all available environments from .env.
 * Detects BASE_URL_{ENV} patterns and returns their names.
 */
export function listEnvs(envMap) {
  const envs = [];
  for (const key of Object.keys(envMap)) {
    const match = key.match(/^BASE_URL_(.+)$/);
    if (match) {
      envs.push({
        name: match[1].toLowerCase(),
        key: key,
        url: envMap[key],
      });
    }
  }
  return envs;
}

/**
 * Resolve target environment config.
 *
 * @param {string} [envName] - Target environment name (e.g. 'staging', 'test')
 * @returns {{ env: string, baseUrl: string|null, availableEnvs: Array<{name:string,url:string}> }}
 *
 * If envName is omitted, uses DEFAULT_ENV from .env (or 'test').
 * If the environment is not found, baseUrl is null and availableEnvs lists alternatives.
 */
export function resolveEnv(envName) {
  const envMap = readDotEnv();
  const name = envName || getDefaultEnv(envMap);
  const availableEnvs = listEnvs(envMap);

  const baseUrlKey = `BASE_URL_${name.toUpperCase()}`;
  const baseUrl = envMap[baseUrlKey] || null;

  return { env: name, baseUrl, availableEnvs };
}

// ── Framework config ──────────────────────────────────────────────

/**
 * Read E2E framework config from .deepstorm/settings.json → sweep.e2eFramework.
 *
 * @returns {{ framework: string|null, source: string }}
 *   framework: 'playwright' | 'cypress' | null
 *   source: 'deepstorm-settings' | 'missing-file' | 'not-configured' | 'parse-error'
 */
export function readFramework() {
  const deepstormPath = resolve(process.cwd(), '.deepstorm', 'settings.json');
  if (!existsSync(deepstormPath)) {
    return { framework: null, source: 'missing-file' };
  }

  try {
    const content = readFileSync(deepstormPath, 'utf-8');
    const config = JSON.parse(content);
    const framework = config.sweep?.e2eFramework || null;
    return { framework, source: framework ? 'deepstorm-settings' : 'not-configured' };
  } catch {
    return { framework: null, source: 'parse-error' };
  }
}

// ── MCP availability ──────────────────────────────────────────────

/**
 * Check if the required MCP service is configured in .mcp.json.
 *
 * @param {string} [mcpName='deepstorm-playwright'] - MCP service name to check
 * @returns {{ available: boolean, mcpName: string }}
 */
export function checkMcpAvailable(mcpName = 'deepstorm-playwright') {
  if (!existsSync(getMcpPath())) {
    return { available: false, mcpName };
  }

  try {
    const content = readFileSync(getMcpPath(), 'utf-8');
    const config = JSON.parse(content);
    const available = !!(config.mcpServers?.[mcpName] || config[mcpName]);
    return { available, mcpName };
  } catch {
    return { available: false, mcpName };
  }
}

// ── CLI entry point ────────────────────────────────────────────────

if (process.argv[1] === import.meta.filename) {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const envMap = readDotEnv();
    const envs = listEnvs(envMap);
    const defaultEnv = getDefaultEnv(envMap);
    console.log(JSON.stringify({ default: defaultEnv, environments: envs }));
    process.exit(0);
  }

  if (args.includes('--framework')) {
    const result = readFramework();
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  if (args.includes('--check-mcp')) {
    const mcpName = args.find(a => a.startsWith('--mcp='))?.split('=')[1] || 'deepstorm-playwright';
    const result = checkMcpAvailable(mcpName);
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  // Default: resolve env
  const envFlag = args.find(a => a.startsWith('--env='));
  const envName = envFlag ? envFlag.split('=')[1] : undefined;
  const result = resolveEnv(envName);

  if (args.includes('--print')) {
    if (result.baseUrl) {
      console.log(`export BASE_URL=${result.baseUrl}`);
    } else {
      console.error(`# No base URL found for environment "${result.env}"`);
      console.error(`# Available: ${result.availableEnvs.map(e => e.name).join(', ')}`);
      process.exit(1);
    }
  } else {
    console.log(JSON.stringify(result));
  }
}
