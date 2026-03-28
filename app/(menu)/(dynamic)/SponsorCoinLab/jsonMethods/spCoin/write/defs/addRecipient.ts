// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addRecipient.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'addRecipient',
    params: [{ label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' }],
  }

export default methodDef;
