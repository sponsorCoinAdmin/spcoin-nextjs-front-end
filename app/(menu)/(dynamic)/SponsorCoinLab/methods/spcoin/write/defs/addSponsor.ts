// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/addSponsor.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'addSponsor',
  params: [{ label: 'Sponsor Key', placeholder: 'address sponsor', type: 'address' }],
};

export default methodDef;
