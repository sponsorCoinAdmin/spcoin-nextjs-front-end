import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getRecipientRateTransactionSetKeysPage',
  params: [
    { label: 'Recipient Key', placeholder: 'address recipient', type: 'address' },
    { label: 'Offset', placeholder: 'uint offset', type: 'uint' },
    { label: 'Limit', placeholder: 'uint limit', type: 'uint' },
  ],
};

export default methodDef;
