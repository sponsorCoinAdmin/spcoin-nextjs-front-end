// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/deleteAccountRecords.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'deleteAccountRecords',
    params: [{ label: 'Account List Keys', placeholder: 'address[] _accountListKeys (comma/newline separated)', type: 'address_array' }],
  }

export default methodDef;
