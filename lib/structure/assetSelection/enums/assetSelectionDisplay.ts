// lib/structure/assetSelection/enums/assetSelectionDisplay.ts

// TEMP: local-only sub-display “enum” for AssetSelection
export const ASSET_SELECTION_DISPLAY = {
  IDLE: 'IDLE',
  ASSET_PREVIEW: 'ASSET_PREVIEW', // <RenderAssetPreview />
  ERROR_PREVIEW: 'ERROR_PREVIEW', // <ErrorAssetPreview />
} as const;

export type AssetSelectionDisplay =
  (typeof ASSET_SELECTION_DISPLAY)[keyof typeof ASSET_SELECTION_DISPLAY];

export const getAssetSelectionDisplayString = (
  d?: AssetSelectionDisplay
): string => d ?? ASSET_SELECTION_DISPLAY.IDLE;
