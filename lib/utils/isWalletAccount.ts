// lib/utils/isWalletAccount.ts
import type { spCoinAccount } from '@/lib/structure';

export function isWalletAccount(obj: unknown): obj is spCoinAccount {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as {
    address?: unknown;
    symbol?: unknown;
    name?: unknown;
  };
  return (
    typeof candidate.address === 'string' &&
    typeof candidate.symbol === 'string' &&
    typeof candidate.name === 'string'
  );
}
