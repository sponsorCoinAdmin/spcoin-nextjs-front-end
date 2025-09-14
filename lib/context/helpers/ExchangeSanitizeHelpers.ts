// File: lib/context/ExchangeSanitizeHelpers.ts

import { TradeData, ExchangeContext } from '@/lib/structure';
import { getInitialContext } from './ExchangeInitialContext';
import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

/** Legacy guards — we only use them to decide whether to preserve or drop. */
function isPanelNodeArray(x: unknown): x is PanelNode[] {
  return Array.isArray(x) && x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean' &&
      Array.isArray((n as any).children ?? [])
  );
}
function isMainPanelNode(x: unknown): x is MainPanelNode {
  return !!x &&
    typeof x === 'object' &&
    typeof (x as any).panel === 'number' &&
    typeof (x as any).visible === 'boolean' &&
    Array.isArray((x as any).children ?? []);
}

/**
 * Safely merges a raw (possibly partial or malformed) ExchangeContext object with defaults.
 * IMPORTANT:
 * - Do NOT seed/overwrite `settings.mainPanelNode` here. If present, preserve it as-is.
 *   Provider/init code is responsible for seeding/migrating defaults.
 */
export const sanitizeExchangeContext = (
  raw: { tradeData?: Partial<TradeData> } & Partial<ExchangeContext> | null,
  chainId: number
): ExchangeContext => {
  const defaultContext = getInitialContext(chainId);

  if (!raw) {
    // No raw context → return defaults (which already include settings.mainPanelNode).
    return { ...defaultContext };
  }

  // ----- SETTINGS: shallow merge defaults <- raw.settings; preserve mainPanelNode if present.
  const prevSettings: any = (raw as any).settings ?? {};
  const sanitizedSettings: any = {
    ...defaultContext.settings,
    ...prevSettings,
  };

 // Preserve persisted panel state if it looks like either the new tree or the old array
  const mpn = prevSettings.mainPanelNode;
  if (isMainPanelNode(mpn) || isPanelNodeArray(mpn)) {
    sanitizedSettings.mainPanelNode = mpn;
  } else if (typeof mpn !== 'undefined') {
    // Malformed → drop; provider will seed/migrate later
    delete sanitizedSettings.mainPanelNode;
  }

  // ----- NETWORK
  const sanitizedNetwork = {
    ...defaultContext.network,
    ...raw.network,
    connected: raw.network?.connected ?? defaultContext.network.connected,
  };

  // ----- ACCOUNTS
  const sanitizedAccounts = {
    connectedAccount: raw.accounts?.connectedAccount
      ? { ...raw.accounts.connectedAccount, balance: raw.accounts.connectedAccount.balance ?? 0n }
      : defaultContext.accounts.connectedAccount,
    sponsorAccount: raw.accounts?.sponsorAccount
      ? { ...raw.accounts.sponsorAccount, balance: raw.accounts.sponsorAccount.balance ?? 0n }
      : defaultContext.accounts.sponsorAccount,
    recipientAccount: raw.accounts?.recipientAccount
      ? { ...raw.accounts.recipientAccount, balance: raw.accounts.recipientAccount.balance ?? 0n }
      : defaultContext.accounts.recipientAccount,
    agentAccount: raw.accounts?.agentAccount
      ? { ...raw.accounts.agentAccount, balance: raw.accounts.agentAccount.balance ?? 0n }
      : defaultContext.accounts.agentAccount,
    sponsorAccounts: raw.accounts?.sponsorAccounts ?? defaultContext.accounts.sponsorAccounts,
    recipientAccounts: raw.accounts?.recipientAccounts ?? defaultContext.accounts.recipientAccounts,
    agentAccounts: raw.accounts?.agentAccounts ?? defaultContext.accounts.agentAccounts,
  };

  // ----- TRADEDATA
  const sanitizedTradeData: TradeData = {
    tradeDirection: raw.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
    sellTokenContract: raw.tradeData?.sellTokenContract
      ? {
          ...defaultContext.tradeData.sellTokenContract,
          ...raw.tradeData.sellTokenContract,
          balance: raw.tradeData.sellTokenContract.balance ?? 0n,
        }
      : defaultContext.tradeData.sellTokenContract,
    buyTokenContract: raw.tradeData?.buyTokenContract
      ? {
          ...defaultContext.tradeData.buyTokenContract,
          ...raw.tradeData.buyTokenContract,
          balance: raw.tradeData.buyTokenContract.balance ?? 0n,
        }
      : defaultContext.tradeData.buyTokenContract,
    rateRatio: raw.tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
    slippage: {
      bps: raw.tradeData?.slippage?.bps ?? defaultContext.tradeData.slippage.bps,
      percentage: raw.tradeData?.slippage?.percentage ?? defaultContext.tradeData.slippage.percentage,
      percentageString:
        raw.tradeData?.slippage?.percentageString ?? defaultContext.tradeData.slippage.percentageString,
    },
  };

  return {
    settings: sanitizedSettings,
    network: sanitizedNetwork,
    accounts: sanitizedAccounts,
    tradeData: sanitizedTradeData,
    errorMessage: raw.errorMessage ?? defaultContext.errorMessage,
    apiErrorMessage: raw.apiErrorMessage ?? defaultContext.apiErrorMessage,
  };
};
