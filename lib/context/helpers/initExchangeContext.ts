// File: lib/context/helpers/initExchangeContext.ts

import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from './loadLocalExchangeContext';
import { WalletAccount, ExchangeContext, SP_COIN_DISPLAY_NEW } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('initExchangeContext', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/**
 * Initializes the ExchangeContext by hydrating from localStorage and optionally
 * augmenting it with connected wallet metadata if `address` is provided.
 *
 * @param chainId - The current chain ID from Wagmi.
 * @param isConnected - Whether a wallet is connected.
 * @param address - The connected wallet address (optional).
 * @returns Promise resolving to a sanitized ExchangeContext.
 */
export async function initExchangeContext(
  chainId: number,
  isConnected: boolean,
  address?: `0x${string}`
): Promise<ExchangeContext> {
  const effectiveChainId = chainId ?? 1;

  debugLog.log('🔍 Loading stored ExchangeContext...');
  const stored = loadLocalExchangeContext();

  debugLog.log(`🔗 Stored network.chainId = ${stored?.network?.chainId}`);
  const sanitized = sanitizeExchangeContext(stored, effectiveChainId);
  debugLog.log(`🧪 sanitizeExchangeContext → network.chainId = ${sanitized.network?.chainId}`);
  debugLog.warn(`📥 Final network.chainId before hydration: ${sanitized.network?.chainId}`);

  // ✅ Ensure NEW panel settings bag exists with a sane default
  // We don't alter existing `settings`; we add/patch `settings_NEW`.
  const ctxAny = sanitized as any;
  if (!ctxAny.settings_NEW) {
    ctxAny.settings_NEW = {
      spCoinDisplay: SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL,
    };
  } else if (ctxAny.settings_NEW.spCoinDisplay === undefined) {
    ctxAny.settings_NEW.spCoinDisplay = SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;
  }

  if (isConnected && address) {
    try {
      const res = await fetch(`/assets/accounts/${address}/wallet.json`);
      const metadata = res.ok ? await res.json() : null;

      sanitized.accounts.connectedAccount = metadata
        ? { ...metadata, address }
        : {
            address,
            type: 'ERC20_WALLET',
            name: '',
            symbol: '',
            website: '',
            status: 'Missing',
            description: `Account ${address} not registered on this site`,
            logoURL: '/public/assets/miscellaneous/SkullAndBones.png',
            balance: 0n,
          } satisfies WalletAccount;
    } catch (err) {
      debugLog.error('⛔ Failed to load wallet.json:', err);
    }
  }

  return sanitized;
}
