// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/testStakingRewards.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'testStakingRewards',
    params: [
      { label: 'Last Update Time', placeholder: 'uint256 lastUpdateTime', type: 'uint' },
      { label: 'Test Update Time', placeholder: 'uint256 testUpdateTime', type: 'uint' },
      { label: 'Interest Rate', placeholder: 'uint256 interestRate', type: 'uint' },
      { label: 'Quantity', placeholder: 'uint256 quantity', type: 'uint' },
    ],
  }

export default methodDef;
