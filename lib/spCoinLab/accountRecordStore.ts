import { useSyncExternalStore } from 'react';

type AccountRecordListener = () => void;

type AccountRecordEntry = {
  value: unknown;
  updatedAt: number;
};

const accountRecordStore = new Map<string, AccountRecordEntry>();
const listenersByAccount = new Map<string, Set<AccountRecordListener>>();

export function normalizeAccountRecordKey(accountKey: unknown): string {
  return String(accountKey ?? '').trim().toLowerCase();
}

function emitAccountRecord(accountKey: string) {
  listenersByAccount.get(accountKey)?.forEach((listener) => listener());
}

export function getSpCoinLabAccountRecord(accountKey: unknown): unknown | undefined {
  return accountRecordStore.get(normalizeAccountRecordKey(accountKey))?.value;
}

export function setSpCoinLabAccountRecord(accountKey: unknown, value: unknown): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  accountRecordStore.set(normalizedAccount, { value, updatedAt: Date.now() });
  emitAccountRecord(normalizedAccount);
}

export function invalidateSpCoinLabAccountRecord(accountKey: unknown): void {
  const normalizedAccount = normalizeAccountRecordKey(accountKey);
  if (!normalizedAccount) return;
  accountRecordStore.delete(normalizedAccount);
  emitAccountRecord(normalizedAccount);
}

export function subscribeSpCoinLabAccountRecord(
  accountKey: unknown,
  listener: AccountRecordListener,
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
