// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getSerializedRecipientRecordList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getSerializedRecipientRecordList (legacy compat)',
  params: [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
  ],
};

export default methodDef;
