// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/methods/symbol.ts
import { Contract } from 'ethers';

export const method = {
  key: 'symbol',
  labels: {
    title: 'symbol',
    addressALabel: '',
    addressAPlaceholder: '',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressA: false,
    requiresAddressB: false,
  },
  async run(contract: Contract) {
    return await contract.symbol();
  },
};
