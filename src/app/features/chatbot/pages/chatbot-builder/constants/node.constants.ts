export const NODE_CONSTANTS = {
  ZOOM: {
    MIN: 0.2,
    MAX: 2,
    STEP: 0.1
  },
  DRAG: {
    LONG_PRESS_THRESHOLD: 150, // Reduced for more responsive feel
    SNAP_SIZE: 20,
    DRAG_THRESHOLD: 5, // Pixels to move before starting drag
    UPDATE_THROTTLE: 16 // ~60fps
  },
  DIMENSIONS: {
    MESSAGE_WIDTH: 320,
    BUTTON_WIDTH: 384,
    CARD_HEIGHT: 120
  },
  COLORS: {
    MESSAGE: 'bg-blue-500',
    QUESTION: 'bg-green-500',
    BUTTONS: 'bg-yellow-500'
  },
  PERFORMANCE: {
    USE_TRANSFORM_DURING_DRAG: true,
    ENABLE_HARDWARE_ACCELERATION: true,
    THROTTLE_UPDATES: true
  },
  CANVAS: {
    PADDING: 24 // p-6 = 1.5rem = 24px
  }
} as const;
