import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getTransactionRecord',
  params: [{ label: 'Transaction Id', placeholder: 'uint256 transactionId', type: 'uint' }],
};

export default methodDef;
