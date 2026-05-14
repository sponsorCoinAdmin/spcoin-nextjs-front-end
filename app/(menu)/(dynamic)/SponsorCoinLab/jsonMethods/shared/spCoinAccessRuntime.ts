// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessRuntime.ts
import { Contract } from 'ethers';
import type { Signer } from 'ethers';
import { createSpCoinModuleAccess, type SpCoinAccessSource, type SpCoinModuleAccessOptions } from './spCoinAccessIncludes';
import { getSpCoinLabAbi } from './spCoinAbi';
import { wrapContractWithTiming } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';

export function createSpCoinContract(address: string, runner: any) {
  return wrapContractWithTiming(new Contract(address, getSpCoinLabAbi(), runner));
}

export function createSpCoinLibraryAccess(
  address: string,
  runner: any,
  signer?: Signer,
  source: SpCoinAccessSource = 'local',
  options: SpCoinModuleAccessOptions = {},
) {
  const contract = createSpCoinContract(address, runner);
  return createSpCoinModuleAccess(contract, signer, source, undefined, options);
}
