import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getAgentRateTransactionSetKeysPage',
  params: [
    { label: 'Agent Key', placeholder: 'address agent', type: 'address' },
    { label: 'Offset', placeholder: 'uint offset', type: 'uint' },
    { label: 'Limit', placeholder: 'uint limit', type: 'uint' },
  ],
};

export default methodDef;
