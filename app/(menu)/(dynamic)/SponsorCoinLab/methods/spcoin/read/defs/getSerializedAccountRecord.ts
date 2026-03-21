// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getSerializedAccountRecord.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getSerializedAccountRecord (legacy compat)',
    params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
  }

export default methodDef;
