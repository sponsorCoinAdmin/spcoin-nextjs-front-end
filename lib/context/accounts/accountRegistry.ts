import type { spCoinAccount } from '@/lib/structure';

export const DEFAULT_ACCOUNT_REGISTRY_MAX_RECORDS = 64;

export type AccountRegistryRecord = spCoinAccount & {
  email?: string;
  emailAddress?: string;
  contactEmail?: string;
};

type AccountRegistryEntry = {
  record: AccountRegistryRecord;
  lastTouchedAt: number;
  lastUpdatedAt: number;
  pinKeys: Set<string>;
};

export type AccountRegistry = {
  maxRecords: number;
  entries: Map<string, AccountRegistryEntry>;
};

export function normalizeAccountRegistryAddress(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase();
}

function cloneRecord<T extends AccountRegistryRecord>(record: T): T {
  return { ...record };
}

function touchEntry(entry: AccountRegistryEntry, timestamp: number) {
  entry.lastTouchedAt = timestamp;
}

function evictIfNeeded(registry: AccountRegistry) {
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

export function createAccountRegistry(
  maxRecords = DEFAULT_ACCOUNT_REGISTRY_MAX_RECORDS,
): AccountRegistry {
  return {
    maxRecords,
    entries: new Map<string, AccountRegistryEntry>(),
  };
}

export const accountRegistry = createAccountRegistry(
  DEFAULT_ACCOUNT_REGISTRY_MAX_RECORDS,
);

export function upsertAccountRegistryRecord<T extends AccountRegistryRecord>(
  registry: AccountRegistry,
  record: T,
  pinKey?: string,
): T {
  const key = normalizeAccountRegistryAddress(record?.address);
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

  const entry: AccountRegistryEntry = {
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

export function getAccountRegistryRecord<T extends AccountRegistryRecord>(
  registry: AccountRegistry,
  address: unknown,
  pinKey?: string,
): T | undefined {
  const key = normalizeAccountRegistryAddress(address);
  if (!key) return undefined;

  const entry = registry.entries.get(key);
  if (!entry) return undefined;

  touchEntry(entry, Date.now());
  if (pinKey) entry.pinKeys.add(pinKey);
  return cloneRecord(entry.record as T);
}

export function syncAccountRegistryPins(
  registry: AccountRegistry,
  pinKey: string,
  addresses: readonly string[],
) {
  const normalizedAddresses = new Set(
    addresses
      .map((address) => normalizeAccountRegistryAddress(address))
      .filter(Boolean),
  );

  for (const [key, entry] of registry.entries) {
    if (normalizedAddresses.has(key)) {
      entry.pinKeys.add(pinKey);
      touchEntry(entry, Date.now());
      continue;
    }

    entry.pinKeys.delete(pinKey);
  }

  evictIfNeeded(registry);
}
