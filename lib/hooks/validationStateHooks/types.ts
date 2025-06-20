// File: lib/hooks/validationStateHooks/types.ts

import { TokenContract, WalletAccount } from '@/lib/structure';

export type BalanceData = {
  formatted: string;
  value: bigint;
  decimals: number;
  symbol: string;
};

export type AgentAccount = WalletAccount;
export type SponsorAccount = WalletAccount;
export type ValidAddressAccount = WalletAccount | SponsorAccount | AgentAccount;
