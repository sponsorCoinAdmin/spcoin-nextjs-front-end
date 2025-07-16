// File: lib/context/helpers/displaySettingsHelpers.ts

import { DisplaySettings, SP_COIN_DISPLAY } from "@/lib/structure";
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_DISPLAY === 'true';
const debugLog = createDebugLogger('resolveDisplay', DEBUG_ENABLED, LOG_TIME);

/**
 * Resolves a valid display state from an input DisplaySettings object.
 * Enforces the following:
 * - Normalizes undefined values to DISPLAY_OFF.
 * - Only one display panel should be active (≠ DISPLAY_OFF).
 * - Priority: errorDisplay > assetSelectScrollDisplay > spCoinDisplay
 * - If all are DISPLAY_OFF → default spCoinDisplay = TRADING_STATION_PANEL
 * - activeDisplay is synced to the winner (temporary bridge)
 */
export function resolveDisplaySettings(settings: DisplaySettings): DisplaySettings {
  const normalized: DisplaySettings = {
    errorDisplay: settings.errorDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    assetSelectScrollDisplay: settings.assetSelectScrollDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    spCoinDisplay: settings.spCoinDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
    activeDisplay: settings.activeDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF,
  };

  debugLog.log('🧩 Normalized Settings:', normalized);

  const allOff =
    normalized.errorDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
    normalized.assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
    normalized.spCoinDisplay === SP_COIN_DISPLAY.DISPLAY_OFF;

  if (allOff) {
    const winner = SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    debugLog.warn('⚠️ All panels are DISPLAY_OFF → Defaulting spCoinDisplay = TRADING_STATION_PANEL');
    debugLog.log(`🎯 Resolved activeDisplay = ${SP_COIN_DISPLAY[winner]}`);
    return {
      errorDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      assetSelectScrollDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      spCoinDisplay: winner,
      activeDisplay: winner,
    };
  }

  if (normalized.errorDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF) {
    const winner = normalized.errorDisplay;
    debugLog.log('🟥 Showing errorDisplay → Hiding others');
    debugLog.log(`🎯 Resolved activeDisplay = ${SP_COIN_DISPLAY[winner]}`);
    return {
      errorDisplay: winner,
      assetSelectScrollDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      spCoinDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      activeDisplay: winner,
    };
  }

  if (normalized.assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF) {
    const winner = normalized.assetSelectScrollDisplay;
    debugLog.log('🟦 Showing assetSelectScrollDisplay → Hiding others');
    debugLog.log(`🎯 Resolved activeDisplay = ${SP_COIN_DISPLAY[winner]}`);
    return {
      errorDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      assetSelectScrollDisplay: winner,
      spCoinDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
      activeDisplay: winner,
    };
  }

  const winner = normalized.spCoinDisplay;
  debugLog.log('🟩 Showing spCoinDisplay → Hiding others');
  debugLog.log(`🎯 Resolved activeDisplay = ${SP_COIN_DISPLAY[winner]}`);
  return {
    errorDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
    assetSelectScrollDisplay: SP_COIN_DISPLAY.DISPLAY_OFF,
    spCoinDisplay: winner,
    activeDisplay: winner,
  };
}

/**
 * Validates whether the current DisplaySettings object is in a valid state.
 * Returns `false` if all three panels are DISPLAY_OFF — which is not allowed.
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
