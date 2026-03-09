// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessRuntime.ts
import { Contract } from 'ethers';
import type { Signer } from 'ethers';
import { createSpCoinModuleAccess } from './spCoinAccessIncludes';
import { SPCOIN_LAB_ABI } from './spCoinAbi';

export function createSpCoinContract(address: string, runner: any) {
  return new Contract(address, SPCOIN_LAB_ABI, runner);
}

export function createSpCoinLibraryAccess(address: string, runner: any, signer?: Signer) {
  const contract = createSpCoinContract(address, runner);
  return createSpCoinModuleAccess(contract, signer);
}
