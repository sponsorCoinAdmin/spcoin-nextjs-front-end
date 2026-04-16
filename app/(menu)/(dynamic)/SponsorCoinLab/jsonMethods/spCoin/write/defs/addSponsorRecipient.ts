// File: app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/addSponsorRecipient.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addSponsorRecipient',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
    ],
  }

export default methodDef;
