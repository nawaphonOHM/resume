#!/usr/bin/env node

/**
 * Reusable test runner script that executes Angular/Vitest unit tests,
 * enforces process timeouts to prevent hangs, captures stdout/stderr,
 * and extracts failed test names and error messages for immediate diagnosis.
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

const timeoutMs = parseInt(process.env.TEST_TIMEOUT_MS || '120000', 10);
const args = process.argv.slice(2);
const defaultArgs = ['test', '--watch=false'];
const finalArgs = args.length > 0 ? ['test', '--watch=false', ...args] : defaultArgs;

console.log(`[test-runner] Executing: npx ng ${finalArgs.join(' ')}`);
console.log(`[test-runner] Timeout configured: ${timeoutMs / 1000}s`);
const startTime = Date.now();

const child = spawn('npx', ['ng', ...finalArgs], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: process.env,
});

let stdout = '';
let stderr = '';
let timedOut = false;

const timer = setTimeout(() => {
  timedOut = true;
  console.error(
    `\n[test-runner] ERROR: Process exceeded timeout of ${timeoutMs / 1000}s. Terminating.`,
  );
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 3000).unref();
}, timeoutMs);

child.stdout?.on('data', (data) => {
  const str = data.toString();
  stdout += str;
  process.stdout.write(str);
});

child.stderr?.on('data', (data) => {
  const str = data.toString();
  stderr += str;
  process.stderr.write(str);
});

child.on('close', (code) => {
  clearTimeout(timer);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n----------------------------------------`);
  console.log(`[test-runner] Finished in ${duration}s with exit code ${timedOut ? 124 : code}`);

  if (code !== 0 || timedOut) {
    console.error(`\n[test-runner] TEST FAILURES / ERRORS DETECTED:`);
    const combined = stdout + '\n' + stderr;
    const failureLines = combined
      .split('\n')
      .filter(
        (line) =>
          line.includes('FAIL') ||
          line.includes('AssertionError') ||
          line.includes('Error:') ||
          line.includes('✕') ||
          line.includes('failed'),
      );
    if (failureLines.length > 0) {
      console.error(failureLines.join('\n'));
    }
  } else {
    console.log(`[test-runner] All tests executed successfully.`);
  }

  process.exit(timedOut ? 124 : (code ?? 1));
});
