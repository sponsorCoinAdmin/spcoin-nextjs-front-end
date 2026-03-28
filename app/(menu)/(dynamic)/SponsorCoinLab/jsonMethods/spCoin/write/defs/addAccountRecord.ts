// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addAccountRecord.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addAccountRecord',
    params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
  }

export default methodDef;
