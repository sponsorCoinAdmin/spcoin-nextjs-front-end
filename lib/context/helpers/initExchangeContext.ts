// File: lib/context/helpers/initExchangeContext.ts

import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { loadLocalExchangeContext } from './loadLocalExchangeContext';
import { WalletAccount, ExchangeContext, STATUS } from '@/lib/structure';
import { Address, isAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('initExchangeContext', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/**
 * NOTE (contract with ExchangeProvider):
 * - Hydrates ExchangeContext from localStorage (if present) and sanitizes it for the given chainId.
 * - May enrich `accounts.connectedAccount` with metadata for a connected wallet.
 * - Does NOT create or mutate any panel state (`settings.mainPanelNode`, etc.). Panel state is owned by the Provider.
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
  debugLog.log(`🔗 Stored network.chainId = ${stored?.network?.chainId}`);

  const sanitized = sanitizeExchangeContext(stored, effectiveChainId);
  debugLog.log(`🧪 sanitizeExchangeContext → network.chainId = ${sanitized.network?.chainId}`);
  debugLog.log(`📥 Final network.chainId before hydration: ${sanitized.network?.chainId}`);

  // 2) Optionally enrich with wallet metadata (client-only; no panel changes)
  if (isConnected && address && isProbablyClient() && isAddress(address)) {
    try {
      const meta = await loadWalletMetadata(address);
      sanitized.accounts.connectedAccount = meta;
    } catch (err) {
      debugLog.error('⛔ Wallet metadata load failed; falling back.', err);
      sanitized.accounts.connectedAccount = makeWalletFallback(address, STATUS.MESSAGE_ERROR, `Account ${address} metadata could not be loaded`);
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

async function loadWalletMetadata(addr: Address): Promise<WalletAccount> {
  // Local, static metadata (don’t block the app if it fails)
  const res = await fetch(`/assets/accounts/${addr}/wallet.json`).catch(() => undefined);
  if (!res || !res.ok) {
    return makeWalletFallback(addr, STATUS.MESSAGE_ERROR, `Account ${addr} not registered on this site`);
  }

  let json: Partial<WalletAccount> & { balance?: string | number | bigint } = {};
  try {
    json = (await res.json()) ?? {};
  } catch {
    // non-JSON / parse error → fallback
    return makeWalletFallback(addr, STATUS.MESSAGE_ERROR, `Account ${addr} metadata could not be parsed`);
  }

  const balance = toBigIntSafe(json.balance);

  return {
    address: addr,
    type: json.type ?? 'ERC20_WALLET',
    name: json.name ?? '',
    symbol: json.symbol ?? '',
    website: json.website ?? '',
    status: STATUS.INFO,
    description: json.description ?? '',
    logoURL: json.logoURL ?? '/assets/miscellaneous/SkullAndBones.png',
    balance,
  };
}
