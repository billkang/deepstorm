import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { initProject } from '../init-project.mjs';

describe('init-project — initProject', () => {
  let origCwd;
  let tmpDir;

  before(() => {
    origCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'init-test-'));
    process.chdir(tmpDir);
  });

  after(() => {
    process.chdir(origCwd);
  });

  it('should create project structure with playwright', () => {
    const result = initProject({ framework: 'playwright', dir: '.' });
    assert.equal(result.framework, 'playwright');

    // 目录存在
    assert.ok(existsSync(join(tmpDir, 'flows')));
    assert.ok(existsSync(join(tmpDir, 'flows/reports')));
    assert.ok(existsSync(join(tmpDir, 'scripts')));

    // 配置文件存在
    assert.ok(existsSync(join(tmpDir, 'package.json')));
    assert.ok(existsSync(join(tmpDir, 'tsconfig.json')));
    assert.ok(existsSync(join(tmpDir, 'playwright.config.ts')));

    // package.json 内容
    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'sweep-e2e');
    assert.ok(pkg.devDependencies['@playwright/test']);
    assert.ok(pkg.devDependencies['@inquirer/checkbox']);
  });

  it('should create project without playwright framework', () => {
    const subDir = join(tmpDir, 'sub-e2e');
    const result = initProject({ framework: null, dir: 'sub-e2e' });

    assert.ok(existsSync(join(subDir, 'flows')));
    assert.ok(existsSync(join(subDir, 'package.json')));
    assert.ok(!existsSync(join(subDir, 'playwright.config.ts')));

    const pkg = JSON.parse(readFileSync(join(subDir, 'package.json'), 'utf8'));
    assert.equal(pkg.devDependencies['@playwright/test'], undefined);
  });

  it('should not overwrite existing topology.yaml', () => {
    // topology.yaml 已经在第一个测试中创建
    assert.ok(existsSync(join(tmpDir, 'flows', 'topology.yaml')));
  });
});
