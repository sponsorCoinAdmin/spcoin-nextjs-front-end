// File: guiControl.tsx

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

export const spCoinStringDisplay = (spCoinDisplay: SP_COIN_DISPLAY | undefined): string => {
  switch (spCoinDisplay) {
    case SP_COIN_DISPLAY.OFF:
      return `spCoinDisplay(${SP_COIN_DISPLAY.OFF}) = OFF`;
    case SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON}) = SELECT_RECIPIENT_BUTTON`;
    case SP_COIN_DISPLAY.MANAGE_RECIPIENT_BUTTON:
      return `spCoinDisplay(${SP_COIN_DISPLAY.MANAGE_RECIPIENT_BUTTON}) = MANAGE_RECIPIENT_BUTTON`;
    case SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER}) = SHOW_RECIPIENT_CONTAINER`;
    case SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG:
      return `spCoinDisplay(${SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG}) = SHOW_SPONSOR_RATE_CONFIG`;
    default: return `spCoinDisplay(${String(spCoinDisplay)}) = ❓ UNKNOWN`;
  }
};

export {
  hideElement,
  showElement,
  toggleElement,
};
