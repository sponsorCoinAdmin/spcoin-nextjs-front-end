/// START DROPDOWN STUFF

import { exchangeContext } from "../context";
import { SP_COIN_DISPLAY } from "../structure/types";

const displaySpCoinContainers = (spCoinDisplay:SP_COIN_DISPLAY) => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.SELECT_BUTTON:
      // alert(`displaySpCoinContainers = ${spCoinDisplay}\nSP_COIN_DISPLAY.SELECT_BUTTON:`)
      showElement("AddSponsorshipButton_ID");
      hideElement("RecipientSelect_ID")
      hideElement("SponsorRateConfig_ID")
      exchangeContext.spCoinPanels = spCoinDisplay;
    break;
    case SP_COIN_DISPLAY.RECIPIENT_CONTAINER:
      // alert(`displaySpCoinContainers = ${spCoinDisplay}\nSP_COIN_DISPLAY.RECIPIENT_CONTAINER:`)
      showElement("RecipientSelect_ID")
      hideElement("AddSponsorshipButton_ID")
      hideElement("SponsorRateConfig_ID")
      exchangeContext.spCoinPanels = spCoinDisplay;
    break;
    case SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG:
      // alert(`displaySpCoinContainers = ${spCoinDisplay}\nSP_COIN_DISPLAY.SPONSOR_RATE_CONFIG:`)
      showElement("SponsorRateConfig_ID")
      showElement("RecipientSelect_ID")
      hideElement("AddSponsorshipButton_ID")
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

const toggleSponsorRateConfig = (element: any) => {
  // alert(`Toggle Sponsor Rate Config = ${element}`)
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display === 'block' ? 
      displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER) :
      displaySpCoinContainers(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG);
  }
};

const toggleElement = (element: any) => {
  // alert(`Toggle Element = ${element}`)
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
};

export {
  displaySpCoinContainers,
  hideElement,
  showElement,
  toggleElement,
  toggleSponsorRateConfig
}