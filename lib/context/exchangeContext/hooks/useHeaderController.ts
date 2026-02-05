// File: @/lib/context/exchangeContext/hooks/useHeaderController.ts
'use client';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
  manageName?: string,
): string {
  if (display === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL && rewardsState) {
    return getRewardsHeaderTitle(rewardsState, manageName);
  }

  if (display === SP_COIN_DISPLAY.ACCOUNT_PANEL && accountsState) {
    return getAccountsHeaderTitle(accountsState, manageName);
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
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,

  SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL,
  SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,

  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL,

  SP_COIN_DISPLAY.ACCOUNT_PANEL,

  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
] as const;

type PriorityDisplay = (typeof DISPLAY_PRIORITY)[number];

type RewardsRoleMode = 'sponsor' | 'recipient' | 'agent' | 'none';

function deriveRewardsRoleMode(opts: {
  unSponsor: boolean;
  claimSponsor: boolean;
  claimRecipient: boolean;
  claimAgent: boolean;
}): RewardsRoleMode {
  if (opts.unSponsor || opts.claimSponsor) return 'sponsor';
  if (opts.claimRecipient) return 'recipient';
  if (opts.claimAgent) return 'agent';
  return 'none';
}

export function useHeaderController() {
  const panelTree = usePanelTree();
  const openPanel = (panelTree as any).openPanel;
  const closePanel = (panelTree as any).closePanel;

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // ✅ ExchangeContext access (for activeAccount + writable accounts fields)
  const exchangeCtx = useContext(ExchangeContextState);
  const exchangeContext = (exchangeCtx as any)?.exchangeContext;
  const setExchangeContext = (exchangeCtx as any)?.setExchangeContext;

  const activeAccount = exchangeContext?.accounts?.activeAccount;

  const activeAccountLogoURL = activeAccount?.logoURL;
  const activeAccountAddress = activeAccount?.address;

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

  const accountPanel = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);

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

  // ✅ ACCOUNT_PANEL active sub-view visibility (dynamic title)
  const activeSponsor = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_SPONSOR);
  const activeRecipient = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_RECIPIENT);
  const activeAgent = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_AGENT);

  const accountsState = useMemo(
    () => ({ activeSponsor, activeRecipient, activeAgent }),
    [activeSponsor, activeRecipient, activeAgent],
  );

  /**
   * ✅ Populate accounts.sponsorAccount / recipientAccount / agentAccount
   * AND force a reload when the rewards "role mode" changes.
   *
   * Role mode rules:
   * - ACTIVE_SPONSORSHIPS OR PENDING_SPONSOR_REWARDS -> sponsor mode
   * - PENDING_RECIPIENT_REWARDS -> recipient mode
   * - PENDING_AGENT_REWARDS -> agent mode
   */
  const lastRewardsRoleModeRef = useRef<RewardsRoleMode>('none');

  useEffect(() => {
    if (typeof setExchangeContext !== 'function') return;
    if (!activeAccount) return;

    const nextMode = deriveRewardsRoleMode({
      unSponsor,
      claimSponsor,
      claimRecipient,
      claimAgent,
    });

    // If none of the modes are active, do nothing (don’t stomp selections)
    if (nextMode === 'none') return;

    const prevMode = lastRewardsRoleModeRef.current;

    // ✅ Only "reload" on *mode changes* after the initial mode is established.
    const modeChanged = prevMode !== 'none' && prevMode !== nextMode;

    // update ref immediately to avoid double-trigger on rapid flips
    lastRewardsRoleModeRef.current = nextMode;

    setExchangeContext(
      (prev: any) => {
        const prevEx = prev?.exchangeContext ?? prev;
        const prevAccounts = prevEx?.accounts ?? {};

        const nextSponsor = nextMode === 'sponsor' ? activeAccount : undefined;
        const nextRecipient = nextMode === 'recipient' ? activeAccount : undefined;
        const nextAgent = nextMode === 'agent' ? activeAccount : undefined;

        const curSponsorAddr = prevAccounts?.sponsorAccount?.address ?? null;
        const curRecipientAddr = prevAccounts?.recipientAccount?.address ?? null;
        const curAgentAddr = prevAccounts?.agentAccount?.address ?? null;

        const nextSponsorAddr = nextSponsor?.address ?? null;
        const nextRecipientAddr = nextRecipient?.address ?? null;
        const nextAgentAddr = nextAgent?.address ?? null;

        const roleAccountsUnchanged =
          curSponsorAddr === nextSponsorAddr &&
          curRecipientAddr === nextRecipientAddr &&
          curAgentAddr === nextAgentAddr;

        const nextReloadNonce = modeChanged ? Number(prevAccounts?.reloadNonce ?? 0) + 1 : prevAccounts?.reloadNonce;

        // No-op if already in desired state and no reload needed
        if (roleAccountsUnchanged && !modeChanged) return prev;

        const writeAccounts = {
          ...prevAccounts,
          activeAccount: prevAccounts.activeAccount ?? activeAccount,
          sponsorAccount: nextSponsor,
          recipientAccount: nextRecipient,
          agentAccount: nextAgent,
          ...(modeChanged ? { reloadNonce: nextReloadNonce } : null),
        };

        if (prev?.exchangeContext) {
          return {
            ...prev,
            exchangeContext: {
              ...prev.exchangeContext,
              accounts: writeAccounts,
            },
          };
        }

        return {
          ...prev,
          accounts: writeAccounts,
          activeAccount: prevAccounts.activeAccount ?? activeAccount,
        };
      },
      'useHeaderController:setRoleAccountFromRewardsMode',
    );

    // ✅ Best-effort reload hooks if your accounts model exposes one
    if (modeChanged) {
      try {
        exchangeContext?.accounts?.reload?.('rewardsModeChanged');
      } catch {}
      try {
        exchangeContext?.accounts?.reloadAccounts?.('rewardsModeChanged');
      } catch {}
      try {
        exchangeContext?.accounts?.refresh?.('rewardsModeChanged');
      } catch {}
      try {
        exchangeContext?.accounts?.refreshAccounts?.('rewardsModeChanged');
      } catch {}
    }
  }, [
    setExchangeContext,
    exchangeContext,
    activeAccount,
    unSponsor,
    claimSponsor,
    claimRecipient,
    claimAgent,
  ]);

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
    buyList,
    recipientList,
    agentDetail,
    recipientDetail,
    sponsorDetail,
    agentList,
    sponsorList,
    accountPanel,
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
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL ? accountsState : undefined,
      activeAccountName,
    );
  }, [currentDisplay, rewardsState, accountsState, activeAccountName]);

  /**
   * ✅ LEFT ELEMENT BEHAVIOR
   *
   * Rules:
   * - If ACCOUNT_PANEL is active: do nothing.
   * - If ACCOUNT_LIST_REWARDS_PANEL is active: open ACTIVE_* based on rewards child mode, then open ACCOUNT_PANEL.
   * - Otherwise (e.g. MANAGE_SPONSORSHIPS_PANEL): open ACCOUNT_PANEL.
   *
   * NOTE: file is `.ts` so we avoid JSX and use React.createElement().
   */
  const leftElement = useMemo(() => {
    const factory = headerLeftOverrides.get(currentDisplay);
    if (factory) return factory();

    const showActiveLogo =
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL ||
      currentDisplay === SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

    if (!showActiveLogo) return null;
    if (!activeAccountLogoURL) return null;

    const sizePx = 38;
    const isAccountPanelActive = currentDisplay === SP_COIN_DISPLAY.ACCOUNT_PANEL;

    return React.createElement(
      'button',
      {
        type: 'button',
        className: `bg-transparent p-0 m-0 focus:outline-none ${isAccountPanelActive ? '' : 'hover:opacity-90'}`,
        'aria-label': isAccountPanelActive ? 'Active Account' : 'Open Account Panel',
        'data-role': 'ActiveAccount',
        'data-address': activeAccountAddress ?? '',
        disabled: isAccountPanelActive,
        onClick: isAccountPanelActive
          ? undefined
          : () => {
              suppressNextOverlayClose('Header:ActiveLogo->AccountPanel', 'HeaderController');

              if (currentDisplay === SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL) {
                const modeToOpen =
                  unSponsor || claimSponsor
                    ? SP_COIN_DISPLAY.ACTIVE_SPONSOR
                    : claimRecipient
                      ? SP_COIN_DISPLAY.ACTIVE_RECIPIENT
                      : claimAgent
                        ? SP_COIN_DISPLAY.ACTIVE_AGENT
                        : null;

                if (modeToOpen != null) {
                  openPanel(modeToOpen, 'Header:ActiveLogoClick:preselectAccountMode');
                }
              }

              openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'Header:ActiveLogoClick');
            },
      },
      React.createElement('img', {
        src: activeAccountLogoURL,
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
    activeAccountLogoURL,
    activeAccountAddress,
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
