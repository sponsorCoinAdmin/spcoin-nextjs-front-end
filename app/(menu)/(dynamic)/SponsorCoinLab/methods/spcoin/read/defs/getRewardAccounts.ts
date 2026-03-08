// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getRewardAccounts.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getRewardAccounts',
    params: [
      { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
      { label: 'Reward Type', placeholder: 'uint256 _rewardType', type: 'uint' },
    ],
  }

export default methodDef;
