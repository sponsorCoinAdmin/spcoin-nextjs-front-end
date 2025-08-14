// File: lib/context/helpers/initExchangeContext.ts

import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from './loadLocalExchangeContext';
import {
  WalletAccount,
  ExchangeContext,
  SP_COIN_DISPLAY,
  STATUS, // ✅ use enum, not raw string
} from '@/lib/structure';
import { Address } from 'viem'; // ✅ ensure Address type for casting
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('initExchangeContext', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/**
 * Initializes the ExchangeContext by hydrating from localStorage and optionally
 * augmenting it with connected wallet metadata if `address` is provided.
 *
 * - Normalizes panel state via `sanitizeExchangeContext` (coerces settings.activeDisplay).
 * - Seeds transitional `settings_NEW.spCoinDisplay` for legacy paths if missing.
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

  // ✅ Ensure the transitional settings_NEW bag exists with a sane default
  const ctxAny = sanitized as any;
  if (!ctxAny.settings_NEW) {
    ctxAny.settings_NEW = {
      spCoinDisplay: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    };
  } else if (ctxAny.settings_NEW.spCoinDisplay === undefined) {
    ctxAny.settings_NEW.spCoinDisplay = SP_COIN_DISPLAY.TRADING_STATION_PANEL;
  }

  if (isConnected && address) {
    try {
      const res = await fetch(`/assets/accounts/${address}/wallet.json`);
      const metadata = res.ok ? (await res.json()) : null;

      if (metadata) {
        // ✅ Merge metadata safely, ensuring required WalletAccount fields exist
        const merged: WalletAccount = {
          name: metadata.name ?? '',
          symbol: metadata.symbol ?? '',
          type: metadata.type ?? 'ERC20_WALLET',
          website: metadata.website ?? '',
          description: metadata.description ?? '',
          status: STATUS.INFO, // choose a sensible default status for loaded metadata
          address: address as Address,
          logoURL: metadata.logoURL ?? '/assets/miscellaneous/SkullAndBones.png',
          balance: BigInt(metadata.balance ?? 0),
        };
        sanitized.accounts.connectedAccount = merged;
      } else {
        // ✅ Fallback WalletAccount using proper enum and types
        const fallback: WalletAccount = {
          address: address as Address,
          type: 'ERC20_WALLET',
          name: '',
          symbol: '',
          website: '',
          status: STATUS.MESSAGE_ERROR, // ← enum, not string
          description: `Account ${address} not registered on this site`,
          logoURL: '/assets/miscellaneous/SkullAndBones.png', // no '/public' prefix
          balance: 0n,
        };
        sanitized.accounts.connectedAccount = fallback;
      }
    } catch (err) {
      debugLog.error('⛔ Failed to load wallet.json:', err);
      // On fetch error, still ensure we set a sensible fallback
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
      sanitized.accounts.connectedAccount = fallback;
    }
  }

  return sanitized;
}
