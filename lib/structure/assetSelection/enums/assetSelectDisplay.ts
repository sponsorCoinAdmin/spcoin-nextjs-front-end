// lib/structure/assetSelection/enums/assetSelectionDisplay.ts

// TEMP: local-only sub-display “enum” for AssetSelect
export const ASSET_SELECTION_DISPLAY = {
  IDLE: 'IDLE',
  ASSET_PREVIEW: 'ASSET_PREVIEW', // <RenderAssetPreview />
  ERROR_PREVIEW: 'ERROR_PREVIEW', // <ErrorAssetPreview />
} as const;

export type AssetSelectDisplay =
  (typeof ASSET_SELECTION_DISPLAY)[keyof typeof ASSET_SELECTION_DISPLAY];

export const getAssetSelectDisplayString = (
  d?: AssetSelectDisplay
): string => d ?? ASSET_SELECTION_DISPLAY.IDLE;
