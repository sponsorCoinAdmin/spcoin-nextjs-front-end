/// START DROPDOWN STUFF

import { useExchangeContext } from "../context/ExchangeContext";
import { SP_COIN_DISPLAY } from "@/lib/structure/types";

const displaySpCoinContainers = (spCoinDisplay: SP_COIN_DISPLAY, exchangeContext: any) => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.SELECT_BUTTON:
      showElement("AddSponsorshipButton_ID");
      hideElement("RecipientSelect_ID");
      hideElement("SponsorRateConfig_ID");
      exchangeContext.spCoinPanels = spCoinDisplay;
      break;
    case SP_COIN_DISPLAY.RECIPIENT_CONTAINER:
      showElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
      hideElement("SponsorRateConfig_ID");
      exchangeContext.spCoinPanels = spCoinDisplay;
      break;
    case SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG:
      showElement("SponsorRateConfig_ID");
      showElement("RecipientSelect_ID");
      hideElement("AddSponsorshipButton_ID");
      exchangeContext.spCoinPanels = spCoinDisplay;
      break;
  }
};

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
      ? displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER, exchangeContext)
      : displaySpCoinContainers(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG, exchangeContext);
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
    displaySpCoinContainers: (spCoinDisplay: SP_COIN_DISPLAY) => displaySpCoinContainers(spCoinDisplay, exchangeContext),
    toggleSponsorRateConfig: (element: any) => toggleSponsorRateConfig(element, exchangeContext),
    hideElement,
    showElement,
    toggleElement,
  };
};

export {
  displaySpCoinContainers,
  hideElement,
  showElement,
  toggleElement,
  toggleSponsorRateConfig
}
