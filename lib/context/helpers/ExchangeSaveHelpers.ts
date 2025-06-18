// File: lib/context/ExchangeSaveHelpers.ts

import { ExchangeContext } from '@/lib/structure';
import { serializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSaveHelpers', DEBUG_ENABLED, LOG_TIME);

/**
 * Save the provided ExchangeContext to localStorage
 * @param contextData ExchangeContext to save
 */
export const saveLocalExchangeContext = (contextData: ExchangeContext): void => {
  if (typeof window === 'undefined') return;

  try {
    debugLog.log(`📦 Saving exchangeContext to localStorage under key: ${STORAGE_KEY}`);

    const safeContext: ExchangeContext = {
      ...contextData,

      tradeData: {
        ...contextData.tradeData,
        sellTokenContract: contextData.tradeData.sellTokenContract
          ? {
              ...contextData.tradeData.sellTokenContract,
              balance: contextData.tradeData.sellTokenContract.balance ?? 0n,
            }
          : undefined,
        buyTokenContract: contextData.tradeData.buyTokenContract
          ? {
              ...contextData.tradeData.buyTokenContract,
              balance: contextData.tradeData.buyTokenContract.balance ?? 0n,
            }
          : undefined,
      },

      accounts: {
        connectedAccount: contextData.accounts?.connectedAccount
          ? { ...contextData.accounts.connectedAccount, balance: contextData.accounts.connectedAccount.balance ?? 0n }
          : undefined,
        sponsorAccount: contextData.accounts?.sponsorAccount
          ? { ...contextData.accounts.sponsorAccount, balance: contextData.accounts.sponsorAccount.balance ?? 0n }
          : undefined,
        recipientAccount: contextData.accounts?.recipientAccount
          ? { ...contextData.accounts.recipientAccount, balance: contextData.accounts.recipientAccount.balance ?? 0n }
          : undefined,
        agentAccount: contextData.accounts?.agentAccount
          ? { ...contextData.accounts.agentAccount, balance: contextData.accounts.agentAccount.balance ?? 0n }
          : undefined,
        sponsorAccounts: contextData.accounts?.sponsorAccounts ?? [],
        recipientAccounts: contextData.accounts?.recipientAccounts ?? [],
        agentAccounts: contextData.accounts?.agentAccounts ?? [],
      },
    };

    const serializedContext = serializeWithBigInt(safeContext);
    debugLog.log('🔓 SAVING EXCHANGE CONTEXT TO LOCALSTORAGE (serializedContext)\n:', serializedContext);

    try {
      const prettyPrinted = JSON.stringify(
        safeContext,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      debugLog.log('✅ (PRETTY PRINT) SAVED EXCHANGE CONTEXT TO LOCALSTORAGE (parsed)\n:', prettyPrinted);
    } catch (prettyError) {
      debugLog.warn('⚠️ Failed to pretty-print exchangeContext', prettyError);
    }

    localStorage.setItem(STORAGE_KEY, serializedContext);
    debugLog.log('✅ exchangeContext successfully saved');
  } catch (err) {
    debugLog.error('❌ Failed to save exchangeContext to localStorage', err);
  }
};
