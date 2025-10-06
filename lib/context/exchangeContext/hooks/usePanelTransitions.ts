// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

/**
 * Declarative, named transitions for common UI flows.
 * These wrap openPanel/closePanel so components don't orchestrate multi-step state.
 */
export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();

  // ---- Core overlays (radio group) ----
  const toTrading = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [openPanel]);

  const openBuyList = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST);
  }, [openPanel]);

  const openSellList = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST);
  }, [openPanel]);

  const openRecipientList = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST);
  }, [openPanel]);

  const openAgentList = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST);
  }, [openPanel]);

  const showErrorOverlay = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  }, [openPanel]);

  const openManageSponsorships = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  }, [openPanel]);

  // ---- Non-overlay panels (inline) ----
  const startAddSponsorship = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
  }, [openPanel]);

  const openConfigSponsorship = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
  }, [openPanel]);

  const closeConfigSponsorship = useCallback(() => {
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
  }, [closePanel]);

  const closeAddSponsorship = useCallback(() => {
    // Close the flow and any nested config panel if open.
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
  }, [closePanel]);

  // ---- Generic helpers ----
  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    openPanel(overlay);
  }, [openPanel]);

  // If an overlay is already visible, go back to Trading; else open that overlay.
  const toggleOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    if (isVisible(overlay)) {
      toTrading();
    } else {
      openPanel(overlay);
    }
  }, [isVisible, toTrading, openPanel]);

  // Simple show/hide for inline (non-radio) panels.
  const toggleInline = useCallback((panel: SP_COIN_DISPLAY) => {
    isVisible(panel) ? closePanel(panel) : openPanel(panel);
  }, [isVisible, openPanel, closePanel]);

  return {
    // overlays
    toTrading,
    openBuyList,
    openSellList,
    openRecipientList,
    openAgentList,
    showErrorOverlay,
    openManageSponsorships,
    openOverlay,
    toggleOverlay,

    // inline flow
    startAddSponsorship,
    openConfigSponsorship,
    closeConfigSponsorship,
    closeAddSponsorship,
    toggleInline,
  };
}
