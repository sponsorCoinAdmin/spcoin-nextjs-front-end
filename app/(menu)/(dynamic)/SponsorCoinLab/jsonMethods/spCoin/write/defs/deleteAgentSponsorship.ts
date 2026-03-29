// File: app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/deleteAgentSponsorship.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'deleteAgentSponsorship',
  params: [
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
    { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
    { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
    { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
  ],
};

export default methodDef;
