// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addSponsorship.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addSponsorship',
    params: [
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
      { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
      { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
      { label: 'Whole Amount', placeholder: 'string _strWholeAmount', type: 'string' },
      { label: 'Decimal Amount', placeholder: 'string _strDecimalAmount', type: 'string' },
    ],
  }

export default methodDef;
