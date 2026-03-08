// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getStakingRewards',
    params: [
      { label: 'Last Update Time', placeholder: 'uint256 lastUpdateTime', type: 'uint' },
      { label: 'Interest Rate', placeholder: 'uint256 interestRate', type: 'uint' },
      { label: 'Quantity', placeholder: 'uint256 quantity', type: 'uint' },
    ],
  }

export default methodDef;
