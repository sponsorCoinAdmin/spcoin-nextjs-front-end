import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getSponsorRecipientRateTransactionIdKeys',
  params: [
    { label: 'Sponsor Key', placeholder: 'address sponsorKey', type: 'address' },
    { label: 'Recipient Key', placeholder: 'address recipientKey', type: 'address' },
    { label: 'Recipient Rate Key', placeholder: 'uint256 recipientRateKey', type: 'uint' },
  ],
};

export default methodDef;
