// File: @/lib/context/exchangeContext/hooks/useHeaderController.ts
'use client';

import type React from 'react';
import { useCallback, useMemo, useState, useEffect } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

// ✅ Prevent “double close” when a header close also triggers an overlay/backdrop close.
import { suppressNextOverlayClose } from '@/lib/context/exchangeContext/hooks/useOverlayCloseHandler';

// Read env once, with a safe fallback
const AGENT_WALLET_TITLE =
  process.env.NEXT_PUBLIC_AGENT_WALLET_TITLE ?? 'Sponsor Coin Exchange';

/** Title override mapper */
const headerTitleOverrides = new Map<SP_COIN_DISPLAY, string>();
export function useRegisterHeaderTitle(panel: SP_COIN_DISPLAY, title?: string) {
  useEffect(() => {
    if (title === undefined) return;
    headerTitleOverrides.set(panel, title);
    return () => {
      if (headerTitleOverrides.get(panel) === title) {
        headerTitleOverrides.delete(panel);
      }
    };
  }, [panel, title]);
}

/** Left-side component override mapper */
type LeftFactory = () => React.ReactNode;
const headerLeftOverrides = new Map<SP_COIN_DISPLAY, LeftFactory>();
export function useRegisterHeaderLeft(
  panel: SP_COIN_DISPLAY,
  factory?: LeftFactory,
) {
  useEffect(() => {
    if (!factory) return;
    headerLeftOverrides.set(panel, factory);
    return () => {
      if (headerLeftOverrides.get(panel) === factory) {
        headerLeftOverrides.delete(panel);
      }
    };
  }, [panel, factory]);
}

function titleFor(display: SP_COIN_DISPLAY): string {
  switch (display) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return 'Select Sponsors Agent';
    case SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL:
      return 'Select a Token to Buy';
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL:
      return 'Error Message Panel';
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return 'Select Recipient to Sponsor';
    case SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL:
      return 'Select a Token to Sell';
    case SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL:
      return 'Sponsor Rate Configuration';
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL:
      return AGENT_WALLET_TITLE;
    case SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD:
      return 'Select a Sponsor';
    case SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL:
      return 'Sponsorship Account Management';
    case SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL:
      return 'Claim Recipient Rewards';
    case SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL:
      return 'Claim Agent Rewards';
    case SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL:
      return 'Claim Sponsor Rewards';
    case SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL:
      return 'Manage Recipient Account';
    case SP_COIN_DISPLAY.MANAGE_AGENT_PANEL:
      return 'Manage Agent Account';
    case SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL:
      return 'Manage Sponsor Account';
    case SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL:
      return 'Un-Staking Your Sponsor Coins';
    case SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL:
      return 'Staking Your Sponsor Coins';
    default:
      return 'Main Panel Header';
  }
}

export function useHeaderController() {
  const { closePanel } = usePanelTree();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  /**
   * Visibility is used ONLY for computing header title/left (not for nav).
   *
   * ✅ Pending Rewards is a LOCAL/INLINE toggle and must NOT drive header selection.
   * We intentionally do NOT read it here to avoid treating it like a nav/display member.
   */
  const vis = {
    sponsor: usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD),
    sell: usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
    buy: usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
    recipient: usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL),

    manageHub: usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL),

    manageRecipientsList: usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL),
    manageAgentsList: usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL),
    manageSponsorsList: usePanelVisible(
      SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL,
    ),

    manageRecipientDetail: usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL),
    manageAgentDetail: usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL),
    manageSponsorDetail: usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL),

    manageTradingCoins: usePanelVisible(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL),
    manageStakingCoins: usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL),

    agent: usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL),
    error: usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL),
    trading: usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL),
  };

  const currentDisplay: SP_COIN_DISPLAY = useMemo(() => {
    if (vis.sponsor) return SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD;
    if (vis.sell) return SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL;
    if (vis.buy) return SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;
    if (vis.recipient) return SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL;

    if (vis.manageAgentDetail) return SP_COIN_DISPLAY.MANAGE_AGENT_PANEL;
    if (vis.manageRecipientDetail) return SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL;
    if (vis.manageSponsorDetail) return SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL;

    if (vis.manageAgentsList) return SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL;
    if (vis.manageRecipientsList) return SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL;
    if (vis.manageSponsorsList)
      return SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL;

    if (vis.manageTradingCoins) return SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL;
    if (vis.manageStakingCoins) return SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL;

    if (vis.manageHub) return SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

    if (vis.agent) return SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL;
    if (vis.error) return SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;
    if (vis.trading) return SP_COIN_DISPLAY.TRADING_STATION_PANEL;

    return SP_COIN_DISPLAY.UNDEFINED;
  }, [vis]);

  const overrideTitle = headerTitleOverrides.get(currentDisplay);
  const title = overrideTitle ?? titleFor(currentDisplay);

  const leftElementFactory = headerLeftOverrides.get(currentDisplay);
  const leftElement = leftElementFactory ? leftElementFactory() : null;

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  /**
   * ✅ Header X = POP stack (close top of persisted displayStack) exactly once.
   *
   * IMPORTANT:
   * This handler is designed to be callable from:
   * - onPointerDownCapture
   * - onMouseDownCapture
   * - onClick
   *
   * so suppression + stopPropagation can run BEFORE backdrop/document handlers.
   */
  type AnyCloseEvent = {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  };

  const onClose = useCallback(
    (e?: AnyCloseEvent) => {
      // one-shot suppress next overlay close attempt (header + backdrop)
      suppressNextOverlayClose('HeaderController:onClose(pop)', 'HeaderController');

      try {
        e?.preventDefault?.();
        e?.stopPropagation?.();
      } catch {}

      // Pop top-of-stack (legacy API: closePanel(invoker, event?))
      // If your closePanel does NOT need the event, you can remove the 2nd arg safely.
      closePanel('HeaderController:onClose(pop)', e as any);
    },
    [closePanel],
  );

  return {
    title,
    leftElement,
    isConfigOpen,
    onOpenConfig,
    onCloseConfig,
    onClose,
    isTrading: vis.trading,
    currentDisplay,
  };
}
