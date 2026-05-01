import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getSponsorRecipientBoxRecipientRateTransactionSetKeysPage',
  params: [
    { label: 'Sponsor Key', placeholder: 'address sponsor', type: 'address' },
    { label: 'Recipient Key', placeholder: 'address recipient', type: 'address' },
    { label: 'Offset', placeholder: 'uint offset', type: 'uint' },
    { label: 'Limit', placeholder: 'uint limit', type: 'uint' },
  ],
};

export default methodDef;
