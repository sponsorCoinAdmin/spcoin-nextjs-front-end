// File: lib/context/helpers/activeDisplayHelpers.ts

import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';

/**
 * Returns the display name (string) for the given SP_COIN_DISPLAY_NEW enum value.
 */
export function getActiveDisplayString(value: SP_COIN_DISPLAY_NEW): string {
  return SP_COIN_DISPLAY_NEW[value] ?? `UNKNOWN(${value})`;
}

/**
 * Returns true if the given display is considered an "asset scroll" type.
 */
export function isAssetScrollDisplay(value: SP_COIN_DISPLAY_NEW): boolean {
  return (
    value === SP_COIN_DISPLAY_NEW.SELL_SELECT_SCROLL_PANEL ||
    value === SP_COIN_DISPLAY_NEW.BUY_SELECT_SCROLL_PANEL ||
    value === SP_COIN_DISPLAY_NEW.RECIPIENT_SELECT_PANEL
  );
}

/**
 * Returns true if the given display is considered an "error" type.
 */
export function isErrorDisplay(value: SP_COIN_DISPLAY_NEW): boolean {
  return value === SP_COIN_DISPLAY_NEW.ERROR_MESSAGE_PANEL;
}

/**
 * Returns true if the given display is the main trading panel.
 */
export function isTradingStationPanel(value: SP_COIN_DISPLAY_NEW): boolean {
  return value === SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;
}

/**
 * Normalizes an input display value to a known SP_COIN_DISPLAY_NEW enum.
 * For now, it simply returns the input — extend to coerce unknown values if needed.
 */
export function normalizeActiveDisplay(value: SP_COIN_DISPLAY_NEW): SP_COIN_DISPLAY_NEW {
  return value;
}
