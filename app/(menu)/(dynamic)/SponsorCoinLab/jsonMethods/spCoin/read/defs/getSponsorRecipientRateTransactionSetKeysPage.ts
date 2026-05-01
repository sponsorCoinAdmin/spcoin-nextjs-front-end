import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getSponsorRecipientRateTransactionSetKeysPage',
  params: [
    { label: 'Sponsor Key', placeholder: 'address sponsor', type: 'address' },
    { label: 'Offset', placeholder: 'uint offset', type: 'uint' },
    { label: 'Limit', placeholder: 'uint limit', type: 'uint' },
  ],
};

export default methodDef;
