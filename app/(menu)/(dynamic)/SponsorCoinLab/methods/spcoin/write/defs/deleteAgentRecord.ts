// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/deleteAgentRecord.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'deleteAgentRecord',
    executable: false,
    params: [
      { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
      { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
      { label: 'Account Agent Key', placeholder: 'address _accountAgentKey', type: 'address' },
    ],
  }

export default methodDef;
