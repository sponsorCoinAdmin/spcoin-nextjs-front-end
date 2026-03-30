// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addAgent.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addAgent',
    params: [
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
      { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
    ],
    executable: false,
  }

export default methodDef;
