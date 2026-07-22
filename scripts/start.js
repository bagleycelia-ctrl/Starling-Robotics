'use strict';

// Launches the real Electron binary directly, explicitly stripping
// ELECTRON_RUN_AS_NODE from the child's environment. That variable is
// sometimes inherited from a parent process (e.g. VS Code's integrated
// terminal), and it makes Electron start as a plain Node process instead
// of launching the app window. Setting it to an empty string via a shell
// env-prefix is not reliable on Windows, so it's deleted here instead.

const { spawn } = require('child_process');

const electronPath = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], { stdio: 'inherit', env });

child.on('close', (code) => process.exit(code === null ? 1 : code));
