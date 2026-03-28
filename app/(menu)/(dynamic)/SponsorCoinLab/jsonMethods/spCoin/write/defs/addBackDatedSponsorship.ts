// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addBackDatedSponsorship.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addBackDatedSponsorship',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
      { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
      { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
      { label: 'Whole Amount', placeholder: 'string _strWholeAmount', type: 'string' },
      { label: 'Decimal Amount', placeholder: 'string _strDecimalAmount', type: 'string' },
      { label: 'Transaction Back Date', placeholder: 'Select date', type: 'date' },
    ],
  }

export default methodDef;
