// File: lib/context/helpers/activeDisplayHelpers.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

export function getActiveDisplayString(value: SP_COIN_DISPLAY): string {
  return SP_COIN_DISPLAY[value] || `UNKNOWN(${value})`;
}

export function isActiveMainPanel(value: SP_COIN_DISPLAY): boolean {
  return [
    SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON,
    SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG,
  ].includes(value);
}

export function isActiveScrollPanel(value: SP_COIN_DISPLAY): boolean {
  return [
    SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER,
    SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER,
  ].includes(value);
}

export function isActiveErrorPanel(value: SP_COIN_DISPLAY): boolean {
  return value === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE;
}

export function normalizeActiveDisplay(value: SP_COIN_DISPLAY | undefined): SP_COIN_DISPLAY {
  return typeof value === 'number' ? value : SP_COIN_DISPLAY.TRADING_STATION_PANEL;
}
