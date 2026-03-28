// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/unSponsorRecipient.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'unSponsorRecipient',
    params: [{ label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' }],
  }

export default methodDef;
