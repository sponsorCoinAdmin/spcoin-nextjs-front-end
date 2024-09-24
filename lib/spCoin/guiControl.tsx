/// START DROPDOWN STUFF

import { exchangeContext } from "../context";
import { SP_COIN_DISPLAY } from "../structure/types";

const displaySpCoinContainers = (spCoinDisplay:SP_COIN_DISPLAY) => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.SELECT_BUTTON:
      showElement("MainSwapContainer_ID")
      hideElement("RecipientSelect_ID")
      exchangeContext.spCoinPanels = spCoinDisplay;
    break;
    case SP_COIN_DISPLAY.RECIPIENT_CONTAINER:
      showElement("RecipientSelect_ID")
      hideElement("AddSponsorshipButton_ID")
      exchangeContext.spCoinPanels = spCoinDisplay;
    break;
    case SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG:
      showElement("SponsorRateConfig_ID")
      exchangeContext.spCoinPanels = spCoinDisplay;
    break;
  }
}

const hideElement = (element: string) => {
  const el = document.getElementById(element);
  // console.debug("hideElement(" + element +")")
  if (el != null) {
    el.style.display = 'none';
  }
};

const showElement = (element: string) => {
  const el = document.getElementById(element);
  // console.debug("showElement(" + element + ")");
  if (el != null) {
    el.style.display = 'block';
  }
};

const toggleElement = (element: any) => {
  alert(`Toggle Element = ${element}`)
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
};

export {
  displaySpCoinContainers,
  hideElement,
  showElement,
  toggleElement
}