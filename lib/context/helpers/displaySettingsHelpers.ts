// File: lib/context/helpers/displaySettingsHelpers.ts

import { DisplaySettings, SP_COIN_DISPLAY } from "@/lib/structure";
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_DISPLAY === 'true';
const debugLog = createDebugLogger('resolveDisplay', DEBUG_ENABLED, LOG_TIME);

/**
 * Resolves a valid display state from an input DisplaySettings object.
 * Ensures activeDisplay is set, defaults to SHOW_TRADING_STATION_PANEL if undefined.
 */
export function resolveDisplaySettings(settings: DisplaySettings): DisplaySettings {
  const active = settings.activeDisplay ?? SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL;

  debugLog.log(`🎯 Resolved activeDisplay = ${SP_COIN_DISPLAY[active]}`);

  return {
    activeDisplay: active,
  };
}

/**
 * Validates whether the current DisplaySettings object is in a valid state.
 * Returns `false` if activeDisplay is undefined.
 */
export function validateDisplaySettings(settings: DisplaySettings): boolean {
  const isValid = settings.activeDisplay !== undefined;

  if (!isValid) {
    debugLog.warn('❌ Invalid display state: activeDisplay is undefined');
  } else {
    debugLog.log('✅ Valid display state');
  }

  return isValid;
}
