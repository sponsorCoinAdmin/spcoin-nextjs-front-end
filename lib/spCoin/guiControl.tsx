// File: lib/utils/guiControl.ts
'use client';

import { useEffect } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_GUI_CONTROLLER === 'true';
const debugLog = createDebugLogger('GuiController', DEBUG_ENABLED, LOG_TIME);

/** ── DOM helpers ────────────────────────────────────────────────────────── */
const getEl = (id: string): HTMLElement | null =>
  typeof document !== 'undefined' ? document.getElementById(id) : null;

const hideElement = (id: string): boolean => {
  const el = getEl(id);
  if (!el) return false;
  el.style.display = 'none';
  return true;
};

const showElement = (id: string): boolean => {
  const el = getEl(id);
  if (!el) return false;
  el.style.display = 'block';
  return true;
};

const toggleElement = (id: string): boolean => {
  const el = getEl(id);
  if (!el) return false;
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
  return true;
};

/** ── Display string / logging helpers ───────────────────────────────────── */
/** Fast, allocation-light label (only builds when called). */
const spCoinDisplayString = (display?: SP_COIN_DISPLAY): string =>
  display == null
    ? 'display(undefined) = ❓ UNKNOWN'
    : `display(${display}) = ${getActiveDisplayString(display)}`;

/** Avoids building strings when debug is off. */
const logDesiredDisplay = (prefix: string, display?: SP_COIN_DISPLAY) => {
  if (!DEBUG_ENABLED) return;
  debugLog.log(`${prefix} ${spCoinDisplayString(display)}`);
};

/** ── Hook: keep panel-tree overlays in sync with a desired display ─────────
 * Back-compat name: `useDisplaySpCoinContainers`
 * Behavior:
 *   - If desired = TRADING_STATION_PANEL → close overlays (show trading)
 *   - Else → open the desired overlay (radio behavior among overlays)
 */
const useDisplaySpCoinContainers = (desiredDisplay: SP_COIN_DISPLAY) => {
  const { isVisible, openOverlay, closeOverlays } = usePanelTree();

  useEffect(() => {
    if (desiredDisplay === SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
      logDesiredDisplay('🧩 [useDisplaySpCoinContainers] → closeOverlays for', desiredDisplay);
      closeOverlays();
      return;
    }

    // Only open if not already visible to avoid redundant writes/renders
    if (!isVisible(desiredDisplay)) {
      logDesiredDisplay('🧩 [useDisplaySpCoinContainers] → openOverlay for', desiredDisplay);
      openOverlay(desiredDisplay);
    }
  }, [desiredDisplay, isVisible, openOverlay, closeOverlays]);
};

export {
  hideElement,
  showElement,
  toggleElement,
  spCoinDisplayString,
  useDisplaySpCoinContainers,
};
