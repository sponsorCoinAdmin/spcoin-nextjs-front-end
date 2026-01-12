// File: @/components/views/TradingStationPanel/lib/twSettingConfig.ts

export const TSP_TW = {
  container: 'flex flex-col',
  gap: 'gap-1',
  slot: 'w-full',

  // Arrow wrapper: centered + always on top
  arrowSlot:
    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]',

} as const;
