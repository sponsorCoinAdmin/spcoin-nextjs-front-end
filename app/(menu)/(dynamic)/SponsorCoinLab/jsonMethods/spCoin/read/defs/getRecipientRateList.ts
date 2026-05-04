// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getRecipientRateList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getSponsorRecipientRateKeys',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
    ],
  }

export default methodDef;
