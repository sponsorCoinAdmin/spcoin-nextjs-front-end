// File: lib/utils/guiControl.ts

'use client';

import { useSpCoinDisplay } from '@/lib/context/hooks/contextHooks';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useEffect } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

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

const toggleElement = (element: any) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
};

const spCoinDisplayString = (spCoinDisplay: SP_COIN_DISPLAY | undefined): string => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.UNDEFINED:
      return `spCoinDisplay(${SP_COIN_DISPLAY.UNDEFINED}) = UNDEFINED`;
    case SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER :
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER }) = SHOW_ACTIVE_RECIPIENT_CONTAINER `;
    case SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG}) = SHOW_RECIPIENT_SELECT_DIALOG`;
    case SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON}) = SHOW_MANAGE_SPONSORS_BUTTON`;
    case SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG}) = SHOW_SPONSOR_RATE_CONFIG`;
    default:
      return `spCoinDisplay(${String(spCoinDisplay)}) = ❓ UNKNOWN`;
  }
};

const useDisplaySpCoinContainers = (spCoinDisplay: SP_COIN_DISPLAY) => {
  const [currentDisplay, debugSetSpCoinDisplay] = useSpCoinDisplay();

  useEffect(() => {
    if (currentDisplay === spCoinDisplay) return;
    debugLog.log(`🧩 [useDisplaySpCoinContainers] Sync to → ${spCoinDisplayString(spCoinDisplay)}`);
    debugSetSpCoinDisplay(spCoinDisplay);
  }, [spCoinDisplay, currentDisplay]);
};

export {
  hideElement,
  showElement,
  toggleElement,
  spCoinDisplayString,
  useDisplaySpCoinContainers,
};
