// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

type OpenOpts = {
  methodName?: string;
  count?: number;
};

export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  const log = (label: string, to: SP_COIN_DISPLAY, opts?: OpenOpts) => {
    // eslint-disable-next-line no-console
    console.log(
      `[usePanelTransitions] ${label} -> ${SP_COIN_DISPLAY[to]} ` +
        `(method=${opts?.methodName ?? 'n/a'} count=${opts?.count ?? -1})`
    );
  };

  const _emit = (to: SP_COIN_DISPLAY, action: 'open' | 'close' | 'toggle', opts?: OpenOpts) => {
    telemetry.emit('panel_transition', {
      action,
      to,
      label: SP_COIN_DISPLAY[to],
      ts: Date.now(),
      methodName: opts?.methodName,
      count: opts?.count,
    });
  };

  // ── radio overlays ─────────────────────────────────────────
  const toTrading = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('toTrading', SP_COIN_DISPLAY.TRADING_STATION_PANEL, opts);
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const openBuyList = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('openBuyList:requested', SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, opts);
    // Idempotent guard – avoid accidental toggle if already open
    if (isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL)) {
      log('openBuyList:skip_already_visible', SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, opts);
      perf.end('openBuyList');
      return;
    }
    openPanel(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open', opts);
  }, [openPanel, isVisible, perf]);

  const openSellList = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('openSellList:requested', SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, opts);
    if (isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL)) {
      log('openSellList:skip_already_visible', SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, opts);
      perf.end('openSellList');
      return;
    }
    openPanel(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open', opts);
  }, [openPanel, isVisible, perf]);

  const openRecipientList = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('openRecipientList:requested', SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, opts);
    openPanel(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);
    perf.end('openRecipientList');
    _emit(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const openAgentList = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('openAgentList:requested', SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, opts);
    openPanel(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
    perf.end('openAgentList');
    _emit(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const showErrorOverlay = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('showErrorOverlay', SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, opts);
    openPanel(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
    perf.end('showErrorOverlay');
    _emit(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const openManageSponsorships = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('openManageSponsorships', SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, opts);
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
    perf.end('openManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const closeManageSponsorships = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('closeManageSponsorships', SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, opts);
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
    perf.end('closeManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'close', opts);
  }, [closePanel, perf]);

  // ── inline helpers ────────────────────────────────────────
  const startAddSponsorship = useCallback((opts?: OpenOpts) => {
    perf.time('startAddSponsorship', () => {
      log('startAddSponsorship', SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, opts);
      openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
    });
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const openConfigSponsorship = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('openConfigSponsorship', SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, opts);
    openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.end('openConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'open', opts);
  }, [openPanel, perf]);

  const closeConfigSponsorship = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('closeConfigSponsorship', SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, opts);
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.end('closeConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'close', opts);
  }, [closePanel, perf]);

  const toggleSponsorConfig = useCallback((opts?: OpenOpts) => {
    const open = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.start();
    log(open ? 'toggleSponsorConfig:close' : 'toggleSponsorConfig:open',
        SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, opts);
    open
      ? closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL)
      : openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.end('toggleSponsorConfig');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, open ? 'close' : 'open', opts);
  }, [isVisible, closePanel, openPanel, perf]);

  const closeAddSponsorship = useCallback((opts?: OpenOpts) => {
    perf.start();
    log('closeAddSponsorship', SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, opts);
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
    perf.end('closeAddSponsorship');
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'close', opts);
  }, [closePanel, perf]);

  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY, opts?: OpenOpts) => {
    perf.start();
    log('openOverlay', overlay, opts);
    openPanel(overlay);
    perf.end(`openOverlay:${overlay}`);
    _emit(overlay, 'open', opts);
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
