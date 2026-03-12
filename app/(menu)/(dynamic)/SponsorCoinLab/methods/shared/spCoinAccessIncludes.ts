// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessIncludes.ts
import type { Contract, Signer } from 'ethers';
import { SpCoinAddModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js';
import { SpCoinDeleteModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module } from '@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js';
import { SpCoinReadModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js';
import { SpCoinRewardsModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js';

type ModuleCtor<T = any> = new (spCoinContractDeployed: Contract) => T;

export type SpCoinAccessIncludes = {
  SpCoinAddModule: ModuleCtor;
  SpCoinDeleteModule: ModuleCtor;
  SpCoinERC20Module: ModuleCtor;
  SpCoinReadModule: ModuleCtor;
  SpCoinRewardsModule: ModuleCtor;
  SpCoinStakingModule: ModuleCtor;
};

export type SpCoinModuleAccess = {
  add: any;
  del: any;
  erc20: any;
  read: any;
  rewards: any;
  staking: any;
  contract: Contract;
  signer?: Signer;
};

export function getSpCoinAccessIncludes(): SpCoinAccessIncludes {
  return {
    SpCoinAddModule,
    SpCoinDeleteModule,
    SpCoinERC20Module,
    SpCoinReadModule,
    SpCoinRewardsModule,
    SpCoinStakingModule,
  };
}

// Convenience factory for tests/stubs that call library modules instead of direct contract methods.
export function createSpCoinModuleAccess(contract: Contract, signer?: Signer): SpCoinModuleAccess {
  const includes = getSpCoinAccessIncludes();
  return {
    add: new includes.SpCoinAddModule(contract),
    del: new includes.SpCoinDeleteModule(contract),
    erc20: new includes.SpCoinERC20Module(contract),
    read: new includes.SpCoinReadModule(contract),
    rewards: new includes.SpCoinRewardsModule(contract),
    staking: new includes.SpCoinStakingModule(contract),
    contract,
    signer,
  };
}
