// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/methods/balanceOf.ts
import { Contract } from 'ethers';

export const method = {
  key: 'balanceOf',
  labels: {
    title: 'balanceOf',
    addressALabel: 'Owner Address',
    addressAPlaceholder: 'balanceOf(owner)',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressA: true,
    requiresAddressB: false,
  },
  async run(contract: Contract, addressA: string) {
    return await contract.balanceOf(addressA);
  },
};
