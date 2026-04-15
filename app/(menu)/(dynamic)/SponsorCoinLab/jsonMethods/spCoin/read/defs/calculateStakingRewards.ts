// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/calculateStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'calculateStakingRewards',
  params: [
    { label: 'Staked SP Coins', placeholder: 'uint256 _stakedSPCoins', type: 'uint' },
    { label: 'Update Timestamp', placeholder: 'Select date', type: 'date' },
    { label: 'Transaction Timestamp', placeholder: 'Select date', type: 'date' },
    { label: 'Rate', placeholder: 'uint256 _rate', type: 'uint' },
  ],
};

export default methodDef;
