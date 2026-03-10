// File: lib/utils/network/chainIdMap.ts

import chainIdMapRaw from '@/resources/data/networks/chainIdMap.json';

type ChainIdMapFile = {
  assetMap?: Record<string, number | string>;
  reverseMap?: Record<string, number | string>;
};

const parsedMap = chainIdMapRaw as ChainIdMapFile;

function toPositiveInt(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function normalizeMap(
  input: Record<string, number | string> | undefined,
): Record<number, number> {
  const out: Record<number, number> = {};
  if (!input || typeof input !== 'object') return out;
  for (const [k, v] of Object.entries(input)) {
    const key = toPositiveInt(k);
    const val = toPositiveInt(v);
    if (!key || !val) continue;
    out[key] = val;
  }
  return out;
}

const ASSET_MAP = normalizeMap(parsedMap.assetMap);
const REVERSE_MAP_EXPLICIT = normalizeMap(parsedMap.reverseMap);

const REVERSE_MAP_DERIVED: Record<number, number> = Object.entries(ASSET_MAP).reduce(
  (acc, [fromRaw, toRaw]) => {
    const from = toPositiveInt(fromRaw);
    const to = toPositiveInt(toRaw);
    if (!from || !to) return acc;
    if (!acc[to]) acc[to] = from;
    return acc;
  },
  {} as Record<number, number>,
);

const REVERSE_MAP: Record<number, number> = {
  ...REVERSE_MAP_DERIVED,
  ...REVERSE_MAP_EXPLICIT,
};

export function toMappedChainId(chainId: number): number {
  const id = toPositiveInt(chainId);
  if (!id) return Number(chainId) || 0;
  return ASSET_MAP[id] ?? id;
}

export function toOriginalChainId(chainId: number): number {
  const id = toPositiveInt(chainId);
  if (!id) return Number(chainId) || 0;
  return REVERSE_MAP[id] ?? id;
}

export function isMappedChainId(chainId: number): boolean {
  const id = toPositiveInt(chainId);
  if (!id) return false;
  return toMappedChainId(id) !== id;
}

export function getChainIdAssetMap(): Record<number, number> {
  return { ...ASSET_MAP };
}

