// File: @/lib/context/init/initExchangeContext.ts
import { sanitizeExchangeContext } from '../helpers/ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from '../helpers/loadLocalExchangeContext';
import {
  getAccountAddress,
  normalizeAccountAddressKey,
} from '@/lib/accounts/accountAddress';
import { rehydrateAccountRefs } from '@/lib/accounts/accountProjection';
import type { ExchangeContext, spCoinAccount } from '@/lib/structure';
import { STATUS, SP_COIN_DISPLAY as SP } from '@/lib/structure';

import { isAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ✅ SSOT account hydration (account.json + logo derivation)
import {
  hydrateAccountFromAddress,
  makeAccountFallback,
} from '@/lib/context/helpers/accountHydration';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const SEED_DEBUG =
  (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_SEED ?? 'false').toLowerCase() ===
  'true';

const debugLog = createDebugLogger(
  'initExchangeContext',
  DEBUG_ENABLED,
  LOG_TIME,
  LOG_LEVEL,
);

/**
 * NOTE (contract with ExchangeProvider):
 * - Hydrates ExchangeContext from localStorage (if present) and sanitizes it for the given chainId.
 * - May enrich `accounts.activeAccount` with metadata for a wallet address (via SSOT helper).
 * - Does NOT create or mutate any panel state (`settings.spCoinPanelTree`, etc.). Panel state is owned by the Provider.
 */
export async function initExchangeContext(
  chainId: number,
  isConnected: boolean,
  address?: `0x${string}`,
): Promise<ExchangeContext> {
  // 1) Load stored context (if any)
  debugLog.log?.('🔍 Loading stored ExchangeContext…');

  const stored = loadLocalExchangeContext();
  debugLog.log?.('[initExchangeContext] stored snapshot', stored);

  // Seed/boot diagnostics (read-only; we do NOT mutate panel state here)
  if (SEED_DEBUG) {
    logStoredBootState(stored);
  }

  // ────────────────────────────────────────────────────────────────
  // Network hydrate: LS vs wallet vs default
  // ────────────────────────────────────────────────────────────────

  // In case of historical refactors, try both top-level `network` and `settings.network`.
  const storedNetwork: any =
    (stored as any)?.network ?? (stored as any)?.settings?.network ?? null;

  // Extra debug so we can see where it actually lives in real data
  debugLog.log?.(
    '[initExchangeContext] raw stored.network',
    (stored as any)?.network,
  );
  debugLog.log?.(
    '[initExchangeContext] raw stored.settings?.network',
    (stored as any)?.settings?.network,
  );

  const storedAppChainId =
    typeof storedNetwork?.appChainId === 'number'
      ? (storedNetwork.appChainId as number)
      : undefined;
  const storedChainId =
    typeof storedNetwork?.chainId === 'number'
      ? (storedNetwork.chainId as number)
      : undefined;

  // isLocalStorage = this boot has a usable network from LS
  const isLocalStorage =
    !!stored && (storedAppChainId !== undefined || storedChainId !== undefined);

  const walletChainId =
    typeof chainId === 'number' && chainId > 0 ? chainId : undefined;

  debugLog.log?.('[initExchangeContext] network boot inputs', {
    isLocalStorage,
    storedAppChainId: storedAppChainId ?? null,
    storedChainId: storedChainId ?? null,
    walletChainId: walletChainId ?? null,
    wagmiIsConnected: isConnected,
  });

  // Decide effectiveChainId according to the LS vs wallet rules:
  //
  //  - isLocalStorage = true  → LS is authoritative on boot (Case C/D).
  //  - isLocalStorage = false → fresh boot:
  //        • if wallet already connected → adopt wallet (Case B)
  //        • else → default to 1 (Case A provisional)
  let effectiveChainId: number;

  if (isLocalStorage) {
    // LocalStorage had a network; prefer appChainId, then chainId, then wallet, then default 1.
    effectiveChainId = storedAppChainId ?? storedChainId ?? walletChainId ?? 1;

    debugLog.log?.('📦 [initExchangeContext] Case C/D (from localStorage)', {
      effectiveChainId,
      storedAppChainId: storedAppChainId ?? null,
      storedChainId: storedChainId ?? null,
      walletChainId: walletChainId ?? null,
    });
  } else {
    // No network in LS for this boot.
    if (isConnected && walletChainId) {
      // Case B: LS empty + wallet connected → app follows wallet.
      effectiveChainId = walletChainId;
      debugLog.log?.('🌱 [initExchangeContext] Case B (fresh + wallet connected)', {
        effectiveChainId,
        walletChainId,
      });
    } else {
      // Case A: LS empty + no wallet → default to 1
      effectiveChainId = 1;
      debugLog.log?.('🌱 [initExchangeContext] Case A (fresh + no wallet)', {
        effectiveChainId,
        walletChainId: walletChainId ?? null,
        wagmiIsConnected: isConnected,
      });
    }
  }

  debugLog.log?.('📦 stored.network BEFORE sanitize', {
    isLocalStorage,
    storedAppChainId: storedAppChainId ?? null,
    storedChainId: storedChainId ?? null,
    walletChainId: walletChainId ?? null,
    effectiveChainId,
  });

  // 2) Sanitize using the effectiveChainId we chose above
  const sanitized = sanitizeExchangeContext(stored, effectiveChainId);

  debugLog.log?.('🧼 sanitized.network AFTER sanitize', {
    effectiveChainId,
    sanitizedAppChainId: sanitized.network?.appChainId,
    sanitizedChainId: sanitized.network?.chainId,
    isLocalStorage,
  });

  debugLog.log?.(
    `🧪 sanitizeExchangeContext → network.chainId = ${sanitized.network?.chainId}`,
  );
  debugLog.log?.(
    `📥 Final network.chainId before hydration: ${sanitized.network?.chainId}`,
  );

  // Inspect any panels already present post-sanitize (for visibility debugging only)
  if (SEED_DEBUG) {
    logPanelSnapshot('post-sanitize', getPanelsArray(sanitized));
  }

  // 3) Rehydrate persisted account address refs through the account registry/store.
  const addressesToHydrate = new Set<`0x${string}`>();
  const walletAddress =
    address && isAddress(address) ? (address as `0x${string}`) : undefined;

  if (walletAddress) {
    addressesToHydrate.add(walletAddress);
  } else {
    const persistedActiveAddress = getAccountAddress(sanitized.accounts.activeAccount);
    if (persistedActiveAddress) {
      addressesToHydrate.add(persistedActiveAddress);
    }
  }

  const roleAndListAccounts = [
    sanitized.accounts.sponsorAccount,
    sanitized.accounts.recipientAccount,
    sanitized.accounts.agentAccount,
    ...(Array.isArray(sanitized.accounts.sponsorAccounts)
      ? sanitized.accounts.sponsorAccounts
      : []),
    ...(Array.isArray(sanitized.accounts.recipientAccounts)
      ? sanitized.accounts.recipientAccounts
      : []),
    ...(Array.isArray(sanitized.accounts.agentAccounts)
      ? sanitized.accounts.agentAccounts
      : []),
  ];

  for (const account of roleAndListAccounts) {
    const accountAddress = getAccountAddress(account);
    if (accountAddress) addressesToHydrate.add(accountAddress);
  }

  if (addressesToHydrate.size > 0) {
    const hydratedByAddress = new Map<string, spCoinAccount>();

    await Promise.all(
      Array.from(addressesToHydrate).map(async (accountAddress) => {
        try {
          const hydrated = await hydrateAccountFromAddress(accountAddress as any, {
            fallbackStatus: STATUS.MESSAGE_ERROR,
          });
          hydratedByAddress.set(normalizeAccountAddressKey(accountAddress), hydrated);
        } catch (err) {
          debugLog.error?.(
            '[initExchangeContext] account hydration failed unexpectedly; using fallback',
            { accountAddress, err: String((err as any)?.message ?? err) },
          );
          hydratedByAddress.set(
            normalizeAccountAddressKey(accountAddress),
            makeAccountFallback(
              accountAddress as any,
              STATUS.MESSAGE_ERROR,
              `Account ${accountAddress} metadata could not be loaded`,
            ),
          );
        }
      }),
    );

    sanitized.accounts = rehydrateAccountRefs(
      sanitized.accounts,
      hydratedByAddress,
    );

    if (walletAddress) {
      sanitized.accounts.activeAccount =
        hydratedByAddress.get(normalizeAccountAddressKey(walletAddress)) ??
        sanitized.accounts.activeAccount;
    }
  }

  return sanitized;
}

/* ────────────────────────────── diagnostics (read-only) ────────────────────────────── */

type FlatPanel = { panel: number; name?: string; visible?: boolean };

// Safely pull whatever your app currently uses to hold panels.
// We *only* read for logging; we do not modify anything here.
function getPanelsArray(ctx: any): FlatPanel[] | undefined {
  // Try common locations; adjust if your context uses a different path.
  // 1) ctx.ui.panels (flat array)
  const uiPanels = ctx?.ui?.panels;
  if (Array.isArray(uiPanels)) return uiPanels as FlatPanel[];

  // 2) ctx.settings.spCoinPanelTree (already flattened by provider)
  const settingsTree = ctx?.settings?.spCoinPanelTree;
  if (Array.isArray(settingsTree)) return settingsTree as FlatPanel[];

  // 3) ctx.panels (generic)
  const directPanels = ctx?.panels;
  if (Array.isArray(directPanels)) return directPanels as FlatPanel[];

  return undefined;
}

// Called before sanitize, so we can tell cold boot vs. LS restore
function logStoredBootState(stored: any) {
  if (!SEED_DEBUG) return;

  const hasStored = !!stored;
  const panels = getPanelsArray(stored);

  debugLog.log?.('seed:initExchangeContext(stored)', {
    hasStored,
  });

  if (!hasStored) {
    debugLog.log?.(
      'ℹ️ No stored ExchangeContext found. Expect the Provider to seed defaultPanelTree on mount.',
    );
  }

  if (panels) {
    logPanelSnapshot('stored', panels);
  } else {
    debugLog.log?.('stored.panels = <none>');
  }
}

// Pretty-print + quick checks that catch your “missing widgets / extra transient panel” issue
function logPanelSnapshot(label: string, panels?: FlatPanel[]) {
  if (!SEED_DEBUG) return;

  if (!panels) {
    debugLog.log?.('seed:panels(undefined)', { label, panels: null });
    return;
  }

  try {
    debugLog.log?.(`seed:panels(${label})`, {
      panels: panels.map((p) => ({
        panel: p.panel,
        name: p.name,
        visible: p.visible,
      })),
    });
  } catch {
    debugLog.log?.(`seed:panels(${label}) raw`, { panels });
  }

  const byId = new Map<number, FlatPanel>();
  for (const p of panels) byId.set(p.panel, p);

  // NOTE: keep this list aligned with MUST_INCLUDE_ON_BOOT in defaultPanelTree.ts
  const mustIncludeOnBoot: Array<[number, boolean]> = [
    [SP.MAIN_TRADING_PANEL, true],
    [SP.TRADE_CONTAINER_HEADER, true],
    [SP.TRADING_STATION_PANEL, true],
    [SP.SELL_SELECT_PANEL, true],
    [SP.BUY_SELECT_PANEL, true],
    [SP.SWAP_ARROW_BUTTON, true],
    [SP.CONNECT_TRADE_BUTTON, true],
    [SP.FEE_DISCLOSURE, true],

    // ✅ New persisted overlays (ensure presence on legacy trees)
    [SP.ACCOUNT_PANEL, false],

    // ✅ TOKEN_PANEL is now persisted; keep it in boot checks
    [SP.TOKEN_PANEL, false],
  ];

  // Panels that should never be present in the persisted tree.
  // (Empty for now; TOKEN_PANEL is a first-class overlay.)
  const neverPersist: number[] = [];

  const missing = mustIncludeOnBoot
    .filter(([id]) => !byId.has(id))
    .map(([id]) => id);
  const wrongVisibility = mustIncludeOnBoot
    .filter(([id, vis]) => byId.has(id) && !!byId.get(id)!.visible !== vis)
    .map(([id, vis]) => ({
      id,
      expected: vis,
      got: !!byId.get(id)!.visible,
    }));

  const accidentallyIncluded = neverPersist.filter((id) => byId.has(id));

  debugLog.log?.('checks.missing', {
    label,
    missing: missing.map((id) => SP[id] ?? id),
  });

  debugLog.log?.('checks.wrongVisibility', {
    label,
    wrongVisibility: wrongVisibility.map((row) => ({
      name: SP[row.id] ?? row.id,
      ...row,
    })),
  });

  debugLog.log?.('checks.accidentallyIncluded', {
    label,
    accidentallyIncluded: accidentallyIncluded.map((id) => SP[id] ?? id),
  });
}
