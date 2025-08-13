// File: lib/context/ExchangeSanitizeHelpers.ts

import { TradeData, ExchangeContext, SP_COIN_DISPLAY_NEW } from '@/lib/structure';
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

  // Build a set of valid enum numeric values for quick validation
  const validDisplayValues = new Set<number>(
    (Object.values(SP_COIN_DISPLAY_NEW).filter((v) => typeof v === 'number') as number[])
  );

  // Helper to coerce any incoming value to a valid SP_COIN_DISPLAY_NEW or fallback
  const coerceDisplay = (value: unknown): SP_COIN_DISPLAY_NEW => {
    const asNum = typeof value === 'number' ? value : undefined;
    if (asNum !== undefined && validDisplayValues.has(asNum)) {
      return asNum as SP_COIN_DISPLAY_NEW;
    }
    // Prefer defaultContext if it already has a valid value, otherwise use TRADING_STATION_PANEL
    const def = (defaultContext as any)?.settings?.activeDisplay;
    return validDisplayValues.has(def) ? (def as SP_COIN_DISPLAY_NEW) : SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;
  };

  if (!raw) {
    // No raw context — return defaults with a guaranteed valid activeDisplay
    const ctx = { ...defaultContext } as ExchangeContext;
    (ctx as any).settings = {
      ...defaultContext.settings,
      activeDisplay: coerceDisplay((defaultContext as any)?.settings?.activeDisplay),
    };
    return ctx;
  }

  // Build the sanitized base (existing fields)
  const sanitized: ExchangeContext = {
    settings: {
      apiTradingProvider:
        raw.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      activeDisplay: coerceDisplay(raw.settings?.activeDisplay), // ✅ new enum throughout
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
      sponsorAccounts: raw.accounts?.sponsorAccounts ?? defaultContext.accounts.sponsorAccounts,
      recipientAccounts: raw.accounts?.recipientAccounts ?? defaultContext.accounts.recipientAccounts,
      agentAccounts: raw.accounts?.agentAccounts ?? defaultContext.accounts.agentAccounts,
    },
    tradeData: {
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
    },
    errorMessage: raw.errorMessage ?? defaultContext.errorMessage,
    apiErrorMessage: raw.apiErrorMessage ?? defaultContext.apiErrorMessage,
  };

  return sanitized;
};
