// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getRecipientRateAgentList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getRecipientRateAgentList',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
    ],
  }

export default methodDef;
