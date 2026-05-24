// Custom Blockly block definitions for the robot car

(function () {
  'use strict';

  // ── Colour palette ──────────────────────────────────────────────────────────
  var COLOUR_CONTROL  = '#5C6BC0'; // indigo
  var COLOUR_MOVE     = '#26A69A'; // teal
  var COLOUR_TURN     = '#FFA726'; // orange
  var COLOUR_MISC     = '#AB47BC'; // purple

  // ── Block definitions ───────────────────────────────────────────────────────

  Blockly.defineBlocksWithJsonArray([

    // START — hat block (no previous connection)
    {
      type: 'car_start',
      message0: '🚦 Start',
      nextStatement: null,
      colour: COLOUR_CONTROL,
      tooltip: 'Your program begins here.',
      hat: 'cap',
    },

    // END
    {
      type: 'car_end',
      message0: '🏁 End',
      previousStatement: null,
      colour: COLOUR_CONTROL,
      tooltip: 'Your program ends here.',
    },

    // MOVE FORWARD
    {
      type: 'car_move_forward',
      message0: '⬆ Move forward for %1 seconds',
      args0: [
        {
          type: 'field_number',
          name: 'DURATION',
          value: 1,
          min: 0.1,
          max: 60,
          precision: 0.1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MOVE,
      tooltip: 'Drive forward for the given number of seconds.',
    },

    // MOVE BACKWARD
    {
      type: 'car_move_backward',
      message0: '⬇ Move backward for %1 seconds',
      args0: [
        {
          type: 'field_number',
          name: 'DURATION',
          value: 1,
          min: 0.1,
          max: 60,
          precision: 0.1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MOVE,
      tooltip: 'Drive backward for the given number of seconds.',
    },

    // TURN LEFT (fixed ~90°)
    {
      type: 'car_turn_left',
      message0: '↰ Turn left',
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot left approximately 90 degrees.',
    },

    // TURN RIGHT (fixed ~90°)
    {
      type: 'car_turn_right',
      message0: '↱ Turn right',
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot right approximately 90 degrees.',
    },

    // TURN AROUND (~180°)
    {
      type: 'car_turn_around',
      message0: '🔄 Turn around',
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot 180 degrees (turn around).',
    },

    // TURN LEFT FOR (timed)
    {
      type: 'car_turn_left_for',
      message0: '↰ Turn left for %1 seconds',
      args0: [
        {
          type: 'field_number',
          name: 'DURATION',
          value: 0.5,
          min: 0.1,
          max: 10,
          precision: 0.1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot left for the given number of seconds.',
    },

    // TURN RIGHT FOR (timed)
    {
      type: 'car_turn_right_for',
      message0: '↱ Turn right for %1 seconds',
      args0: [
        {
          type: 'field_number',
          name: 'DURATION',
          value: 0.5,
          min: 0.1,
          max: 10,
          precision: 0.1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_TURN,
      tooltip: 'Pivot right for the given number of seconds.',
    },

    // WAIT
    {
      type: 'car_wait',
      message0: '⏳ Wait %1 seconds',
      args0: [
        {
          type: 'field_number',
          name: 'DURATION',
          value: 1,
          min: 0.1,
          max: 60,
          precision: 0.1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: COLOUR_MISC,
      tooltip: 'Pause for the given number of seconds.',
    },

    // SET SPEED
    {
      type: 'car_set_speed',
      message0: '⚡ Set speed to %1',
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
      colour: COLOUR_MISC,
      tooltip: 'Set the motor speed (1=slow, 2=medium, 3=fast).',
    },

  ]);

})();
