// File: lib/context/initExchangeContext.ts
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from './loadLocalExchangeContext';
import type { WalletAccount, ExchangeContext } from '@/lib/structure';
import { STATUS, SP_COIN_DISPLAY as SP } from '@/lib/structure';

import type { Address } from 'viem';
import { isAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getJson } from '@/lib/rest/http'; // ← REST helper

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const SEED_DEBUG =
  (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_SEED ?? 'false').toLowerCase() === 'true';

const debugLog = createDebugLogger('initExchangeContext', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/**
 * NOTE (contract with ExchangeProvider):
 * - Hydrates ExchangeContext from localStorage (if present) and sanitizes it for the given chainId.
 * - May enrich `accounts.connectedAccount` with metadata for a connected wallet.
 * - Does NOT create or mutate any panel state (`settings.spCoinPanelTree`, etc.). Panel state is owned by the Provider.
 */
export async function initExchangeContext(
  chainId: number,
  isConnected: boolean,
  address?: `0x${string}`
): Promise<ExchangeContext> {
  const effectiveChainId = typeof chainId === 'number' && chainId > 0 ? chainId : 1;

  // 1) Load & sanitize stored context
  debugLog.log('🔍 Loading stored ExchangeContext…');
  const stored = loadLocalExchangeContext();

  // Seed/boot diagnostics (read-only; we do NOT mutate panel state here)
  if (SEED_DEBUG) {
    logStoredBootState(stored);
  }

  debugLog.log(`🔗 Stored network.chainId = ${stored?.network?.chainId}`);

  const sanitized = sanitizeExchangeContext(stored, effectiveChainId);

  debugLog.log(`🧪 sanitizeExchangeContext → network.chainId = ${sanitized.network?.chainId}`);
  debugLog.log(`📥 Final network.chainId before hydration: ${sanitized.network?.chainId}`);

  // Inspect any panels already present post-sanitize (for visibility debugging only)
  if (SEED_DEBUG) {
    logPanelSnapshot('post-sanitize', getPanelsArray(sanitized));
  }

  // 2) Optionally enrich with wallet metadata (client-only; no panel changes)
  if (isConnected && address && isProbablyClient() && isAddress(address)) {
    try {
      const meta = await loadWalletMetadata(address);
      sanitized.accounts.connectedAccount = meta;
    } catch (err) {
      debugLog.error('⛔ Wallet metadata load failed; falling back.', err);
      sanitized.accounts.connectedAccount = makeWalletFallback(
        address,
        STATUS.MESSAGE_ERROR,
        `Account ${address} metadata could not be loaded`
      );
    }
  }

  return sanitized;
}

/* ────────────────────────────── helpers ────────────────────────────── */

function isProbablyClient() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function toBigIntSafe(value: unknown): bigint {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
    if (typeof value === 'string') {
      // Accept decimal or hex strings
      const trimmed = value.trim();
      if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return BigInt(trimmed);
      if (/^-?\d+$/.test(trimmed)) return BigInt(trimmed);
    }
  } catch {
    /* ignore */
  }
  return 0n;
}

function makeWalletFallback(addr: Address, status: STATUS, description: string): WalletAccount {
  return {
    address: addr,
    type: 'ERC20_WALLET',
    name: '',
    symbol: '',
    website: '',
    status,
    description,
    logoURL: '/assets/miscellaneous/SkullAndBones.png',
    balance: 0n,
  };
}

type WalletJson = Partial<WalletAccount> & { balance?: string | number | bigint };

/** RESTful metadata loader (no plain). */
async function loadWalletMetadata(addr: Address): Promise<WalletAccount> {
  const url = `/assets/accounts/${addr}/wallet.json`;

  let json: WalletJson | undefined;
  try {
    json = await getJson<WalletJson>(url, {
      timeoutMs: 6000,
      retries: 1,
      accept: 'application/json',
      init: { cache: 'no-store' },
    });
  } catch {
    return makeWalletFallback(addr, STATUS.MESSAGE_ERROR, `Account ${addr} not registered on this site`);
  }

  const balance = toBigIntSafe(json?.balance);

  return {
    address: addr,
    type: json?.type ?? 'ERC20_WALLET',
    name: json?.name ?? '',
    symbol: json?.symbol ?? '',
    website: json?.website ?? '',
    status: STATUS.INFO,
    description: json?.description ?? '',
    logoURL: json?.logoURL ?? '/assets/miscellaneous/SkullAndBones.png',
    balance,
  };
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
  const hasStored = !!stored;
  const panels = getPanelsArray(stored);
  console.groupCollapsed('%cseed:initExchangeContext(stored)', 'color:#89b4fa;font-weight:bold;');
  console.log('hasStored?', hasStored);
  if (!hasStored) {
    console.log('ℹ️ No stored ExchangeContext found. Expect the Provider to seed defaultPanelTree on mount.');
  }
  if (panels) {
    logPanelSnapshot('stored', panels);
  } else {
    console.log('stored.panels = <none>');
  }
  console.groupEnd();
}

// Pretty-print + quick checks that catch your “missing widgets / extra transient panel” issue
function logPanelSnapshot(label: string, panels?: FlatPanel[]) {
  console.groupCollapsed(`%cseed:panels(${label})`, 'color:#a6e3a1;font-weight:bold;');
  if (!panels) {
    console.log('panels = <undefined>');
    console.groupEnd();
    return;
  }

  try {
    console.table(
      panels.map((p) => ({
        panel: p.panel,
        name: p.name,
        visible: p.visible,
      }))
    );
  } catch {
    console.log('panels(raw):', panels);
  }

  const byId = new Map<number, FlatPanel>();
  for (const p of panels) byId.set(p.panel, p);

  const mustIncludeOnBoot: Array<[number, boolean]> = [
    [SP.MAIN_TRADING_PANEL, true],
    [SP.TRADE_CONTAINER_HEADER, true],
    [SP.TRADING_STATION_PANEL, true],
    [SP.SELL_SELECT_PANEL, true],
    [SP.BUY_SELECT_PANEL, true],
    [SP.SWAP_ARROW_BUTTON, true],
    [SP.PRICE_BUTTON, true],
    [SP.FEE_DISCLOSURE, true],
  ];

  const neverPersist: number[] = [SP.SPONSOR_LIST_SELECT_PANEL];

  const missing = mustIncludeOnBoot.filter(([id]) => !byId.has(id)).map(([id]) => id);
  const wrongVisibility = mustIncludeOnBoot
    .filter(([id, vis]) => byId.has(id) && !!byId.get(id)!.visible !== vis)
    .map(([id, vis]) => ({ id, expected: vis, got: !!byId.get(id)!.visible }));

  const accidentallyIncluded = neverPersist.filter((id) => byId.has(id));

  console.log('%cchecks.missing', 'color:#f38ba8', missing.map((id) => SP[id] ?? id));
  console.log(
    '%cchecks.wrongVisibility',
    'color:#fab387',
    wrongVisibility.map((row) => ({ name: SP[row.id] ?? row.id, ...row }))
  );
  console.log(
    '%cchecks.accidentallyIncluded',
    'color:#f38ba8',
    accidentallyIncluded.map((id) => SP[id] ?? id)
  );

  console.groupEnd();
}
