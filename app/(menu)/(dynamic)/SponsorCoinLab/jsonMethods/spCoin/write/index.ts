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
  | 'addSponsorRecipientBranch'
  | 'addRecipientRateTransaction'
  | 'addRecipients'
  | 'addRecipientAgentBranch'
  | 'addAgentRateTransaction'
  | 'addAgents'
  | 'deleteSponsor'
  | 'deleteSponsorTree'
  | 'deleteSponsorRecipientBranch'
  | 'deleteRecipientRateBranch'
  | 'deleteRecipientAgentBranch'
  | 'deleteAgentRateBranch'
  | 'deleteRecipientSponsorships'
  | 'deleteRecipientSponsorshipTree'
  | 'deleteAgentSponsorships'
  | 'deleteRecipientRateSponsorship'
  | 'deleteRecipientRateAmount'
  | 'deleteAgent'
  | 'unSponsorAgent'
  | 'addBackDatedRecipientRateTransaction'
  | 'addBackDatedAgentRateTransaction'
  | 'backDateRecipientTransactionDate'
  | 'backDateAgentTransactionDate'
  | 'deleteRecipientSponsorship'
  | 'deleteAccountRecord'
  | 'deleteAccountRecords'
  | 'updateAccountStakingRewards'
  | 'updateMasterStakingRewards'
  | 'depositSponsorStakingRewards'
  | 'depositRecipientStakingRewards'
  | 'depositAgentStakingRewards'
  | 'setInflationRate'
  | 'setLowerRecipientRate'
  | 'setUpperRecipientRate'
  | 'setRecipientRateRange'
  | 'setLowerAgentRate'
  | 'setUpperAgentRate'
  | 'setAgentRateRange'
  | 'setVersion';

export const SPCOIN_ADMIN_WRITE_METHODS: SpCoinWriteMethod[] = [
  'updateMasterStakingRewards',
  'addBackDatedRecipientRateTransaction',
  'addBackDatedAgentRateTransaction',
  'backDateRecipientTransactionDate',
  'backDateAgentTransactionDate',
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
  'addSponsorRecipientBranch',
  'addRecipientRateTransaction',
  'addRecipientAgentBranch',
  'addAgentRateTransaction',
  'updateAccountStakingRewards',
  'deleteSponsorTree',
  'deleteSponsorRecipientBranch',
  'deleteRecipientRateBranch',
  'deleteRecipientAgentBranch',
  'deleteAgentRateBranch',
  'deleteRecipientSponsorships',
  'deleteRecipientSponsorshipTree',
  'deleteAgentSponsorships',
  'deleteSponsor',
  'deleteRecipientRateSponsorship',
  'deleteRecipientRateAmount',
  'deleteAgent',
  'unSponsorAgent',
  'deleteRecipientSponsorship',
  'deleteAccountRecord',
];

export const SPCOIN_TODO_WRITE_METHODS: SpCoinWriteMethod[] = [
  'addRecipients',
  'addAgents',
  'deleteAccountRecords',
];

export const SPCOIN_OFFCHAIN_WRITE_METHODS: SpCoinWriteMethod[] = [
  'addRecipients',
  'addAgents',
  'deleteSponsorTree',
  'deleteSponsorRecipientBranch',
  'deleteRecipientRateBranch',
  'deleteRecipientAgentBranch',
  'deleteAgentRateBranch',
];

const SPCOIN_HIDDEN_WRITE_METHODS = new Set<SpCoinWriteMethod>([
  'deleteSponsor',
  'deleteRecipientSponsorships',
  'deleteRecipientSponsorshipTree',
  'deleteAgentSponsorships',
  'deleteRecipientRateSponsorship',
  'deleteRecipientRateAmount',
  'deleteAgent',
  'deleteRecipientSponsorship',
  'unSponsorAgent',
]);

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
  const all = (Object.keys(SPCOIN_WRITE_METHOD_DEFS) as SpCoinWriteMethod[])
    .filter((name) => !SPCOIN_HIDDEN_WRITE_METHODS.has(name))
    .sort((a, b) => a.localeCompare(b));
  if (!hideUnexecutables) return all;
  return all.filter((name) => SPCOIN_WRITE_METHOD_DEFS[name].executable !== false);
}

const LEGACY_WRITE_METHOD_RENAMES: Partial<Record<string, SpCoinWriteMethod>> = {
  addRecipient: 'addSponsorRecipientBranch',
  addAccountRecipient: 'addSponsorRecipientBranch',
  addRecipientRateAmount: 'addRecipientRateTransaction',
  addRecipientRateBranchAmount: 'addRecipientRateTransaction',
  addSponsorship: 'addRecipientRateTransaction',
  addAccountRecipientRate: 'addRecipientRateTransaction',
  addAgent: 'addRecipientAgentBranch',
  addAgentRateAmount: 'addAgentRateTransaction',
  addAgentRateBranchAmount: 'addAgentRateTransaction',
  addAgentSponsorship: 'addAgentRateTransaction',
  addAccountAgentRate: 'addAgentRateTransaction',
  addBackDatedSponsorship: 'addBackDatedRecipientRateTransaction',
  addBackDatedRecipientSponsorship: 'addBackDatedRecipientRateTransaction',
  addBackDatedRecipientRateAmount: 'addBackDatedRecipientRateTransaction',
  addBackDatedRecipientRateTransaction: 'addBackDatedRecipientRateTransaction',
  addAccountRecipientRateBackdated: 'addBackDatedRecipientRateTransaction',
  addBackDatedAgentSponsorship: 'addBackDatedAgentRateTransaction',
  addBackDatedRecipientAgentRateAmount: 'addBackDatedAgentRateTransaction',
  addBackDatedAgentRateAmount: 'addBackDatedAgentRateTransaction',
  addBackDatedAgentRateTransaction: 'addBackDatedAgentRateTransaction',
  addAccountAgentRateBackdated: 'addBackDatedAgentRateTransaction',
  deleteAccountTree: 'deleteSponsor',
  delAccountTree: 'deleteSponsor',
  deleteRecipient: 'deleteRecipientSponsorship',
  deleteRecipientSponsorship: 'deleteRecipientSponsorship',
  deleteRecipientRate: 'deleteRecipientRateSponsorship',
  delRecipient: 'deleteRecipientSponsorship',
  delAccountRecipientSponsorship: 'deleteRecipientRateBranch',
  delAccountRecipientRateAmount: 'deleteRecipientRateAmount',
  deleteRecipientRateAmount: 'deleteRecipientRateAmount',
  deleteRecipientSponsorshipTree: 'deleteRecipientRateBranch',
  delAccountAgent: 'deleteAgent',
  deleteAgent: 'deleteAgent',
  deleteAgentSponsorships: 'deleteRecipientAgentBranch',
  deleteAgentRate: 'deleteAgentRateBranch',
  deleteAgentRateAmount: 'deleteAgentRateBranch',
  delAccountAgentSponsorship: 'unSponsorAgent',
  deleteAgentSponsorship: 'unSponsorAgent',
  delAccountRecord: 'deleteAccountRecord',
  deleteAccountRecord: 'deleteAccountRecord',
  delAccountRecords: 'deleteAccountRecords',
  deleteAccountRecords: 'deleteAccountRecords',
  delAccountRecipientRate: 'deleteRecipientRateSponsorship',
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

function normalizeAddress(value: unknown): string {
  const trimmed = String(value ?? '').trim();
  return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
}

async function loadSponsorAccounts(access: ReturnType<typeof createSpCoinModuleAccess>) {
  const read = access.read as SpCoinReadAccess & Record<string, unknown>;
  if (typeof read.getAccountList !== 'function' || typeof read.getAccountRecipientList !== 'function') {
    throw new Error('updateMasterStakingRewards requires getAccountList() and getAccountRecipientList() read methods.');
  }
  const accountList = Array.from((await read.getAccountList()) as unknown[]).map((value) => normalizeAddress(value));
  const recipientLists = await Promise.all(
    accountList.map(async (account) => {
      const recipients = Array.from((await read.getAccountRecipientList(account)) as unknown[]).map((value) =>
        normalizeAddress(value),
      );
      return { account, recipients };
    }),
  );
  return recipientLists.filter((entry) => entry.recipients.length > 0).map((entry) => entry.account);
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
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const getErrorText = (error: unknown): string => {
    const parts = [
      (error as { message?: unknown } | null)?.message,
      (error as { shortMessage?: unknown } | null)?.shortMessage,
      (error as { reason?: unknown } | null)?.reason,
      (error as { info?: { error?: { message?: unknown } } } | null)?.info?.error?.message,
      (error as { error?: { message?: unknown } } | null)?.error?.message,
      error,
    ];
    return parts.map((part) => String(part || '')).join(' ');
  };
  const isTransientFetchError = (error: unknown) => /failed to fetch/i.test(getErrorText(error));
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
  const submitWriteWithFetchRetry = async (
    label: string,
    writeCall: (access: ReturnType<typeof createSpCoinModuleAccess>, signer: any) => Promise<any>,
    maxAttempts = 3,
  ) => {
    appendWriteTrace?.(`submitWrite(${label}) fetch-retry wrapper active; maxAttempts=${maxAttempts}`);
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        appendWriteTrace?.(`submitWrite(${label}) fetch-retry attempt ${attempt}/${maxAttempts}`);
        if (attempt > 1) {
          appendWriteTrace?.(`submitWrite(${label}) retry attempt ${attempt}/${maxAttempts} after transient fetch failure`);
          appendLog(`${label} retrying after transient fetch failure (${attempt}/${maxAttempts})...`);
        }
        return await submitWrite(label, writeCall);
      } catch (error) {
        appendWriteTrace?.(
          `submitWrite(${label}) fetch-retry caught attempt ${attempt}/${maxAttempts}; transient=${String(isTransientFetchError(error))}; text=${getErrorText(error)}`,
        );
        if (attempt >= maxAttempts || !isTransientFetchError(error)) {
          throw error;
        }
        await sleep(1000 * attempt);
      }
    }
  };

  switch (canonicalMethod) {
    case 'addRecipients': {
      const recipientList = methodArgs[1] as string[];
      await submitWrite(activeDef.title, (access) => access.offChain.addRecipients(asString(methodArgs[0]), recipientList));
      break;
    }
    case 'addAgents': {
      const agentList = methodArgs[3] as string[];
      await submitWrite(activeDef.title, (access) =>
        access.offChain.addAgents(asString(methodArgs[0]), asString(methodArgs[1]), asStringOrNumber(methodArgs[2]), agentList),
      );
      break;
    }
    case 'deleteSponsor': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.contract.deleteSponsor;
        if (typeof method !== 'function') {
          throw new Error('deleteSponsor is not available on the current SpCoin contract access path.');
        }
        return method(asString(methodArgs[0]));
      });
      break;
    }
    case 'deleteRecipientRateSponsorship': {
      await submitWrite(activeDef.title, (access, signer) => {
        const method = access.contract.deleteRecipientRateBranch;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientRateBranch is not available on the current SpCoin contract access path.');
        }
        return method(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]), asStringOrNumber(methodArgs[1]));
      });
      break;
    }
    case 'deleteRecipientRateAmount': {
      await submitWrite(activeDef.title, (access, signer) => {
        const method = access.contract.deleteRecipientRateBranch;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientRateBranch is not available on the current SpCoin contract access path.');
        }
        return method(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]), asStringOrNumber(methodArgs[1]));
      });
      break;
    }
    case 'deleteAgent': {
      await submitWrite(activeDef.title, (access, signer) => {
        const method = access.contract.deleteRecipientAgentBranch;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientAgentBranch is not available on the current SpCoin contract access path.');
        }
        return method(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]), asStringOrNumber(methodArgs[1]), asString(methodArgs[2]));
      });
      break;
    }
    case 'addBackDatedRecipientRateTransaction': {
      const qty = String(methodArgs[3]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedRecipientRateTransaction(
          signer,
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          qty,
          Number(methodArgs[4]),
        ),
      );
      break;
    }
    case 'addBackDatedAgentRateTransaction': {
      const qty = String(methodArgs[5]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedAgentRateTransaction(
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
    case 'backDateRecipientTransactionDate': {
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.backDateRecipientTransactionDate(
          signer,
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asStringOrNumber(methodArgs[3]),
          Number(methodArgs[4]),
        ),
      );
      break;
    }
    case 'backDateAgentTransactionDate': {
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.backDateAgentTransactionDate(
          signer,
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
          asStringOrNumber(methodArgs[4]),
          asStringOrNumber(methodArgs[5]),
          Number(methodArgs[6]),
        ),
      );
      break;
    }
    case 'addSponsorRecipientBranch': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.add.addSponsorRecipientBranch;
        if (typeof method === 'function') {
          return method(asString(methodArgs[0]), asString(methodArgs[1]));
        }
        const contractMethod = access.contract.addSponsorRecipientBranch;
        if (typeof contractMethod !== 'function') {
          throw new Error('addSponsorRecipientBranch is not available on the current SpCoin contract access path.');
        }
        return contractMethod(asString(methodArgs[0]), asString(methodArgs[1]));
      });
      break;
    }
    case 'addRecipientRateTransaction': {
      const qty = String(methodArgs[3]);
      await submitWrite(activeDef.title, (access) =>
        access.add.addRecipientRateTransaction(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          qty,
        ),
      );
      break;
    }
    case 'addRecipientAgentBranch': {
      await submitWrite(activeDef.title, (access) =>
        access.add.addRecipientAgentBranch(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
        ),
      );
      break;
    }
    case 'addAgentRateTransaction': {
      const qty = String(methodArgs[5]);
      await submitWriteWithFetchRetry(activeDef.title, (access) =>
        access.add.addAgentRateTransaction(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
          asStringOrNumber(methodArgs[4]),
          qty,
        ),
      );
      break;
    }
    case 'deleteAccountRecords': {
      const accountList = methodArgs[0] as string[];
      for (const accountKey of accountList) {
        await submitWrite(`deleteAccountRecord(${accountKey})`, (access) => access.del.deleteAccountRecord(accountKey));
      }
      break;
    }
    case 'deleteRecipientSponsorship': {
      await submitWrite(activeDef.title, (access, signer) => {
        const delRecipient = access.contract.delRecipient;
        if (typeof delRecipient !== 'function') {
          throw new Error('delRecipient is not available on the current SpCoin contract access path.');
        }
        return delRecipient(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]));
      });
      break;
    }
    case 'deleteAccountRecord': {
      await submitWrite(activeDef.title, (access, signer) => {
        access.del.signer = signer;
        return access.del.deleteAccountRecord(asString(methodArgs[0]));
      });
      break;
    }
    case 'unSponsorAgent': {
      await submitWrite(`${activeDef.title}(${methodArgs.join(', ')})`, (access, signer) => {
        const deleteAgentRateBranch = access.contract.deleteAgentRateBranch;
        if (typeof deleteAgentRateBranch !== 'function') {
          throw new Error('deleteAgentRateBranch is not available on the current SpCoin contract access path.');
        }
        return deleteAgentRateBranch(
          asString(signer?.address || selectedHardhatAddress || ''),
          asString(methodArgs[0]),
          asStringOrNumber(methodArgs[1]),
          asString(methodArgs[2]),
          asStringOrNumber(methodArgs[3]),
        );
      });
      break;
    }
    case 'updateAccountStakingRewards': {
      await submitWrite(activeDef.title, (access) => access.rewards.updateAccountStakingRewards(asString(methodArgs[0])));
      break;
    }
    case 'updateMasterStakingRewards': {
      setStatus('Loading master sponsor accounts...');
      const sponsorAccounts = await executeWriteConnected(
        `${activeDef.title}:loadSponsorAccounts`,
        async (contract: Contract, signer: any) => {
          const access = createSpCoinModuleAccess(contract, signer, spCoinAccessSource, appendWriteTrace);
          return await loadSponsorAccounts(access);
        },
        selectedHardhatAddress,
      );
      const normalizedSponsorAccounts = Array.from(
        new Set((Array.isArray(sponsorAccounts) ? sponsorAccounts : []).map((value) => normalizeAddress(value)).filter(Boolean)),
      );
      if (normalizedSponsorAccounts.length === 0) {
        appendLog(`${activeDef.title} skipped: no sponsor accounts found.`);
        setStatus(`${activeDef.title} skipped (no sponsor accounts).`);
        break;
      }
      for (const sponsorAccount of normalizedSponsorAccounts) {
        await submitWrite(`${activeDef.title}(${sponsorAccount})`, (access) =>
          access.rewards.updateAccountStakingRewards(sponsorAccount),
        );
      }
      appendLog(`${activeDef.title} -> updated ${normalizedSponsorAccounts.length} sponsor account(s).`);
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

