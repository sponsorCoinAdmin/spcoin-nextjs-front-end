// File: lib/context/helpers/activeDisplayHelpers.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Returns the display name (string) for the given SP_COIN_DISPLAY enum value.
 */
export function getActiveDisplayString(value: SP_COIN_DISPLAY): string {
  return SP_COIN_DISPLAY[value] || `UNKNOWN(${value})`;
}

/**
 * Returns true if the given display is considered an "asset scroll" type.
 */
export function isAssetScrollDisplay(value: SP_COIN_DISPLAY): boolean {
  return (
    value === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_PANEL ||
    value === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_PANEL
  );
}

/**
 * Returns true if the given display is considered an "error" type.
 */
export function isErrorDisplay(value: SP_COIN_DISPLAY): boolean {
  return value === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE_PANEL;
}

/**
 * Returns true if the given display is the main trading panel.
 */
export function isTradingStationPanel(value: SP_COIN_DISPLAY): boolean {
  return value === SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL;
}

/**
 * Normalizes an input display value to a known SP_COIN_DISPLAY enum.
 * For now, it simply returns the input — can extend later.
 */
export function normalizeActiveDisplay(value: SP_COIN_DISPLAY): SP_COIN_DISPLAY {
  return value;
}
