// File: @/lib/context/exchangeContext/hooks/useHeaderController.ts
'use client';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { suppressNextOverlayClose } from '@/lib/context/exchangeContext/hooks/useOverlayCloseHandler';
import { useBuyTokenContract, useSellTokenContract } from '@/lib/context/hooks';

// ✅ ExchangeContext access (for accounts.* + address/logo)
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

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

/** Default titles (STATIC only) */
const DEFAULT_TITLES: Partial<Record<SP_COIN_DISPLAY, string>> = {
  [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: 'Select Sponsors Agent',
  [SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL]: 'Error Message Panel',
  [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: 'Select Recipient to Sponsor',
  [SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL]: 'Select a Token',
  [SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL]: 'Sponsor Rate Configuration',
  [SP_COIN_DISPLAY.TRADING_STATION_PANEL]: AGENT_WALLET_TITLE,
  [SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL]: 'Token Contract',

  // NOTE: MANAGE_SPONSORSHIPS_PANEL title is dynamic (computed in titleFor())
  [SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL]: 'Staking Your Sponsor Coins',

  // Fallback label for the rewards panel (dynamic title computed in titleFor())
  [SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL]: 'Pending Rewards Page',

  // Fallback for account panel when no active child is visible
  [SP_COIN_DISPLAY.ACCOUNT_PANEL]: 'Accounts',
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

  if (opts.unSponsor) return 'Allocated Sponsorships';

  return 'Pending Rewards Page';
}

/**
 * ✅ ACCOUNT_PANEL header title logic
 */
function getAccountsHeaderTitle(
  opts: {
    activeSponsor: boolean;
    activeRecipient: boolean;
    activeAgent: boolean;
  },
  name?: string,
): string {
  const n = (name ?? '').trim();
  const label = n.length ? n : 'Sponsor Coin';

  if (opts.activeSponsor) return `${label}'s Sponsor Account`;
  if (opts.activeRecipient) return `${label}'s Recipient Account`;
  if (opts.activeAgent) return `${label}'s Agent Account`;

  return `${label}'s Account`;
}

/**
 * ✅ TOKEN_CONTRACT_PANEL header title logic
 */
function getTokenContractHeaderTitle(
  opts: {
    activeBuyToken: boolean;
    activeSellToken: boolean;
  },
  symbols?: { buySymbol?: string; sellSymbol?: string },
): string {
  const buySym = (symbols?.buySymbol ?? '').trim() || 'Token';
  const sellSym = (symbols?.sellSymbol ?? '').trim() || 'Token';

  if (opts.activeSellToken) return `Sell ${sellSym} Token`;
  if (opts.activeBuyToken) return `Buy ${buySym} Token`;

  return 'Token Contract';
}

function titleFor(
  display: SP_COIN_DISPLAY,
  rewardsState?: {
    claimSponsor: boolean;
    claimRecipient: boolean;
    claimAgent: boolean;
    unSponsor: boolean;
  },
  accountsState?: {
    activeSponsor: boolean;
    activeRecipient: boolean;
    activeAgent: boolean;
  },
  tokenState?: {
    activeBuyToken: boolean;
    activeSellToken: boolean;
    buySymbol?: string;
    sellSymbol?: string;
  },
  manageName?: string,
): string {
  if (display === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL && rewardsState) {
    return getRewardsHeaderTitle(rewardsState, manageName);
  }

  if (display === SP_COIN_DISPLAY.ACCOUNT_PANEL && accountsState) {
    return getAccountsHeaderTitle(accountsState, manageName);
  }

  if (display === SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL && tokenState) {
    return getTokenContractHeaderTitle(tokenState, {
      buySymbol: tokenState.buySymbol,
      sellSymbol: tokenState.sellSymbol,
    });
  }

  if (display === SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL && tokenState) {
    return getTokenContractHeaderTitle(tokenState, {
      buySymbol: tokenState.buySymbol,
      sellSymbol: tokenState.sellSymbol,
    });
  }

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
  SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,

  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL,

  SP_COIN_DISPLAY.ACCOUNT_PANEL,

  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
] as const;

type PriorityDisplay = (typeof DISPLAY_PRIORITY)[number];

function getAccountDisplayName(acct: any): string {
  return (
    (acct as any)?.name ??
    (acct as any)?.accountName ??
    (acct as any)?.label ??
    (acct as any)?.displayName ??
    ''
  );
}

export function useHeaderController() {
  const panelTree = usePanelTree();
  const openPanel = (panelTree as any).openPanel;
  const closePanel = (panelTree as any).closePanel;

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // ✅ ExchangeContext access (for accounts.* + address/logo)
  const exchangeCtx = useContext(ExchangeContextState);
  const exchangeContext = (exchangeCtx as any)?.exchangeContext;

  const accounts = exchangeContext?.accounts;
  const activeAccount = accounts?.activeAccount;

  // Read each visibility exactly once
  const tokenList = usePanelVisible(SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL);
  const sellList = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const recipientList = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);

  const agentList = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  const sponsorList = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);

  const accountPanel = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);
  const buyTokenPanel = usePanelVisible(SP_COIN_DISPLAY.BUY_TOKEN);
  const sellTokenPanel = usePanelVisible(SP_COIN_DISPLAY.SELL_TOKEN);

  const staking = usePanelVisible(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL);
  const manageHub = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  const error = usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  const trading = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

  // ✅ rewards-subpanel visibility (children of ACCOUNT_LIST_REWARDS_PANEL)
  const claimSponsor = usePanelVisible(SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS);
  const claimRecipient = usePanelVisible(SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS);
  const claimAgent = usePanelVisible(SP_COIN_DISPLAY.PENDING_AGENT_REWARDS);
  const unSponsor = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS);

  const rewardsState = useMemo(
    () => ({ claimSponsor, claimRecipient, claimAgent, unSponsor }),
    [claimSponsor, claimRecipient, claimAgent, unSponsor],
  );

  // ✅ ACCOUNT_PANEL active sub-view visibility (dynamic title + header account source)
  const activeSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const activeRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const activeAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);

  const accountsState = useMemo(
    () => ({ activeSponsor, activeRecipient, activeAgent }),
    [activeSponsor, activeRecipient, activeAgent],
  );

  const [buyToken] = useBuyTokenContract();
  const [sellToken] = useSellTokenContract();

  const tokenState = useMemo(
    () => ({
      activeBuyToken: buyTokenPanel,
      activeSellToken: sellTokenPanel,
      buySymbol: buyToken?.symbol,
      sellSymbol: sellToken?.symbol,
    }),
    [buyTokenPanel, sellTokenPanel, buyToken?.symbol, sellToken?.symbol],
  );

  const currentDisplay = useMemo<SP_COIN_DISPLAY>(() => {
    const visibleByDisplay: Record<PriorityDisplay, boolean> = {
      [SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL]: tokenList,
      [SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL]: sellList,
      [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: recipientList,

      [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: agentList,
      [SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL]: sponsorList,

      [SP_COIN_DISPLAY.ACCOUNT_PANEL]: accountPanel,

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
    recipientList,
    agentList,
    sponsorList,
    accountPanel,
    staking,
    manageHub,
    error,
    trading,
  ]);

  /**
   * When ACCOUNT_PANEL is active, the header uses role accounts.
   * Otherwise it uses accounts.activeAccount.
   */
  const headerAccount = useMemo(() => {
    if (currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL) {
      if (activeSponsor) return accounts?.sponsorAccount;
      if (activeRecipient) return (accounts as any)?.recipientAccount;
      if (activeAgent) return (accounts as any)?.agentAccount;
      return undefined;
    }
    return activeAccount;
  }, [currentDisplay, activeSponsor, activeRecipient, activeAgent, accounts, activeAccount]);

  const headerAccountLogoURL = (headerAccount as any)?.logoURL;
  const headerAccountAddress = (headerAccount as any)?.address;

  const headerAccountName = useMemo(() => {
    if (!headerAccount) return undefined;
    const n = getAccountDisplayName(headerAccount).toString().trim();
    return n.length ? n : undefined;
  }, [headerAccount]);

  const title = useMemo(() => {
    const override = headerTitleOverrides.get(currentDisplay);
    if (override) return override;

    return titleFor(
      currentDisplay,
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL ? rewardsState : undefined,
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL ? accountsState : undefined,
      currentDisplay === SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL ||
        currentDisplay === SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL
        ? tokenState
        : undefined,
      headerAccountName,
    );
  }, [currentDisplay, rewardsState, accountsState, tokenState, headerAccountName]);

  const leftElement = useMemo(() => {
    const factory = headerLeftOverrides.get(currentDisplay);
    if (factory) return factory();

    const showActiveLogo =
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

    if (!showActiveLogo) return null;
    if (!headerAccountLogoURL) return null;

    const sizePx = 38;
    const isAccountPanelActive = currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL;

    return React.createElement(
      'button',
      {
        type: 'button',
        className: `bg-transparent p-0 m-0 focus:outline-none ${
          isAccountPanelActive ? '' : 'hover:opacity-90'
        }`,
        'aria-label': isAccountPanelActive ? 'Active Account' : 'Open Account Panel',
        'data-role': 'ActiveAccount',
        'data-address': headerAccountAddress ?? '',
        disabled: isAccountPanelActive,
        onClick: isAccountPanelActive
          ? undefined
          : () => {
              suppressNextOverlayClose('Header:ActiveLogo->AccountPanel', 'HeaderController');

              // If rewards panel is active, preselect account mode before opening ACCOUNT_PANEL
              if (currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL) {
                const modeToOpen =
                  unSponsor || claimSponsor
                    ? SP_COIN_DISPLAY.SPONSOR_ACCOUNT
                    : claimRecipient
                      ? SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
                      : claimAgent
                        ? SP_COIN_DISPLAY.AGENT_ACCOUNT
                        : null;

                if (modeToOpen != null) {
                  openPanel(modeToOpen, 'Header:ActiveLogoClick:preselectAccountMode');
                }
              }

              openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'Header:ActiveLogoClick');
            },
      },
      React.createElement('img', {
        src: headerAccountLogoURL,
        alt: 'Active Account logo',
        width: sizePx,
        height: sizePx,
        loading: 'lazy',
        decoding: 'async',
        className: `h-[38px] w-[38px] object-contain rounded bg-transparent ${
          isAccountPanelActive ? 'cursor-default' : 'cursor-pointer'
        }`,
      }),
    );
  }, [
    currentDisplay,
    headerAccountLogoURL,
    headerAccountAddress,
    openPanel,
    claimSponsor,
    claimRecipient,
    claimAgent,
    unSponsor,
  ]);

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  const onClose = useCallback(
    (e?: AnyCloseEvent) => {
      suppressNextOverlayClose('HeaderController:onClose(pop)', 'HeaderController');

      try {
        e?.preventDefault?.();
        e?.stopPropagation?.();
      } catch {}

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
