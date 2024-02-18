import { TokenElement } from "../structure/types";

/// START DROPDOWN STUFF
const hideElement = (element: any) => {
    const el = document.getElementById(element);
    // alert("hideElement(" + element +")")
    // alert("el = "+el)
    // console.debug("hideElement(" + element +")")
    if (el != null) {
      el.style.display = 'none';
    }
  };
  
  const showElement = (element: any) => {
    const el = document.getElementById(element);
    console.debug("hideElement(" + element + ")");
    if (el != null) {
      el.style.display = 'block';
    }
  };
  
  const hideSponsorRecipientConfig = () => {
    hideElement("recipientSelectDiv")
    hideElement("recipientConfigDiv")
    hideElement("agent");
    showElement("addSponsorship")
  }
  
  const showSponsorRecipientConfig = () => {
    hideElement("addSponsorship")
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
  
  function switchTokens(sellTokenElement:TokenElement, 
                        buyTokenElement:TokenElement,
                        setSellTokenElement:any,
                        setBuyTokenElement:any) {
    let tmpElement: TokenElement = sellTokenElement;
    setSellTokenElement(buyTokenElement);
    setBuyTokenElement(tmpElement);
    // setSellAmount(buyAmount)
  }

  export {
    hideElement,
    showElement,
    hideSponsorRecipientConfig,
    showSponsorRecipientConfig,
    toggleElement,
    switchTokens
  }