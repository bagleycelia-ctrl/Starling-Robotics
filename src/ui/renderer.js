// Renderer process — Blockly workspace wiring + button handlers

(function () {
  'use strict';

  // ── Blockly workspace ───────────────────────────────────────────────────────

  var kidTheme = Blockly.Theme.defineTheme('carKid', {
    base: Blockly.Themes.Classic,
    fontStyle: {
      family: "'Fredoka One', 'Chalkboard SE', cursive",
      weight: '400',
      size: 14,
    },
    componentStyles: {
      workspaceBackgroundColour: '#EEF2FF',
      toolboxBackgroundColour: '#FFFFFF',
      toolboxForegroundColour: '#333',
      flyoutBackgroundColour: '#F8F9FF',
      flyoutForegroundColour: '#333',
      flyoutOpacity: 1,
      scrollbarColour: '#C5CAE9',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#FF9F43',
      insertionMarkerOpacity: 0.5,
      cursorColour: '#54A0FF',
    },
  });

  var workspace = Blockly.inject('blockly-div', {
    toolbox: window.CAR_TOOLBOX,
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 2, minScale: 0.5 },
    grid: { spacing: 24, length: 4, colour: '#D0D8FF', snap: true },
    theme: kidTheme,
    sounds: false,
  });

  // Keep the flyout (block palette) at a fixed scale so it doesn't zoom with the workspace
  (function () {
    var toolbox = workspace.getToolbox();
    if (!toolbox) return;
    var flyout = typeof toolbox.getFlyout === 'function' ? toolbox.getFlyout() : null;
    if (!flyout) return;
    var fw = typeof flyout.getWorkspace === 'function' ? flyout.getWorkspace() : null;
    if (!fw || !fw.setScale) return;
    var _set = fw.setScale.bind(fw);
    fw.setScale = function () { _set(1); };
  }());

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
      throw new Error('No Start block found. Drag a Start block onto the workspace.');
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

  function statementsToNodes(firstBlock) {
    var nodes = [];
    var current = firstBlock;
    while (current) {
      var node = blockToNode(current);
      if (node) nodes.push(node);
      current = current.getNextBlock();
    }
    return nodes;
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

      case 'car_repeat':
        return { type: 'repeat', times: +block.getFieldValue('TIMES'), body: statementsToNodes(block.getInputTargetBlock('DO')) };

      case 'car_loop_forever':
        return { type: 'loop_forever', body: statementsToNodes(block.getInputTargetBlock('DO')) };

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

    var result;
    try {
      var timeout = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Scan timed out after 5 seconds.')); }, 5000);
      });
      result = await Promise.race([window.electronAPI.getPorts(), timeout]);
    } catch (e) {
      log('<span class="status-error">⚠ Port scan error: ' + escHtml(e.message) + '</span>');
      setButtons(true);
      return;
    }

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
      log('<span class="status-error">⚠ No port selected. Click "Detect Ports" first, then choose your Arduino.</span>');
      return;
    }

    var fqbn = document.getElementById('fqbn-select').value;

    setButtons(false);
    clearStatus();
    log('<span class="status-info"><span class="spinner"></span>Compiling and uploading…</span>');

    var result = await window.electronAPI.uploadToArduino({ ast: ast, port: port, fqbn: fqbn });

    if (result.ok) {
      log('<span class="status-ok">✔ Upload complete! Your car is ready to run.</span>');
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

  // No auto-scan on startup — click "Detect Ports" to scan

})();
