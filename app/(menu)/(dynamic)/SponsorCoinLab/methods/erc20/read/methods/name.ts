// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/methods/name.ts
import { Contract } from 'ethers';

export const method = {
  key: 'name',
  labels: {
    title: 'name',
    addressALabel: '',
    addressAPlaceholder: '',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressA: false,
    requiresAddressB: false,
  },
  async run(contract: Contract) {
    return await contract.name();
  },
};
