// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessIncludes.ts
import type { Contract, ContractTransactionResponse, Signer } from 'ethers';
import { SpCoinAddModule as NodeSpCoinAddModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js';
import { SpCoinDeleteModule as NodeSpCoinDeleteModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module as NodeSpCoinERC20Module } from '@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js';
import { SpCoinReadModule as NodeSpCoinReadModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js';
import { SpCoinRewardsModule as NodeSpCoinRewardsModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule as NodeSpCoinStakingModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js';
import { SpCoinAddModule as LocalSpCoinAddModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinAddModule.js';
import { SpCoinDeleteModule as LocalSpCoinDeleteModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module as LocalSpCoinERC20Module } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinERC20Module.js';
import { SpCoinReadModule as LocalSpCoinReadModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinReadModule.js';
import { SpCoinRewardsModule as LocalSpCoinRewardsModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule as LocalSpCoinStakingModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/modules/spCoinStakingModule.js';
import type {
  AccountStruct,
  AgentRateStruct,
  RecipientRateStruct,
  RecipientStruct,
  RewardsStruct,
  SponsorCoinHeader,
  StakingTransactionStruct,
} from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/dataTypes/spCoinDataTypes.js';

type ModuleCtor = new (spCoinContractDeployed: Contract) => unknown;
export type SpCoinAccessSource = 'local' | 'node_modules';

export type SpCoinAddAccess = {
  addRecipient: (_recipientKey: string) => Promise<ContractTransactionResponse>;
  addAgent: (_recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string) => Promise<ContractTransactionResponse>;
  addAgentSponsorship: (
    _sponsorSigner: Signer,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addBackDatedAgentSponsorship: (
    _sponsorSigner: Signer,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
};

export type SpCoinDeleteAccess = {
  signer?: Signer;
  deleteAccountRecord: (_accountKey: string) => Promise<ContractTransactionResponse>;
};

export type SpCoinReadAccess = {
  [key: string]: ((...args: unknown[]) => unknown) | unknown;
  getAccountList: () => Promise<string[]>;
  getAccountRecipientList: (_accountKey: string) => Promise<string[]>;
  getAccountRecord: (_accountKey: string) => Promise<AccountStruct>;
  getAccountRecords: () => Promise<AccountStruct[]>;
  getAccountStakingRewards: (_accountKey: string) => Promise<RewardsStruct>;
  getSPCoinHeaderRecord: (getBody?: boolean) => Promise<SponsorCoinHeader>;
  getRecipientRecord: (_sponsorKey: string, _recipientKey: string) => Promise<RecipientStruct>;
  getRecipientRateRecord: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number) => Promise<RecipientRateStruct>;
  getAgentRateRecord: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _agentKey: string,
    _agentRateKey: string | number,
  ) => Promise<AgentRateStruct>;
  getAgentRateTransactionList: (
    _sponsorCoin: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _agentKey: string,
    _agentRateKey: string | number,
  ) => Promise<StakingTransactionStruct[]>;
};

export type SpCoinContractAccess = Contract & {
  [key: string]: ((...args: unknown[]) => unknown) | unknown;
  connect?: (signer: Signer) => Contract;
  getRecipientRateAgentList?: (
    sponsorKey: unknown,
    recipientKey: unknown,
    recipientRateKey: unknown,
  ) => Promise<unknown>;
  getRecipientRateList?: (sponsorKey: unknown, recipientKey: unknown) => Promise<Array<string | bigint>>;
  getAgentRateList?: (
    sponsorKey: unknown,
    recipientKey: unknown,
    recipientRateKey: unknown,
    agentKey: unknown,
  ) => Promise<Array<string | bigint> | unknown>;
  getAgentTotalRecipient?: (
    sponsorKey: unknown,
    recipientKey: unknown,
    recipientRateKey: unknown,
    agentKey: unknown,
  ) => Promise<unknown>;
  unSponsorRecipient?: (...args: unknown[]) => Promise<unknown>;
};

export type SpCoinRewardsAccess = {
  updateAccountStakingRewards: (accountKey: string) => Promise<ContractTransactionResponse>;
};

export type SpCoinStakingAccess = {
  depositSponsorStakingRewards: (
    _sponsorAccount: string,
    _recipientAccount: string,
    _recipientRate: string | number,
    _amount: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  depositRecipientStakingRewards: (
    _sponsorAccount: string,
    _recipientAccount: string,
    _recipientRate: string | number,
    _amount: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  depositAgentStakingRewards: (
    _sponsorAccount: string,
    _recipientAccount: string,
    _recipientRate: string | number,
    _agentAccount: string,
    _agentRate: string | number,
    _amount: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
};

export type SpCoinAccessIncludes = {
  SpCoinAddModule: ModuleCtor;
  SpCoinDeleteModule: ModuleCtor;
  SpCoinERC20Module: ModuleCtor;
  SpCoinReadModule: ModuleCtor;
  SpCoinRewardsModule: ModuleCtor;
  SpCoinStakingModule: ModuleCtor;
};

export type SpCoinModuleAccess = {
  add: SpCoinAddAccess;
  del: SpCoinDeleteAccess;
  erc20: NodeSpCoinERC20Module;
  read: SpCoinReadAccess;
  rewards: SpCoinRewardsAccess;
  staking: SpCoinStakingAccess;
  contract: SpCoinContractAccess;
  signer?: Signer;
};

const localIncludes: SpCoinAccessIncludes = {
  SpCoinAddModule: LocalSpCoinAddModule,
  SpCoinDeleteModule: LocalSpCoinDeleteModule,
  SpCoinERC20Module: LocalSpCoinERC20Module,
  SpCoinReadModule: LocalSpCoinReadModule,
  SpCoinRewardsModule: LocalSpCoinRewardsModule,
  SpCoinStakingModule: LocalSpCoinStakingModule,
};

const nodeModulesIncludes: SpCoinAccessIncludes = {
  SpCoinAddModule: NodeSpCoinAddModule,
  SpCoinDeleteModule: NodeSpCoinDeleteModule,
  SpCoinERC20Module: NodeSpCoinERC20Module,
  SpCoinReadModule: NodeSpCoinReadModule,
  SpCoinRewardsModule: NodeSpCoinRewardsModule,
  SpCoinStakingModule: NodeSpCoinStakingModule,
};

export function getSpCoinAccessIncludes(source: SpCoinAccessSource = 'node_modules'): SpCoinAccessIncludes {
  return source === 'local' ? localIncludes : nodeModulesIncludes;
}

// Convenience factory for tests/stubs that call library modules instead of direct contract methods.
export function createSpCoinModuleAccess(
  contract: Contract,
  signer?: Signer,
  source: SpCoinAccessSource = 'node_modules',
): SpCoinModuleAccess {
  const includes = getSpCoinAccessIncludes(source);
  return {
    add: new includes.SpCoinAddModule(contract) as SpCoinAddAccess,
    del: new includes.SpCoinDeleteModule(contract) as SpCoinDeleteAccess,
    erc20: new includes.SpCoinERC20Module(contract) as NodeSpCoinERC20Module,
    read: new includes.SpCoinReadModule(contract) as SpCoinReadAccess,
    rewards: new includes.SpCoinRewardsModule(contract) as SpCoinRewardsAccess,
    staking: new includes.SpCoinStakingModule(contract) as SpCoinStakingAccess,
    contract: contract as SpCoinContractAccess,
    signer,
  };
}
