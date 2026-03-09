// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessIncludes.ts
import type { Contract, Signer } from 'ethers';

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

// Centralized CJS includes for local spcoin-access-modules package.
export function getSpCoinAccessIncludes(): SpCoinAccessIncludes {
  const addModule = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js');
  const deleteModule = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js');
  const erc20Module = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js');
  const readModule = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js');
  const rewardsModule = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js');
  const stakingModule = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js');

  return {
    SpCoinAddModule: addModule.SpCoinAddModule,
    SpCoinDeleteModule: deleteModule.SpCoinDeleteModule,
    SpCoinERC20Module: erc20Module.SpCoinERC20Module,
    SpCoinReadModule: readModule.SpCoinReadModule,
    SpCoinRewardsModule: rewardsModule.SpCoinRewardsModule,
    SpCoinStakingModule: stakingModule.SpCoinStakingModule,
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
