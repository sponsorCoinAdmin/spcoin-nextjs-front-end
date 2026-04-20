// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAccountRateTransactionList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getAccountRateTransactionList',
    params: [{ label: 'Rate Reward List', placeholder: 'string[] rateRewardList (comma/newline separated)', type: 'string_array' }],
  }

export default methodDef;
