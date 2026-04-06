import { isAddress } from '@/lib/utils/address';

import type { spCoinAccount } from '@/lib/structure';

export function normalizeAccountAddress(value: unknown): `0x${string}` | undefined {
  const address = String(value ?? '').trim();
  if (!address || !isAddress(address)) return undefined;
  return `0x${address.slice(2).toLowerCase()}` as `0x${string}`;
}

export function toAccountDiskFolderName(value: unknown): string {
  const normalized = normalizeAccountAddress(value);
  if (!normalized) return '';
  return `0X${normalized.slice(2).toUpperCase()}`;
}

export function normalizeAccountAddressKey(value: unknown): string {
  return normalizeAccountAddress(value) ?? (value ?? '').toString().trim().toLowerCase();
}

export function getAccountAddress(
  account: unknown,
): `0x${string}` | undefined {
  const address =
    account &&
    typeof account === 'object' &&
    typeof (account as any).address === 'string'
      ? String((account as any).address).trim()
      : '';

  return normalizeAccountAddress(address);
}

export function toPersistedAccountRef(
  account: unknown,
): spCoinAccount | undefined {
  const address = getAccountAddress(account);
  return address ? ({ address } as spCoinAccount) : undefined;
}
