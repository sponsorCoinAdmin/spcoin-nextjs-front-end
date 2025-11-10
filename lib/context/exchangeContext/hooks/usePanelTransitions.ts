// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import type { MouseEvent, MouseEventHandler } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

type OpenOpts = {
  /** For correlating caller in logs/telemetry */
  methodName?: string;
};

type ClickOpts = OpenOpts & {
  /** default true */
  preventDefault?: boolean;
  /** default true */
  stopPropagation?: boolean;
  /** If true, wrap the open call in queueMicrotask() (helps avoid outside-click closers) */
  defer?: boolean;
};

export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  // Monotonic counters to correlate repeated attempts
  const buyCountRef  = useRef(0);
  const sellCountRef = useRef(0);

  const _emit = (
    to: SP_COIN_DISPLAY,
    action: 'open' | 'close' | 'toggle',
    methodName?: string,
    count?: number,
  ) => {
    telemetry.emit('panel_transition', {
      action,
      to,
      label: SP_COIN_DISPLAY[to],
      ts: Date.now(),
      methodName,
      count,
    });
  };

  // Helper to build safe click handlers with correct typing
  const toClickHandler = <T extends HTMLElement>(
    act: (opts?: OpenOpts) => void,
    base?: ClickOpts,
  ): MouseEventHandler<T> => {
    const {
      preventDefault = true,
      stopPropagation = true,
      defer = true,
      methodName,
    } = base ?? {};
    return (e: MouseEvent<T>) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      if (defer) {
        queueMicrotask(() => act({ methodName }));
      } else {
        act({ methodName });
      }
    };
  };

  // ─── Core overlays (radio group) ───────────────────────────────────────────
  const toTrading = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'usePanelTransitions:toTrading');
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open', 'toTrading');
  }, [openPanel, perf]);

  const openBuyList = useCallback((opts?: OpenOpts) => {
    const count = ++buyCountRef.current;
    const methodName = opts?.methodName ?? 'openBuyList';

    const before = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    const beforeOther = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    // eslint-disable-next-line no-console
    console.log('[openBuyList]', `#${count}`, { before, beforeOther, methodName });

    perf.start();
    openPanel(
      SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
      `usePanelTransitions:openBuyList#${count}(${methodName})`,
    );
    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open', methodName, count);

    const after = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    const afterOther = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    // eslint-disable-next-line no-console
    console.log('[openBuyList]', `#${count} (after)`, { after, afterOther, methodName });
  }, [openPanel, isVisible, perf]);

  const openSellList = useCallback((opts?: OpenOpts) => {
    const count = ++sellCountRef.current;
    const methodName = opts?.methodName ?? 'openSellList';

    const before = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const beforeOther = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    // eslint-disable-next-line no-console
    console.log('[openSellList]', `#${count}`, { before, beforeOther, methodName });

    perf.start();
    openPanel(
      SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
      `usePanelTransitions:openSellList#${count}(${methodName})`,
    );
    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open', methodName, count);

    const after = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
    const afterOther = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
    // eslint-disable-next-line no-console
    console.log('[openSellList]', `#${count} (after)`, { after, afterOther, methodName });
  }, [openPanel, isVisible, perf]);

  // Type-safe click handlers you can pass directly to onClick
  const openBuyListClick    = useCallback(
    (opts?: ClickOpts) => toClickHandler<HTMLDivElement>(openBuyList, opts),
    [openBuyList],
  );
  const openSellListClick   = useCallback(
    (opts?: ClickOpts) => toClickHandler<HTMLDivElement>(openSellList, opts),
    [openSellList],
  );

  // ─── Other panels ──────────────────────────────────────────────────────────
  const openRecipientList = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
      'usePanelTransitions:openRecipientList',
    );
    perf.end('openRecipientList');
    _emit(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, 'open', 'openRecipientList');
  }, [openPanel, perf]);

  const openAgentList = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
      'usePanelTransitions:openAgentList',
    );
    perf.end('openAgentList');
    _emit(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, 'open', 'openAgentList');
  }, [openPanel, perf]);

  const showErrorOverlay = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
      'usePanelTransitions:showErrorOverlay',
    );
    perf.end('showErrorOverlay');
    _emit(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, 'open', 'showErrorOverlay');
  }, [openPanel, perf]);

  const openManageSponsorships = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'usePanelTransitions:openManageSponsorships',
    );
    perf.end('openManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'open', 'openManageSponsorships');
  }, [openPanel, perf]);

  const closeManageSponsorships = useCallback(() => {
    perf.start();
    closePanel(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'usePanelTransitions:closeManageSponsorships',
    );
    perf.end('closeManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'close', 'closeManageSponsorships');
  }, [closePanel, perf]);

  const startAddSponsorship = useCallback(() => {
    perf.time('startAddSponsorship', () => {
      openPanel(
        SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
        'usePanelTransitions:startAddSponsorship',
      );
    });
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'open', 'startAddSponsorship');
  }, [openPanel, perf]);

  const openConfigSponsorship = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:openConfigSponsorship',
    );
    perf.end('openConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'open', 'openConfigSponsorship');
  }, [openPanel, perf]);

  const closeConfigSponsorship = useCallback(() => {
    perf.start();
    closePanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeConfigSponsorship',
    );
    perf.end('closeConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'close', 'closeConfigSponsorship');
  }, [closePanel, perf]);

  const toggleSponsorConfig = useCallback(() => {
    const open = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.start();
    open
      ? closePanel(
          SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
          'usePanelTransitions:toggleSponsorConfig(close)',
        )
      : openPanel(
          SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
          'usePanelTransitions:toggleSponsorConfig(open)',
        );
    perf.end('toggleSponsorConfig');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, open ? 'close' : 'open', 'toggleSponsorConfig');
  }, [isVisible, closePanel, openPanel, perf]);

  const closeAddSponsorship = useCallback(() => {
    perf.start();
    closePanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeAddSponsorship(Config)',
    );
    closePanel(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeAddSponsorship(Add)',
    );
    perf.end('closeAddSponsorship');
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'close', 'closeAddSponsorship');
  }, [closePanel, perf]);

  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    perf.start();
    openPanel(overlay, `usePanelTransitions:openOverlay(${SP_COIN_DISPLAY[overlay]})`);
    perf.end(`openOverlay:${overlay}`);
    _emit(overlay, 'open', 'openOverlay');
  }, [openPanel, perf]);

  return {
    // programmatic
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

    // click-safe handlers
    openBuyListClick,
    openSellListClick,
  };
}
