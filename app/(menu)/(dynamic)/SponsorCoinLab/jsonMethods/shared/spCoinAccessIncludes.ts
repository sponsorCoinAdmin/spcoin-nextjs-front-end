// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/spCoinAccessIncludes.ts
import type { Contract, ContractTransactionResponse, Signer } from 'ethers';
import { SpCoinAddModule as NodeSpCoinAddModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js';
import { SpCoinDeleteModule as NodeSpCoinDeleteModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js';
import { SpCoinERC20Module as NodeSpCoinERC20Module } from '@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js';
import { SpCoinReadModule as NodeSpCoinReadModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js';
import { SpCoinRewardsModule as NodeSpCoinRewardsModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js';
import { SpCoinStakingModule as NodeSpCoinStakingModule } from '@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js';
import { SpCoinAddModule as LocalSpCoinAddModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinAddModule/index';
import { SpCoinDeleteModule as LocalSpCoinDeleteModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinDeleteModule/index';
import { SpCoinERC20Module as LocalSpCoinERC20Module } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinERC20Module/index';
import { SpCoinReadModule as LocalSpCoinReadModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/index';
import { SpCoinRewardsModule as LocalSpCoinRewardsModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinRewardsModule/index';
import { SpCoinStakingModule as LocalSpCoinStakingModule } from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinStakingModule/index';
import type {
  AccountStruct,
  AgentRateStruct,
  RecipientRateStruct,
  RecipientStruct,
  RewardsStruct,
  StakingTransactionStruct,
} from '../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/dist/dataTypes/spCoinDataTypes';

type ModuleCtor = new (...args: any[]) => unknown;
export type SpCoinAccessSource = 'local' | 'node_modules';

export type SpCoinAddAccess = {
  addRecipient: (_recipientKey: string) => Promise<ContractTransactionResponse>;
  addSponsorRecipient?: (_sponsorKey: string, _recipientKey: string) => Promise<ContractTransactionResponse>;
  addSponsorship?: (
    _sponsorSigner: Signer,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addRecipientRateTransaction?: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addRecipientTransaction?: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addRecipientRateBranchAmount: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addRecipientAgent: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string) => Promise<ContractTransactionResponse>;
  addAgentTransaction?: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addAgentRateTransaction?: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addAgentRateBranchAmount: (
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addAgentSponsorship: (
    _sponsorSigner: Signer,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
  ) => Promise<ContractTransactionResponse>;
  addBackDatedAgentTransaction: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
  addBackDatedSponsorship: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
  addBackDatedAgentSponsorship: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionQty: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
  addBackDatedRecipientTransaction: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
  addBackDatedRecipientSponsorship: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionQty: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
  backDateRecipientTransactionDate: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _transactionIndex: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
  backDateAgentTransactionDate: (
    _adminSigner: Signer,
    _sponsorKey: string,
    _recipientKey: string,
    _recipientRateKey: string | number,
    _accountAgentKey: string,
    _agentRateKey: string | number,
    _transactionIndex: string | number,
    _transactionBackDate: number,
  ) => Promise<ContractTransactionResponse>;
};

export type SpCoinDeleteAccess = {
  signer?: Signer;
  deleteAccountRecord: (_accountKey: string) => Promise<ContractTransactionResponse>;
  delRecipient?: (_sponsorKey: { accountKey: string }, _recipientKey: string) => Promise<unknown>;
  unSponsorRecipient?: (_sponsorKey: { accountKey: string }, _recipientKey: string) => Promise<unknown>;
  deleteAgentRecord?: (_accountKey: string, _recipientKey: string, _accountAgentKey: string) => Promise<unknown>;
};

export type SpCoinOffChainAccess = {
  addRecipients: (_accountKey: string, _recipientAccountList: string[]) => Promise<number>;
  addAgents: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _agentAccountList: string[]) => Promise<number>;
  deleteAccountTree: () => Promise<{
    accountCount: number;
    recipientCount: number;
    recipientRateCount: number;
    agentCount: number;
    deletedAgentCount: number;
    deletedRecipientCount: number;
    deletedAccountCount: number;
  }>;
  setLowerRecipientRate: (newLowerRecipientRate: string | number) => Promise<ContractTransactionResponse>;
  setUpperRecipientRate: (newUpperRecipientRate: string | number) => Promise<ContractTransactionResponse>;
  setLowerAgentRate: (newLowerAgentRate: string | number) => Promise<ContractTransactionResponse>;
  setUpperAgentRate: (newUpperAgentRate: string | number) => Promise<ContractTransactionResponse>;
};

export type SpCoinReadAccess = {
  [key: string]: ((...args: unknown[]) => unknown) | unknown;
  getMasterAccountList: () => Promise<string[]>;
  getRecipientList?: (_accountKey: string) => Promise<string[]>;
  getAccountRecipientList: (_accountKey: string) => Promise<string[]>;
  getAgentList?: (_accountKey: string) => Promise<string[]>;
  getAgentListSize?: (_accountKey: string) => Promise<number>;
  getRecipientListSize?: (_accountKey: string) => Promise<number>;
  getMasterAccountListSize?: () => Promise<number>;
  getAccountRecord: (_accountKey: string) => Promise<AccountStruct>;
  getAccountStakingRewards: (_accountKey: string) => Promise<RewardsStruct>;
  getSpCoinMetaData: () => Promise<unknown>;
  getRecipientRateList: (_sponsorKey: string, _recipientKey: string) => Promise<(string | number | bigint)[]>;
  getRecipientRateAgentList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number) => Promise<string[]>;
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
  connect?: (signer: Signer) => SpCoinContractAccess;
  addBackDatedSponsorship?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
    transactionTimestamp: number,
  ) => Promise<ContractTransactionResponse>;
  addRecipientRateTransaction?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
  ) => Promise<ContractTransactionResponse>;
  addRecipientTransaction?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
  ) => Promise<ContractTransactionResponse>;
  addRecipientRateBranchAmount?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
  ) => Promise<ContractTransactionResponse>;
  addSponsorRecipient?: (
    sponsorKey: string,
    recipientKey: string,
  ) => Promise<ContractTransactionResponse>;
  addAgentTransaction?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
  ) => Promise<ContractTransactionResponse>;
  addAgentRateTransaction?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
  ) => Promise<ContractTransactionResponse>;
  addAgentRateBranchAmount?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
    wholeAmount: string,
    decimalAmount: string,
  ) => Promise<ContractTransactionResponse>;
  backDateTransactionDate?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
    transactionIndex: string | number | bigint,
    transactionTimestamp: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  getRecipientRateRange?: () => Promise<[bigint, bigint] | Array<string | number | bigint>>;
  getAgentRateRange?: () => Promise<[bigint, bigint] | Array<string | number | bigint>>;
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
  setRecipientRateRange?: (lower: string | number | bigint, upper: string | number | bigint) => Promise<ContractTransactionResponse>;
  setAgentRateRange?: (lower: string | number | bigint, upper: string | number | bigint) => Promise<ContractTransactionResponse>;
  delRecipient?: (...args: unknown[]) => Promise<unknown>;
  deleteSponsor?: (sponsorKey: string) => Promise<ContractTransactionResponse>;
  deleteRecipient?: (recipientKey: string) => Promise<ContractTransactionResponse>;
  deleteSponsorRecipient?: (sponsorKey: string, recipientKey: string) => Promise<ContractTransactionResponse>;
  deleteRecipientRate?: (
    recipientKey: string,
    recipientRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  deleteRecipientRateBranch?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  deleteRecipientTransaction?: (
    recipientKey: string,
    recipientRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  deleteAgent?: (
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
  ) => Promise<ContractTransactionResponse>;
  deleteRecipientAgent?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
  ) => Promise<ContractTransactionResponse>;
  deleteAgentRate?: (
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  deleteAgentRateAmount?: (
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  unSponsorRecipient?: (...args: unknown[]) => Promise<unknown>;
  unSponsorAgent?: (
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
  deleteAgentRateBranch?: (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number | bigint,
    agentKey: string,
    agentRateKey: string | number | bigint,
  ) => Promise<ContractTransactionResponse>;
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
  offChain: SpCoinOffChainAccess;
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

function normalizeRateValue(value: unknown): string | number | bigint {
  if (typeof value === 'bigint' || typeof value === 'number') return value;
  return String(value);
}

function createSpCoinOffChainAccess(
  contract: Contract,
  add: SpCoinAddAccess,
  read: SpCoinReadAccess,
  del: SpCoinDeleteAccess,
  trace?: (line: string) => void,
): SpCoinOffChainAccess {
  const typedContract = contract as SpCoinContractAccess;
  const isBadDataError = (error: unknown) => {
    const code = String((error as { code?: unknown } | null)?.code || '');
    const message = String((error as { message?: unknown } | null)?.message || '');
    return code === 'BAD_DATA' || /could not decode result data/i.test(message);
  };
  const buildReadDecodeError = async (error: unknown, method: string) => {
    if (!isBadDataError(error)) return error;
    const runner = (contract as Contract & { runner?: any }).runner;
    const provider = runner?.provider ?? runner;
    if (!provider || typeof provider.getCode !== 'function') {
      return new Error(`Unable to read ${method}() before validating deleteAccountTree. The contract returned undecodable data.`);
    }
    try {
      const target =
        String((contract as Contract & { target?: unknown }).target || '') ||
        (typeof typedContract.getAddress === 'function' ? String(await typedContract.getAddress()) : '');
      const [code, network] = await Promise.all([
        provider.getCode(target),
        typeof provider.getNetwork === 'function' ? provider.getNetwork() : Promise.resolve(null),
      ]);
      const chainId = network?.chainId != null ? String(network.chainId) : 'unknown';
      const hasCode = typeof code === 'string' && code !== '0x';
      const nextError = new Error(
        hasCode
          ? `Unable to read ${method}() before validating deleteAccountTree at ${target} on chain ${chainId}. The contract returned undecodable data, so account existence could not be verified.`
          : `Unable to read ${method}() before validating deleteAccountTree at ${target} on chain ${chainId}. No contract code was found at that address.`,
      );
      (nextError as Error & { cause?: unknown; code?: unknown }).cause = error;
      (nextError as Error & { cause?: unknown; code?: unknown }).code =
        (error as { code?: unknown } | null)?.code || 'BAD_DATA';
      return nextError;
    } catch {
      return new Error(`Unable to read ${method}() before validating deleteAccountTree. The contract returned undecodable data, so account existence could not be verified.`);
    }
  };
  const toDebugJson = (value: unknown): string =>
    JSON.stringify(
      value,
      (_key, innerValue) => (typeof innerValue === 'bigint' ? innerValue.toString() : innerValue),
      2,
    );
  const logDebug = (message: string) => {
    if (typeof trace === 'function' && String(message || '').trim()) {
      trace(String(message));
    }
    const candidateLoggers = [
      (add as { spCoinLogger?: { logDetail?: (value: string) => void } }).spCoinLogger,
      (del as { spCoinLogger?: { logDetail?: (value: string) => void } }).spCoinLogger,
      (read as { spCoinLogger?: { logDetail?: (value: string) => void } }).spCoinLogger,
      (contract as { spCoinLogger?: { logDetail?: (value: string) => void } }).spCoinLogger,
    ];
    for (const logger of candidateLoggers) {
      if (typeof logger?.logDetail === 'function') {
        logger.logDetail(message);
        return;
      }
    }
  };
  const waitForReceipt = async (label: string, tx: unknown) => {
    const txHash = String((tx as { hash?: string })?.hash || '');
    logDebug(`JS => ${label} tx hash = ${txHash}`);
    if (!tx || typeof (tx as { wait?: () => Promise<unknown> }).wait !== 'function') {
      logDebug(`JS => ${label} returned without waitable receipt`);
      return tx;
    }
    const receipt = await (tx as { wait: () => Promise<{ status?: unknown; hash?: unknown }> }).wait();
    logDebug(
      `JS => ${label} receipt status = ${String((receipt as { status?: unknown })?.status ?? '')} hash = ${String(
        (receipt as { hash?: unknown })?.hash ?? txHash,
      )}`,
    );
    return receipt;
  };
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const sendDeleteAccountRecordWithRecovery = async (accountKey: string, attempts = 2) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        logDebug(`JS => deleteAccountTree deleteAccountRecord ${accountKey} send attempt ${String(attempt)}`);
        return await del.deleteAccountRecord(accountKey);
      } catch (error) {
        lastError = error;
        const message = String((error as { message?: unknown })?.message ?? error ?? '');
        logDebug(`JS => deleteAccountTree deleteAccountRecord ${accountKey} send attempt ${String(attempt)} failed = ${message}`);
        if (!/Failed to fetch/i.test(message)) {
          throw error;
        }
        await sleep(1200);
        if (typeof typedContract.isAccountInserted === 'function') {
          const stillInserted = await typedContract.isAccountInserted(accountKey);
          logDebug(
            `JS => deleteAccountTree deleteAccountRecord ${accountKey} post-failure visibility after attempt ${String(attempt)} = ${String(
              stillInserted,
            )}`,
          );
          if (!stillInserted) {
            logDebug(`JS => deleteAccountTree deleteAccountRecord ${accountKey} treating transport failure as success because account is gone`);
            return null;
          }
        }
      }
    }
    throw lastError;
  };
  const logDeleteStructure = async (stageLabel: string, sponsorKey: string) => {
    const snapshot: Record<string, unknown> = { sponsorKey };
    if (typeof read.getMasterAccountList === 'function') {
      snapshot.accountList = await read.getMasterAccountList();
    }
    if (typeof typedContract.isAccountInserted === 'function') {
      snapshot.sponsorInserted = await typedContract.isAccountInserted(sponsorKey);
    }
    if (typeof read.getAccountRecipientList === 'function') {
      snapshot.sponsorRecipientList = await read.getAccountRecipientList(sponsorKey);
    }
    logDebug(`JS => deleteAccountTree structure ${stageLabel} = ${toDebugJson(snapshot)}`);
  };
  const logRecipientStructure = async (stageLabel: string, sponsorKey: string, recipientKey: string) => {
    const snapshot: Record<string, unknown> = { sponsorKey, recipientKey };
    if (typeof typedContract.isAccountInserted === 'function') {
      snapshot.recipientInserted = await typedContract.isAccountInserted(recipientKey);
    }
    if (typeof read.getRecipientRateList === 'function') {
      snapshot.recipientRateList = await read.getRecipientRateList(sponsorKey, recipientKey);
    }
    logDebug(`JS => deleteAccountTree recipient ${stageLabel} = ${toDebugJson(snapshot)}`);
  };
  const logRecipientRateStructure = async (
    stageLabel: string,
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number,
  ) => {
    const snapshot: Record<string, unknown> = { sponsorKey, recipientKey, recipientRateKey };
    if (typeof read.getRecipientRateAgentList === 'function') {
      snapshot.recipientRateAgentList = await read.getRecipientRateAgentList(
        sponsorKey,
        recipientKey,
        recipientRateKey,
      );
    }
    logDebug(`JS => deleteAccountTree recipientRate ${stageLabel} = ${toDebugJson(snapshot)}`);
  };
  return {
    addRecipients: async (_accountKey: string, recipientAccountList: string[]) => {
      let recipientCount = 0;
      for (const recipientKey of recipientAccountList) {
        if (typeof add.addSponsorRecipient === 'function') {
          await add.addSponsorRecipient(String(_accountKey), String(recipientKey));
        } else {
          await add.addRecipient(String(recipientKey));
        }
        recipientCount += 1;
      }
      return recipientCount;
    },
    addAgents: async (sponsorKey: string, recipientKey: string, recipientRateKey: string | number, agentAccountList: string[]) => {
      let agentCount = 0;
      for (const agentKey of agentAccountList) {
        await add.addRecipientAgent(String(sponsorKey), String(recipientKey), recipientRateKey, String(agentKey));
        agentCount += 1;
      }
      return agentCount;
    },
    deleteAccountTree: async () => {
      const summary = {
        accountCount: 0,
        recipientCount: 0,
        recipientRateCount: 0,
        agentCount: 0,
        deletedAgentCount: 0,
        deletedRecipientCount: 0,
        deletedAccountCount: 0,
      };
      let accountList: string[];
      try {
        accountList = await read.getMasterAccountList();
      } catch (error) {
        throw await buildReadDecodeError(error, 'getMasterAccountList');
      }
      const accountKeySet = new Set((Array.isArray(accountList) ? accountList : []).map((accountKeyValue) => String(accountKeyValue)));
      const targetAccountKey = String((await del.signer?.getAddress?.()) || '').trim();
      if (!targetAccountKey) {
        throw new Error('deleteAccountTree requires a connected signer.');
      }
      const processedAccountKeys = new Set<string>();
      const countedAccountKeys = new Set<string>();
      const activeAccountKeys = new Set<string>();
      const walkAccountTree = async (sponsorKey: string, deferDelete = false): Promise<void> => {
        logDebug(`JS => deleteAccountTree walk start sponsor=${sponsorKey} deferDelete=${String(deferDelete)}`);
        if (processedAccountKeys.has(sponsorKey)) {
          logDebug(`JS => deleteAccountTree already processed ${sponsorKey}`);
          return;
        }
        if (!countedAccountKeys.has(sponsorKey)) {
          summary.accountCount += 1;
          countedAccountKeys.add(sponsorKey);
        }
        if (activeAccountKeys.has(sponsorKey)) {
          logDebug(`JS => deleteAccountTree active cycle detected for ${sponsorKey}`);
          return;
        }
        activeAccountKeys.add(sponsorKey);
        try {
          await logDeleteStructure('before walk', sponsorKey);
          const recipientList = await read.getAccountRecipientList(sponsorKey);
          logDebug(`JS => deleteAccountTree recipient list for ${sponsorKey} = ${toDebugJson(recipientList)}`);
          for (const recipientKeyValue of Array.isArray(recipientList) ? recipientList : []) {
            const recipientKey = String(recipientKeyValue);
            summary.recipientCount += 1;
            await logRecipientStructure('before child handling', sponsorKey, recipientKey);
            if (accountKeySet.has(recipientKey)) {
              await walkAccountTree(recipientKey, true);
            }
            const recipientRateList = await read.getRecipientRateList(sponsorKey, recipientKey);
            logDebug(
              `JS => deleteAccountTree recipient rate list sponsor=${sponsorKey} recipient=${recipientKey} = ${toDebugJson(recipientRateList)}`,
            );
            for (const recipientRateKey of Array.isArray(recipientRateList) ? recipientRateList : []) {
              summary.recipientRateCount += 1;
              const normalizedRecipientRateKey =
                typeof recipientRateKey === 'bigint' ? recipientRateKey.toString() : recipientRateKey;
              await logRecipientRateStructure(
                'before unSponsorRecipient',
                sponsorKey,
                recipientKey,
                normalizedRecipientRateKey,
              );
              const agentList = await read.getRecipientRateAgentList(
                sponsorKey,
                recipientKey,
                normalizedRecipientRateKey,
              );
              logDebug(
                `JS => deleteAccountTree agent list sponsor=${sponsorKey} recipient=${recipientKey} rate=${String(normalizedRecipientRateKey)} = ${toDebugJson(agentList)}`,
              );
              for (const _agentKeyValue of Array.isArray(agentList) ? agentList : []) {
                summary.agentCount += 1;
                summary.deletedAgentCount += 1;
              }
            }
            if (typeof del.delRecipient === 'function' || typeof del.unSponsorRecipient === 'function') {
              logDebug(`JS => deleteAccountTree delRecipient sponsor=${sponsorKey} recipient=${recipientKey}`);
              let tx: any;
              try {
                logDebug(
                  `JS => deleteAccountTree delRecipient start sponsor=${sponsorKey} recipient=${recipientKey} via=${
                    typeof del.delRecipient === 'function' ? 'delRecipient' : 'unSponsorRecipient'
                  }`,
                );
                tx =
                  typeof del.delRecipient === 'function'
                    ? await del.delRecipient({ accountKey: sponsorKey }, recipientKey)
                    : await del.unSponsorRecipient!({ accountKey: sponsorKey }, recipientKey);
                logDebug(
                  `JS => deleteAccountTree delRecipient sent sponsor=${sponsorKey} recipient=${recipientKey} tx=${String(
                    tx?.hash || '',
                  )}`,
                );
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logDebug(
                  `JS => deleteAccountTree delRecipient failed sponsor=${sponsorKey} recipient=${recipientKey} error=${message}`,
                );
                throw new Error(
                  `deleteAccountTree delRecipient failed for sponsor=${sponsorKey} recipient=${recipientKey}: ${message}`,
                );
              }
              await waitForReceipt(`deleteAccountTree delRecipient sponsor=${sponsorKey} recipient=${recipientKey}`, tx);
              summary.deletedRecipientCount += 1;
              await logRecipientStructure('after delRecipient', sponsorKey, recipientKey);
              await logDeleteStructure('after delRecipient', sponsorKey);
            }
            if (accountKeySet.has(recipientKey)) {
              await walkAccountTree(recipientKey, false);
            }
          }
          if (!deferDelete) {
            logDebug(`JS => deleteAccountTree deleteAccountRecord ${sponsorKey}`);
            const tx = await sendDeleteAccountRecordWithRecovery(sponsorKey);
            if (tx) {
              await waitForReceipt(`deleteAccountTree deleteAccountRecord ${sponsorKey}`, tx);
            }
            summary.deletedAccountCount += 1;
            processedAccountKeys.add(sponsorKey);
            await logDeleteStructure('after deleteAccountRecord', sponsorKey);
          }
        } finally {
          activeAccountKeys.delete(sponsorKey);
        }
      };
      if (!targetAccountKey) {
        throw new Error('deleteAccountTree requires an Account Key.');
      }
      if (!accountKeySet.has(targetAccountKey)) {
        throw new Error(`deleteAccountTree target account not found in getMasterAccountList(): ${targetAccountKey}`);
      }
      if (!processedAccountKeys.has(targetAccountKey)) {
        await walkAccountTree(targetAccountKey);
      }
      return summary;
    },
    setLowerRecipientRate: async (newLowerRecipientRate: string | number) => {
      if (typeof typedContract.getUpperRecipientRate !== 'function' || typeof typedContract.setRecipientRateRange !== 'function') {
        throw new Error('Recipient rate methods are not available on the current SpCoin contract access path.');
      }
      const upper = normalizeRateValue(await typedContract.getUpperRecipientRate());
      return typedContract.setRecipientRateRange(normalizeRateValue(newLowerRecipientRate), upper);
    },
    setUpperRecipientRate: async (newUpperRecipientRate: string | number) => {
      if (typeof typedContract.getLowerRecipientRate !== 'function' || typeof typedContract.setRecipientRateRange !== 'function') {
        throw new Error('Recipient rate methods are not available on the current SpCoin contract access path.');
      }
      const lower = normalizeRateValue(await typedContract.getLowerRecipientRate());
      return typedContract.setRecipientRateRange(lower, normalizeRateValue(newUpperRecipientRate));
    },
    setLowerAgentRate: async (newLowerAgentRate: string | number) => {
      if (typeof typedContract.getUpperAgentRate !== 'function' || typeof typedContract.setAgentRateRange !== 'function') {
        throw new Error('Agent rate methods are not available on the current SpCoin contract access path.');
      }
      const upper = normalizeRateValue(await typedContract.getUpperAgentRate());
      return typedContract.setAgentRateRange(normalizeRateValue(newLowerAgentRate), upper);
    },
    setUpperAgentRate: async (newUpperAgentRate: string | number) => {
      if (typeof typedContract.getLowerAgentRate !== 'function' || typeof typedContract.setAgentRateRange !== 'function') {
        throw new Error('Agent rate methods are not available on the current SpCoin contract access path.');
      }
      const lower = normalizeRateValue(await typedContract.getLowerAgentRate());
      return typedContract.setAgentRateRange(lower, normalizeRateValue(newUpperAgentRate));
    },
  };
}

// Convenience factory for tests/stubs that call library modules instead of direct contract methods.
export function createSpCoinModuleAccess(
  contract: Contract,
  signer?: Signer,
  source: SpCoinAccessSource = 'node_modules',
  trace?: (line: string) => void,
): SpCoinModuleAccess {
  const includes = getSpCoinAccessIncludes(source);
  const add = new includes.SpCoinAddModule(contract) as SpCoinAddAccess;
  const del = new includes.SpCoinDeleteModule(contract) as SpCoinDeleteAccess;
  const read = new includes.SpCoinReadModule(contract) as SpCoinReadAccess;
  const attachTrace = (moduleValue: unknown) => {
    if (!trace || !moduleValue || typeof moduleValue !== 'object') return;
    const logger = (moduleValue as { spCoinLogger?: Record<string, unknown> }).spCoinLogger;
    if (!logger || typeof logger !== 'object') return;
    const bindTraceMethod = (methodName: 'log' | 'logDetail' | 'logFunctionHeader') => {
      const original = logger[methodName];
      if (typeof original !== 'function') return;
      logger[methodName] = ((message: unknown) => {
        const text = String(message ?? '');
        if (text.trim()) {
          trace(text);
        }
        return (original as (value: unknown) => unknown).call(logger, message);
      }) as unknown;
    };
    bindTraceMethod('log');
    bindTraceMethod('logDetail');
    bindTraceMethod('logFunctionHeader');
  };
  attachTrace(add);
  attachTrace(del);
  attachTrace(read);
  if (signer) {
    (add as { signer?: Signer }).signer = signer;
    (del as { signer?: Signer }).signer = signer;
    (read as { signer?: Signer }).signer = signer;
  }
  return {
    add,
    del,
    erc20: new includes.SpCoinERC20Module(contract) as NodeSpCoinERC20Module,
    offChain: createSpCoinOffChainAccess(contract, add, read, del, trace),
    read,
    rewards: new includes.SpCoinRewardsModule(contract) as SpCoinRewardsAccess,
    staking: new includes.SpCoinStakingModule(contract) as SpCoinStakingAccess,
    contract: contract as SpCoinContractAccess,
    signer,
  };
}
