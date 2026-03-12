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

const ASSET_MAP = normalizeMap((chainIdMapRaw as { assetMap?: unknown })?.assetMap);

export const HH_FORK_CHAIN_ID = ASSET_MAP[31337]
  ? 31337
  : Number(Object.keys(ASSET_MAP)[0]) || 31337;

export const HH_FORK_TOKEN_ASSET_CHAIN_ID = ASSET_MAP[HH_FORK_CHAIN_ID] || HH_FORK_CHAIN_ID;

export function resolveHHForkTokenAssetChainId(chainId: unknown): number {
  const id = toPositiveInt(chainId);
  if (!id) return Number(chainId) || 0;
  return ASSET_MAP[id] || id;
}
