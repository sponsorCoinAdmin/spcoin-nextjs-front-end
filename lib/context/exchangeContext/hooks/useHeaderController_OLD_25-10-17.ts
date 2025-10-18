// File: lib/context/exchangeContext/hooks/useHeaderController.ts
'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const detailClosers = new Map<number, Set<() => void>>();
export function useRegisterDetailCloser(panel: SP_COIN_DISPLAY, fn?: () => void) {
  useEffect(() => {
    if (!fn) return;
    let set = detailClosers.get(panel);
    if (!set) {
      set = new Set();
      detailClosers.set(panel, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
      if (set && set.size === 0) detailClosers.delete(panel);
    };
  }, [panel, fn]);
}

function titleFor(display: SP_COIN_DISPLAY): string {
  switch (display) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL: return 'Select Sponsors Agent';
    case SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL: return 'Select a Token to Buy';
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL: return 'Error Message Panel';
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL: return 'Select Recipient to Sponsor';
    case SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL: return 'Select a Token to Sell';
    case SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL: return 'Sponsor Rate Configuration';
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL: return 'Sponsor Coin Exchange';
    case SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL: return 'Select a Sponsor';
    case SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL: return 'Manage Sponsorship Account Rewards';
    case SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL: return 'Manage Recipient Rewards';
    case SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL: return 'Manage Agent Rewards';
    case SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL: return 'Manage Sponsor Rewards';
    case SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL: return 'Manage Recipient Account';
    case SP_COIN_DISPLAY.MANAGE_AGENT_PANEL: return 'Manage Agent Account';
    case SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL: return 'Manage Sponsor Account';
    default: return 'Main Panel Header';
  }
}

export function useHeaderController() {
  const { openPanel, closePanel } = usePanelTree();
  const { toTrading } = usePanelTransitions();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const vis = {
    sponsor: usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL),
    sell: usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
    buy: usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
    recipient: usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL),

    manageHub: usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL),

    // Lists
    manageRecipientsList: usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL),
    manageAgentsList: usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL),
    manageSponsorsList: usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL),

    // Details
    manageRecipientDetail: usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL),
    manageAgentDetail: usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL),
    manageSponsorDetail: usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL),

    agent: usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL),
    error: usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL),
    trading: usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL),
  };

  const currentDisplay: SP_COIN_DISPLAY = useMemo(() => {
    if (vis.sponsor) return SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL;
    if (vis.sell) return SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL;
    if (vis.buy) return SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;
    if (vis.recipient) return SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL;

    // Prefer detail first
    if (vis.manageAgentDetail) return SP_COIN_DISPLAY.MANAGE_AGENT_PANEL;
    if (vis.manageRecipientDetail) return SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL;
    if (vis.manageSponsorDetail) return SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL;

    // Then lists
    if (vis.manageAgentsList) return SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL;
    if (vis.manageRecipientsList) return SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL;
    if (vis.manageSponsorsList) return SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL;

    if (vis.manageHub) return SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;
    if (vis.agent) return SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL;
    if (vis.error) return SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;
    if (vis.trading) return SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    return SP_COIN_DISPLAY.UNDEFINED;
  }, [vis]);

  const title = titleFor(currentDisplay);
  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  // Helper: force exactly one manage sub-list visible (and hide hub + details)
  const openOnlyManageList = useCallback((list: SP_COIN_DISPLAY) => {
    // close hub + all details
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
    closePanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL);
    closePanel(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL);

    // close the other lists
    if (list !== SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL) closePanel(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
    if (list !== SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL) closePanel(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
    if (list !== SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL) closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);

    // finally open the requested list
    openPanel(list);
  }, [openPanel, closePanel]);

  /** Close button behavior:
   *  - DETAIL → its LIST (via openOnlyManageList)
   *  - LIST   → hub
   *  - else   → trading
   *  - If a detail closer is registered, run it first and return.
   */
  const onClose = useCallback(() => {
    // Run any registered detail closer first
    if (
      currentDisplay === SP_COIN_DISPLAY.MANAGE_AGENT_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL
    ) {
      const closers = detailClosers.get(currentDisplay);
      if (closers && closers.size) {
        closers.forEach((fn) => { try { fn(); } catch {} });
        return;
      }
    }

    switch (currentDisplay) {
      // DETAIL → LIST (explicitly force list; avoid hub fallback)
      case SP_COIN_DISPLAY.MANAGE_AGENT_PANEL:
        openOnlyManageList(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
        return;
      case SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL:
        openOnlyManageList(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
        return;
      case SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL:
        openOnlyManageList(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);
        return;

      // LIST → HUB
      case SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL:
      case SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL:
      case SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL:
        openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
        return;

      default:
        toTrading();
        return;
    }
  }, [currentDisplay, openOnlyManageList, openPanel, toTrading]);

  return {
    title,
    isConfigOpen,
    onOpenConfig,
    onCloseConfig,
    onClose,
    isTrading: vis.trading,
    currentDisplay,
  };
}
