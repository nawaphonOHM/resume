#!/usr/bin/env node

/**
 * Reusable test runner script that executes Angular/Vitest unit tests,
 * captures stdout/stderr, reports progress, and surfaces any failure details.
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

const args = process.argv.slice(2);
const defaultArgs = ['test', '--watch=false'];
const finalArgs = args.length > 0 ? ['test', '--watch=false', ...args] : defaultArgs;

console.log(`[test-runner] Executing: npx ng ${finalArgs.join(' ')}`);
const startTime = Date.now();

const child = spawn('npx', ['ng', ...finalArgs], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: process.env,
});

let stdout = '';
let stderr = '';

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
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n----------------------------------------`);
  console.log(`[test-runner] Finished in ${duration}s with exit code ${code}`);

  if (code !== 0) {
    console.error(`\n[test-runner] TEST FAILURES DETECTED:`);
    const combined = stdout + '\n' + stderr;
    const failureLines = combined
      .split('\n')
      .filter(
        (line) =>
          line.includes('FAIL') || line.includes('AssertionError') || line.includes('Error:'),
      );
    if (failureLines.length > 0) {
      console.error(failureLines.join('\n'));
    }
  } else {
    console.log(`[test-runner] All tests executed successfully.`);
  }

  process.exit(code ?? 1);
});
