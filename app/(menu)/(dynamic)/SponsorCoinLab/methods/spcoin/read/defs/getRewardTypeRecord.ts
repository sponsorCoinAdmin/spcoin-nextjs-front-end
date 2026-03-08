// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getRewardTypeRecord.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getRewardTypeRecord',
    params: [
      { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
      { label: 'Reward Type', placeholder: 'uint256 _rewardType', type: 'uint' },
      { label: 'Reward', placeholder: 'uint256 _reward', type: 'uint' },
    ],
  }

export default methodDef;
