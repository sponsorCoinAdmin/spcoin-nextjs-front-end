import { STATUS, type spCoinAccount } from '@/lib/structure';
import type { SpCoinWalletAccount } from './types';

export function buildSpCoinAccount(
  account: SpCoinWalletAccount | spCoinAccount,
  fallbackName = 'Unnamed account',
): spCoinAccount {
  return {
    name: String((account as any).name || (account as any).label || fallbackName).trim(),
    symbol: String((account as any).symbol || '').trim(),
    type: 'account',
    website: String((account as any).website || '').trim(),
    description: String((account as any).description || '').trim(),
    status: STATUS.INFO,
    address: account.address as spCoinAccount['address'],
    ...((account as any).email ? { email: String((account as any).email).trim() } : {}),
    ...((account as any).logoURL ? { logoURL: (account as any).logoURL } : {}),
    balance: 0n,
  };
}
