import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  parseDotEnv,
  readDotEnv,
  getDefaultEnv,
  listEnvs,
  resolveEnv,
  readFramework,
  checkMcpAvailable,
} from '../env-manager.mjs';

// ── Pure function tests (no file I/O) ──────────────────────────────

describe('Env Manager — parseDotEnv', () => {
  it('should parse KEY=VALUE pairs', () => {
    const content = [
      'BASE_URL_TEST=https://test.example.com',
      'BASE_URL_STAGING=https://staging.example.com',
      'DEFAULT_ENV=test',
    ].join('\n');
    const result = parseDotEnv(content);
    assert.equal(result.BASE_URL_TEST, 'https://test.example.com');
    assert.equal(result.BASE_URL_STAGING, 'https://staging.example.com');
    assert.equal(result.DEFAULT_ENV, 'test');
  });

  it('should strip surrounding double quotes from values', () => {
    const content = 'BASE_URL_TEST="https://test.example.com"';
    const result = parseDotEnv(content);
    assert.equal(result.BASE_URL_TEST, 'https://test.example.com');
  });

  it('should strip surrounding single quotes from values', () => {
    const content = "BASE_URL_TEST='https://test.example.com'";
    const result = parseDotEnv(content);
    assert.equal(result.BASE_URL_TEST, 'https://test.example.com');
  });

  it('should ignore comment lines and blank lines', () => {
    const content = [
      '# This is a comment',
      '',
      '  # indented comment',
      'BASE_URL_TEST=https://test.example.com',
      '',
    ].join('\n');
    const result = parseDotEnv(content);
    assert.equal(result.BASE_URL_TEST, 'https://test.example.com');
    assert.equal(Object.keys(result).length, 1);
  });

  it('should handle values with embedded = sign', () => {
    const content = 'SECRET=base64:abc123==';
    const result = parseDotEnv(content);
    assert.equal(result.SECRET, 'base64:abc123==');
  });

  it('should handle lines with no value after =', () => {
    const content = 'EMPTY_VAR=';
    const result = parseDotEnv(content);
    assert.equal(result.EMPTY_VAR, '');
  });

  it('should handle lines with no separator gracefully', () => {
    const content = 'JUST_A_KEY';
    const result = parseDotEnv(content);
    assert.equal(Object.keys(result).length, 0);
  });

  it('should trim whitespace around key and value', () => {
    const content = '  KEY =  some-value  ';
    const result = parseDotEnv(content);
    assert.equal(result.KEY, 'some-value');
  });

  it('should handle empty content', () => {
    const result = parseDotEnv('');
    assert.deepEqual(result, {});
  });

  it('should handle multiple values with varying quote styles', () => {
    const content = [
      'A=plain',
      'B="double quoted"',
      "C='single quoted'",
      'D=mixed"quote',
    ].join('\n');
    const result = parseDotEnv(content);
    assert.equal(result.A, 'plain');
    assert.equal(result.B, 'double quoted');
    assert.equal(result.C, 'single quoted');
    assert.equal(result.D, 'mixed"quote');
  });
});

describe('Env Manager — getDefaultEnv', () => {
  let origCwd;

  before(() => {
    origCwd = process.cwd();
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should return default from settings.json when configured', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: { environments: { default: 'staging' } },
    }));
    process.chdir(tmpDir);

    assert.equal(getDefaultEnv(), 'staging');
  });

  it('should fall back to "test" when settings.json has no default', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: { environments: { test: { baseUrl: 'http://localhost' } } },
    }));
    process.chdir(tmpDir);

    assert.equal(getDefaultEnv(), 'test');
  });

  it('should fall back to "test" when settings.json has no environments', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({}));
    process.chdir(tmpDir);

    assert.equal(getDefaultEnv(), 'test');
  });

  it('should fall back to "test" when .deepstorm/settings.json is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    process.chdir(tmpDir);

    assert.equal(getDefaultEnv(), 'test');
  });
});

describe('Env Manager — listEnvs', () => {
  let origCwd;

  before(() => {
    origCwd = process.cwd();
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should list environments from settings.json', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          test: { baseUrl: 'https://test.example.com' },
          staging: { baseUrl: 'https://staging.example.com' },
          prod: { baseUrl: 'https://prod.example.com' },
        },
      },
    }));
    process.chdir(tmpDir);

    const result = listEnvs();
    assert.equal(result.length, 3);
    assert.equal(result[0].name, 'test');
    assert.equal(result[0].url, 'https://test.example.com');
    assert.equal(result[1].name, 'staging');
    assert.equal(result[1].url, 'https://staging.example.com');
    assert.equal(result[2].name, 'prod');
    assert.equal(result[2].url, 'https://prod.example.com');
  });

  it('should exclude the default key from environments', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          test: { baseUrl: 'https://test.example.com' },
          default: 'test',
        },
      },
    }));
    process.chdir(tmpDir);

    const result = listEnvs();
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'test');
  });

  it('should return empty array when no environments configured', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({}));
    process.chdir(tmpDir);

    const result = listEnvs();
    assert.deepEqual(result, []);
  });

  it('should return empty array when settings.json is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    process.chdir(tmpDir);

    const result = listEnvs();
    assert.deepEqual(result, []);
  });

  it('should include key field in output', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          uat: { baseUrl: 'https://uat.example.com' },
        },
      },
    }));
    process.chdir(tmpDir);

    const result = listEnvs();
    assert.equal(result[0].key, 'BASE_URL_UAT');
  });
});

// ── File I/O dependent tests ───────────────────────────────────────

describe('Env Manager — readDotEnv', () => {
  let origCwd;

  before(() => {
    origCwd = process.cwd();
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should parse .env when file exists', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.env'), 'BASE_URL_TEST=https://test.example.com\n');
    process.chdir(tmpDir);
    const result = readDotEnv();
    assert.equal(result.BASE_URL_TEST, 'https://test.example.com');
  });

  it('should return empty object when .env does not exist', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    process.chdir(tmpDir);
    assert.deepEqual(readDotEnv(), {});
  });

  it('should handle empty .env file', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.env'), '');
    process.chdir(tmpDir);
    const result = readDotEnv();
    assert.deepEqual(result, {});
  });

  it('should handle .env with only comments', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.env'), '# comment\n  # indented\n');
    process.chdir(tmpDir);
    const result = readDotEnv();
    assert.deepEqual(result, {});
  });

  it('should catch read error and return empty object', () => {
    // Simulate by using a directory that exists but isn't readable as a file
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    // .env is a directory, not a file — readFileSync will throw
    mkdirSync(join(tmpDir, '.env'));
    process.chdir(tmpDir);
    const result = readDotEnv();
    assert.deepEqual(result, {});
  });
});

describe('Env Manager — resolveEnv', () => {
  let origCwd;

  before(() => {
    origCwd = process.cwd();
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should resolve a known environment from settings.json', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          test: { baseUrl: 'https://test.example.com' },
          staging: { baseUrl: 'https://staging.example.com' },
          default: 'test',
        },
      },
    }));
    process.chdir(tmpDir);

    const result = resolveEnv('staging');
    assert.equal(result.env, 'staging');
    assert.equal(result.baseUrl, 'https://staging.example.com');
    assert.equal(result.availableEnvs.length, 2);
  });

  it('should use default env when envName is omitted', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          test: { baseUrl: 'https://test.example.com' },
          default: 'test',
        },
      },
    }));
    process.chdir(tmpDir);

    const result = resolveEnv();
    assert.equal(result.env, 'test');
    assert.equal(result.baseUrl, 'https://test.example.com');
  });

  it('should fall back to "test" when default is not set', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          test: { baseUrl: 'https://test.example.com' },
        },
      },
    }));
    process.chdir(tmpDir);

    const result = resolveEnv();
    assert.equal(result.env, 'test');
    assert.equal(result.baseUrl, 'https://test.example.com');
  });

  it('should return null baseUrl for unknown environment', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {
        environments: {
          test: { baseUrl: 'https://test.example.com' },
          default: 'test',
        },
      },
    }));
    process.chdir(tmpDir);

    const result = resolveEnv('nonexistent');
    assert.equal(result.env, 'nonexistent');
    assert.equal(result.baseUrl, null);
    assert.equal(result.availableEnvs.length, 1);
  });

  it('should return env=test and baseUrl=null when settings.json is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    process.chdir(tmpDir);

    const result = resolveEnv();
    assert.equal(result.env, 'test');
    assert.equal(result.baseUrl, null);
    assert.deepEqual(result.availableEnvs, []);
  });
});

describe('Env Manager — readFramework', () => {
  let origCwd;

  before(() => {
    origCwd = process.cwd();
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should read playwright from .deepstorm/settings.json', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: { e2eFramework: 'playwright' },
    }));
    process.chdir(tmpDir);

    const result = readFramework();
    assert.equal(result.framework, 'playwright');
    assert.equal(result.source, 'deepstorm-settings');
  });

  it('should return null when .deepstorm/settings.json is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    process.chdir(tmpDir);

    const result = readFramework();
    assert.equal(result.framework, null);
    assert.equal(result.source, 'missing-file');
  });

  it('should handle malformed JSON gracefully', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), 'not-json{');
    process.chdir(tmpDir);

    const result = readFramework();
    assert.equal(result.framework, null);
    assert.equal(result.source, 'parse-error');
  });

  it('should return null when e2eFramework key is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({
      sweep: {},
    }));
    process.chdir(tmpDir);

    const result = readFramework();
    assert.equal(result.framework, null);
    assert.equal(result.source, 'not-configured');
  });

  it('should return null when sweep config is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({}));
    process.chdir(tmpDir);

    const result = readFramework();
    assert.equal(result.framework, null);
    assert.equal(result.source, 'not-configured');
  });

  it('should return not-configured when .deepstorm/settings.json has no e2eFramework', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    mkdirSync(join(tmpDir, '.deepstorm'), { recursive: true });
    writeFileSync(join(tmpDir, '.deepstorm/settings.json'), JSON.stringify({ reef: {} }));
    process.chdir(tmpDir);

    const result = readFramework();
    assert.equal(result.framework, null);
    assert.equal(result.source, 'not-configured');
  });
});

describe('Env Manager — checkMcpAvailable', () => {
  let origCwd;

  before(() => {
    origCwd = process.cwd();
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should return true when deepstorm-playwright is in .mcp.json', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.mcp.json'), JSON.stringify({
      mcpServers: {
        'deepstorm-playwright': { command: 'npx', args: ['@playwright/mcp'] },
      },
    }));
    process.chdir(tmpDir);

    const result = checkMcpAvailable();
    assert.equal(result.available, true);
    assert.equal(result.mcpName, 'deepstorm-playwright');
  });

  it('should return false when .mcp.json is missing', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    process.chdir(tmpDir);

    const result = checkMcpAvailable();
    assert.equal(result.available, false);
    assert.equal(result.mcpName, 'deepstorm-playwright');
  });

  it('should handle malformed .mcp.json gracefully', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.mcp.json'), '{broken');
    process.chdir(tmpDir);

    const result = checkMcpAvailable();
    assert.equal(result.available, false);
  });

  it('should return false when mcpServers does not contain the named service', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.mcp.json'), JSON.stringify({
      mcpServers: {
        'some-other-mcp': { command: 'echo' },
      },
    }));
    process.chdir(tmpDir);

    const result = checkMcpAvailable();
    assert.equal(result.available, false);
  });

  it('should accept custom mcpName parameter', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.mcp.json'), JSON.stringify({
      mcpServers: {
        'custom-mcp': { command: 'echo' },
      },
    }));
    process.chdir(tmpDir);

    const result = checkMcpAvailable('custom-mcp');
    assert.equal(result.available, true);
  });

  it('should detect MCP at top-level key (legacy format)', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'env-manager-test-'));
    writeFileSync(join(tmpDir, '.mcp.json'), JSON.stringify({
      'deepstorm-playwright': { command: 'npx', args: ['@playwright/mcp'] },
    }));
    process.chdir(tmpDir);

    const result = checkMcpAvailable();
    assert.equal(result.available, true);
  });
});
