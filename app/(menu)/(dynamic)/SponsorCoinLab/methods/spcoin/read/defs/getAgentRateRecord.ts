// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAgentRateRecord.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getAgentRateRecord',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
      { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
      { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
    ],
  }

export default methodDef;
