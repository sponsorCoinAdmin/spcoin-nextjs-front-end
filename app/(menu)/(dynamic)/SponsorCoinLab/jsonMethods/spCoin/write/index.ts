// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/index.ts
import type { Contract } from 'ethers';
import { SPCOIN_WRITE_METHOD_DEFS } from './defs';
export { SPCOIN_WRITE_METHOD_DEFS };
import type { ParamDef } from '../../shared/types';
import {
  createSpCoinModuleAccess,
  type SpCoinAccessSource,
  type SpCoinAddAccess,
  type SpCoinDeleteAccess,
  type SpCoinOffChainAccess,
  type SpCoinReadAccess,
  type SpCoinRewardsAccess,
  type SpCoinStakingAccess,
  type SpCoinContractAccess,
} from '../../shared';

export type SpCoinWriteMethod =
  | 'addAccountSponsor'
  | 'addAccountRecipient'
  | 'addAccountRecipientRate'
  | 'addRecipients'
  | 'addAgent'
  | 'addAccountAgentRate'
  | 'addAgents'
  | 'delAccountTree'
  | 'delAccountSponsor'
  | 'delAccountRecipient'
  | 'delAccountRecipientRate'
  | 'delAccountRecipientRateAmount'
  | 'delAccountAgent'
  | 'delAccountAgentRate'
  | 'delAccountAgentRateAmount'
  | 'delAccountAgentSponsorship'
  | 'addAccountRecipientRateBackdated'
  | 'addAccountAgentRateBackdated'
  | 'unSponsorRecipient'
  | 'delRecipient'
  | 'delAccountRecord'
  | 'delAccountRecords'
  | 'updateAccountStakingRewards'
  | 'updateAgentAccountRewards'
  | 'updateRecipietAccountRewards'
  | 'updateSponsorAccountRewards'
  | 'depositSponsorStakingRewards'
  | 'depositRecipientStakingRewards'
  | 'depositAgentStakingRewards'
  | 'depositStakingRewards'
  | 'setInflationRate'
  | 'setLowerRecipientRate'
  | 'setUpperRecipientRate'
  | 'setRecipientRateRange'
  | 'setLowerAgentRate'
  | 'setUpperAgentRate'
  | 'setAgentRateRange'
  | 'setVersion';

export const SPCOIN_ADMIN_WRITE_METHODS: SpCoinWriteMethod[] = [
  'delAccountTree',
  'addAccountRecipientRateBackdated',
  'addAccountAgentRateBackdated',
  'setInflationRate',
  'setLowerRecipientRate',
  'setUpperRecipientRate',
  'setRecipientRateRange',
  'setLowerAgentRate',
  'setUpperAgentRate',
  'setAgentRateRange',
  'setVersion',
];

export const SPCOIN_SENDER_WRITE_METHODS: SpCoinWriteMethod[] = [
  'addAccountRecipient',
  'addAccountRecipientRate',
  'addAccountAgentRate',
  'delAccountSponsor',
  'delAccountRecipient',
  'delAccountRecipientRate',
  'delAccountRecipientRateAmount',
  'delAccountAgent',
  'delAccountAgentRate',
  'delAccountAgentRateAmount',
  'delAccountAgentSponsorship',
  'unSponsorRecipient',
  'delRecipient',
  'delAccountRecord',
];

export const SPCOIN_TODO_WRITE_METHODS: SpCoinWriteMethod[] = [
  'addAgent',
  'addRecipients',
  'addAgents',
  'delAccountRecords',
];

export const SPCOIN_OFFCHAIN_WRITE_METHODS: SpCoinWriteMethod[] = [
  'addRecipients',
  'addAgents',
  'delAccountTree',
];

export const SPCOIN_ONCHAIN_WRITE_METHODS: SpCoinWriteMethod[] = (
  Object.keys(SPCOIN_WRITE_METHOD_DEFS) as SpCoinWriteMethod[]
).filter((name) => !SPCOIN_OFFCHAIN_WRITE_METHODS.includes(name));

export function getSpCoinWorldWriteOptions(hideUnexecutables: boolean): SpCoinWriteMethod[] {
  return getSpCoinWriteOptions(hideUnexecutables).filter(
    (name) =>
      !SPCOIN_ADMIN_WRITE_METHODS.includes(name) &&
      !SPCOIN_SENDER_WRITE_METHODS.includes(name) &&
      !SPCOIN_TODO_WRITE_METHODS.includes(name),
  );
}

export function getSpCoinSenderWriteOptions(hideUnexecutables: boolean): SpCoinWriteMethod[] {
  return getSpCoinWriteOptions(hideUnexecutables).filter((name) => SPCOIN_SENDER_WRITE_METHODS.includes(name));
}

export function getSpCoinTodoWriteOptions(hideUnexecutables: boolean): SpCoinWriteMethod[] {
  return getSpCoinWriteOptions(hideUnexecutables).filter((name) => SPCOIN_TODO_WRITE_METHODS.includes(name));
}

export function getSpCoinAdminWriteOptions(hideUnexecutables: boolean): SpCoinWriteMethod[] {
  return getSpCoinWriteOptions(hideUnexecutables).filter((name) => SPCOIN_ADMIN_WRITE_METHODS.includes(name));
}

export function getSpCoinWriteOptions(hideUnexecutables: boolean): SpCoinWriteMethod[] {
  const all = (Object.keys(SPCOIN_WRITE_METHOD_DEFS) as SpCoinWriteMethod[]).sort((a, b) => a.localeCompare(b));
  if (!hideUnexecutables) return all;
  return all.filter((name) => SPCOIN_WRITE_METHOD_DEFS[name].executable !== false);
}

const LEGACY_WRITE_METHOD_RENAMES: Partial<Record<string, SpCoinWriteMethod>> = {
  addSponsor: 'addAccountSponsor',
  addRecipient: 'addAccountRecipient',
  addRecipientRateAmount: 'addAccountRecipientRate',
  addAgentRateAmount: 'addAccountAgentRate',
  addAgentSponsorship: 'addAccountAgentRate',
  addBackDatedSponsorship: 'addAccountRecipientRateBackdated',
  addBackDatedAgentSponsorship: 'addAccountAgentRateBackdated',
  deleteAccountTree: 'delAccountTree',
  deleteSponsor: 'delAccountSponsor',
  deleteRecipient: 'delAccountRecipient',
  deleteRecipientRate: 'delAccountRecipientRate',
  deleteRecipientRateAmount: 'delAccountRecipientRateAmount',
  deleteAgent: 'delAccountAgent',
  deleteAgentRate: 'delAccountAgentRate',
  deleteAgentRateAmount: 'delAccountAgentRateAmount',
  deleteAgentSponsorship: 'delAccountAgentSponsorship',
  deleteAccountRecord: 'delAccountRecord',
  deleteAccountRecords: 'delAccountRecords',
};

export function normalizeSpCoinWriteMethod(method: string): SpCoinWriteMethod {
  return (LEGACY_WRITE_METHOD_RENAMES[method] || method) as SpCoinWriteMethod;
}

type RunArgs = {
  selectedMethod: SpCoinWriteMethod;
  spWriteParams: string[];
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: Contract, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  selectedHardhatAddress?: string;
  spCoinAccessSource?: SpCoinAccessSource;
  appendLog: (line: string) => void;
  appendWriteTrace?: (line: string) => void;
  setStatus: (value: string) => void;
};

function getDynamicMethod(target: Record<string, unknown>, method: string) {
  const candidate = target[method];
  return typeof candidate === 'function' ? (candidate as (...args: unknown[]) => unknown) : undefined;
}

function asString(value: unknown): string {
  return String(value);
}

function asStringOrNumber(value: unknown): string | number {
  return typeof value === 'number' ? value : String(value);
}

export async function runSpCoinWriteMethod(args: RunArgs): Promise<
  Array<{
    label: string;
    txHash: string;
    receiptHash: string;
    blockNumber: string;
    status: string;
  }>
> {
  const {
    selectedMethod,
    spWriteParams,
    coerceParamValue,
    executeWriteConnected,
    selectedHardhatAddress,
    spCoinAccessSource = 'node_modules',
    appendLog,
    appendWriteTrace,
    setStatus,
  } = args;
  if (
    selectedMethod === ('addAccountRecord' as string) ||
    selectedMethod === ('addAccountRecords' as string) ||
    selectedMethod === ('deleteAgentRecord' as string)
  ) {
    throw new Error(
      `${selectedMethod} is not available because it is not exposed as a callable public contract method in the current SpCoin access path.`,
    );
  }
  const canonicalMethod = normalizeSpCoinWriteMethod(selectedMethod);
  const activeDef = SPCOIN_WRITE_METHOD_DEFS[canonicalMethod];
  if (!activeDef) {
    throw new Error(`Unsupported SpCoin write method: ${String(selectedMethod)}`);
  }
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spWriteParams[idx], def));
  const receipts: Array<{
    label: string;
    txHash: string;
    receiptHash: string;
    blockNumber: string;
    status: string;
  }> = [];
  const submitWrite = async (
    label: string,
    writeCall: (access: ReturnType<typeof createSpCoinModuleAccess>, signer: any) => Promise<any>,
  ) => {
    setStatus(`Submitting ${label}...`);
    appendWriteTrace?.(`submitWrite(${label}) start`);
    let activeContract: Contract | null = null;
    let activeSigner: any = null;
    try {
      const tx = await executeWriteConnected(
        label,
        (contract: Contract, signer: any) => {
          activeContract = contract;
          activeSigner = signer;
          const access = createSpCoinModuleAccess(contract, signer, spCoinAccessSource, appendWriteTrace);
          appendWriteTrace?.(
            `submitWrite(${label}) contract target=${String((contract as any)?.target || (contract as any)?.address || '')} signer=${String(signer?.address || '')}`,
          );
          return writeCall(access, signer);
        },
        selectedHardhatAddress,
      );
      appendWriteTrace?.(`submitWrite(${label}) tx returned=${tx ? 'yes' : 'no'} hash=${String(tx?.hash || '')}`);
      appendLog(`${label} tx sent: ${String(tx?.hash || '(no hash)')}`);
      if (!tx || typeof tx.wait !== 'function') {
        throw new Error(`${label} did not return a transaction response.`);
      }
      const receipt = await tx.wait();
      appendWriteTrace?.(`submitWrite(${label}) receipt status=${String(receipt?.status ?? '')} hash=${String(receipt?.hash || tx?.hash || '')}`);
      appendLog(`${label} mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
      receipts.push({
        label,
        txHash: String(tx?.hash || ''),
        receiptHash: String(receipt?.hash || tx?.hash || ''),
        blockNumber: String(receipt?.blockNumber ?? ''),
        status: String(receipt?.status ?? ''),
      });
    } catch (error) {
      const errorCode = String((error as any)?.code || '');
      const errorReason = String((error as any)?.reason || '');
      const errorMessage = String((error as any)?.message || '');
      if (
        errorCode === 'CALL_EXCEPTION' &&
        /INSUFFICIENT_BAL/i.test(`${errorReason} ${errorMessage}`) &&
        activeContract &&
        activeSigner &&
        typeof (activeContract as any).balanceOf === 'function'
      ) {
        try {
          const sponsorKey = String(activeSigner?.address || selectedHardhatAddress || '').trim();
          const balanceRaw = await (activeContract as any).balanceOf(sponsorKey);
          const enrichedMessage = `INSUFFICIENT_BAL: sponsor ${sponsorKey} balanceOf=${String(balanceRaw)}`;
          appendWriteTrace?.(`submitWrite(${label}) insufficient balance detail=${enrichedMessage}`);
          appendLog(`${label} failed: ${enrichedMessage}`);
          const enrichedError = new Error(enrichedMessage);
          (enrichedError as any).code = errorCode;
          (enrichedError as any).reason = errorReason || 'INSUFFICIENT_BAL';
          (enrichedError as any).cause = error;
          throw enrichedError;
        } catch (balanceLookupError) {
          appendWriteTrace?.(
            `submitWrite(${label}) insufficient balance lookup failed=${String((balanceLookupError as any)?.message || balanceLookupError)}`,
          );
        }
      }
      const detail = error && typeof error === 'object'
        ? JSON.stringify(
            {
              message: (error as any)?.message,
              reason: (error as any)?.reason,
              code: (error as any)?.code,
              action: (error as any)?.action,
              data: (error as any)?.data,
              shortMessage: (error as any)?.shortMessage,
              info: (error as any)?.info,
              error: (error as any)?.error,
            },
            null,
            2,
          )
        : String(error);
      appendWriteTrace?.(`submitWrite(${label}) failed detail=${detail}`);
      appendLog(`${label} failed: ${detail}`);
      throw error;
    }
  };

  switch (canonicalMethod) {
    case 'addRecipients': {
      const recipientList = methodArgs[1] as string[];
      await submitWrite(activeDef.title, (access) => access.offChain.addRecipients(asString(methodArgs[0]), recipientList));
      break;
    }
    case 'addAgents': {
      const agentList = methodArgs[2] as string[];
      await submitWrite(activeDef.title, (access) =>
        access.offChain.addAgents(asString(methodArgs[0]), asStringOrNumber(methodArgs[1]), agentList),
      );
      break;
    }
    case 'delAccountTree': {
      const accountKey = asString(methodArgs[0]);
      setStatus(`Submitting ${activeDef.title}...`);
      appendWriteTrace?.(`submitWorkflow(${activeDef.title}) start`);
      const summary = await executeWriteConnected(
        activeDef.title,
        (contract: Contract, signer: any) => {
          appendWriteTrace?.(`submitWorkflow(${activeDef.title}) build access start`);
          const access = createSpCoinModuleAccess(contract, signer, spCoinAccessSource, appendWriteTrace);
          access.del.signer = signer;
          appendWriteTrace?.(`submitWorkflow(${activeDef.title}) offChain.deleteAccountTree enter`);
          return access.offChain.deleteAccountTree(accountKey);
        },
        selectedHardhatAddress,
      );
      appendWriteTrace?.(`submitWorkflow(${activeDef.title}) complete summary=${JSON.stringify(summary)}`);
      appendLog(`${activeDef.title} complete: ${JSON.stringify(summary)}`);
      break;
    }
    case 'delAccountSponsor': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteSponsor;
        if (typeof method !== 'function') {
          throw new Error('deleteSponsor is not available on the current SpCoin contract access path.');
        }
        return method();
      });
      break;
    }
    case 'delAccountRecipient': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteRecipient;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipient is not available on the current SpCoin contract access path.');
        }
        return method(asString(methodArgs[0]));
      });
      break;
    }
    case 'delAccountRecipientRate': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteRecipientRate;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientRate is not available on the current SpCoin contract access path.');
        }
        return method(asString(methodArgs[0]), asStringOrNumber(methodArgs[1]));
      });
      break;
    }
    case 'delAccountRecipientRateAmount': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteRecipientRateAmount;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientRateAmount is not available on the current SpCoin contract access path.');
        }
        return method(asString(methodArgs[0]), asStringOrNumber(methodArgs[1]));
      });
      break;
    }
    case 'delAccountAgent': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteAgent;
        if (typeof method !== 'function') {
          throw new Error('deleteAgent is not available on the current SpCoin contract access path.');
        }
        return method(asString(methodArgs[0]), asStringOrNumber(methodArgs[1]), asString(methodArgs[2]));
      });
      break;
    }
    case 'delAccountAgentRate': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteAgentRate;
        if (typeof method !== 'function') {
          throw new Error('deleteAgentRate is not available on the current SpCoin contract access path.');
        }
        return method(
          asString(methodArgs[0]),
          asStringOrNumber(methodArgs[1]),
          asString(methodArgs[2]),
          asStringOrNumber(methodArgs[3]),
        );
      });
      break;
    }
    case 'delAccountAgentRateAmount': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteAgentRateAmount;
        if (typeof method !== 'function') {
          throw new Error('deleteAgentRateAmount is not available on the current SpCoin contract access path.');
        }
        return method(
          asString(methodArgs[0]),
          asStringOrNumber(methodArgs[1]),
          asString(methodArgs[2]),
          asStringOrNumber(methodArgs[3]),
        );
      });
      break;
    }
    case 'addAccountRecipientRateBackdated': {
      const qty = `${String(methodArgs[5])}.${String(methodArgs[6])}`;
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedAgentSponsorship(
          signer,
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
          asStringOrNumber(methodArgs[4]),
          qty,
          Number(methodArgs[7]),
        ),
      );
      break;
    }
    case 'addAccountAgentRateBackdated': {
      const qty = String(methodArgs[5]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedAgentSponsorship(
          signer,
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
          asStringOrNumber(methodArgs[4]),
          qty,
          Number(methodArgs[6]),
        ),
      );
      break;
    }
    case 'addAccountRecipient': {
      await submitWrite(activeDef.title, (access) => access.add.addRecipient(asString(methodArgs[0])));
      break;
    }
    case 'addAccountRecipientRate': {
      const qty = String(methodArgs[2]);
      await submitWrite(activeDef.title, (access) =>
        access.add.addRecipientRateAmount(
          asString(methodArgs[0]),
          asStringOrNumber(methodArgs[1]),
          qty,
        ),
      );
      break;
    }
    case 'addAccountSponsor': {
      await submitWrite(activeDef.title, (access) => access.add.addSponsor(asString(methodArgs[0])));
      break;
    }
    case 'addAgent': {
      await submitWrite(activeDef.title, (access) =>
        access.add.addAgent(asString(methodArgs[0]), asStringOrNumber(methodArgs[1]), asString(methodArgs[2])),
      );
      break;
    }
    case 'addAccountAgentRate': {
      const qty = String(methodArgs[4]);
      await submitWrite(activeDef.title, (access) =>
        access.add.addAgentRateAmount(
          asString(methodArgs[0]),
          asStringOrNumber(methodArgs[1]),
          asString(methodArgs[2]),
          asStringOrNumber(methodArgs[3]),
          qty,
        ),
      );
      break;
    }
    case 'delAccountRecords': {
      const accountList = methodArgs[0] as string[];
      for (const accountKey of accountList) {
        await submitWrite(`delAccountRecord(${accountKey})`, (access) => access.del.deleteAccountRecord(accountKey));
      }
      break;
    }
    case 'unSponsorRecipient': {
      await submitWrite(activeDef.title, (access) => {
        const unSponsorRecipient = access.contract.unSponsorRecipient;
        if (typeof unSponsorRecipient !== 'function') {
          throw new Error('unSponsorRecipient is not available on the current SpCoin contract access path.');
        }
        return unSponsorRecipient(asString(methodArgs[0]));
      });
      break;
    }
    case 'delRecipient': {
      await submitWrite(activeDef.title, (access, signer) => {
        const delRecipient = access.contract.delRecipient;
        if (typeof delRecipient !== 'function') {
          throw new Error('delRecipient is not available on the current SpCoin contract access path.');
        }
        return delRecipient(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]));
      });
      break;
    }
    case 'delAccountRecord': {
      await submitWrite(activeDef.title, (access, signer) => {
        access.del.signer = signer;
        return access.del.deleteAccountRecord(asString(methodArgs[0]));
      });
      break;
    }
    case 'updateAccountStakingRewards': {
      await submitWrite(activeDef.title, (access) => access.rewards.updateAccountStakingRewards(asString(methodArgs[0])));
      break;
    }
    case 'depositSponsorStakingRewards': {
      await submitWrite(activeDef.title, (access) =>
        access.staking.depositSponsorStakingRewards(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          methodArgs[3] as string | number | bigint,
        ),
      );
      break;
    }
    case 'depositRecipientStakingRewards': {
      await submitWrite(activeDef.title, (access) =>
        access.staking.depositRecipientStakingRewards(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          methodArgs[3] as string | number | bigint,
        ),
      );
      break;
    }
    case 'depositAgentStakingRewards': {
      await submitWrite(activeDef.title, (access) =>
        access.staking.depositAgentStakingRewards(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
          asStringOrNumber(methodArgs[4]),
          methodArgs[5] as string | number | bigint,
        ),
      );
      break;
    }
    case 'setLowerRecipientRate': {
      await submitWrite(activeDef.title, (access) => access.offChain.setLowerRecipientRate(asStringOrNumber(methodArgs[0])));
      break;
    }
    case 'setUpperRecipientRate': {
      await submitWrite(activeDef.title, (access) => access.offChain.setUpperRecipientRate(asStringOrNumber(methodArgs[0])));
      break;
    }
    case 'setLowerAgentRate': {
      await submitWrite(activeDef.title, (access) => access.offChain.setLowerAgentRate(asStringOrNumber(methodArgs[0])));
      break;
    }
    case 'setUpperAgentRate': {
      await submitWrite(activeDef.title, (access) => access.offChain.setUpperAgentRate(asStringOrNumber(methodArgs[0])));
      break;
    }
    default:
      await submitWrite(`${activeDef.title}(${methodArgs.join(', ')})`, async (access) => {
        const readFn = getDynamicMethod(access.read as SpCoinReadAccess & Record<string, unknown>, selectedMethod);
        const addFn = getDynamicMethod(access.add as SpCoinAddAccess & Record<string, unknown>, selectedMethod);
        const delFn = getDynamicMethod(access.del as SpCoinDeleteAccess & Record<string, unknown>, selectedMethod);
        const offChainFn = getDynamicMethod(access.offChain as SpCoinOffChainAccess & Record<string, unknown>, selectedMethod);
        const stakingFn = getDynamicMethod(access.staking as SpCoinStakingAccess & Record<string, unknown>, selectedMethod);
        const rewardsFn = getDynamicMethod(access.rewards as SpCoinRewardsAccess & Record<string, unknown>, selectedMethod);
        const contractFn = getDynamicMethod(access.contract as SpCoinContractAccess & Record<string, unknown>, selectedMethod);
        if (typeof addFn === 'function') return await addFn(...methodArgs);
        if (typeof delFn === 'function') return await delFn(...methodArgs);
        if (typeof offChainFn === 'function') return await offChainFn(...methodArgs);
        if (typeof stakingFn === 'function') return await stakingFn(...methodArgs);
        if (typeof rewardsFn === 'function') return await rewardsFn(...methodArgs);
        if (typeof readFn === 'function') return await readFn(...methodArgs);
        if (!contractFn) {
          throw new Error(`SpCoin write method ${selectedMethod} is not available on access modules or contract.`);
        }
        return await contractFn(...methodArgs);
      });
      break;
  }

  setStatus(`${activeDef.title} complete.`);
  return receipts;
}

