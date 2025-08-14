// File: lib/utils/guiControl.ts
'use client';

import { useActiveDisplay } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useEffect } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

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
    ? 'activeDisplay(undefined) = ❓ UNKNOWN'
    : `activeDisplay(${display}) = ${getActiveDisplayString(display)}`;

/** Avoids building strings when debug is off. */
const logActiveDisplay = (prefix: string, display?: SP_COIN_DISPLAY) => {
  if (!DEBUG_ENABLED) return;
  debugLog.log(`${prefix} ${spCoinDisplayString(display)}`);
};

/** ── Hook: keep global display in sync with desired value ──────────────────
 * Back-compat name, now standardized on useActiveDisplay()
 */
const useDisplaySpCoinContainers = (desiredDisplay: SP_COIN_DISPLAY) => {
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  useEffect(() => {
    if (activeDisplay === desiredDisplay) return;
    logActiveDisplay('🧩 [useDisplaySpCoinContainers] Sync to →', desiredDisplay);
    setActiveDisplay(desiredDisplay);
  }, [desiredDisplay, activeDisplay, setActiveDisplay]);
};

export {
  hideElement,
  showElement,
  toggleElement,
  spCoinDisplayString,
  useDisplaySpCoinContainers,
};
