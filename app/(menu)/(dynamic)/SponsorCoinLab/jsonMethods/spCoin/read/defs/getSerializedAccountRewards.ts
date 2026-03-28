// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getSerializedAccountRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getSerializedAccountRewards (legacy compat)',
    params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
  }

export default methodDef;
