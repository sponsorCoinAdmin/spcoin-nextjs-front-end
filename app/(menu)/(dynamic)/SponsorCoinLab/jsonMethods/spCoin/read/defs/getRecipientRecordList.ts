// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getRecipientRecordList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getSponsorRecipientRecordList',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Account List', placeholder: 'address[] _recipientAccountList (comma/newline separated)', type: 'address_array' },
    ],
  }

export default methodDef;
