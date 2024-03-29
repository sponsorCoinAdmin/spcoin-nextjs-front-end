import { TokenElement } from "../structure/types";

/// START DROPDOWN STUFF
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

// ToDo: Check out the next 2 functions
const hideClass = (className: string) => {
  let els = document.getElementsByClassName(className);

  for (var i = 0; i < els.length; i ++) {
    els[i].style.display = 'none';
  }
}

const showClass = (className: string) => {
  let els = document.getElementsByClassName(className);

  for (var i = 0; i < els.length; i ++) {
    els[i].style.display = 'block';
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
  hideClass,
  showClass,
  hideSponsorRecipientConfig,
  showSponsorRecipientConfig,
  toggleElement
}