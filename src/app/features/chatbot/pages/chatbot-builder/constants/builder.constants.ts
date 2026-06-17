export const BUILDER_CONSTANTS = {
  NODE_OPTIONS: [
    {
      title: 'Send message',
      type: 'message' as const,
      icon: 'chat',
      bgColor: 'bg-blue-500',
      iconBg: 'bg-blue-700',
    },
    {
      title: 'Question',
      type: 'question' as const,
      icon: 'question_answer',
      bgColor: 'bg-green-500',
      iconBg: 'bg-green-700',
    },
    {
      title: 'Buttons',
      type: 'interactive_buttons' as const,
      icon: 'widgets',
      bgColor: 'bg-yellow-500',
      iconBg: 'bg-yellow-700',
    },
    {
      title: 'Operation',
      type: 'operation' as const,
      icon: 'settings',
      bgColor: 'bg-purple-500',
      iconBg: 'bg-purple-700',
    },
  ],
  DEFAULT_NODE_POSITION: { x: 200, y: 200 },
  NODE_SPACING: {
    HORIZONTAL: 350,
    VERTICAL: 50,
  },
  PROGRESS: {
    STEP_INTERVAL: 800, // milliseconds
  },
} as const;

