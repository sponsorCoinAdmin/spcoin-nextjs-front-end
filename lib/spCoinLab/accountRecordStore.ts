import { useSyncExternalStore } from 'react';

interface AccountRecordEntry {
  value: unknown;
  updatedAt: number;
  dirty?: boolean;
  refreshing?: boolean;
  reason?: string;
  error?: string;
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
