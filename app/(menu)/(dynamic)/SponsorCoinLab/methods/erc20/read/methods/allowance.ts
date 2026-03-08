// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/methods/allowance.ts
import { Contract } from 'ethers';

export const method = {
  key: 'allowance',
  labels: {
    title: 'allowance',
    addressALabel: 'Owner Address',
    addressAPlaceholder: 'allowance(owner)',
    addressBLabel: 'Spender Address',
    addressBPlaceholder: 'allowance(spender)',
    requiresAddressA: true,
    requiresAddressB: true,
  },
  async run(contract: Contract, addressA: string, addressB: string) {
    return await contract.allowance(addressA, addressB);
  },
};
