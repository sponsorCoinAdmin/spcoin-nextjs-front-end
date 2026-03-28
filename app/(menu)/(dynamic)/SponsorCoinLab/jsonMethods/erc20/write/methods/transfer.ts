// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/write/methods/transfer.ts
import type { Contract } from 'ethers';

export const method = {
  key: 'transfer',
  labels: {
    title: 'transfer',
    addressALabel: 'To Address',
    addressAPlaceholder: 'transfer(to)',
    addressBLabel: '',
    addressBPlaceholder: '',
    requiresAddressB: false,
  },
  async run(contract: Contract, addressA: string, _addressB: string, amount: string) {
    return await contract.transfer(addressA, amount);
  },
};
