// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

/**
 * Declarative, named transitions for common UI flows.
 * Now instrumented with optional perf marks + telemetry events.
 */
export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  // ---- helpers ----
  const _emit = (to: SP_COIN_DISPLAY, action: 'open' | 'close' | 'toggle') => {
    telemetry.emit('panel_transition', {
      action,
      to,
      label: SP_COIN_DISPLAY[to],
      // Add anything useful for later analysis here:
      ts: Date.now(),
    });
  };

  // ---- Core overlays (radio group) ----
  const toTrading = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open');
  }, [openPanel, perf]);

  const openBuyList = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open');
  }, [openPanel, perf]);

  const openSellList = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open');
  }, [openPanel, perf]);

  const openRecipientList = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);
    perf.end('openRecipientList');
    _emit(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, 'open');
  }, [openPanel, perf]);

  const openAgentList = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
    perf.end('openAgentList');
    _emit(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, 'open');
  }, [openPanel, perf]);

  const showErrorOverlay = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
    perf.end('showErrorOverlay');
    _emit(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, 'open');
  }, [openPanel, perf]);

  const openManageSponsorships = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
    perf.end('openManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'open');
  }, [openPanel, perf]);

  const closeManageSponsorships = useCallback(() => {
    perf.start();
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
    // Removed: do not force button visibility; respect restored state
    // openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    perf.end('closeManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'close');
  }, [closePanel, perf]);

  // ---- Non-overlay panels (inline) ----
  const startAddSponsorship = useCallback(() => {
    perf.time('startAddSponsorship', () => {
      openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
    });
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'open');
  }, [openPanel, perf]);

  const openConfigSponsorship = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.end('openConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'open');
  }, [openPanel, perf]);

  const closeConfigSponsorship = useCallback(() => {
    perf.start();
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.end('closeConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'close');
  }, [closePanel, perf]);

  const toggleSponsorConfig = useCallback(() => {
    const open = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.start();
    open
      ? closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL)
      : openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.end('toggleSponsorConfig');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, open ? 'close' : 'open');
  }, [isVisible, closePanel, openPanel, perf]);

  const closeAddSponsorship = useCallback(() => {
    perf.start();
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
    perf.end('closeAddSponsorship');
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'close');
  }, [closePanel, perf]);

  // ---- Generic helper (if you need a custom overlay) ----
  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    perf.start();
    openPanel(overlay);
    perf.end(`openOverlay:${overlay}`);
    _emit(overlay, 'open');
  }, [openPanel, perf]);

  return {
    // overlays
    toTrading,
    openBuyList,
    openSellList,
    openRecipientList,
    openAgentList,
    showErrorOverlay,
    openManageSponsorships,
    closeManageSponsorships,
    openOverlay,
    // inline flow
    startAddSponsorship,
    openConfigSponsorship,
    closeConfigSponsorship,
    toggleSponsorConfig,
    closeAddSponsorship,
  };
}
