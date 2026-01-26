// lib/utils/isWalletAccount.ts
import type { spCoinAccount } from '@/lib/structure';

export function isWalletAccount(obj: any): obj is spCoinAccount {
  return (
    obj &&
    typeof obj.address === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.name === 'string'
  );
}
