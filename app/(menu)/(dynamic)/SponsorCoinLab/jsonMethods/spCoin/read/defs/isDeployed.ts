// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/isDeployed.ts
import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'isDeployed',
  params: [{ label: 'Contract Address', placeholder: 'Active contract address', type: 'contract_address' }],
};

export default methodDef;
