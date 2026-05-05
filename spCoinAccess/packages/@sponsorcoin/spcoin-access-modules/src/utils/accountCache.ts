// @ts-nocheck
/**
 * Write-through account record cache for the SpCoin master account map.
 * Keyed by `contractAddress:accountKey` (both lowercased).
 * Invalidated by TransactionAdded events via the event listener.
 */

export interface CachedAccountRecord {
  data: unknown;
  cachedAt: number;
}

const cache = new Map<string, CachedAccountRecord>();

function buildKey(contractAddress: string, accountKey: string): string {
  return `${String(contractAddress || '').trim().toLowerCase()}:${String(accountKey || '').trim().toLowerCase()}`;
}

export function getCachedAccountRecord(contractAddress: string, accountKey: string): unknown | null {
  const entry = cache.get(buildKey(contractAddress, accountKey));
  return entry ? entry.data : null;
}

export function setCachedAccountRecord(contractAddress: string, accountKey: string, data: unknown): void {
  cache.set(buildKey(contractAddress, accountKey), { data, cachedAt: Date.now() });
}

export function invalidateCachedAccountRecord(contractAddress: string, accountKey: string): void {
  cache.delete(buildKey(contractAddress, accountKey));
}

export function invalidateAllForContract(contractAddress: string): void {
  const prefix = `${String(contractAddress || '').trim().toLowerCase()}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function getCacheSize(): number {
  return cache.size;
}

export function clearCache(): void {
  cache.clear();
}
