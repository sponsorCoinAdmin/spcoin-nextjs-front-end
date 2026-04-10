// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/updateAccountStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'updateAccountStakingRewards',
    params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
  }

export default methodDef;
