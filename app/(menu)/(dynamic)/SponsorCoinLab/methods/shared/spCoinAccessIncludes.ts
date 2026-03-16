// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessIncludes.ts
import type { Contract, Signer } from 'ethers';
import { SpCoinAddModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js';
import { SpCoinDeleteModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module } from '@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js';
import { SpCoinReadModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js';
import { SpCoinRewardsModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js';

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

function loadLocalSpCoinAccessIncludes(): SpCoinAccessIncludes | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    const localBase = '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules';
    const req = eval('require') as NodeRequire;
    return {
      SpCoinAddModule: req(`${localBase}/spCoinAddModule.js`).SpCoinAddModule as ModuleCtor,
      SpCoinDeleteModule: req(`${localBase}/spCoinDeleteModule.js`).SpCoinDeleteModule as ModuleCtor,
      SpCoinERC20Module: req(`${localBase}/spCoinERC20Module.js`).SpCoinERC20Module as ModuleCtor,
      SpCoinReadModule: req(`${localBase}/spCoinReadModule.js`).SpCoinReadModule as ModuleCtor,
      SpCoinRewardsModule: req(`${localBase}/spCoinRewardsModule.js`).SpCoinRewardsModule as ModuleCtor,
      SpCoinStakingModule: req(`${localBase}/spCoinStakingModule.js`).SpCoinStakingModule as ModuleCtor,
    };
  } catch (error) {
    console.warn('[spCoinAccessIncludes] Falling back to node_modules package for local source.', error);
    return null;
  }
}

export function getSpCoinAccessIncludes(source: SpCoinAccessSource = 'node_modules'): SpCoinAccessIncludes {
  if (source === 'local') {
    const localIncludes = loadLocalSpCoinAccessIncludes();
    if (localIncludes) return localIncludes;
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
