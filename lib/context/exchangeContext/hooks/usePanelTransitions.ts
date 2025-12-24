// File: @/lib/context/exchangeContext/hooks/usePanelTransitions.ts
'use client';

import { useCallback, useRef } from 'react';
import type { MouseEvent, MouseEventHandler } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

type OpenOpts = { methodName?: string };

type ClickOpts = OpenOpts & {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  defer?: boolean;
};

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_PANEL_TRANSITIONS === 'true';
const debug = createDebugLogger('usePanelTransitions', DEBUG_ENABLED);

export function usePanelTransitions() {
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  const buyCountRef = useRef(0);
  const sellCountRef = useRef(0);

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

      const runner = () => act({ methodName });

      if (defer) {
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(runner);
        } else {
          void Promise.resolve().then(runner);
        }
      } else {
        runner();
      }
    };
  };

  // ─── Core overlays ────────────────────────────────────────────────────────

  const toTrading = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      'usePanelTransitions:toTrading(MAIN_TRADING_PANEL)',
    );
    perf.end('toTrading');
  }, [openPanel, perf]);

  const openBuyList = useCallback(
    (opts?: OpenOpts) => {
      const count = ++buyCountRef.current;
      const methodName = opts?.methodName ?? 'openBuyList';

      debug.log?.('[openBuyList]', `#${count}`, {
        before: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
        beforeOther: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
        methodName,
      });

      perf.start();
      openPanel(
        SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
        `usePanelTransitions:openBuyList#${count}(${methodName}→TRADING_STATION_PANEL)`,
      );
      perf.end('openBuyList');

      debug.log?.('[openBuyList]', `#${count} (after)`, {
        after: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
        afterOther: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
        methodName,
      });
    },
    [isVisible, openPanel, perf],
  );

  const openSellList = useCallback(
    (opts?: OpenOpts) => {
      const count = ++sellCountRef.current;
      const methodName = opts?.methodName ?? 'openSellList';

      debug.log?.('[openSellList]', `#${count}`, {
        before: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
        beforeOther: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
        methodName,
      });

      perf.start();
      openPanel(
        SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
        `usePanelTransitions:openSellList#${count}(${methodName}→TRADING_STATION_PANEL)`,
      );
      perf.end('openSellList');

      debug.log?.('[openSellList]', `#${count} (after)`, {
        after: isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
        afterOther: isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
        methodName,
      });
    },
    [isVisible, openPanel, perf],
  );

  const openBuyListClick = useCallback(
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
    openPanel(
      SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
      'usePanelTransitions:openRecipientList(TRADING_STATION_PANEL)',
    );
    perf.end('openRecipientList');
  }, [openPanel, perf]);

  const openAgentList = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
      'usePanelTransitions:openAgentList(TRADING_STATION_PANEL)',
    );
    perf.end('openAgentList');
  }, [openPanel, perf]);

  const showErrorOverlay = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
      'usePanelTransitions:showErrorOverlay(TRADING_STATION_PANEL)',
    );
    perf.end('showErrorOverlay');
  }, [openPanel, perf]);

  // IMPORTANT:
  // MANAGE_SPONSORSHIPS is the GLOBAL overlay container.
  // MANAGE_SPONSORSHIPS_PANEL is the default scoped child inside that overlay.
  const openManageSponsorships = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS,
      'usePanelTransitions:openManageSponsorships(TRADING_STATION_PANEL)',
    );
    perf.end('openManageSponsorships');
  }, [openPanel, perf]);

  const closeManageSponsorships = useCallback(() => {
    perf.start();
    closePanel(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS,
      'usePanelTransitions:closeManageSponsorships(TRADING_STATION_PANEL)',
    );
    perf.end('closeManageSponsorships');
  }, [closePanel, perf]);

  const startAddSponsorship = useCallback(() => {
    perf.time('startAddSponsorship', () => {
      openPanel(
        SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
        'usePanelTransitions:startAddSponsorship(MANAGE_SPONSORSHIPS_PANEL)',
      );
    });
  }, [openPanel, perf]);

  const openConfigSponsorship = useCallback(() => {
    perf.start();
    openPanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:openConfigSponsorship(MANAGE_SPONSORSHIPS_PANEL)',
    );
    perf.end('openConfigSponsorship');
  }, [openPanel, perf]);

  const closeConfigSponsorship = useCallback(() => {
    perf.start();
    closePanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeConfigSponsorship(MANAGE_SPONSORSHIPS_PANEL)',
    );
    perf.end('closeConfigSponsorship');
  }, [closePanel, perf]);

  const toggleSponsorConfig = useCallback(() => {
    const open = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);

    perf.start();
    if (open) {
      closePanel(
        SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
        'usePanelTransitions:toggleSponsorConfig(close→MANAGE_SPONSORSHIPS_PANEL)',
      );
    } else {
      openPanel(
        SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
        'usePanelTransitions:toggleSponsorConfig(open→MANAGE_SPONSORSHIPS_PANEL)',
      );
    }
    perf.end('toggleSponsorConfig');
  }, [isVisible, closePanel, openPanel, perf]);

  const closeAddSponsorship = useCallback(() => {
    perf.start();
    closePanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeAddSponsorship(Config→MANAGE_SPONSORSHIPS_PANEL)',
    );
    closePanel(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
      'usePanelTransitions:closeAddSponsorship(Add→MANAGE_SPONSORSHIPS_PANEL)',
    );
    perf.end('closeAddSponsorship');
  }, [closePanel, perf]);

  const openOverlay = useCallback(
    (overlay: SP_COIN_DISPLAY) => {
      const name = SP_COIN_DISPLAY[overlay];
      perf.start();
      openPanel(overlay, `usePanelTransitions:openOverlay(${name}→TRADING_STATION_PANEL)`);
      perf.end(`openOverlay:${overlay}`);
    },
    [openPanel, perf],
  );

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
