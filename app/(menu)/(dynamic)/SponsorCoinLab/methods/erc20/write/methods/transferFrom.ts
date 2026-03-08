// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/write/methods/transferFrom.ts
import type { Contract } from 'ethers';

export const method = {
  key: 'transferFrom',
  labels: {
    title: 'transferFrom',
    addressALabel: 'From Address',
    addressAPlaceholder: 'transferFrom(from)',
    addressBLabel: 'To Address',
    addressBPlaceholder: 'transferFrom(to)',
    requiresAddressB: true,
  },
  async run(contract: Contract, addressA: string, addressB: string, amount: string) {
    return await contract.transferFrom(addressA, addressB, amount);
  },
};
