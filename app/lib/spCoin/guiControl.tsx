import { DISPLAY_STATE, TokenElement } from "../structure/types";

/// START DROPDOWN STUFF
const hideElement = (element: string) => {
  const el = document.getElementById(element);
  console.debug("hideElement(" + element +")")
  if (el != null) {
    el.style.display = 'none';
  }
};

const showElement = (element: string) => {
  const el = document.getElementById(element);
  console.debug("showElement(" + element + ")");
  if (el != null) {
    el.style.display = 'block';
  }
};

const setDisplayPanels = (displayState:DISPLAY_STATE) => {
  // alert(`guiControl.setDisplayState(${getDisplayStateString(displayState)})`)
  switch(displayState) {
    case DISPLAY_STATE.OFF:
      hideElement("addSponsorshipDiv")
      hideElement("recipientSelectDiv")
      hideElement("recipientConfigDiv")
    break
    case DISPLAY_STATE.SPONSOR_SELL_ON:
      showElement("addSponsorshipDiv")
      hideElement("recipientSelectDiv")
      hideElement("recipientConfigDiv")
    break;
    case DISPLAY_STATE.SPONSOR_SELL_OFF:
      hideElement("addSponsorshipDiv")
     break;
    case DISPLAY_STATE.SPONSOR_BUY:
      showElement("addSponsorshipDiv")
      hideElement("recipientSelectDiv")
      hideElement("recipientConfigDiv")
    break
    case DISPLAY_STATE.RECIPIENT:
      hideElement("addSponsorshipDiv")
      showElement("recipientSelectDiv")
      hideElement("recipientConfigDiv")
    break
    case DISPLAY_STATE.CONFIG:
      hideElement("addSponsorshipDiv")
      showElement("recipientSelectDiv")
      showElement("recipientConfigDiv")
    break
  }
}

const getDisplayStateString  = (displayState:DISPLAY_STATE) => {
  switch(displayState) {
    case DISPLAY_STATE.OFF: return("DISPLAY_STATE.OFF")
    case DISPLAY_STATE.SPONSOR_SELL_ON: return("DISPLAY_STATE.SPONSOR_SELL_ON")
    case DISPLAY_STATE.SPONSOR_SELL_OFF: return("DISPLAY_STATE.SPONSOR_SELL_OFF")
    case DISPLAY_STATE.SPONSOR_BUY: return("DISPLAY_STATE.SPONSOR_BUY")
    case DISPLAY_STATE.RECIPIENT: return("DISPLAY_STATE.RECIPIENT")
    case DISPLAY_STATE.CONFIG: return("DISPLAY_STATE.CONFIG")
    default: return(`UNDEFINED DISPLAY_STATE ${displayState}`)
  }
};

const hideSponsorRecipientConfig = () => {
  hideElement("recipientSelectDiv")
  hideElement("recipientConfigDiv")
  hideElement("agent");
  showElement("addSponsorshipDiv")
}

const showSponsorRecipientConfig = () => {
  hideElement("addSponsorshipDiv")
  showElement("recipientSelectDiv")
  // hideElement("recipientConfigDiv")
  // showElement("agent");
}

const toggleElement = (element: any) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
};

export {
  hideElement,
  showElement,
  setDisplayPanels,
  getDisplayStateString,
  hideSponsorRecipientConfig,
  showSponsorRecipientConfig,
  toggleElement
}