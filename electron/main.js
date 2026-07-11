const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const codegen = require('../src/compiler/codegen');
const uploader = require('../src/arduino/uploader');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'Pathfinders Coding',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Generate Arduino C++ from JSON AST
ipcMain.handle('generate-code', (event, ast) => {
  try {
    return { ok: true, code: codegen.generate(ast) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Detect available serial ports via Arduino CLI
ipcMain.handle('get-ports', async () => {
  try {
    const ports = await uploader.listPorts();
    return { ok: true, ports };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Compile + upload to Arduino
ipcMain.handle('upload-to-arduino', async (event, { ast, port, fqbn }) => {
  try {
    const code = codegen.generate(ast);
    const result = await uploader.upload(code, port, fqbn);
    return { ok: true, message: result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
