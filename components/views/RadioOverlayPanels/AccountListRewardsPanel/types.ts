// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel

import type { spCoinAccount } from '@/lib/structure';
import type { SP_COIN_DISPLAY, AccountType } from '@/lib/structure';

export type REWARDS_LIST_MODE =
  | SP_COIN_DISPLAY.AGENTS
  | SP_COIN_DISPLAY.RECIPIENTS
  | SP_COIN_DISPLAY.SPONSORS
  | SP_COIN_DISPLAY.UNSPONSOR_SP_COINS;

export type Props = {
  accountList: spCoinAccount[];
  setAccountCallBack: (wallet?: spCoinAccount) => void;

  /** REQUIRED: selector panel container type */
  containerType: SP_COIN_DISPLAY;

  /** SSOT: determines which actions/columns this list should show */
  listType: REWARDS_LIST_MODE;
};

export type PendingClaim = {
  type: AccountType;
  accountId: number;
  label?: string;
};

export type SubRowKey = 'staked' | 'sponsor' | 'recipient' | 'agent';
export type SubRowOpenState = Partial<Record<SubRowKey, boolean>> & { all?: boolean };
export type OpenByWalletKey = Record<string, SubRowOpenState>;
