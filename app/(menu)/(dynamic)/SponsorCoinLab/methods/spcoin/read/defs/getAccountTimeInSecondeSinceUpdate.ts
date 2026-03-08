// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAccountTimeInSecondeSinceUpdate.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getAccountTimeInSecondeSinceUpdate',
    params: [{ label: 'Token Last Update', placeholder: 'uint256 _tokenLastUpdate', type: 'uint' }],
  }

export default methodDef;
