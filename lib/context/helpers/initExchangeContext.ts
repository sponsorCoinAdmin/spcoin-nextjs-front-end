'use client';

import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from './loadLocalExchangeContext';
import { WalletAccount } from '@/lib/structure';
import { ExchangeContext } from '@/lib/structure';
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

  debugLog.warn(`🧪 sanitizeExchangeContext → network.chainId = ${sanitized.network?.chainId}`);

  // ✅ Force override chainId to match wagmi value
  if (sanitized.network.chainId !== effectiveChainId) {
    debugLog.warn(`⚠️ Overriding sanitized.chainId ${sanitized.network.chainId} → ${effectiveChainId}`);
    sanitized.network.chainId = effectiveChainId;
  }

  debugLog.warn(`📥 Final network.chainId before hydration: ${sanitized.network?.chainId}`);

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

  debugLog.warn(`✅ After init: sanitized.network.chainId = ${sanitized.network.chainId}, wagmi = ${chainId}`);
  return sanitized;
}
