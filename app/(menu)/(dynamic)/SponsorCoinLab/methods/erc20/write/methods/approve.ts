// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/write/methods/approve.ts
import type { Contract } from 'ethers';

export const method = {
  key: 'approve',
  labels: {
    title: 'approve',
    addressALabel: 'Spender Address',
    addressAPlaceholder: 'approve(spender)',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressB: false,
  },
  async run(contract: Contract, addressA: string, _addressB: string, amount: string) {
    return await contract.approve(addressA, amount);
  },
};
