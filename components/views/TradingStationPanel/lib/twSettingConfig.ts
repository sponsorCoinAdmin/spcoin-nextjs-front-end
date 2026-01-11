// File: @/components/views/TradingStationPanel/lib/twSettingConfig.ts

export const TSP_TW = {
  // Outer container
  container: 'flex flex-col',

  // Global vertical spacing between children
  gap: 'gap-0', // change to gap-1 / gap-3 / gap-4 etc.

  // Default slot wrapper (lets you normalize odd children without touching them)
  slot: 'w-full',

  // If you want BuySellSwapArrowButton to have a different spacing rule
  arrowSlot: 'w-full py-1', // or 'my-1', etc.

  // Optional: panel-style wrapper if you want consistent rounding/padding around certain items
  // panelSlot: 'w-full rounded-[12px]',
} as const;
