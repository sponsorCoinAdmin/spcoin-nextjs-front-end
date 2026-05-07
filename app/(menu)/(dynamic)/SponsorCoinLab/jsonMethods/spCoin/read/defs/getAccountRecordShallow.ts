// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAccountRecordShallow.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getAccountRecordShallow',
  params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
};

export default methodDef;
