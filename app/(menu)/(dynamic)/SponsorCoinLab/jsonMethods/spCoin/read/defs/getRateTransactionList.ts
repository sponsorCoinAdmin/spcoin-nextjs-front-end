// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getTransactionList.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
    title: 'getTransactionList',
    params: [{ label: 'Reward Rate Row List', placeholder: 'string[] rewardRateRowList (comma/newline separated)', type: 'string_array' }],
  }

export default methodDef;
