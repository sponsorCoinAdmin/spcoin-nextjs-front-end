// File: @/lib/hooks/inputValidations/types/validationTypes.ts

import type { TokenContract, spCoinAccount } from '@/lib/structure';

export type AgentAccount = spCoinAccount;
export type SponsorAccount = spCoinAccount;
export type ValidAddressAccount = spCoinAccount | SponsorAccount | AgentAccount;
export type ValidatedAsset = TokenContract | ValidAddressAccount;

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}
