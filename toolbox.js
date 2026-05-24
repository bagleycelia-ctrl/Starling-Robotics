// Blockly toolbox definition — exposes all car blocks grouped by category

window.CAR_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '🚦 Control',
      colour: '#5C6BC0',
      contents: [
        { kind: 'block', type: 'car_start' },
        { kind: 'block', type: 'car_end' },
      ],
    },
    {
      kind: 'category',
      name: '🚗 Movement',
      colour: '#26A69A',
      contents: [
        {
          kind: 'block',
          type: 'car_move_forward',
          fields: { DURATION: 1 },
        },
        {
          kind: 'block',
          type: 'car_move_backward',
          fields: { DURATION: 1 },
        },
      ],
    },
    {
      kind: 'category',
      name: '↩ Turning',
      colour: '#FFA726',
      contents: [
        { kind: 'block', type: 'car_turn_left' },
        { kind: 'block', type: 'car_turn_right' },
        { kind: 'block', type: 'car_turn_around' },
        {
          kind: 'block',
          type: 'car_turn_left_for',
          fields: { DURATION: 0.5 },
        },
        {
          kind: 'block',
          type: 'car_turn_right_for',
          fields: { DURATION: 0.5 },
        },
      ],
    },
    {
      kind: 'category',
      name: '⚙ Misc',
      colour: '#AB47BC',
      contents: [
        {
          kind: 'block',
          type: 'car_wait',
          fields: { DURATION: 1 },
        },
        {
          kind: 'block',
          type: 'car_set_speed',
          fields: { LEVEL: '2' },
        },
      ],
    },
  ],
};
