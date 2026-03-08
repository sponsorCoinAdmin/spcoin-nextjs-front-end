// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/methods/decimals.ts
import { Contract } from 'ethers';

export const method = {
  key: 'decimals',
  labels: {
    title: 'decimals',
    addressALabel: '',
    addressAPlaceholder: '',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressA: false,
    requiresAddressB: false,
  },
  async run(contract: Contract) {
    return await contract.decimals();
  },
};
