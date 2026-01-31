// File: @/components/views/AssetSelectPanels/panelScrollTw.ts

/**
 * SSOT: panel scroll body behavior.
 *
 * Why:
 * - In flex/grid layouts, scroll children MUST have `min-h-0` (or they overflow).
 * - `flex-1` ensures it takes remaining height rather than pushing past the parent.
 * - `overflow-y-auto` enables the scroll *inside* the panel, not outside it.
 */
export const panelScrollTw = {
  body: 'flex-1 min-h-0 overflow-x-auto overflow-y-auto',
} as const;
