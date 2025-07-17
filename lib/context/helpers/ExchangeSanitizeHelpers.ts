// File: lib/context/ExchangeSanitizeHelpers.ts

import { TradeData, ExchangeContext, SP_COIN_DISPLAY } from '@/lib/structure';
import { getInitialContext } from './ExchangeInitialContext';

/**
 * Safely merges a raw (possibly partial or malformed) ExchangeContext object with defaults.
 * Ensures all required properties are present and initializes any missing fields with fallback values.
 *
 * @param raw - The raw context object, usually deserialized from localStorage
 * @param chainId - The chainId used to pull default values
 * @returns Fully sanitized ExchangeContext
 */
export const sanitizeExchangeContext = (
  raw: { tradeData?: Partial<TradeData> } & Partial<ExchangeContext> | null,
  chainId: number
): ExchangeContext => {
  const defaultContext = getInitialContext(chainId);

  if (!raw) return defaultContext;

  return {
    settings: {
      apiTradingProvider:
        raw.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      activeDisplay:
        raw.settings?.activeDisplay ?? SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL, // ✅ only activeDisplay
    },
    network: {
      ...defaultContext.network,
      ...raw.network,
      connected: raw.network?.connected ?? defaultContext.network.connected,
    },
    accounts: {
      connectedAccount: raw.accounts?.connectedAccount
        ? {
            ...raw.accounts.connectedAccount,
            balance: raw.accounts.connectedAccount.balance ?? 0n,
          }
        : defaultContext.accounts.connectedAccount,
      sponsorAccount: raw.accounts?.sponsorAccount
        ? {
            ...raw.accounts.sponsorAccount,
            balance: raw.accounts.sponsorAccount.balance ?? 0n,
          }
        : defaultContext.accounts.sponsorAccount,
      recipientAccount: raw.accounts?.recipientAccount
        ? {
            ...raw.accounts.recipientAccount,
            balance: raw.accounts.recipientAccount.balance ?? 0n,
          }
        : defaultContext.accounts.recipientAccount,
      agentAccount: raw.accounts?.agentAccount
        ? {
            ...raw.accounts.agentAccount,
            balance: raw.accounts.agentAccount.balance ?? 0n,
          }
        : defaultContext.accounts.agentAccount,
      sponsorAccounts:
        raw.accounts?.sponsorAccounts ?? defaultContext.accounts.sponsorAccounts,
      recipientAccounts:
        raw.accounts?.recipientAccounts ?? defaultContext.accounts.recipientAccounts,
      agentAccounts:
        raw.accounts?.agentAccounts ?? defaultContext.accounts.agentAccounts,
    },
    tradeData: {
      tradeDirection:
        raw.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
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
      rateRatio:
        raw.tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
      slippage: {
        bps:
          raw.tradeData?.slippage?.bps ?? defaultContext.tradeData.slippage.bps,
        percentage:
          raw.tradeData?.slippage?.percentage ?? defaultContext.tradeData.slippage.percentage,
        percentageString:
          raw.tradeData?.slippage?.percentageString ??
          defaultContext.tradeData.slippage.percentageString,
      },
    },
    errorMessage: raw.errorMessage ?? defaultContext.errorMessage,
    apiErrorMessage: raw.apiErrorMessage ?? defaultContext.apiErrorMessage,
  };
};
