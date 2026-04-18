// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/getAccountTimeInSecondeSinceUpdate.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'getAccountTimeInSecondeSinceUpdate',
  params: [
    { label: 'From Date/Time', placeholder: 'yyyy-mm-dd HH:mm:ss', type: 'string' },
    { label: 'To Date/Time', placeholder: 'yyyy-mm-dd HH:mm:ss', type: 'string' },
    { label: 'Date Difference Unit', placeholder: 'Seconds', type: 'string' },
  ],
};

export default methodDef;
