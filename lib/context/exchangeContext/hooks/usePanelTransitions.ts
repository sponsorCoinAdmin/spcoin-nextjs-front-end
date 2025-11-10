// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import type { MouseEvent, MouseEventHandler } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

type OpenOpts  = { methodName?: string };
type ClickOpts = OpenOpts & { preventDefault?: boolean; stopPropagation?: boolean; defer?: boolean };

export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  const buyCountRef  = useRef(0);
  const sellCountRef = useRef(0);

  const _emit = (
    to: SP_COIN_DISPLAY,
    action: 'open' | 'close' | 'toggle',
    methodName?: string,
    count?: number,
  ) => {
    telemetry.emit('panel_transition', {
      action, to, label: SP_COIN_DISPLAY[to], ts: Date.now(), methodName, count,
    });
  };

  const toClickHandler = <T extends HTMLElement>(
    act: (opts?: OpenOpts) => void,
    base?: ClickOpts,
  ): MouseEventHandler<T> => {
    const { preventDefault = true, stopPropagation = true, defer = true, methodName } = base ?? {};
    return (e: MouseEvent<T>) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      defer ? queueMicrotask(() => act({ methodName })) : act({ methodName });
    };
  };

  // ─── Core overlays ────────────────────────────────────────────────────────
  const toTrading = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL, {
      reason: 'usePanelTransitions:toTrading',
      // parent intentionally omitted for root panel
    });
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open', 'toTrading');
  }, [openPanel, perf]);

  const openBuyList = useCallback((opts?: OpenOpts) => {
    const count = ++buyCountRef.current;
    const methodName = opts?.methodName ?? 'openBuyList';
    // eslint-disable-next-line no-console
    console.log('[openBuyList]', `#${count}`, {
      before: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
      beforeOther: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
      methodName,
    });

    perf.start();
    openPanel(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, {
      reason: `usePanelTransitions:openBuyList#${count}(${methodName})`,
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open', methodName, count);

    // eslint-disable-next-line no-console
    console.log('[openBuyList]', `#${count} (after)`, {
      after: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
      afterOther: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
      methodName,
    });
  }, [isVisible, openPanel, perf]);

  const openSellList = useCallback((opts?: OpenOpts) => {
    const count = ++sellCountRef.current;
    const methodName = opts?.methodName ?? 'openSellList';
    // eslint-disable-next-line no-console
    console.log('[openSellList]', `#${count}`, {
      before: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
      beforeOther: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
      methodName,
    });

    perf.start();
    openPanel(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, {
      reason: `usePanelTransitions:openSellList#${count}(${methodName})`,
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open', methodName, count);

    // eslint-disable-next-line no-console
    console.log('[openSellList]', `#${count} (after)`, {
      after: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
      afterOther: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
      methodName,
    });
  }, [isVisible, openPanel, perf]);

  const openBuyListClick  = useCallback(
    (opts?: ClickOpts) => toClickHandler<HTMLDivElement>(openBuyList, opts),
    [openBuyList],
  );
  const openSellListClick = useCallback(
    (opts?: ClickOpts) => toClickHandler<HTMLDivElement>(openSellList, opts),
    [openSellList],
  );

  // ─── Other panels ─────────────────────────────────────────────────────────
  const openRecipientList = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, {
      reason: 'usePanelTransitions:openRecipientList',
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('openRecipientList');
    _emit(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, 'open', 'openRecipientList');
  }, [openPanel, perf]);

  const openAgentList = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, {
      reason: 'usePanelTransitions:openAgentList',
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('openAgentList');
    _emit(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, 'open', 'openAgentList');
  }, [openPanel, perf]);

  const showErrorOverlay = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, {
      reason: 'usePanelTransitions:showErrorOverlay',
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('showErrorOverlay');
    _emit(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, 'open', 'showErrorOverlay');
  }, [openPanel, perf]);

  const openManageSponsorships = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, {
      reason: 'usePanelTransitions:openManageSponsorships',
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('openManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'open', 'openManageSponsorships');
  }, [openPanel, perf]);

  const closeManageSponsorships = useCallback(() => {
    perf.start();
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, {
      reason: 'usePanelTransitions:closeManageSponsorships',
      parent: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    });
    perf.end('closeManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'close', 'closeManageSponsorships');
  }, [closePanel, perf]);

  const startAddSponsorship = useCallback(() => {
    perf.time('startAddSponsorship', () => {
      openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, {
        reason: 'usePanelTransitions:startAddSponsorship',
        parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      });
    });
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'open', 'startAddSponsorship');
  }, [openPanel, perf]);

  const openConfigSponsorship = useCallback(() => {
    perf.start();
    openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, {
      reason: 'usePanelTransitions:openConfigSponsorship',
      parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    });
    perf.end('openConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'open', 'openConfigSponsorship');
  }, [openPanel, perf]);

  const closeConfigSponsorship = useCallback(() => {
    perf.start();
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, {
      reason: 'usePanelTransitions:closeConfigSponsorship',
      parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    });
    perf.end('closeConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'close', 'closeConfigSponsorship');
  }, [closePanel, perf]);

  const toggleSponsorConfig = useCallback(() => {
    const open = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.start();
    open
      ? closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, {
          reason: 'usePanelTransitions:toggleSponsorConfig(close)',
          parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        })
      : openPanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, {
          reason: 'usePanelTransitions:toggleSponsorConfig(open)',
          parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        });
    perf.end('toggleSponsorConfig');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, open ? 'close' : 'open', 'toggleSponsorConfig');
  }, [isVisible, closePanel, openPanel, perf]);

  const closeAddSponsorship = useCallback(() => {
    perf.start();
    closePanel(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, {
      reason: 'usePanelTransitions:closeAddSponsorship(Config)',
      parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    });
    closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, {
      reason: 'usePanelTransitions:closeAddSponsorship(Add)',
      parent: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    });
    perf.end('closeAddSponsorship');
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'close', 'closeAddSponsorship');
  }, [closePanel, perf]);

  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    const parent =
      overlay === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL ||
      overlay === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL ||
      overlay === SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL ||
      overlay === SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL ||
      overlay === SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL
        ? SP_COIN_DISPLAY.TRADING_STATION_PANEL
        : overlay === SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL ||
          overlay === SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL
        ? SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL
        : undefined;

    perf.start();
    openPanel(overlay, {
      reason: `usePanelTransitions:openOverlay(${SP_COIN_DISPLAY[overlay]})`,
      parent,
    });
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
