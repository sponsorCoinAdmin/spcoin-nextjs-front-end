// File: lib/hooks/inputValidations/types/validationTypes.ts

import type { TokenContract, WalletAccount } from '@/lib/structure';

export type AgentAccount = WalletAccount;
export type SponsorAccount = WalletAccount;
export type ValidAddressAccount = WalletAccount | SponsorAccount | AgentAccount;
export type ValidatedAsset = TokenContract | ValidAddressAccount;

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}
