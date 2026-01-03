// File: @/lib/context/ExchangeSanitizeHelpers.ts

import type { TradeData, ExchangeContext } from '@/lib/structure';
import { getInitialContext } from './ExchangeInitialContext';
import type {
  PanelNode,
  SpCoinPanelTree,
} from '@/lib/structure/exchangeContext/types/PanelNode';

/** Legacy guards — we only use them to decide whether to preserve or drop. */
function isPanelNodeArray(x: unknown): x is PanelNode[] {
  return (
    Array.isArray(x) &&
    x.every(
      (n) =>
        n &&
        typeof n === 'object' &&
        typeof (n as any).panel === 'number' &&
        typeof (n as any).visible === 'boolean' &&
        Array.isArray((n as any).children ?? []),
    )
  );
}
function isSpCoinPanelTree(x: unknown): x is SpCoinPanelTree {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof (x as any).panel === 'number' &&
    typeof (x as any).visible === 'boolean' &&
    Array.isArray((x as any).children ?? [])
  );
}

/**
 * DisplayStack invariants for sanitize:
 * - SINGLE SOURCE OF TRUTH is ALWAYS: `settings.displayStack`
 * - Legacy/shadow root `displayStack` is ignored (but can be migrated if settings is empty)
 *
 * We intentionally do NOT normalize the shape here (numbers vs nodes);
 * Provider code is responsible for normalization.
 */
function sanitizeDisplayStack(raw: any, sanitizedSettings: any) {
  // Prefer settings.displayStack if present
  const settingsStack = raw?.settings?.displayStack;
  const rootStack = raw?.displayStack;

  const settingsHas =
    Array.isArray(settingsStack) && settingsStack.length > 0;
  const rootHas = Array.isArray(rootStack) && rootStack.length > 0;

  if (settingsHas) {
    sanitizedSettings.displayStack = settingsStack;
    return;
  }

  if (rootHas) {
    // migrate legacy root → settings (best effort)
    sanitizedSettings.displayStack = rootStack;
    return;
  }

  // else: keep whatever defaultContext.settings had (if anything)
}

/**
 * Safely merges a raw (possibly partial or malformed) ExchangeContext object with defaults.
 * IMPORTANT:
 * - Do NOT seed/overwrite `settings.spCoinPanelTree` here. If present, preserve it as-is.
 *   Provider/init code is responsible for seeding/migrating defaults.
 * - We enforce the invariant that when `network.chainId` is non-zero,
 *   `network.appChainId` MUST equal `network.chainId`.
 * - SINGLE SOURCE OF TRUTH: displayStack lives ONLY at `settings.displayStack`.
 */
export const sanitizeExchangeContext = (
  raw: ({ tradeData?: Partial<TradeData> } & Partial<ExchangeContext>) | null,
  chainId: number,
): ExchangeContext => {
  const defaultContext = getInitialContext(chainId);

  if (!raw) {
    // No raw context → return defaults (which already include settings.spCoinPanelTree).
    return { ...defaultContext };
  }

  // ----- SETTINGS: shallow merge defaults <- raw.settings; preserve spCoinPanelTree if present.
  const prevSettings: any = (raw as any).settings ?? {};
  const sanitizedSettings: any = {
    ...defaultContext.settings,
    ...prevSettings,
  };

  // ✅ enforce single source of truth for displayStack (settings only)
  sanitizeDisplayStack(raw as any, sanitizedSettings);

  // Preserve persisted panel state if it looks like either the new tree or the old array
  const mpn = prevSettings.spCoinPanelTree;
  if (isSpCoinPanelTree(mpn) || isPanelNodeArray(mpn)) {
    sanitizedSettings.spCoinPanelTree = mpn;
  } else if (typeof mpn !== 'undefined') {
    // Malformed → drop; provider will seed/migrate later
    delete sanitizedSettings.spCoinPanelTree;
  }

  // ----- NETWORK
  // Start with defaults, then overlay whatever was stored.
  let sanitizedNetwork = {
    ...defaultContext.network,
    ...(raw as any).network,
    connected:
      (raw as any).network?.connected ?? defaultContext.network.connected,
  };

  // Enforce the invariant:
  //  - If we have a non-zero chain id, appChainId MUST match it.
  //  - If we were passed an explicit `chainId` arg, that takes precedence when non-zero.
  let effectiveChainId = sanitizedNetwork.chainId ?? 0;
  const argChainId = chainId ?? 0;

  if (argChainId !== 0) {
    effectiveChainId = argChainId;
  }

  if (effectiveChainId !== 0) {
    sanitizedNetwork = {
      ...sanitizedNetwork,
      chainId: effectiveChainId,
      appChainId: effectiveChainId,
      connected: true,
    };
  } else {
    // Disconnected / unknown network → both ids are 0
    sanitizedNetwork = {
      ...sanitizedNetwork,
      chainId: 0,
      appChainId: 0,
      connected: false,
    };
  }

  // ----- ACCOUNTS
  const sanitizedAccounts = {
    activeAccount: (raw as any).accounts?.activeAccount
      ? {
          ...(raw as any).accounts.activeAccount,
          balance: (raw as any).accounts.activeAccount.balance ?? 0n,
        }
      : defaultContext.accounts.activeAccount,

    sponsorAccount: (raw as any).accounts?.sponsorAccount
      ? {
          ...(raw as any).accounts.sponsorAccount,
          balance: (raw as any).accounts.sponsorAccount.balance ?? 0n,
        }
      : defaultContext.accounts.sponsorAccount,

    recipientAccount: (raw as any).accounts?.recipientAccount
      ? {
          ...(raw as any).accounts.recipientAccount,
          balance: (raw as any).accounts.recipientAccount.balance ?? 0n,
        }
      : defaultContext.accounts.recipientAccount,

    agentAccount: (raw as any).accounts?.agentAccount
      ? {
          ...(raw as any).accounts.agentAccount,
          balance: (raw as any).accounts.agentAccount.balance ?? 0n,
        }
      : defaultContext.accounts.agentAccount,

    sponsorAccounts:
      (raw as any).accounts?.sponsorAccounts ??
      defaultContext.accounts.sponsorAccounts,
    recipientAccounts:
      (raw as any).accounts?.recipientAccounts ??
      defaultContext.accounts.recipientAccounts,
    agentAccounts:
      (raw as any).accounts?.agentAccounts ??
      defaultContext.accounts.agentAccounts,
  };

  // ----- TRADEDATA
  const sanitizedTradeData: TradeData = {
    tradeDirection:
      (raw as any).tradeData?.tradeDirection ??
      defaultContext.tradeData.tradeDirection,
    sellTokenContract: (raw as any).tradeData?.sellTokenContract
      ? {
          ...defaultContext.tradeData.sellTokenContract,
          ...(raw as any).tradeData.sellTokenContract,
          balance: (raw as any).tradeData.sellTokenContract.balance ?? 0n,
        }
      : defaultContext.tradeData.sellTokenContract,
    buyTokenContract: (raw as any).tradeData?.buyTokenContract
      ? {
          ...defaultContext.tradeData.buyTokenContract,
          ...(raw as any).tradeData.buyTokenContract,
          balance: (raw as any).tradeData.buyTokenContract.balance ?? 0n,
        }
      : defaultContext.tradeData.buyTokenContract,
    rateRatio:
      (raw as any).tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
    slippage: {
      bps:
        (raw as any).tradeData?.slippage?.bps ??
        defaultContext.tradeData.slippage.bps,
      percentage:
        (raw as any).tradeData?.slippage?.percentage ??
        defaultContext.tradeData.slippage.percentage,
      percentageString:
        (raw as any).tradeData?.slippage?.percentageString ??
        defaultContext.tradeData.slippage.percentageString,
    },
  };

  // ✅ DO NOT return any root displayStack field.
  return {
    settings: sanitizedSettings,
    network: sanitizedNetwork,
    accounts: sanitizedAccounts,
    tradeData: sanitizedTradeData,
    errorMessage: (raw as any).errorMessage ?? defaultContext.errorMessage,
    apiErrorMessage: (raw as any).apiErrorMessage ?? defaultContext.apiErrorMessage,
  };
};
