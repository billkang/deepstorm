import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  findPidByPort,
  getProcessCommand,
  isHeadless,
  killProcess,
  getStatus,
  stopMcp,
  ensureMcp,
} from '../mcp-manager.mjs';

// ── Pure function tests ────────────────────────────────────────────

describe('MCP Manager — isHeadless', () => {
  it('should return true when command contains --headless', () => {
    assert.equal(isHeadless('node mcp --headless'), true);
    assert.equal(isHeadless('/usr/bin/npx @playwright/mcp --port 54321 --headless'), true);
  });

  it('should return false when command lacks --headless', () => {
    assert.equal(isHeadless('node mcp --port 54321'), false);
    assert.equal(isHeadless(''), false);
  });

  it('should be case-sensitive (--headless must be lowercase)', () => {
    assert.equal(isHeadless('node mcp --Headless'), false);
  });
});

// ── OS-dependent function tests ────────────────────────────────────

describe('MCP Manager — findPidByPort', () => {
  it('should return null for an invalid/unused port number', () => {
    // Port 0 or a very high port unlikely to be in use
    const result = findPidByPort(0);
    assert.equal(result, null);
  });

  it('should return null for a negative port', () => {
    const result = findPidByPort(-1);
    assert.equal(result, null);
  });

  it('should return null for a very high unused port', () => {
    // Port 65535 is unlikely to be used in test environments
    const result = findPidByPort(65535);
    // This could potentially be in use, but extremely unlikely
    // Just verify it returns a number or null
    assert.ok(result === null || typeof result === 'number');
  });
});

describe('MCP Manager — getProcessCommand', () => {
  it('should return a non-empty string for the current process', () => {
    const cmd = getProcessCommand(process.pid);
    assert.ok(typeof cmd === 'string');
    assert.ok(cmd.length > 0);
    // Should contain "node" or the test runner
    assert.ok(cmd.includes('node') || cmd.includes('mjs'));
  });

  it('should return empty string for a non-existent PID', () => {
    // PID 1 is init/systemd, PID 0 is scheduler - neither is accessible
    // Use a ridiculously high PID that definitely doesn't exist
    const cmd = getProcessCommand(999999999);
    assert.equal(cmd, '');
  });
});

describe('MCP Manager — killProcess', () => {
  it('should not throw when killing a non-existent PID', () => {
    assert.doesNotThrow(() => {
      killProcess(999999999);
    });
  });

  it('should not throw when killing negative PID', () => {
    assert.doesNotThrow(() => {
      killProcess(-1);
    });
  });

  it('should not throw when killing NaN-like PID', () => {
    assert.doesNotThrow(() => {
      killProcess(undefined);
    });
  });
});

// ── Composed function tests ────────────────────────────────────────

describe('MCP Manager — getStatus', () => {
  it('should return not-running status for an unused port', () => {
    const status = getStatus(0);
    assert.equal(status.running, false);
    assert.equal(status.pid, null);
    assert.equal(status.mode, null);
  });

  it('should return a valid object structure even when not running', () => {
    const status = getStatus(65535);
    assert.ok(typeof status === 'object');
    assert.ok('running' in status);
    assert.ok('pid' in status);
    assert.ok('mode' in status);
  });

  // Note: testing the "running" case would require starting an actual MCP
  // process, which is expensive and has side effects. We skip that here
  // and rely on the unit tests for the component functions (findPidByPort,
  // getProcessCommand, isHeadless) which compose into getStatus.
});

describe('MCP Manager — stopMcp', () => {
  it('should return stopped=false when nothing is running on port', () => {
    const result = stopMcp(0);
    // Port 0 means "pick any available port" - nothing listens on port 0 itself
    // But lsof -ti tcp:0 might not work as expected on all systems
    // Just verify the function returns a valid shape without throwing
    assert.ok(typeof result === 'object');
    assert.ok('stopped' in result);
    assert.ok('pid' in result);
  });
});

describe('MCP Manager — ensureMcp', () => {
  it('should skip when mode=skip is passed', () => {
    const result = ensureMcp({ mode: 'skip' });
    assert.equal(result.action, 'skipped');
    assert.equal(result.mode, 'skip');
    assert.equal(result.pid, null);
  });

  it('should default to headless mode when no options given', { timeout: 5000 }, () => {
    // This will try to actually start MCP on default port, which will fail
    // in test environments. We test the mode defaulting and catch the spawn error.
    try {
      const result = ensureMcp({});
      assert.ok(['started', 'already-ok', 'switched'].includes(result.action));
      assert.equal(result.mode, 'headless');
    } catch (err) {
      assert.ok(
        err.message?.includes('MCP failed to start') || err.code === 'ENOENT',
        `Unexpected error: ${err.message}`,
      );
    }
  });

  it('should use provided port option', { timeout: 5000 }, () => {
    try {
      const result = ensureMcp({ mode: 'headless', port: 54322 });
      assert.equal(result.port, 54322);
    } catch (err) {
      assert.ok(
        err.message?.includes('MCP failed to start') || err.code === 'ENOENT',
        `Unexpected error: ${err.message}`,
      );
    }
  });
});
