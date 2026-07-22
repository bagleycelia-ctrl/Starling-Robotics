'use strict';

const { execFile, execFileSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const util = require('util');

const execFileAsync = util.promisify(execFile);

// ── Arduino CLI location ──────────────────────────────────────────────────────

// Checks these locations in order; falls back to PATH.
const CANDIDATE_PATHS = [
  '/usr/local/bin/arduino-cli',
  '/opt/homebrew/bin/arduino-cli',          // Apple Silicon Homebrew
  '/home/linuxbrew/.linuxbrew/bin/arduino-cli',
  path.join(os.homedir(), '.local/bin/arduino-cli'),
  'arduino-cli',                            // already in PATH
];

let _cliPath = null;

async function findCLI() {
  if (_cliPath) return _cliPath;

  for (const candidate of CANDIDATE_PATHS) {
    try {
      await execFileAsync(candidate, ['version'], { timeout: 5000 });
      _cliPath = candidate;
      return _cliPath;
    } catch (_) {
      // not found here; try next
    }
  }

  throw new Error(
    'arduino-cli not found.\n\n' +
    'Install it with one of these commands:\n' +
    '  macOS:  brew install arduino-cli\n' +
    '  Linux:  curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh\n' +
    '  Windows: winget install ArduinoSA.CLI\n\n' +
    'After installing, restart Car Block Coding.'
  );
}

// ── Native port fallback (no arduino-cli needed) ──────────────────────────────

// Matches the common USB-serial chip names that Arduino boards use on macOS/Linux.
const SERIAL_RE = /^(cu\.usb|cu\.SLAB|cu\.wch|cu\.ch340|ttyUSB|ttyACM)/i;

function listWindowsPorts() {
  try {
    const output = execFileSync(
      'reg',
      ['query', 'HKLM\\HARDWARE\\DEVICEMAP\\SERIALCOMM'],
      { encoding: 'utf8', timeout: 5000 }
    );
    const ports = [];
    output.split(/\r?\n/).forEach((line) => {
      const m = line.trim().match(/(COM\d+)\s*$/i);
      if (m) ports.push({ address: m[1], label: '' });
    });
    return ports;
  } catch (_) {
    // Registry key doesn't exist when no serial devices have ever connected
    return [];
  }
}

function listNativePorts() {
  if (process.platform === 'win32') return listWindowsPorts();

  const devDir = '/dev/';
  try {
    return fs.readdirSync(devDir)
      .filter((name) => SERIAL_RE.test(name))
      .map((name) => ({ address: devDir + name, label: '' }));
  } catch (_) {
    return [];
  }
}

// ── List connected boards ─────────────────────────────────────────────────────

/**
 * Returns an array of { address, label } objects for connected boards.
 * Uses arduino-cli for board identification; falls back to native /dev/ scan.
 */
async function listPorts() {
  // Try arduino-cli first (gives board names)
  try {
    const cli = await findCLI();

    let stdout = '';
    try {
      ({ stdout } = await execFileAsync(cli, ['board', 'list', '--format', 'json'], {
        timeout: 15000,
      }));
    } catch (err) {
      // arduino-cli exits non-zero when no boards are connected; stdout still has JSON
      stdout = err.stdout || '';
      if (!stdout) throw new Error('arduino-cli board list failed: ' + err.message);
    }

    let parsed;
    try { parsed = JSON.parse(stdout); } catch (_) { parsed = null; }

    if (parsed) {
      // arduino-cli ≥0.35 returns { detected_ports: [...] }; older returns an array
      const raw = Array.isArray(parsed) ? parsed : (parsed.detected_ports || []);
      const cliPorts = raw
        .filter((p) => p.port && p.port.address)
        .map((p) => ({
          address: p.port.address,
          label: p.matching_boards && p.matching_boards[0]
            ? p.matching_boards[0].name
            : (p.port.label || ''),
        }));
      if (cliPorts.length > 0) return cliPorts;
    }
  } catch (_) {
    // arduino-cli not installed or failed — fall through to native scan
  }

  // Fallback: scan /dev/ for USB-serial devices
  return listNativePorts();
}

// ── Sketch management ─────────────────────────────────────────────────────────

const SKETCH_NAME = 'car_sketch';

function getSketchDir() {
  return path.join(os.tmpdir(), SKETCH_NAME);
}

function writeSketch(code) {
  const dir = getSketchDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, SKETCH_NAME + '.ino'), code, 'utf8');
  return dir;
}

// ── Compile + Upload ──────────────────────────────────────────────────────────

/**
 * Compile and upload an Arduino sketch to a connected board.
 *
 * @param {string} code   Complete .ino source
 * @param {string} port   Serial port, e.g. /dev/cu.usbserial-1420
 * @param {string} fqbn   Fully-qualified board name, e.g. arduino:avr:nano:cpu=atmega328old
 * @returns {string} Success message
 */
async function upload(code, port, fqbn) {
  const cli = await findCLI();
  const sketchDir = writeSketch(code);

  // ── 1. Ensure arduino:avr core is installed ─────────────────────────────
  try {
    await execFileAsync(cli, ['core', 'install', 'arduino:avr'], { timeout: 120000 });
  } catch (err) {
    // Non-fatal if already installed; the error text says "already installed"
    if (!(err.stderr || err.stdout || '').includes('already installed')) {
      throw new Error('Failed to install arduino:avr core:\n' + (err.stderr || err.message));
    }
  }

  // ── 2. Compile ──────────────────────────────────────────────────────────
  let compileOut;
  try {
    compileOut = await execFileAsync(
      cli,
      ['compile', '--fqbn', fqbn, sketchDir],
      { timeout: 120000 }
    );
  } catch (err) {
    throw new Error(
      'Compile failed:\n' +
      (err.stderr || err.stdout || err.message)
    );
  }

  // ── 3. Upload ───────────────────────────────────────────────────────────
  let uploadOut;
  try {
    uploadOut = await execFileAsync(
      cli,
      ['upload', '-p', port, '--fqbn', fqbn, sketchDir],
      { timeout: 60000 }
    );
  } catch (err) {
    throw new Error(
      'Upload failed:\n' +
      (err.stderr || err.stdout || err.message) +
      '\n\nCheck that:\n' +
      '  • The correct port is selected\n' +
      '  • The correct board variant is selected (old vs new bootloader)\n' +
      '  • No other program is using the port'
    );
  }

  const out = (uploadOut.stdout || '') + (uploadOut.stderr || '');
  return out.trim() || 'Upload complete.';
}

module.exports = { listPorts, upload };
