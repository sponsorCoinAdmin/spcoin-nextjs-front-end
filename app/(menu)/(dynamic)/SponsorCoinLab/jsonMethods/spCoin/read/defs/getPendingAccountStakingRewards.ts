// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getPendingAccountStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getPendingAccountStakingRewards',
  params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
};

export default methodDef;
