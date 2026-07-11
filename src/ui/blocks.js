// Custom Blockly block definitions for the robot car

(function () {
  'use strict';

  // ── Colour palette ──────────────────────────────────────────────────────────
  var COLOUR_CONTROL  = '#2F91A3'; // teal
  var COLOUR_MOVE     = '#E0A93A'; // gold (movement + turns + set speed)
  var COLOUR_TURN     = '#E0A93A'; // same — merged into Movement
  var COLOUR_MISC     = '#2F91A3'; // teal (wait — lives in Control)
  var COLOUR_LOOP     = '#3C6178'; // navy

  // ── SVG icon helper ─────────────────────────────────────────────────────────
  function icon(inner, w, h) {
    w = w || 22; h = h || 22;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
      '" viewBox="0 0 ' + w + ' ' + h +
      '" fill="none" stroke="white" stroke-width="3.5"' +
      ' stroke-linecap="round" stroke-linejoin="round">' +
      inner + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  var ICON_TURN_LEFT   = icon('<path d="M18 19 Q18 5 5 5"/><polyline points="9,3 5,5 9,9"/>');
  var ICON_TURN_RIGHT  = icon('<path d="M4 19 Q4 5 17 5"/><polyline points="13,3 17,5 13,9"/>');
  var ICON_TURN_AROUND = icon('<path d="M5 19 L5 9 Q5 3 11 3 Q17 3 17 9 L17 14"/><polyline points="14,10 17,14 20,10"/>');

  function imgArg(url) {
    return { type: 'field_image', src: url, width: 22, height: 22, alt: '' };
  }

  // ── Block definitions ───────────────────────────────────────────────────────

  Blockly.defineBlocksWithJsonArray([

    // START — hat block (no previous connection)
    {
      type: 'car_start',
      message0: 'Start',
      nextStatement: null,
      colour: COLOUR_CONTROL,
      tooltip: 'Your program begins here.',
      hat: 'cap',
    },

    // END
    {
      type: 'car_end',
      message0: 'End',
      previousStatement: null,
      colour: COLOUR_CONTROL,
      tooltip: 'Your program ends here.',
    },

    // MOVE FORWARD
    {
      type: 'car_move_forward',
      message0: 'Move forward for %1 seconds',
      args0: [
        { type: 'field_number', name: 'DURATION', value: 1, min: 0.1, max: 60, precision: 0.1 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MOVE,
      tooltip: 'Drive forward for the given number of seconds.',
    },

    // MOVE BACKWARD
    {
      type: 'car_move_backward',
      message0: 'Move backward for %1 seconds',
      args0: [
        { type: 'field_number', name: 'DURATION', value: 1, min: 0.1, max: 60, precision: 0.1 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MOVE,
      tooltip: 'Drive backward for the given number of seconds.',
    },

    // TURN LEFT (fixed ~90°)
    {
      type: 'car_turn_left',
      message0: '%1 Turn left',
      args0: [ imgArg(ICON_TURN_LEFT) ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot left approximately 90 degrees.',
    },

    // TURN RIGHT (fixed ~90°)
    {
      type: 'car_turn_right',
      message0: '%1 Turn right',
      args0: [ imgArg(ICON_TURN_RIGHT) ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot right approximately 90 degrees.',
    },

    // TURN AROUND (~180°)
    {
      type: 'car_turn_around',
      message0: '%1 Turn around',
      args0: [ imgArg(ICON_TURN_AROUND) ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot 180 degrees (turn around).',
    },

    // TURN LEFT FOR (timed)
    {
      type: 'car_turn_left_for',
      message0: '%1 Turn left for %2 seconds',
      args0: [
        imgArg(ICON_TURN_LEFT),
        { type: 'field_number', name: 'DURATION', value: 0.5, min: 0.1, max: 10, precision: 0.1 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot left for the given number of seconds.',
    },

    // TURN RIGHT FOR (timed)
    {
      type: 'car_turn_right_for',
      message0: '%1 Turn right for %2 seconds',
      args0: [
        imgArg(ICON_TURN_RIGHT),
        { type: 'field_number', name: 'DURATION', value: 0.5, min: 0.1, max: 10, precision: 0.1 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot right for the given number of seconds.',
    },

    // WAIT
    {
      type: 'car_wait',
      message0: 'Wait %1 seconds',
      args0: [
        { type: 'field_number', name: 'DURATION', value: 1, min: 0.1, max: 60, precision: 0.1 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MISC,
      tooltip: 'Pause for the given number of seconds.',
    },

    // SET SPEED
    {
      type: 'car_set_speed',
      message0: 'Set speed to %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'LEVEL',
          options: [
            ['1 — Slow', '1'],
            ['2 — Medium', '2'],
            ['3 — Fast', '3'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MOVE,
      tooltip: 'Set the motor speed (1=slow, 2=medium, 3=fast).',
    },

    // REPEAT (finite loop — C-shape)
    {
      type: 'car_repeat',
      message0: 'Repeat %1 times',
      args0: [
        { type: 'field_number', name: 'TIMES', value: 3, min: 1, max: 999, precision: 1 },
      ],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_LOOP,
      tooltip: 'Repeat the blocks inside a set number of times.',
    },

    // LOOP FOREVER (infinite loop — C-shape, no nextStatement so it terminates the chain)
    {
      type: 'car_loop_forever',
      message0: 'Loop forever',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      colour: COLOUR_LOOP,
      tooltip: 'Repeat the blocks inside forever.',
    },

  ]);

})();
