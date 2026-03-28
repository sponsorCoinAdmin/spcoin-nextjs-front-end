// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/depositRecipientStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'depositRecipientStakingRewards',
    params: [
      { label: 'Sponsor Account', placeholder: 'address _sponsorAccount', type: 'address' },
      { label: 'Recipient Account', placeholder: 'address _recipientAccount', type: 'address' },
      { label: 'Recipient Rate', placeholder: 'uint256 _recipientRate', type: 'uint' },
      { label: 'Amount', placeholder: 'uint256 _amount', type: 'uint' },
    ],
  }

export default methodDef;
