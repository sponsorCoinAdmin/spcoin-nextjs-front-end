// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getPendingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getPendingRewards',
  params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
};

export default methodDef;
