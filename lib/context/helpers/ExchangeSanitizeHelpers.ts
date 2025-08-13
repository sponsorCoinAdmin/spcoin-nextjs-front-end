// File: lib/context/ExchangeSanitizeHelpers.ts

import { TradeData, ExchangeContext, SP_COIN_DISPLAY, SP_COIN_DISPLAY_NEW } from '@/lib/structure';
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

  if (!raw) {
    // When no raw context exists, also seed settings_NEW with a sane default
    const ctx = { ...defaultContext } as any;
    ctx.settings_NEW = {
      spCoinDisplay: SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL,
    };
    return ctx as ExchangeContext;
  }

  // Build the sanitized base (existing fields)
  const sanitized: ExchangeContext = {
    settings: {
      apiTradingProvider:
        raw.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      activeDisplay:
        raw.settings?.activeDisplay ?? SP_COIN_DISPLAY.TRADING_STATION_PANEL, // ✅ only activeDisplay
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
      rateRatio: raw.tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
      slippage: {
        bps: raw.tradeData?.slippage?.bps ?? defaultContext.tradeData.slippage.bps,
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

  // ✅ NEW: Seed/validate the app-level panel visibility in the parallel settings_NEW bag.
  // We intentionally avoid touching your existing `settings`/`Settings` type.
  const validNewValues = new Set<number>(
    (Object.values(SP_COIN_DISPLAY_NEW).filter(v => typeof v === 'number') as number[])
  );

  const storedNewDisplay =
    (raw as any)?.settings_NEW?.spCoinDisplay as number | undefined;

  const sanitizedNewDisplay = validNewValues.has(storedNewDisplay ?? -1)
    ? (storedNewDisplay as SP_COIN_DISPLAY_NEW)
    : SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;

  (sanitized as any).settings_NEW = {
    spCoinDisplay: sanitizedNewDisplay,
  };

  return sanitized;
};
