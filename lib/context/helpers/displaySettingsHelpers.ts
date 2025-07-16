// File: lib/context/helpers/displaySettingsHelpers.ts

import { DisplaySettings, SP_COIN_DISPLAY } from "@/lib/structure";
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_DISPLAY === 'true';
const debugLog = createDebugLogger('resolveDisplay', DEBUG_ENABLED, LOG_TIME);

/**
 * Resolves a valid display state from an input DisplaySettings object.
 * Enforces:
 * - Normalizes undefined values to DISPLAY_OFF.
 * - Only one display panel is active (≠ DISPLAY_OFF).
 * - Priority: errorDisplay > assetSelectScrollDisplay > spCoinDisplay.
 * - Sets activeDisplay to match the resolved visible panel.
 * - If all are DISPLAY_OFF → defaults to TRADING_STATION_PANEL.
 */
export function resolveDisplaySettings(settings: DisplaySettings): DisplaySettings {
  const normalized: DisplaySettings = {
    errorDisplay: settings.errorDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    assetSelectScrollDisplay: settings.assetSelectScrollDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    spCoinDisplay: settings.spCoinDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    activeDisplay: settings.activeDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF, // add default
  };

  debugLog.log('🧩 Normalized Settings:', normalized);

  let resolvedActive: SP_COIN_DISPLAY;

  const allOff =
    normalized.errorDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
    normalized.assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
    normalized.spCoinDisplay === SP_COIN_DISPLAY.DISPLAY_OFF;

  if (allOff) {
    debugLog.warn('⚠️ All panels are DISPLAY_OFF → Defaulting spCoinDisplay = TRADING_STATION_PANEL');
    resolvedActive = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

    return {
      errorDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      assetSelectScrollDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      spCoinDisplay: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      activeDisplay: resolvedActive,
    };
  }

  if (normalized.errorDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF) {
    debugLog.log('🟥 Showing errorDisplay → Hiding others');
    resolvedActive = normalized.errorDisplay;

    return {
      errorDisplay: normalized.errorDisplay,
      assetSelectScrollDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      spCoinDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      activeDisplay: resolvedActive,
    };
  }

  if (normalized.assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF) {
    debugLog.log('🟦 Showing assetSelectScrollDisplay → Hiding others');
    resolvedActive = normalized.assetSelectScrollDisplay;

    return {
      errorDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      assetSelectScrollDisplay: normalized.assetSelectScrollDisplay,
      spCoinDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      activeDisplay: resolvedActive,
    };
  }

  debugLog.log('🟩 Showing spCoinDisplay → Hiding others');
  resolvedActive = normalized.spCoinDisplay;

  return {
    errorDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
    assetSelectScrollDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
    spCoinDisplay: normalized.spCoinDisplay,
    activeDisplay: resolvedActive,
  };
}

/**
 * Validates whether the current DisplaySettings object is in a valid state.
 * Returns false if all three panels are DISPLAY_OFF — which is not allowed.
 */
export function validateDisplaySettings(settings: DisplaySettings): boolean {
  const normalized: DisplaySettings = {
    errorDisplay: settings.errorDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    assetSelectScrollDisplay: settings.assetSelectScrollDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    spCoinDisplay: settings.spCoinDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    activeDisplay: settings.activeDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
  };

  const allOff =
    normalized.errorDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
    normalized.assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
    normalized.spCoinDisplay === SP_COIN_DISPLAY.DISPLAY_OFF;

  if (allOff) {
    debugLog.warn('❌ Invalid display state: all three panels are DISPLAY_OFF');
    return false;
  }

  debugLog.log('✅ Valid display state');
  return true;
}
