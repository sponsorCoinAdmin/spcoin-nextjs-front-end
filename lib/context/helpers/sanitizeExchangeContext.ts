import { ExchangeContext, TradeData } from '@/lib/structure';
import { getInitialContext } from './ExchangeInitialContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSanitizeHelpers', DEBUG_ENABLED, LOG_TIME);

export const sanitizeExchangeContext = (
  raw: { tradeData?: Partial<TradeData> } & Partial<ExchangeContext> | null,
  chainId: number
): ExchangeContext => {
  const defaultContext = getInitialContext(chainId);
  if (!raw) {
    debugLog.warn('⚠️ sanitizeExchangeContext received null — returning defaults');
    return defaultContext;
  }

  return {
    settings: {
      apiTradingProvider: raw.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      spCoinDisplay: raw.settings?.spCoinDisplay ?? defaultContext.settings.spCoinDisplay,
    },
    network: {
      ...defaultContext.network,
      ...raw.network,
      connected: raw.network?.connected ?? defaultContext.network.connected,
    },
    accounts: {
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
    },
    tradeData: {
      tradeDirection: raw.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
      sellTokenContract: raw.tradeData?.sellTokenContract ?? defaultContext.tradeData.sellTokenContract,
      buyTokenContract: raw.tradeData?.buyTokenContract ?? defaultContext.tradeData.buyTokenContract,
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
};
