import { useSyncExternalStore } from 'react';

interface AccountRecordEntry {
  value: unknown;
  updatedAt: number;
  dirty?: boolean;
  refreshing?: boolean;
  reason?: string;
  error?: string;
}

export interface AccountRecordMirrorResult {
  accountKey: string;
  changedFields: string[];
  mismatchedFields: string[];
  storeBefore: Record<string, string>;
  storeAfter: Record<string, string>;
  treeAfter: Record<string, string>;
}

const accountRecordStore = new Map<string, AccountRecordEntry>();
const listenersByAccount = new Map<string, Set<() => void>>();

export function normalizeAccountRecordKey(accountKey: unknown): string {
  if (accountKey == null) return '';
  if (typeof accountKey === 'string') return accountKey.trim().toLowerCase();
  if (typeof accountKey === 'number' || typeof accountKey === 'bigint' || typeof accountKey === 'boolean') {
    return String(accountKey).trim().toLowerCase();
  }
  return '';
}

function emitAccountRecord(accountKey: string) {
  listenersByAccount.get(accountKey)?.forEach((listener) => listener());
}

export function getSpCoinLabAccountRecord(accountKey: unknown): unknown | undefined {
  return accountRecordStore.get(normalizeAccountRecordKey(accountKey))?.value;
}

export function getSpCoinLabAccountRecordState(accountKey: unknown): AccountRecordEntry | undefined {
  const entry = accountRecordStore.get(normalizeAccountRecordKey(accountKey));
  return entry ? { ...entry } : undefined;
}

export function setSpCoinLabAccountRecord(accountKey: unknown, value: unknown): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  accountRecordStore.set(normalizedAccount, { value, updatedAt: Date.now(), dirty: false, refreshing: false });
  emitAccountRecord(normalizedAccount);
}

function readRecordValue(value: unknown, path: string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function toSummaryString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return '';
}

function summarizeAccountRecord(value: unknown): Record<string, string> {
  const totalSpCoinsValue = readRecordValue(value, ['totalSpCoins']);
  const totalSpCoins =
    totalSpCoinsValue && typeof totalSpCoinsValue === 'object' && !Array.isArray(totalSpCoinsValue)
      ? readRecordValue(totalSpCoinsValue, ['totalSpCoins'])
      : totalSpCoinsValue;
  return {
    role: toSummaryString(readRecordValue(value, ['role'])),
    rewardsEarned: toSummaryString(readRecordValue(value, ['rewardsEarned'])),
    totalSpCoins: toSummaryString(totalSpCoins),
    balanceOf: toSummaryString(readRecordValue(value, ['totalSpCoins', 'balanceOf'])),
    stakedBalance: toSummaryString(readRecordValue(value, ['totalSpCoins', 'stakedBalance'])),
    pendingRewards: toSummaryString(readRecordValue(value, ['totalSpCoins', 'pendingRewards', 'pendingRewards'])),
  };
}

export function mirrorSpCoinLabAccountRecord(accountKey: unknown, value: unknown): AccountRecordMirrorResult | null {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return null;
  const previous = getSpCoinLabAccountRecord(normalizedAccount);
  const storeBefore = summarizeAccountRecord(previous);
  const treeAfter = summarizeAccountRecord(value);
  const changedFields = Object.keys(treeAfter).filter((key) => storeBefore[key] !== treeAfter[key]);
  setSpCoinLabAccountRecord(normalizedAccount, value);
  const storeAfter = summarizeAccountRecord(getSpCoinLabAccountRecord(normalizedAccount));
  const mismatchedFields = Object.keys(treeAfter).filter((key) => storeAfter[key] !== treeAfter[key]);
  return {
    accountKey: normalizedAccount,
    changedFields,
    mismatchedFields,
    storeBefore,
    storeAfter,
    treeAfter,
  };
}

export function formatSpCoinLabAccountRecordMirrorTrace(
  source: string,
  accountKey: unknown,
  mirrorResult: AccountRecordMirrorResult | null,
  storeRecord: unknown | undefined,
): string {
  const storeSynced = storeRecord === undefined ? '0' : '1';
  const storeMissing = storeRecord === undefined ? '1' : '0';
  if (!mirrorResult) {
    return `[ACCOUNT_RECORD_STORE_TRACE] mirror source=${source} mirrored=0 compare=missing matched=0 mismatched=0 storeSynced=${storeSynced} storeMissing=${storeMissing} account=${normalizeAccountRecordKey(accountKey)} changed=none mismatchFields=none`;
  }
  const matches = mirrorResult.mismatchedFields.length === 0;
  return `[ACCOUNT_RECORD_STORE_TRACE] mirror source=${source} mirrored=1 compare=${matches ? 'match' : 'mismatch'} matched=${matches ? '1' : '0'} mismatched=${matches ? '0' : '1'} storeSynced=${storeSynced} storeMissing=${storeMissing} account=${mirrorResult.accountKey} changed=${mirrorResult.changedFields.join(',') || 'none'} mismatchFields=${mirrorResult.mismatchedFields.join(',') || 'none'}`;
}

export function markSpCoinLabAccountRecordDirty(accountKey: unknown, reason?: string): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  const current = accountRecordStore.get(normalizedAccount);
  accountRecordStore.set(normalizedAccount, {
    value: current?.value,
    updatedAt: current?.updatedAt ?? 0,
    dirty: true,
    refreshing: current?.refreshing ?? false,
    reason,
  });
  emitAccountRecord(normalizedAccount);
}

export function markSpCoinLabAccountRecordRefreshing(accountKey: unknown, refreshing: boolean, reason?: string): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  const current = accountRecordStore.get(normalizedAccount);
  accountRecordStore.set(normalizedAccount, {
    value: current?.value,
    updatedAt: current?.updatedAt ?? 0,
    dirty: current?.dirty ?? false,
    refreshing,
    reason: reason ?? current?.reason,
  });
  emitAccountRecord(normalizedAccount);
}

export function markSpCoinLabAccountRecordRefreshFailed(accountKey: unknown, error: unknown, reason?: string): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  const current = accountRecordStore.get(normalizedAccount);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unable to refresh account record.';
  accountRecordStore.set(normalizedAccount, {
    value: current?.value,
    updatedAt: current?.updatedAt ?? 0,
    dirty: true,
    refreshing: false,
    reason: reason ?? current?.reason,
    error: message,
  });
  emitAccountRecord(normalizedAccount);
}

export function notifySpCoinLabAccountRecordsChanged(accounts: Iterable<unknown>, reason?: string): string[] {
  const normalizedAccounts = Array.from(
    new Set(
      Array.from(accounts)
        .map((accountKey) => normalizeAccountRecordKey(accountKey))
        .filter(Boolean),
    ),
  );
  for (const accountKey of normalizedAccounts) {
    markSpCoinLabAccountRecordDirty(accountKey, reason);
  }
  return normalizedAccounts;
}

export function invalidateSpCoinLabAccountRecord(accountKey: unknown): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  accountRecordStore.delete(normalizedAccount);
  emitAccountRecord(normalizedAccount);
}

export function subscribeSpCoinLabAccountRecord(
  accountKey: unknown,
  listener: () => void,
): () => void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return () => undefined;
  if (!listenersByAccount.has(normalizedAccount)) {
    listenersByAccount.set(normalizedAccount, new Set());
  }
  const listeners = listenersByAccount.get(normalizedAccount);
  listeners?.add(listener);
  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) listenersByAccount.delete(normalizedAccount);
  };
}

export function useSpCoinLabAccountRecord<T = unknown>(accountKey: unknown): T | undefined {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  return useSyncExternalStore(
    (listener) => subscribeSpCoinLabAccountRecord(normalizedAccount, listener),
    () => getSpCoinLabAccountRecord(normalizedAccount) as T | undefined,
    () => getSpCoinLabAccountRecord(normalizedAccount) as T | undefined,
  );
}

export function useSpCoinLabAccountRecordSelector<T>(
  accountKey: unknown,
  selector: (record: unknown) => T,
): T {
  const record = useSpCoinLabAccountRecord(accountKey);
  return selector(record);
}
