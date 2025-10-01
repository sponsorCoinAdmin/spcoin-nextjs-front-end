// File: lib/context/helpers/initExchangeContext.ts
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from './loadLocalExchangeContext';
import { WalletAccount, ExchangeContext, STATUS } from '@/lib/structure';
import { Address } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('initExchangeContext', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/**
 * Initializes the ExchangeContext by hydrating from localStorage and optionally
 * augmenting it with connected wallet metadata if `address` is provided.
 *
 * 🚫 This function does **not** create or mutate any panel state
 *     (`settings.mainPanelNode`, `settings.panelChildren`, or `settings.ui`).
 *     Panel state is initialized and persisted exclusively by the ExchangeProvider.
 */
export async function initExchangeContext(
  chainId: number,
  isConnected: boolean,
  address?: `0x${string}`
): Promise<ExchangeContext> {
  const effectiveChainId = chainId ?? 1;

  debugLog.log('🔍 Loading stored ExchangeContext...');
  const stored = loadLocalExchangeContext();

  debugLog.log(`🔗 Stored network.chainId = ${(stored as any)?.network?.chainId}`);
  const sanitized = sanitizeExchangeContext(stored, effectiveChainId);
  debugLog.log(`🧪 sanitizeExchangeContext → network.chainId = ${(sanitized as any)?.network?.chainId}`);
  debugLog.log(`📥 Final network.chainId before hydration: ${(sanitized as any)?.network?.chainId}`);

  // 🔐 Wallet metadata enrichment (does not affect panel storage)
  if (isConnected && address) {
    try {
      const res = await fetch(`/assets/accounts/${address}/wallet.json`);
      const metadata = res.ok ? (await res.json()) as Partial<WalletAccount> & { balance?: string | number } : null;

      if (metadata) {
        // Normalize balance to bigint safely
        const rawBalance = metadata.balance ?? 0;
        let balance: bigint = 0n;
        try {
          balance = BigInt(typeof rawBalance === 'string' ? rawBalance : String(rawBalance));
        } catch {
          balance = 0n;
        }

        const merged: WalletAccount = {
          name: metadata.name ?? '',
          symbol: metadata.symbol ?? '',
          type: metadata.type ?? 'ERC20_WALLET',
          website: metadata.website ?? '',
          description: metadata.description ?? '',
          status: STATUS.INFO,
          address: address as Address,
          logoURL: metadata.logoURL ?? '/assets/miscellaneous/SkullAndBones.png',
          balance,
        };
        (sanitized as any).accounts = (sanitized as any).accounts ?? {};
        (sanitized as any).accounts.connectedAccount = merged;
      } else {
        const fallback: WalletAccount = {
          address: address as Address,
          type: 'ERC20_WALLET',
          name: '',
          symbol: '',
          website: '',
          status: STATUS.MESSAGE_ERROR,
          description: `Account ${address} not registered on this site`,
          logoURL: '/assets/miscellaneous/SkullAndBones.png',
          balance: 0n,
        };
        (sanitized as any).accounts = (sanitized as any).accounts ?? {};
        (sanitized as any).accounts.connectedAccount = fallback;
      }
    } catch (err) {
      debugLog.error('⛔ Failed to load wallet.json:', err);
      const fallback: WalletAccount = {
        address: address as Address,
        type: 'ERC20_WALLET',
        name: '',
        symbol: '',
        website: '',
        status: STATUS.MESSAGE_ERROR,
        description: `Account ${address} metadata could not be loaded`,
        logoURL: '/assets/miscellaneous/SkullAndBones.png',
        balance: 0n,
      };
      (sanitized as any).accounts = (sanitized as any).accounts ?? {};
      (sanitized as any).accounts.connectedAccount = fallback;
    }
  }

  return sanitized;
}
