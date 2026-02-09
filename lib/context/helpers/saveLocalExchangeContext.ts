'use client';

import type { ExchangeContext } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_LS_KEY } from '@/lib/context/exchangeContext/localStorageKeys';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_SAVE_HELPERS === 'true';

const debugLog = createDebugLogger('saveLocalExchangeContext', DEBUG_ENABLED, LOG_TIME);

// BigInt-safe replacer for JSON.stringify
function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Panels that should NEVER be persisted to localStorage.
 * (Typically “ephemeral” overlays / temporary list selects.)
 */
const NON_PERSISTED_PANELS = new Set<number>([
  SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
  // Add others if desired:
  // SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  // ...
]);

/**
 * Best-effort deep filter for your spCoinPanelTree.
 * We don’t assume a strict shape beyond:
 *  - objects may have a `panel` field (number/enum)
 *  - objects/arrays may have nested children
 *
 * If the tree shape differs, this still safely walks arrays/objects and
 * removes subtrees where `panel` matches NON_PERSISTED_PANELS.
 */
function filterNonPersistedPanels<T>(node: T): T {
  if (node == null) return node;

  // Arrays: filter/map children
  if (Array.isArray(node)) {
    const next = node
      .map((x) => filterNonPersistedPanels(x))
      .filter((x) => x != null) as unknown as T;
    return next;
  }

  // Primitives: keep
  if (typeof node !== 'object') return node;

  const obj = node as Record<string, any>;

  // If this node declares a panel id and it’s non-persisted: drop node
  const panelVal = obj.panel;
  if (typeof panelVal === 'number' && NON_PERSISTED_PANELS.has(panelVal)) {
    return null as unknown as T;
  }

  // Otherwise shallow-clone and recursively filter all fields
  const out: Record<string, any> = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    out[k] = filterNonPersistedPanels(obj[k]);
  }

  return out as T;
}

export function saveLocalExchangeContext(ctx: ExchangeContext): void {
  // Don’t touch localStorage on the server
  if (typeof window === 'undefined') return;

  try {
    const src: any = ctx;

    // Minimal JSON-safe snapshot — NO panel diffing, NO extra bloat.
    const rawSettings: any = src.settings ?? {};
    const safeSettings = { ...rawSettings };

    // ✅ Strip non-persisted panels out of the saved panel tree (if present)
    if (safeSettings?.spCoinPanelTree) {
      safeSettings.spCoinPanelTree = filterNonPersistedPanels(
        safeSettings.spCoinPanelTree,
      );
    }

    const toPersist = {
      network: src.network ?? {},
      tradeData: src.tradeData ?? {}, // ⬅️ full tradeData persists here
      accounts: src.accounts ?? {},
      settings: safeSettings,
    };

    let serialized: string;
    try {
      serialized = JSON.stringify(toPersist, bigIntReplacer);
    } catch (err) {
      const msg =
        err instanceof Error
          ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
          : String(err);
      debugLog.error?.('JSON.stringify failed in saveLocalExchangeContext:', msg);
      return; // bail – nothing to write
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
      // Optional: you can log visible overlay ids, etc. if you want
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
        : String(err);
    debugLog.error?.('saveLocalExchangeContext failed:', msg);
    // best-effort: don’t rethrow
  }
}
