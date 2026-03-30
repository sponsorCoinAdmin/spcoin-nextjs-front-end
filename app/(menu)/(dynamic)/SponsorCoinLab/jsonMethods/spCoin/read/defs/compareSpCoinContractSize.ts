import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'compareSpCoinContractSize',
  params: [
    {
      label: 'Previous Release Directory',
      placeholder: 'spCoinAccess/contracts/spCoinOrig.BAK',
      type: 'string',
    },
    {
      label: 'Latest Release Directory',
      placeholder: 'spCoinAccess/contracts/spCoin',
      type: 'string',
    },
  ],
};

export default methodDef;
