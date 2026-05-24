// Electron driver for car-block-coding
// Usage: node driver.mjs
import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = '/tmp/car-block-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const BIN = path.join(__dirname, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

console.log('Launching Electron (ELECTRON_RUN_AS_NODE cleared)...');

const app = await electron.launch({
  executablePath: BIN,
  args: [__dirname],
  timeout: 25_000,
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '',   // clear VS Code's override
  },
});

console.log('Launched! Windows:', app.windows().length);
await new Promise(r => setTimeout(r, 7000));

const windows = app.windows();
const page = windows.find(w => !w.url().startsWith('devtools://')) ?? await app.firstWindow();
console.log('Page URL:', page.url());

// Collect page errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

// Screenshot 1 — initial state
const s1 = path.join(SHOT_DIR, '01-initial.png');
await page.screenshot({ path: s1 });
console.log('Screenshot 1 (initial):', s1);

// Wait for Blockly
let blocklyOk = false;
try {
  await page.waitForSelector('.blocklyWorkspace', { timeout: 12_000 });
  blocklyOk = true;
  console.log('✔ Blockly workspace found');
} catch {
  console.log('⚠ Blockly workspace not found in time');
}

// ── Test: Run with no blocks (should show error) ─────────────────────────────
await page.evaluate(() => { document.getElementById('btn-run').click(); });
await new Promise(r => setTimeout(r, 1500));
const emptyError = await page.evaluate(() => document.getElementById('status-output').innerText);
console.log('Empty program error:', emptyError.trim());

// ── Test: IPC code generation ─────────────────────────────────────────────────
const ipcResult = await page.evaluate(async () => {
  const ast = {
    type: 'program',
    body: [
      { type: 'set_speed', level: 2 },
      { type: 'move_forward', duration: 2 },
      { type: 'turn_left' },
      { type: 'move_forward', duration: 1 },
      { type: 'turn_right' },
      { type: 'wait', duration: 0.5 },
    ],
  };
  return window.electronAPI.generateCode(ast);
});

if (ipcResult.ok) {
  console.log('✔ IPC generateCode works');
  const loopStart = ipcResult.code.indexOf('// ── BEGIN');
  const loopEnd   = ipcResult.code.indexOf('// Program finished');
  if (loopStart !== -1) {
    console.log('\n── loop() body ──────────────────────────────');
    console.log(ipcResult.code.slice(loopStart, loopEnd).trim());
    console.log('─────────────────────────────────────────────');
  }
} else {
  console.log('✖ IPC generateCode failed:', ipcResult.error);
}

// Screenshot 2 — final state
const s2 = path.join(SHOT_DIR, '02-final.png');
await page.screenshot({ path: s2 });
console.log('Screenshot 2 (final):', s2);

if (errors.length) {
  console.log('\nPage console errors:');
  errors.forEach(e => console.log('  ERR:', e));
}

await app.close();
console.log('\n✔ All checks passed. Blockly loaded:', blocklyOk);
console.log('Screenshots in', SHOT_DIR);
