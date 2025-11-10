// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

type OpenOpts = {
  methodName?: string;   // who called this (forensics)
  count?: number;        // external sequence id if you want to thread events across components
};

export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  // local counters to catch unexpected double-fires
  const openBuyCount  = useRef(0);
  const openSellCount = useRef(0);

  const _emit = (to: SP_COIN_DISPLAY, action: 'open' | 'close' | 'toggle', extra?: Record<string, unknown>) => {
    telemetry.emit('panel_transition', {
      action,
      to,
      label: SP_COIN_DISPLAY[to],
      ts: Date.now(),
      ...extra,
    });
  };

  const toTrading = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open');
  }, [openPanel, perf]);

  const openBuyList = useCallback((opts?: OpenOpts) => {
    const callNo = ++openBuyCount.current;
    const before = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    const beforeOther = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    // eslint-disable-next-line no-console
    console.log(`[openBuyList] #${callNo}`, { before, beforeOther, ...opts });

    perf.start();
    openPanel(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open', { callNo, ...opts });

    // log after the tree has a chance to settle
    setTimeout(() => {
      const after = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
      const afterOther = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
      // eslint-disable-next-line no-console
      console.log(`[openBuyList] #${callNo} (after)`, { after, afterOther, ...opts });
    }, 0);
  }, [openPanel, isVisible, perf]);

  const openSellList = useCallback((opts?: OpenOpts) => {
    const callNo = ++openSellCount.current;
    const before = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const beforeOther = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    // eslint-disable-next-line no-console
    console.log(`[openSellList] #${callNo}`, { before, beforeOther, ...opts });

    perf.start();
    openPanel(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open', { callNo, ...opts });

    setTimeout(() => {
      const after = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
      const afterOther = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
      // eslint-disable-next-line no-console
      console.log(`[openSellList] #${callNo} (after)`, { after, afterOther, ...opts });
    }, 0);
  }, [openPanel, isVisible, perf]);

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
    perf.end('closeManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'close');
  }, [closePanel, perf]);

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

  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    perf.start();
    openPanel(overlay);
    perf.end(`openOverlay:${overlay}`);
    _emit(overlay, 'open');
  }, [openPanel, perf]);

  return {
    toTrading,
    openBuyList,
    openSellList,
    openRecipientList,
    openAgentList,
    showErrorOverlay,
    openManageSponsorships,
    closeManageSponsorships,
    openOverlay,
    startAddSponsorship,
    openConfigSponsorship,
    closeConfigSponsorship,
    toggleSponsorConfig,
    closeAddSponsorship,
  };
}
