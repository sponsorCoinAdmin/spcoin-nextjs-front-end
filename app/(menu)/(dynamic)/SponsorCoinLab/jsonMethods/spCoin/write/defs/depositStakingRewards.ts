// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/depositStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'depositStakingRewards',
    params: [
      { label: 'Account Type', placeholder: 'uint256 _accountType', type: 'uint' },
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate', placeholder: 'uint256 _recipientRate', type: 'uint' },
      { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
      { label: 'Agent Rate', placeholder: 'uint256 _agentRate', type: 'uint' },
      { label: 'Amount', placeholder: 'uint256 _amount', type: 'uint' },
    ],
  }

export default methodDef;
