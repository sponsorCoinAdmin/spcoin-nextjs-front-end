// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/runPendingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'runPendingRewards',
  params: [
    { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
    { label: 'mode', placeholder: 'Update or Claim', type: 'string' },
  ],
};

export default methodDef;
