import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getAgentRateTransactionCount',
  params: [
    { label: 'Sponsor Key', placeholder: 'address or * for all', type: 'address' },
    { label: 'Recipient Key', placeholder: 'address or * for all', type: 'address' },
    { label: 'Recipient Rate Key', placeholder: 'uint256 or * for all', type: 'uint' },
    { label: 'Agent Key', placeholder: 'address or * for all', type: 'address' },
    { label: 'Agent Rate Key', placeholder: 'uint256 or * for all', type: 'uint' },
  ],
};

export default methodDef;
