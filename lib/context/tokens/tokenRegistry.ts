import type { TokenContract } from '@/lib/structure';

export const DEFAULT_TOKEN_REGISTRY_MAX_RECORDS = 128;

export type TokenRegistryRecord = TokenContract & {
  infoURL?: string;
};

type TokenRegistryEntry = {
  record: TokenRegistryRecord;
  lastTouchedAt: number;
  lastUpdatedAt: number;
  pinKeys: Set<string>;
};

export type TokenRegistry = {
  maxRecords: number;
  entries: Map<string, TokenRegistryEntry>;
};

export function normalizeTokenRegistryKey(
  chainId: unknown,
  address: unknown,
): string {
  const chain = Number(chainId ?? 0);
  const addr = (address ?? '').toString().trim().toLowerCase();
  if (!Number.isFinite(chain) || chain <= 0 || !addr) return '';
  return `${chain}:${addr}`;
}

function cloneRecord<T extends TokenRegistryRecord>(record: T): T {
  return { ...record };
}

function touchEntry(entry: TokenRegistryEntry, timestamp: number) {
  entry.lastTouchedAt = timestamp;
}

function evictIfNeeded(registry: TokenRegistry) {
  while (registry.entries.size > registry.maxRecords) {
    let oldestKey: string | undefined;
    let oldestTouchedAt = Number.POSITIVE_INFINITY;

    for (const [key, entry] of registry.entries) {
      if (entry.pinKeys.size > 0) continue;
      if (entry.lastTouchedAt >= oldestTouchedAt) continue;
      oldestTouchedAt = entry.lastTouchedAt;
      oldestKey = key;
    }

    if (!oldestKey) return;
    registry.entries.delete(oldestKey);
  }
}

export function createTokenRegistry(
  maxRecords = DEFAULT_TOKEN_REGISTRY_MAX_RECORDS,
): TokenRegistry {
  return {
    maxRecords,
    entries: new Map<string, TokenRegistryEntry>(),
  };
}

export const tokenRegistry = createTokenRegistry(
  DEFAULT_TOKEN_REGISTRY_MAX_RECORDS,
);

export function upsertTokenRegistryRecord<T extends TokenRegistryRecord>(
  registry: TokenRegistry,
  record: T,
  pinKey?: string,
): T {
  const key = normalizeTokenRegistryKey(record?.chainId, record?.address);
  if (!key) return cloneRecord(record);

  const now = Date.now();
  const existing = registry.entries.get(key);
  if (existing) {
    existing.record = cloneRecord(record);
    existing.lastUpdatedAt = now;
    touchEntry(existing, now);
    if (pinKey) existing.pinKeys.add(pinKey);
    return cloneRecord(existing.record as T);
  }

  const entry: TokenRegistryEntry = {
    record: cloneRecord(record),
    lastTouchedAt: now,
    lastUpdatedAt: now,
    pinKeys: pinKey ? new Set([pinKey]) : new Set<string>(),
  };

  registry.entries.set(key, entry);
  evictIfNeeded(registry);

  const inserted = registry.entries.get(key);
  return cloneRecord((inserted?.record ?? entry.record) as T);
}

export function getTokenRegistryRecord<T extends TokenRegistryRecord>(
  registry: TokenRegistry,
  chainId: unknown,
  address: unknown,
  pinKey?: string,
): T | undefined {
  const key = normalizeTokenRegistryKey(chainId, address);
  if (!key) return undefined;

  const entry = registry.entries.get(key);
  if (!entry) return undefined;

  touchEntry(entry, Date.now());
  if (pinKey) entry.pinKeys.add(pinKey);
  return cloneRecord(entry.record as T);
}

export function syncTokenRegistryPins(
  registry: TokenRegistry,
  pinKey: string,
  refs: readonly Array<{ chainId?: number; address?: string }>,
) {
  const normalizedKeys = new Set(
    refs
      .map((ref) => normalizeTokenRegistryKey(ref?.chainId, ref?.address))
      .filter(Boolean),
  );

  for (const [key, entry] of registry.entries) {
    if (normalizedKeys.has(key)) {
      entry.pinKeys.add(pinKey);
      touchEntry(entry, Date.now());
      continue;
    }

    entry.pinKeys.delete(pinKey);
  }

  evictIfNeeded(registry);
}
