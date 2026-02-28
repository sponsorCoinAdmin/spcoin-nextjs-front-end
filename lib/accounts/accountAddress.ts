import { isAddress } from 'viem';

import type { spCoinAccount } from '@/lib/structure';

export function normalizeAccountAddressKey(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase();
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

  return address && isAddress(address) ? (address as `0x${string}`) : undefined;
}

export function toPersistedAccountRef(
  account: unknown,
): spCoinAccount | undefined {
  const address = getAccountAddress(account);
  return address ? ({ address } as spCoinAccount) : undefined;
}
