// File: @/lib/context/exchangeContext/hooks/useHeaderController.ts
'use client';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { suppressNextOverlayClose } from '@/lib/context/exchangeContext/hooks/useOverlayCloseHandler';

// ✅ ExchangeContext access (for activeAccount.logoURL + address)
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

// Read env once, with a safe fallback
const AGENT_WALLET_TITLE = process.env.NEXT_PUBLIC_AGENT_WALLET_TITLE ?? 'Sponsor Coin Exchange';

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

/** Default titles (STATIC only) */
const DEFAULT_TITLES: Partial<Record<SP_COIN_DISPLAY, string>> = {
  [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: 'Select Sponsors Agent',
  [SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL]: 'Select a Token to Buy',
  [SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL]: 'Error Message Panel',
  [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: 'Select Recipient to Sponsor',
  [SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL]: 'Select a Token to Sell',
  [SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL]: 'Sponsor Rate Configuration',
  [SP_COIN_DISPLAY.TRADING_STATION_PANEL]: AGENT_WALLET_TITLE,
  [SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL]: 'Select a Sponsor',
  // NOTE: MANAGE_SPONSORSHIPS_PANEL title is dynamic (computed in titleFor())
  [SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL]: 'Manage Recipient Account',
  [SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL]: 'Manage Agent Account',
  [SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL]: 'Manage Sponsor Account',
  [SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL]: 'Staking Your Sponsor Coins',

  // Fallback label for the rewards panel (dynamic title computed in titleFor())
  [SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL]: 'Pending Rewards Page',
};

function getRewardsHeaderTitle(
  opts: {
    claimSponsor: boolean;
    claimRecipient: boolean;
    claimAgent: boolean;
    unSponsor: boolean;
  },
  name?: string,
): string {
  const n = (name ?? '').trim();
  const label = n.length ? n : 'Sponsor Coin';

  if (opts.claimSponsor) return `${label}'s Sponsor Rewards`;
  if (opts.claimRecipient) return `${label}'s Recipient Rewards`;
  if (opts.claimAgent) return `${label}'s Agent Rewards`;

  // ✅ NEW: UNSPONSOR_STATE child-mode title
  if (opts.unSponsor) return 'Allocated Sponsorships';

  return 'Pending Rewards Page';
}

function titleFor(
  display: SP_COIN_DISPLAY,
  rewardsState?: {
    claimSponsor: boolean;
    claimRecipient: boolean;
    claimAgent: boolean;
    unSponsor: boolean;
  },
  manageName?: string,
): string {
  if (display === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL && rewardsState) {
    return getRewardsHeaderTitle(rewardsState, manageName);
  }

  // ✅ dynamic Manage Sponsorships title
  if (display === SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL) {
    const n = (manageName ?? '').trim();
    const label = n.length ? n : 'Sponsor Coin';
    return `${label}'s Account Management`;
  }

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
  SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL,

  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,

  SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,

  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
] as const;

type PriorityDisplay = (typeof DISPLAY_PRIORITY)[number];

export function useHeaderController() {
  // IMPORTANT: we need openPanel (not closePanel) for clicking the logo.
  const panelTree = usePanelTree();
  const openPanel =
    (panelTree as any).openPanel ?? (panelTree as any).showPanel ?? (panelTree as any).setPanelVisible;
  const closePanel = (panelTree as any).closePanel;

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // ✅ ExchangeContext access (for activeAccount.logoURL + address + name)
  const exchangeCtx = useContext(ExchangeContextState);
  const activeAccount = exchangeCtx?.exchangeContext?.accounts?.activeAccount;

  const activeAccountLogoURL = activeAccount?.logoURL;
  const activeAccountAddress = activeAccount?.address;

  // Try common name fields (adjust if your model uses a different key)
  const activeAccountName =
    (activeAccount as any)?.name ??
    (activeAccount as any)?.accountName ??
    (activeAccount as any)?.label ??
    (activeAccount as any)?.displayName ??
    '';

  // Read each visibility exactly once
  const tokenList = usePanelVisible(SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL);
  const sellList = usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
  const buyList = usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
  const recipientList = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);

  const agentDetail = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL);
  const recipientDetail = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL);
  const sponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);

  const agentList = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  const sponsorList = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);

  const staking = usePanelVisible(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL);

  const manageHub = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  const error = usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  const trading = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

  // ✅ rewards-subpanel visibility used to compute dynamic header title
  const claimSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_STATE);
  const claimRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_STATE);
  const claimAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_STATE);
  const unSponsor = usePanelVisible(SP_COIN_DISPLAY.UNSPONSOR_STATE);

  const rewardsState = useMemo(
    () => ({ claimSponsor, claimRecipient, claimAgent, unSponsor }),
    [claimSponsor, claimRecipient, claimAgent, unSponsor],
  );

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
      [SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL]: sponsorList,

      [SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL]: staking,

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
    manageHub,
    error,
    trading,
  ]);

  const title = useMemo(() => {
    const override = headerTitleOverrides.get(currentDisplay);
    if (override) return override;

    return titleFor(
      currentDisplay,
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL ? rewardsState : undefined,
      activeAccountName,
    );
  }, [currentDisplay, rewardsState, activeAccountName]);

  /**
   * ✅ LEFT ELEMENT BEHAVIOR
   * - Overrides still win if registered.
   * - For ACCOUNT_LIST_REWARDS_PANEL AND MANAGE_SPONSORSHIPS_PANEL:
   *   show activeAccount logo as a clickable button that OPENS SPONSOR_ACCOUNT_PANEL.
   *
   * NOTE: file is `.ts` so we avoid JSX and use React.createElement().
   */
  const leftElement = useMemo(() => {
    const factory = headerLeftOverrides.get(currentDisplay);
    if (factory) return factory();

    const showActiveLogo =
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

    if (!showActiveLogo) return null;
    if (!activeAccountLogoURL) return null;

    const sizePx = 38;

    return React.createElement(
      'button',
      {
        type: 'button',
        className: 'bg-transparent p-0 m-0 hover:opacity-90 focus:outline-none',
        'aria-label': 'Open Sponsor Account',
        'data-role': 'ActiveAccount',
        'data-address': activeAccountAddress ?? '',
        onClick: () => {
          suppressNextOverlayClose('Header:ActiveLogo->SponsorAccount', 'HeaderController');

          if (typeof openPanel === 'function') {
            try {
              openPanel(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL, 'Header:ActiveLogoClick');
              return;
            } catch {}

            try {
              openPanel(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL, true, 'Header:ActiveLogoClick');
              return;
            } catch {}

            try {
              openPanel({ panel: SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL, visible: true });
              return;
            } catch {}
          }
        },
      },
      React.createElement('img', {
        src: activeAccountLogoURL,
        alt: 'Active Account logo',
        width: sizePx,
        height: sizePx,
        loading: 'lazy',
        decoding: 'async',
        className: 'h-[38px] w-[38px] object-contain rounded bg-transparent',
      }),
    );
  }, [currentDisplay, activeAccountLogoURL, activeAccountAddress, openPanel]);

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  const onClose = useCallback(
    (e?: AnyCloseEvent) => {
      suppressNextOverlayClose('HeaderController:onClose(pop)', 'HeaderController');

      try {
        e?.preventDefault?.();
        e?.stopPropagation?.();
      } catch {}

      // keep your original close behavior
      if (typeof closePanel === 'function') {
        closePanel('HeaderController:onClose(pop)', e as any);
      }
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
