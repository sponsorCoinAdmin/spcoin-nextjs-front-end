import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getRateTransactionSetTransactionIdsPage',
  params: [
    { label: 'Rate Transaction Set Key', placeholder: 'bytes32 set key', type: 'string' },
    { label: 'Offset', placeholder: 'uint offset', type: 'uint' },
    { label: 'Limit', placeholder: 'uint limit', type: 'uint' },
  ],
};

export default methodDef;
