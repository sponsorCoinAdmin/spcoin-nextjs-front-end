// File: @/lib/context/exchangeContext/hooks/useHeaderController.ts
'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
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
      if (headerTitleOverrides.get(panel) === title) headerTitleOverrides.delete(panel);
    };
  }, [panel, title]);
}

/** Left-side component override mapper */
type LeftFactory = () => React.ReactNode;
const headerLeftOverrides = new Map<SP_COIN_DISPLAY, LeftFactory>();
export function useRegisterHeaderLeft(panel: SP_COIN_DISPLAY, factory?: LeftFactory) {
  useEffect(() => {
    if (!factory) return;
    headerLeftOverrides.set(panel, factory);
    return () => {
      if (headerLeftOverrides.get(panel) === factory) headerLeftOverrides.delete(panel);
    };
  }, [panel, factory]);
}

/** Default titles */
const DEFAULT_TITLES: Partial<Record<SP_COIN_DISPLAY, string>> = {
  [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: 'Select Sponsors Agent',
  [SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL]: 'Select a Token to Buy',
  [SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL]: 'Error Message Panel',
  [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: 'Select Recipient to Sponsor',
  [SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL]: 'Select a Token to Sell',
  [SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL]: 'Sponsor Rate Configuration',
  [SP_COIN_DISPLAY.TRADING_STATION_PANEL]: AGENT_WALLET_TITLE,
  [SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL]: 'Select a Sponsor',
  [SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL]: 'Sponsorship Account Management',
  [SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL]: 'Manage Recipient Account',
  [SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL]: 'Manage Agent Account',
  [SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL]: 'Manage Sponsor Account',
  [SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL]: 'Un-Staking Your Sponsor Coins',
  [SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL]: 'Staking Your Sponsor Coins',
};

function titleFor(display: SP_COIN_DISPLAY): string {
  return DEFAULT_TITLES[display] ?? 'Main Panel Header';
}

type AnyCloseEvent = {
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/**
 * Static, stable priority order (no allocations per render).
 * Reorder/add items here.
 */
const DISPLAY_PRIORITY = [
  SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,

  SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL,
  SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,

  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL,

  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,

  SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,

  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
] as const;

type PriorityDisplay = (typeof DISPLAY_PRIORITY)[number];

export function useHeaderController() {
  const { closePanel } = usePanelTree();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Read each visibility exactly once
  const tokenList = usePanelVisible(SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL);
  const sellList = usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
  const buyList = usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
  const recipientList = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);

  const agentDetail = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL);
  const recipientDetail = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL);
  const sponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);

  const agentList = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  const sponsorList = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL);

  const staking = usePanelVisible(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL);
  const unstaking = usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL);

  const manageHub = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  const error = usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  const trading = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

  /**
   * Option A: make TS understand the *exact* key set.
   * We build a Record<PriorityDisplay, boolean> and iterate DISPLAY_PRIORITY.
   *
   * This removes the "can't index with SP_COIN_DISPLAY" error because
   * `display` is inferred as PriorityDisplay (the subset), not the whole enum.
   */
  const currentDisplay = useMemo<SP_COIN_DISPLAY>(() => {
    const visibleByDisplay: Record<PriorityDisplay, boolean> = {
      [SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL]: tokenList,
      [SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL]: sellList,
      [SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL]: buyList,
      [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: recipientList,

      [SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL]: agentDetail,
      [SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL]: recipientDetail,
      [SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL]: sponsorDetail,

      [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: agentList,
      [SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL]: sponsorList,

      [SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL]: staking,
      [SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL]: unstaking,

      [SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL]: manageHub,

      [SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL]: error,
      [SP_COIN_DISPLAY.TRADING_STATION_PANEL]: trading,
    };

    for (const display of DISPLAY_PRIORITY) {
      if (visibleByDisplay[display]) return display;
    }
    return SP_COIN_DISPLAY.UNDEFINED;
  }, [
    tokenList,
    sellList,
    buyList,
    recipientList,
    agentDetail,
    recipientDetail,
    sponsorDetail,
    agentList,
    sponsorList,
    staking,
    unstaking,
    manageHub,
    error,
    trading,
  ]);

  const title = useMemo(() => {
    return headerTitleOverrides.get(currentDisplay) ?? titleFor(currentDisplay);
  }, [currentDisplay]);

  const leftElement = useMemo(() => {
    const factory = headerLeftOverrides.get(currentDisplay);
    return factory ? factory() : null;
  }, [currentDisplay]);

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  const onClose = useCallback(
    (e?: AnyCloseEvent) => {
      suppressNextOverlayClose('HeaderController:onClose(pop)', 'HeaderController');

      try {
        e?.preventDefault?.();
        e?.stopPropagation?.();
      } catch {}

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
    isTrading: trading,
    currentDisplay,
  };
}
