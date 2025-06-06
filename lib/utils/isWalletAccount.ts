// lib/utils/isWalletAccount.ts
import { WalletAccount } from '@/lib/structure';

export function isWalletAccount(obj: any): obj is WalletAccount {
  return (
    obj &&
    typeof obj.address === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.name === 'string'
  );
}
