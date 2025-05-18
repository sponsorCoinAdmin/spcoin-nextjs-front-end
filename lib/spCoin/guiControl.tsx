/// START DROP DOWN STUFF

import { useSpCoinDisplay } from '@/lib/context/contextHooks';
import { SP_COIN_DISPLAY } from "@/lib/structure/types";
import { useEffect } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_GUI_CONTROLLER === 'true';
const debugLog = createDebugLogger('GuiController', DEBUG_ENABLED, LOG_TIME);

const hideElement = (element: string) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = "none";
  }
};

const showElement = (element: string) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = "block";
  }
};

const toggleElement = (element: any) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === "block" ? "none" : "block";
  }
};

const spCoinStringDisplay = (spCoinDisplay: SP_COIN_DISPLAY | undefined): string => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.OFF:
      return `spCoinDisplay(${SP_COIN_DISPLAY.OFF}) = OFF`;
    case SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON}) = SHOW_ADD_SPONSOR_BUTTON`;
    case SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER}) = SHOW_RECIPIENT_CONTAINER`;
    case SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON}) = SHOW_MANAGE_SPONSORS_BUTTON`;
    case SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG}) = SHOW_SPONSOR_RATE_CONFIG`;
    default: return `spCoinDisplay(${String(spCoinDisplay)}) = ❓ UNKNOWN`;
  }
};

const useDisplaySpCoinContainers = (spCoinDisplay: SP_COIN_DISPLAY) => {
  const [, debugSetSpCoinDisplay] = useSpCoinDisplay();
  useEffect(() => {
    debugLog.log(`🧩 [useDisplaySpCoinContainers] Sync to → ${spCoinStringDisplay(spCoinDisplay)}`);
    debugSetSpCoinDisplay(spCoinDisplay);
  }, [spCoinDisplay]);
};

export {
  hideElement,
  showElement,
  spCoinStringDisplay,
  toggleElement,
  useDisplaySpCoinContainers
} 
