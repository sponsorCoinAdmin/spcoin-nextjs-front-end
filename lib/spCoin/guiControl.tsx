// File: lib/utils/guiControl.ts
'use client';

import { useSpCoinDisplay } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useEffect } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_GUI_CONTROLLER === 'true';
const debugLog = createDebugLogger('GuiController', DEBUG_ENABLED, LOG_TIME);

const hideElement = (element: string) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = 'none';
  }
};

const showElement = (element: string) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = 'block';
  }
};

const toggleElement = (element: string) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
};

/**
 * Human-readable label for the NEW display enum.
 */
const spCoinDisplayString = (display: SP_COIN_DISPLAY | undefined): string => {
  if (display === undefined) return 'activeDisplay(undefined) = ❓ UNKNOWN';
  return `activeDisplay(${display}) = ${getActiveDisplayString(display)}`;
};

/**
 * Keep the global display state in sync with a caller-provided desired value.
 * Backward-compatible name; now works with SP_COIN_DISPLAY and writes to settings.activeDisplay.
 */
const useDisplaySpCoinContainers = (desiredDisplay: SP_COIN_DISPLAY) => {
  const [currentDisplay, setDisplay] = useSpCoinDisplay();

  useEffect(() => {
    if (currentDisplay === desiredDisplay) return;
    if (DEBUG_ENABLED) {
      debugLog.log(
        `🧩 [useDisplaySpCoinContainers] Sync to → ${spCoinDisplayString(desiredDisplay)}`
      );
    }
    setDisplay(desiredDisplay);
  }, [desiredDisplay, currentDisplay, setDisplay]);
};

export {
  hideElement,
  showElement,
  toggleElement,
  spCoinDisplayString,
  useDisplaySpCoinContainers,
};
