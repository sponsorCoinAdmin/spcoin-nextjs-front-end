// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addRecipients.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addRecipients',
    params: [
      { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
      { label: 'Recipient Account List', placeholder: 'address[] _recipientAccountList (comma/newline separated)', type: 'address_array' },
    ],
  }

export default methodDef;
