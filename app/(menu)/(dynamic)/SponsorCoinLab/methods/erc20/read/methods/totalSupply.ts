// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/methods/totalSupply.ts
import { Contract } from 'ethers';

export const method = {
  key: 'totalSupply',
  labels: {
    title: 'totalSupply',
    addressALabel: '',
    addressAPlaceholder: '',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressA: false,
    requiresAddressB: false,
  },
  async run(contract: Contract) {
    return await contract.totalSupply();
  },
};
