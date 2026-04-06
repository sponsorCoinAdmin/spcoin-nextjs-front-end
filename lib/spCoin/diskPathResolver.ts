import { isAddress } from '@/lib/utils/address';
import chainIdMapRaw from '@/resources/data/networks/chainIdMap.json';

type PositiveIntMap = Record<number, number>;

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeMap(input: unknown): PositiveIntMap {
  const out: PositiveIntMap = {};
  if (!input || typeof input !== 'object') return out;

  for (const [keyRaw, valueRaw] of Object.entries(input as Record<string, unknown>)) {
    const key = toPositiveInt(keyRaw);
    const value = toPositiveInt(valueRaw);
    if (!key || !value) continue;
    out[key] = value;
  }

  return out;
}

const DISK_CHAIN_MAP = normalizeMap((chainIdMapRaw as { assetMap?: unknown })?.assetMap);

export function resolveSpCoinDiskChainId(chainId: unknown): number {
  const id = toPositiveInt(chainId);
  if (!id) return Number(chainId) || 0;
  return DISK_CHAIN_MAP[id] || id;
}

export function normalizeDiskAddress(value: unknown): `0x${string}` | undefined {
  const address = String(value ?? '').trim();
  if (!address || !isAddress(address)) return undefined;
  return `0x${address.slice(2).toLowerCase()}` as `0x${string}`;
}

export function toDiskAddressFolderName(value: unknown): string {
  const normalized = normalizeDiskAddress(value);
  if (!normalized) return '';
  return `0X${normalized.slice(2).toUpperCase()}`;
}

export function getDiskAccountsPublicRoot(address: unknown): string {
  const folder = toDiskAddressFolderName(address);
  return folder ? `/assets/accounts/${folder}` : '';
}

export function getDiskBlockchainsPublicRoot(chainId: unknown): string {
  const resolvedChainId = resolveSpCoinDiskChainId(chainId);
  if (!resolvedChainId) return '';
  return `/assets/blockchains/${resolvedChainId}`;
}

export function getDiskContractsPublicRoot(chainId: unknown, address: unknown): string {
  const root = getDiskBlockchainsPublicRoot(chainId);
  const folder = toDiskAddressFolderName(address);
  if (!root || !folder) return '';
  return `${root}/contracts/${folder}`;
}
