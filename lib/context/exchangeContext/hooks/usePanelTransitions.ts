// File: lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import type { MouseEvent, MouseEventHandler } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { telemetry } from '@/lib/utils/telemetry';

type OpenOpts = { methodName?: string };
type ClickOpts = OpenOpts & { preventDefault?: boolean; stopPropagation?: boolean; defer?: boolean };

// ⬇️ Optional parent threading (kept local for now)
type MaybeParent = SP_COIN_DISPLAY | undefined;

export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  // ── Compatibility wrappers: keep 1–2 arg API today ────────────────────────
  const openWithParent = useCallback(
    (id: SP_COIN_DISPLAY, methodName?: string, _parent?: MaybeParent) => {
      // If you want a noop log for parent while keeping the 1–2 arg signature:
      // console.debug('[openPanel]', SP_COIN_DISPLAY[id], 'parent:', _parent && SP_COIN_DISPLAY[_parent]);
      openPanel(id, methodName); // ✅ only pass the supported args
    },
    [openPanel],
  );

  const closeWithParent = useCallback(
    (id: SP_COIN_DISPLAY, methodName?: string, _parent?: MaybeParent) => {
      // console.debug('[closePanel]', SP_COIN_DISPLAY[id], 'parent:', _parent && SP_COIN_DISPLAY[_parent]);
      closePanel(id, methodName); // ✅ only pass the supported args
    },
    [closePanel],
  );
  // ──────────────────────────────────────────────────────────────────────────

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
    openWithParent(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'usePanelTransitions:toTrading', undefined);
    perf.end('toTrading');
    _emit(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'open', 'toTrading');
  }, [openWithParent, perf]);

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
    openWithParent(
      SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
      `usePanelTransitions:openBuyList#${count}(${methodName})`,
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('openBuyList');
    _emit(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL, 'open', methodName, count);

    // eslint-disable-next-line no-console
    console.log('[openBuyList]', `#${count} (after)`, {
      after: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
      afterOther: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
      methodName,
    });
  }, [isVisible, openWithParent, perf]);

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
    openWithParent(
      SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
      `usePanelTransitions:openSellList#${count}(${methodName})`,
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('openSellList');
    _emit(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL, 'open', methodName, count);

    // eslint-disable-next-line no-console
    console.log('[openSellList]', `#${count} (after)`, {
      after: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
      afterOther: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
      methodName,
    });
  }, [isVisible, openWithParent, perf]);

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
    openWithParent(
      SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
      'usePanelTransitions:openRecipientList',
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('openRecipientList');
    _emit(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL, 'open', 'openRecipientList');
  }, [openWithParent, perf]);

  const openAgentList = useCallback(() => {
    perf.start();
    openWithParent(
      SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
      'usePanelTransitions:openAgentList',
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('openAgentList');
    _emit(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL, 'open', 'openAgentList');
  }, [openWithParent, perf]);

  const showErrorOverlay = useCallback(() => {
    perf.start();
    openWithParent(
      SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
      'usePanelTransitions:showErrorOverlay',
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('showErrorOverlay');
    _emit(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL, 'open', 'showErrorOverlay');
  }, [openWithParent, perf]);

  const openManageSponsorships = useCallback(() => {
    perf.start();
    openWithParent(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'usePanelTransitions:openManageSponsorships',
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('openManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'open', 'openManageSponsorships');
  }, [openWithParent, perf]);

  const closeManageSponsorships = useCallback(() => {
    perf.start();
    closeWithParent(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'usePanelTransitions:closeManageSponsorships',
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    );
    perf.end('closeManageSponsorships');
    _emit(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'close', 'closeManageSponsorships');
  }, [closeWithParent, perf]);

  const startAddSponsorship = useCallback(() => {
    perf.time('startAddSponsorship', () => {
      openWithParent(
        SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
        'usePanelTransitions:startAddSponsorship',
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      );
    });
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'open', 'startAddSponsorship');
  }, [openWithParent, perf]);

  const openConfigSponsorship = useCallback(() => {
    perf.start();
    openWithParent(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:openConfigSponsorship',
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    );
    perf.end('openConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'open', 'openConfigSponsorship');
  }, [openWithParent, perf]);

  const closeConfigSponsorship = useCallback(() => {
    perf.start();
    closeWithParent(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeConfigSponsorship',
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    );
    perf.end('closeConfigSponsorship');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, 'close', 'closeConfigSponsorship');
  }, [closeWithParent, perf]);

  const toggleSponsorConfig = useCallback(() => {
    const open = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
    perf.start();
    open
      ? closeWithParent(
          SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
          'usePanelTransitions:toggleSponsorConfig(close)',
          SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        )
      : openWithParent(
          SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
          'usePanelTransitions:toggleSponsorConfig(open)',
          SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        );
    perf.end('toggleSponsorConfig');
    _emit(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL, open ? 'close' : 'open', 'toggleSponsorConfig');
  }, [isVisible, closeWithParent, openWithParent, perf]);

  const closeAddSponsorship = useCallback(() => {
    perf.start();
    closeWithParent(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeAddSponsorship(Config)',
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    );
    closeWithParent(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeAddSponsorship(Add)',
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
    );
    perf.end('closeAddSponsorship');
    _emit(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'close', 'closeAddSponsorship');
  }, [closeWithParent, perf]);

  const openOverlay = useCallback((overlay: SP_COIN_DISPLAY) => {
    // optional parent guess stays here for future use
    const parentGuess: MaybeParent =
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
    openWithParent(
      overlay,
      `usePanelTransitions:openOverlay(${SP_COIN_DISPLAY[overlay]})`,
      parentGuess,
    );
    perf.end(`openOverlay:${overlay}`);
    _emit(overlay, 'open', 'openOverlay');
  }, [openWithParent, perf]);

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
