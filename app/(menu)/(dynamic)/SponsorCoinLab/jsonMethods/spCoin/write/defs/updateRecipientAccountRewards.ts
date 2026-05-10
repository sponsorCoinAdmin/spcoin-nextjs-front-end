// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/updateRecipientAccountRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'updateRecipientAccountRewards',
    params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
  }

export default methodDef;
