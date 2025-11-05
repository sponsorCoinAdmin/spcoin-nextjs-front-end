// File: tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    `./app/**/*.{js,ts,jsx,tsx,mdx}`,
    `./components/**/*.{js,ts,jsx,tsx,mdx}`,
    `./lib/**/*.{js,ts,jsx,tsx,mdx}`,
    `./pages/**/*.{js,ts,jsx,tsx,mdx}`,
  ],

  // ✅ Ensure these utilities are never purged (needed for Connect dropdown colors)
  safelist: [
    // text colors (we use "!text-..." in markup; safelist the base utility)
    `text-emerald-400`,
    `text-red-400`,

    // small status dots
    `bg-emerald-400`,
    `bg-red-400`,

    // arbitrary accent color on checkbox (belt & suspenders)
    `accent-[#5981F3]`,

    // explicit bg tints + hover variants (avoid regex to silence Tailwind warning)
    `bg-emerald-500/15`,
    `bg-red-500/15`,
    `hover:bg-emerald-500/15`,
    `hover:bg-red-500/15`,
  ],

  theme: {
    colors: {
      transparent: `transparent`,
      current: `currentColor`,
      white: `#ffffff`,

      // existing custom palette
      'bg-txt-ltgry': `#94a3b8`,
      midnight: `#121063`,
      metal: `#565584`,
      tahiti: `#3ab7bf`,
      silver: `#ecebff`,
      'bubble-gum': `#ff77e9`,
      bermuda: `#78dcca`,

      // semantic colors for ConnectButton (from connectTheme.json)
      'connect-bg': `transparent`,
      'connect-color': `#ffffff`,
      'connect-hover-bg': `#243056`,
      'connect-hover-color': `#5981F3`,

      'panel-bg': `#1b2232`,
      'panel-hover-bg': `#2a3350`,
      'panel-text': `#E7ECF6`,
      'panel-muted': `#999999`,
      'panel-border': `#2a3350`,

      'focus-ring': `#1A88F8`,
    },
    extend: {
      backgroundImage: {
        'gradient-radial': `radial-gradient(var(--tw-gradient-stops))`,
        'gradient-conic': `conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))`,
      },
    },
  },

  // Use CommonJS require to avoid ESM config pitfalls on some Node setups
  plugins: [require(`tailwind-scrollbar-hide`)],
};
