/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#0B67D0',
          hover: '#0952A5',
          active: '#073D7A',
          light: '#E8F2FC',
          dark: '#3B82F6',
          'dark-hover': '#60A5FA',
          'dark-active': '#2563EB',
        },
        secondary: {
          DEFAULT: '#E8F2FC',
          hover: '#D0E5F9',
          text: '#0B67D0',
        },
        accent: '#00A86B',

        // Semantic colors
        success: {
          DEFAULT: '#4CAF50',
          light: '#E8F5E9',
          dark: '#4ADE80',
          'dark-light': 'rgba(74, 222, 128, 0.15)',
        },
        danger: {
          DEFAULT: '#FF6B6B',
          light: '#FFEBEE',
          dark: '#F87171',
          'dark-light': 'rgba(248, 113, 113, 0.15)',
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFF3E0',
          dark: '#FBBF24',
          'dark-light': 'rgba(251, 191, 36, 0.15)',
        },
        info: {
          DEFAULT: '#2196F3',
          light: '#E3F2FD',
          dark: '#60A5FA',
          'dark-light': 'rgba(96, 165, 250, 0.15)',
        },

        // Surface colors (light mode)
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F5',
          tertiary: '#E8E8E8',
          elevated: '#FFFFFF',
        },

        // Dark mode surface colors
        'dark-surface': {
          DEFAULT: '#0F1419',
          secondary: '#1A1F26',
          tertiary: '#2D3748',
          elevated: '#1E2530',
        },

        // Text colors
        'text-primary': '#1A1A1A',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',

        // Dark mode text colors
        'dark-text': {
          primary: '#E8E8E8',
          secondary: '#A0A0A0',
          tertiary: '#6B7280',
        },

        // Border colors
        border: {
          DEFAULT: '#E0E0E0',
          secondary: '#CCCCCC',
        },

        // Dark mode border colors
        'dark-border': {
          DEFAULT: '#2D3748',
          secondary: '#4A5568',
        },

        // Legacy colors for backwards compatibility
        'neutral-bg': '#F6F8FA',
        background: '#FFFFFF',
        'surface-grey': '#F5F5F5',
      },

      // Extended shadows for dark mode
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
      },

      // Background image for gradients
      backgroundImage: {
        'gradient-light': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F1419 0%, #1A1F26 100%)',
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}

