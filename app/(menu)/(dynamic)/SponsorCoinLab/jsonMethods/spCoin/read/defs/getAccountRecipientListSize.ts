// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAccountRecipientListSize.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getAccountRecipientListSize',
    params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
  }

export default methodDef;
