// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel

// import type { spCoinAccount } from '@/lib/structure';
import type { AccountType } from '@/lib/structure';

export type PendingClaim = {
  type: AccountType;
  accountId: number;
  label?: string;
};

export type SubRowKey = 'staked' | 'sponsor' | 'recipient' | 'agent';
export type SubRowOpenState = Partial<Record<SubRowKey, boolean>> & { all?: boolean };
export type OpenByWalletKey = Record<string, SubRowOpenState>;
