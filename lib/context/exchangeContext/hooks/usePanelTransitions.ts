// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

type DebugCtx = {
  /** Optional: who is calling (e.g., 'TokenSelectDropDown.openTokenSelectPanel:SELL') */
  methodName?: string;
  /** Optional: external sequence/counter if the caller tracks attempts */
  count?: number;
};

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TRANSITIONS === 'true';

/**
 * Declarative, named transitions for common UI flows.
 * Now instrumented with optional perf marks + telemetry events.
 */
export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  // Local counters so we can spot rapid-fire toggles in prod
  const sellOpenSeqRef = useRef(0);
  const buyOpenSeqRef  = useRef(0);

  // ---- helpers ----
  const _emit = (to: SP_COIN_DISPLAY, action: 'open' | 'close' | 'toggle', ctx?: DebugCtx) => {
    telemetry.emit('panel_transition', {
      action,
      to,
      label: SP_COIN_DISPLAY[to],
      ts: Date.now(),
      methodName: ctx?.methodName,
      count: ctx?.count,
    });
  };

  const _debugPre = (label: string, to: SP_COIN_DISPLAY, ctx?: DebugCtx) => {
    if (!DEBUG) return;
    const vis = isVisible(to);
    // eslint-disable-next-line no-console
    console.log(
      `[usePanelTransitions] → ${label} start`,
      { panel: SP_COIN_DISPLAY[to], visible: vis, methodName: ctx?.methodName, count: ctx?.count }
    );
    // Quick, shallow trace to see the path (kept tiny to avoid console spam)
    // eslint-disable-next-line no-console
    console.trace?.(`[usePanelTransitions] trace for ${label}`);
  };

  const _debugPost = (label: string, to: SP_COIN_DISPLAY, ctx?: DebugCtx) => {
    if (!DEBUG) return;
    const vis = isVisible(to);
    // eslint-disable-next-line no-console
    console.log(
      `[usePanelTransitions] ✓ ${label} done`,
      { panel: SP_COIN_DISPLAY[to], visible: vis, methodName: ctx?.methodName, count: ctx?.count }
    );
  };

  // ---- Core overlays (radio group) ----
  const toTrading = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open');
  }, [openPanel, perf]);

  const openBuyList = useCallback((ctx?: DebugCtx) => {
    const localSeq = ++buyOpenSeqRef.current;
    perf.start();
    _debugPre(`openBuyList#${localSeq}`, SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, ctx);

    openPanel(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);

    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open', { ...ctx, count: ctx?.count ?? localSeq });
    _debugPost(`openBuyList#${localSeq}`, SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, ctx);
  }, [openPanel, perf, isVisible]);

  const openSellList = useCallback((ctx?: DebugCtx) => {
    const localSeq = ++sellOpenSeqRef.current;
    perf.start();
    _debugPre(`openSellList#${localSeq}`, SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, ctx);

    openPanel(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);

    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open', { ...ctx, count: ctx?.count ?? localSeq });
    _debugPost(`openSellList#${localSeq}`, SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, ctx);
  }, [openPanel, perf, isVisible]);

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
  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY, ctx?: DebugCtx) => {
    perf.start();
    _debugPre(`openOverlay`, overlay, ctx);
    openPanel(overlay);
    perf.end(`openOverlay:${overlay}`);
    _emit(overlay, 'open', ctx);
    _debugPost(`openOverlay`, overlay, ctx);
  }, [openPanel, perf, isVisible]);

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
