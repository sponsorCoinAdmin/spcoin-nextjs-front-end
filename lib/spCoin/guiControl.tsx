"use client";

import { useExchangeContext } from "../context/ExchangeContext"; // ✅ Use context
import { SP_COIN_DISPLAY } from "@/lib/structure/types";

/**
 * Updates the displayed SP Coin UI panels based on the provided display type.
 * @param {SP_COIN_DISPLAY} spCoinDisplay - The selected display mode.
 */
const displaySpCoinContainers = (spCoinDisplay: SP_COIN_DISPLAY) => {
  const { exchangeContext, setExchangeContext } = useExchangeContext(); // ✅ Get global context

  switch (spCoinDisplay) {
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

  // ✅ Update global context state
  setExchangeContext({
    ...exchangeContext,
    spCoinPanels: spCoinDisplay,
  });
};

/**
 * Hides a specified HTML element by setting its display to "none".
 * @param {string} element - The ID of the element to hide.
 */
const hideElement = (element: string) => {
  const el = document.getElementById(element);
  if (el) {
    el.style.display = "none";
  }
};

/**
 * Shows a specified HTML element by setting its display to "block".
 * @param {string} element - The ID of the element to show.
 */
const showElement = (element: string) => {
  const el = document.getElementById(element);
  if (el) {
    el.style.display = "block";
  }
};

/**
 * Toggles the visibility of the Sponsor Rate Config panel.
 * @param {string} element - The ID of the element to toggle.
 */
const toggleSponsorRateConfig = (element: string) => {
  const el = document.getElementById(element);
  if (el) {
    el.style.display === "block"
      ? displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER)
      : displaySpCoinContainers(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG);
  }
};

/**
 * Toggles the visibility of any given HTML element.
 * @param {string} element - The ID of the element to toggle.
 */
const toggleElement = (element: string) => {
  const el = document.getElementById(element);
  if (el) {
    el.style.display = el.style.display === "block" ? "none" : "block";
  }
};

export {
  displaySpCoinContainers,
  hideElement,
  showElement,
  toggleElement,
  toggleSponsorRateConfig,
};
