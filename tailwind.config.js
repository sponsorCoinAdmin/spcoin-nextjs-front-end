// File: tailwind.config.js

import scrollbarHide from 'tailwind-scrollbar-hide';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',

      // existing custom palette
      'bg-txt-ltgry': '#94a3b8',
      midnight: '#121063',
      metal: '#565584',
      tahiti: '#3ab7bf',
      silver: '#ecebff',
      'bubble-gum': '#ff77e9',
      bermuda: '#78dcca',

      // new semantic colors for ConnectButton (from connectTheme.json)
      'connect-bg': '#243056',
      'connect-color': '#5981F3',
      'connect-hover-bg': '#F0F2F5',
      'connect-hover-color': '#373737',

      'panel-bg': '#1b2232',
      'panel-hover-bg': '#2a3350',
      'panel-text': '#E7ECF6',
      'panel-muted': '#999999',
      'panel-border': '#2a3350',

      'focus-ring': '#1A88F8',
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [scrollbarHide],
};
