// Renderer process — Blockly workspace wiring + button handlers

(function () {
  'use strict';

  // ── Blockly workspace ───────────────────────────────────────────────────────

  var darkTheme = Blockly.Theme.defineTheme('carDark', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#1e1e2e',
      toolboxBackgroundColour: '#16213e',
      toolboxForegroundColour: '#eee',
      flyoutBackgroundColour: '#0f3460',
      flyoutForegroundColour: '#eee',
      flyoutOpacity: 0.97,
      scrollbarColour: '#4a4a6e',
      scrollbarOpacity: 0.5,
      insertionMarkerColour: '#fff',
      insertionMarkerOpacity: 0.3,
      cursorColour: '#d0d0ff',
    },
  });

  var workspace = Blockly.inject('blockly-div', {
    toolbox: window.CAR_TOOLBOX,
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 2, minScale: 0.5 },
    grid: { spacing: 20, length: 3, colour: '#2a2a4a', snap: true },
    theme: darkTheme,
    sounds: false,
  });

  // Pre-populate workspace with a Start block so kids aren't staring at nothing
  var startXml = `
    <xml>
      <block type="car_start" x="60" y="60"></block>
    </xml>`;
  Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(startXml), workspace);

  // ── AST extraction ──────────────────────────────────────────────────────────

  function workspaceToAST() {
    // Find the start block (hat block with no previous)
    var allBlocks = workspace.getAllBlocks(false);
    var startBlock = null;
    for (var i = 0; i < allBlocks.length; i++) {
      if (allBlocks[i].type === 'car_start') {
        startBlock = allBlocks[i];
        break;
      }
    }
    if (!startBlock) {
      throw new Error('No Start block found. Drag a 🚦 Start block onto the workspace.');
    }

    var body = [];
    var current = startBlock.getNextBlock();
    while (current && current.type !== 'car_end') {
      var node = blockToNode(current);
      if (node) body.push(node);
      current = current.getNextBlock();
    }

    if (body.length === 0) {
      throw new Error('Your program has no instructions. Add some blocks between Start and End!');
    }

    return { type: 'program', body: body };
  }

  function blockToNode(block) {
    switch (block.type) {
      case 'car_move_forward':
        return { type: 'move_forward', duration: +block.getFieldValue('DURATION') };

      case 'car_move_backward':
        return { type: 'move_backward', duration: +block.getFieldValue('DURATION') };

      case 'car_turn_left':
        return { type: 'turn_left' };

      case 'car_turn_right':
        return { type: 'turn_right' };

      case 'car_turn_around':
        return { type: 'turn_around' };

      case 'car_turn_left_for':
        return { type: 'turn_left_for', duration: +block.getFieldValue('DURATION') };

      case 'car_turn_right_for':
        return { type: 'turn_right_for', duration: +block.getFieldValue('DURATION') };

      case 'car_wait':
        return { type: 'wait', duration: +block.getFieldValue('DURATION') };

      case 'car_set_speed':
        return { type: 'set_speed', level: +block.getFieldValue('LEVEL') };

      default:
        return null;
    }
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────

  var codeOutput   = document.getElementById('code-output');
  var statusOutput = document.getElementById('status-output');
  var tabs         = document.querySelectorAll('.tab');

  function showTab(name) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); });
    codeOutput.style.display   = (name === 'code')   ? '' : 'none';
    statusOutput.style.display = (name === 'status') ? '' : 'none';
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { showTab(t.dataset.tab); });
  });

  function log(html) {
    statusOutput.innerHTML += html + '<br>';
    statusOutput.scrollTop = statusOutput.scrollHeight;
    showTab('status');
  }

  function clearStatus() {
    statusOutput.innerHTML = '';
  }

  function setButtons(enabled) {
    document.getElementById('btn-run').disabled    = !enabled;
    document.getElementById('btn-upload').disabled = !enabled;
    document.getElementById('btn-ports').disabled  = !enabled;
  }

  // ── Port detection ──────────────────────────────────────────────────────────

  var portSelect = document.getElementById('port-select');

  async function refreshPorts() {
    setButtons(false);
    clearStatus();
    log('<span class="status-info"><span class="spinner"></span>Scanning for Arduino boards…</span>');

    var result = await window.electronAPI.getPorts();

    if (!result.ok) {
      log('<span class="status-error">⚠ Could not list ports: ' + escHtml(result.error) + '</span>');
      log('<span class="status-warn">Make sure Arduino CLI is installed and in your PATH.<br>'
        + 'Install: <code>brew install arduino-cli</code> or visit arduino.cc/en/software</span>');
      setButtons(true);
      return;
    }

    // Rebuild dropdown
    portSelect.innerHTML = '<option value="">-- select port --</option>';
    result.ports.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.address;
      opt.textContent = p.address + (p.label ? '  (' + p.label + ')' : '');
      portSelect.appendChild(opt);
    });

    if (result.ports.length === 0) {
      log('<span class="status-warn">No Arduino boards detected. Plug in your Arduino Nano and try again.</span>');
    } else {
      portSelect.value = result.ports[0].address; // auto-select first
      log('<span class="status-ok">✔ Found ' + result.ports.length + ' port(s). Selected: ' + escHtml(result.ports[0].address) + '</span>');
    }

    setButtons(true);
  }

  document.getElementById('btn-ports').addEventListener('click', refreshPorts);

  // ── Run Program (code preview) ──────────────────────────────────────────────

  document.getElementById('btn-run').addEventListener('click', async function () {
    var ast;
    try {
      ast = workspaceToAST();
    } catch (e) {
      clearStatus();
      log('<span class="status-error">⚠ ' + escHtml(e.message) + '</span>');
      return;
    }

    setButtons(false);

    var result = await window.electronAPI.generateCode(ast);

    if (result.ok) {
      codeOutput.textContent = result.code;
      showTab('code');
    } else {
      clearStatus();
      log('<span class="status-error">⚠ Code generation failed:<br>' + escHtml(result.error) + '</span>');
    }

    setButtons(true);
  });

  // ── Upload to Car ───────────────────────────────────────────────────────────

  document.getElementById('btn-upload').addEventListener('click', async function () {
    var ast;
    try {
      ast = workspaceToAST();
    } catch (e) {
      clearStatus();
      log('<span class="status-error">⚠ ' + escHtml(e.message) + '</span>');
      return;
    }

    var port = portSelect.value;
    if (!port) {
      clearStatus();
      log('<span class="status-error">⚠ No port selected. Click "⟳ Detect Ports" first, then choose your Arduino.</span>');
      return;
    }

    var fqbn = document.getElementById('fqbn-select').value;

    setButtons(false);
    clearStatus();
    log('<span class="status-info"><span class="spinner"></span>Compiling and uploading…</span>');

    var result = await window.electronAPI.uploadToArduino({ ast: ast, port: port, fqbn: fqbn });

    if (result.ok) {
      log('<span class="status-ok">✔ Upload complete! Your car is ready to run. 🚗</span>');
      if (result.message) {
        log('<span class="status-info">' + escHtml(result.message) + '</span>');
      }
    } else {
      log('<span class="status-error">✖ Upload failed:</span>');
      log('<pre style="color:#ef9a9a;font-size:0.75rem">' + escHtml(result.error) + '</pre>');
      log('<span class="status-warn">Tip: Check that the correct port and board variant are selected.</span>');
    }

    setButtons(true);
  });

  // ── Utility ─────────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Trigger initial port scan on startup
  refreshPorts();

})();
