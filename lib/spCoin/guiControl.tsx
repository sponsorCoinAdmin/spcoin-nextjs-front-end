/// START DROP DOWN STUFF

import { useExchangeContext, useSpCoinDisplay } from '@/lib/context/contextHooks';
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

const toggleSponsorRateConfig = (element: any, exchangeContext: any) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display === "block"
      ? displaySpCoinContainers(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER)
      : displaySpCoinContainers(SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG);
  }
};

const toggleElement = (element: any) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === "block" ? "none" : "block";
  }
};

// ✅ Inside a component, get exchangeContext and pass it into functions
export const useSpCoinHandlers = () => {
  const { exchangeContext } = useExchangeContext();

  return {
    displaySpCoinContainers: (spCoinDisplay: SP_COIN_DISPLAY) => displaySpCoinContainers(spCoinDisplay),
    toggleSponsorRateConfig: (element: any) => toggleSponsorRateConfig(element, exchangeContext),
    hideElement,
    showElement,
    toggleElement,
  };
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

const displaySpCoinContainers = (spCoinDisplay: SP_COIN_DISPLAY) => {
  debugLog.log(`🖼️ [displaySpCoinContainers] → ${spCoinStringDisplay(spCoinDisplay)}`);

  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.OFF:
      hideElement("AddSponsorshipButton_ID");
      hideElement("RecipientSelect_ID");
      hideElement("SponsorRateConfig_ID");
      break;
    case SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON:
      showElement("AddSponsorshipButton_ID");
      hideElement("RecipientSelect_ID");
      hideElement("SponsorRateConfig_ID");
      break;
    case SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER:
      showElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
      hideElement("SponsorRateConfig_ID");
      break;
    case SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG:
      showElement("SponsorRateConfig_ID");
      showElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
      break;
  }
};

const useDisplaySpCoinContainers = (spCoinDisplay: SP_COIN_DISPLAY) => {
  const [, debugSetSpCoinDisplay] = useSpCoinDisplay();
  useEffect(() => {
    debugLog.log(`🧩 [useDisplaySpCoinContainers] Sync to → ${spCoinStringDisplay(spCoinDisplay)}`);
    debugSetSpCoinDisplay(spCoinDisplay);
    displaySpCoinContainers(spCoinDisplay);
  }, [spCoinDisplay]);
};

export {
  hideElement,
  showElement,
  spCoinStringDisplay,
  toggleElement,
  toggleSponsorRateConfig,
  useDisplaySpCoinContainers
} 
