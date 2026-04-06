// File: app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/deleteAccountTree.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'delAccountTree',
  params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
};

export default methodDef;
