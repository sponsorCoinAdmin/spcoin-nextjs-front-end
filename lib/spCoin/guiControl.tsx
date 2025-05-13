// File: guiControl.tsx

import { useExchangeContext } from '@/lib/context/contextHooks';
import { SP_COIN_DISPLAY } from "@/lib/structure/types";

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

// ✅ Top-level exportable version for use outside hooks
export const displaySpCoinContainers = (
  spCoinDisplay: SP_COIN_DISPLAY,
  setExchangeContext: (cb: (prev: any) => any) => void
) => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.OFF:
      hideElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
      hideElement("SponsorRateConfig_ID");
    break;
    case SP_COIN_DISPLAY.SELECT_BUTTON:
      showElement("AddSponsorshipButton_ID");
      hideElement("RecipientSelect_ID");
      hideElement("SponsorRateConfig_ID");
      break;
    case SP_COIN_DISPLAY.RECIPIENT_CONTAINER:
      showElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
      hideElement("SponsorRateConfig_ID");
    break;
    case SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG:
      showElement("SponsorRateConfig_ID");
      showElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
    break;
  }

  setExchangeContext((prev: any) => ({
    ...prev,
    spCoinPanels: spCoinDisplay,
  }));
};

export const useSpCoinHandlers = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const toggleSponsorRateConfig = (element: any) => {
    const el = document.getElementById(element);
    const nextDisplay = el?.style.display === "block"
      ? SP_COIN_DISPLAY.RECIPIENT_CONTAINER
      : SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG;
    displaySpCoinContainers(nextDisplay, setExchangeContext);
  };

  return {
    displaySpCoinContainers: (d: SP_COIN_DISPLAY) =>
      displaySpCoinContainers(d, setExchangeContext),
    toggleSponsorRateConfig,
    hideElement,
    showElement,
    toggleElement,
  };
};

export const spCoinStringDisplay = (spCoinDisplay: SP_COIN_DISPLAY):string => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.SELECT_BUTTON:
      return (`spCoinDisplay(${SP_COIN_DISPLAY.SELECT_BUTTON})) = SELECT_BUTTON`)
    case SP_COIN_DISPLAY.RECIPIENT_CONTAINER:
            return (`spCoinDisplay(${SP_COIN_DISPLAY.RECIPIENT_CONTAINER}) = RECIPIENT_CONTAINER)`)
    case SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG:
            return (`spCoinDisplay(${SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG}) = SPONSOR_RATE_CONFIG)`)
    default:
      return (`spCoinDisplay(${SP_COIN_DISPLAY.SELECT_BUTTON}) = undefined`)
  }
}


export {
  hideElement,
  showElement,
  toggleElement,
};
