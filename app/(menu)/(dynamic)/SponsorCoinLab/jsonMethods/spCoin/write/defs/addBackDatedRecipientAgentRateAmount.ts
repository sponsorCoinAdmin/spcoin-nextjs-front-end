// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addBackDatedRecipientAgentRateAmount.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addBackDatedRecipientAgentRateAmount',
    params: [
      { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
      { label: 'Agent Key', placeholder: 'address _accountAgentKey', type: 'address' },
      { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
      { label: 'Transaction Quantity', placeholder: 'number _transactionQty (e.g., 12.34)', type: 'string' },
      { label: 'Transaction Back Date', placeholder: 'Select date', type: 'date' },
    ],
  }

export default methodDef;
