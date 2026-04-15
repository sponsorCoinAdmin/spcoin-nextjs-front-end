// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAccountRewardTransactionList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getAccountRewardTransactionList',
    params: [
      {
        label: 'Reward Account List',
        placeholder: 'string[] _rewardAccountList (comma/newline separated)',
        type: 'string_array',
      },
    ],
    executable: false,
  }

export default methodDef;
