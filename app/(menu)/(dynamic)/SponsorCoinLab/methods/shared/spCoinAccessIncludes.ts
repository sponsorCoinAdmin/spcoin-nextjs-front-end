// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessIncludes.ts
import type { Contract, Signer } from 'ethers';
import { SpCoinAddModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js';
import { SpCoinDeleteModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module } from '@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js';
import { SpCoinReadModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js';
import { SpCoinRewardsModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js';
import { SpCoinAddModule as LocalSpCoinAddModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinAddModule.js';
import { SpCoinDeleteModule as LocalSpCoinDeleteModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module as LocalSpCoinERC20Module } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinERC20Module.js';
import { SpCoinReadModule as LocalSpCoinReadModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinReadModule.js';
import { SpCoinRewardsModule as LocalSpCoinRewardsModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule as LocalSpCoinStakingModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinStakingModule.js';

type ModuleCtor<T = any> = new (spCoinContractDeployed: Contract) => T;
export type SpCoinAccessSource = 'local' | 'node_modules';

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

export function getSpCoinAccessIncludes(source: SpCoinAccessSource = 'node_modules'): SpCoinAccessIncludes {
  if (source === 'local') {
    return {
      SpCoinAddModule: LocalSpCoinAddModule,
      SpCoinDeleteModule: LocalSpCoinDeleteModule,
      SpCoinERC20Module: LocalSpCoinERC20Module,
      SpCoinReadModule: LocalSpCoinReadModule,
      SpCoinRewardsModule: LocalSpCoinRewardsModule,
      SpCoinStakingModule: LocalSpCoinStakingModule,
    };
  }
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
export function createSpCoinModuleAccess(
  contract: Contract,
  signer?: Signer,
  source: SpCoinAccessSource = 'node_modules',
): SpCoinModuleAccess {
  const includes = getSpCoinAccessIncludes(source);
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
