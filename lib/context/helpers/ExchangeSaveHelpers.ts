// File: @/lib/context/helpers/ExchangeSaveHelpers.ts

'use client';

import type { ExchangeContext } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_LS_KEY } from '@/lib/context/exchangeContext/localStorageKeys';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_SAVE_HELPERS === 'true';

const debugLog = createDebugLogger(
  'ExchangeSaveHelpers',
  DEBUG_ENABLED,
  LOG_TIME,
);

// 🔑 MUST match EXCHANGE_CONTEXT_LS_KEY used in ExchangeHelpers.loadLocalExchangeContext

// BigInt-safe replacer for JSON.stringify
function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Normalize network so that:
 *  - appChainId is the single source of truth
 *  - chainId always mirrors appChainId
 *  - if neither is set, both are 0 and connected=false
 */
function normalizeNetworkForSave(
  network: ExchangeContext['network'] | undefined,
): ExchangeContext['network'] {
  const n = (network ?? {}) as any;

  const storedAppChainId =
    typeof n.appChainId === 'number' ? (n.appChainId as number) : 0;
  const storedChainId =
    typeof n.chainId === 'number' ? (n.chainId as number) : 0;

  const effective = storedAppChainId || storedChainId || 0;

  if (effective !== 0) {
    return {
      ...n,
      appChainId: effective,
      chainId: effective,
      connected: true,
    };
  }

  return {
    ...n,
    appChainId: 0,
    chainId: 0,
    connected: false,
  };
}

export function saveLocalExchangeContext(ctx: ExchangeContext): void {
  // Don’t touch localStorage on the server
  if (typeof window === 'undefined') return;

  try {
    const src: any = ctx;

    // Build a minimal, JSON-safe snapshot
    const settings: any = { ...(src.settings ?? {}) };

    // Drop legacy / derived field
    if ('mainPanelNode' in settings) {
      delete settings.mainPanelNode;
      debugLog.log?.('🧹 Removed settings.mainPanelNode before save');
    }

    // 🔒 Enforce appChainId/chainId invariant before persisting
    const normalizedNetwork = normalizeNetworkForSave(src.network);

    const toPersist = {
      network: normalizedNetwork,
      tradeData: src.tradeData ?? {}, // ⬅️ full tradeData will be stored
      accounts: src.accounts ?? {},
      settings,
    };

    let serialized: string;
    try {
      serialized = JSON.stringify(toPersist, bigIntReplacer);
    } catch (err) {
      const msg =
        err instanceof Error
          ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
          : String(err);
      debugLog.error?.(
        'JSON.stringify failed in saveLocalExchangeContext:',
        msg,
      );
      return; // nothing to write
    }

    try {
      window.localStorage.setItem(EXCHANGE_CONTEXT_LS_KEY, serialized);
    } catch (err) {
      const msg =
        err instanceof Error
          ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
          : String(err);
      debugLog.error?.(
        'localStorage.setItem failed in saveLocalExchangeContext:',
        msg,
      );
      return;
    }

    debugLog.log?.('✅ Saved ExchangeContext to localStorage', {
      EXCHANGE_CONTEXT_LS_KEY,
      tradeData: toPersist.tradeData,
      network: toPersist.network,
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
        : String(err);
    debugLog.error?.('❌ saveLocalExchangeContext failed:', msg);
    // best-effort: don’t rethrow
  }
}
