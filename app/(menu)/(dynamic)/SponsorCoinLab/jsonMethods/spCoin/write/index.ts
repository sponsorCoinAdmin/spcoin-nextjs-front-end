// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/index.ts
import { Interface, type Contract } from 'ethers';
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

const SP_COIN_ERROR_MESSAGES: Record<number, string> = {
  0: 'RECIP_RATE_NOT_FOUND',
  1: 'AGENT_RATE_NOT_FOUND',
  2: 'RECIP_RATE_HAS_AGENT',
  3: 'AGENT_NOT_FOUND',
  4: 'OWNER_OR_ROOT',
};
const SP_COIN_ERROR_INTERFACE = new Interface(['error SpCoinError(uint8 code)']);

function decodeSpCoinError(error: unknown): string | null {
  const revert = (error as any)?.revert;
  const revertCode = revert?.name === 'SpCoinError' ? Number(revert?.args?.[0]) : NaN;
  if (Number.isFinite(revertCode)) {
    return `${SP_COIN_ERROR_MESSAGES[revertCode] || 'UNKNOWN_SP_COIN_ERROR'} (${revertCode})`;
  }

  const candidates = [
    (error as any)?.data,
    (error as any)?.error?.data,
    (error as any)?.info?.error?.data,
  ].filter((value): value is string => typeof value === 'string' && value.startsWith('0x'));

  for (const data of candidates) {
    try {
      const parsed = SP_COIN_ERROR_INTERFACE.parseError(data);
      if (parsed?.name === 'SpCoinError') {
        const code = Number(parsed.args?.[0]);
        return `${SP_COIN_ERROR_MESSAGES[code] || 'UNKNOWN_SP_COIN_ERROR'} (${code})`;
      }
    } catch {
      // Try the next nested error payload.
    }
  }
  return null;
}

export type SpCoinWriteMethod =
  | 'addRecipient'
  | 'addRecipientTransaction'
  | 'addRecipients'
  | 'addAgent'
  | 'addAgentTransaction'
  | 'addAgents'
  | 'deleteAccountTree'
  | 'deleteRecipient'
  | 'deleteRecipientRate'
  | 'deleteAgent'
  | 'deleteAgentNode'
  | 'deleteAgentRate'
  | 'deleteRecipientSponsorships'
  | 'deleteRecipientSponsorshipTree'
  | 'deleteAgentSponsorships'
  | 'deleteRecipientSponsorRate'
  | 'deleteRecipientTransaction'
  | 'unSponsorAgent'
  | 'addBackDatedRecipientTransaction'
  | 'addBackDatedAgentTransaction'
  | 'backDateRecipientTransaction'
  | 'backDateAgentTransaction'
  | 'deleteRecipientSponsorship'
  | 'deleteAccountRecord'
  | 'deleteAccountRecords'
  | 'updateAccountStakingRewards'
  | 'updateMasterStakingRewards'
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
  'addBackDatedRecipientTransaction',
  'addBackDatedAgentTransaction',
  'backDateRecipientTransaction',
  'backDateAgentTransaction',
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
  'addRecipient',
  'addRecipientTransaction',
  'addAgent',
  'addAgentTransaction',
  'updateAccountStakingRewards',
  'deleteAccountTree',
  'deleteRecipient',
  'deleteRecipientRate',
  'deleteAgent',
  'deleteAgentRate',
  'deleteRecipientSponsorships',
  'deleteRecipientSponsorshipTree',
  'deleteAgentSponsorships',
  'deleteRecipientSponsorRate',
  'deleteRecipientTransaction',
  'deleteAgentNode',
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
  'deleteAccountTree',
  'deleteRecipient',
  'deleteRecipientRate',
  'deleteAgent',
  'deleteAgentRate',
];

const SPCOIN_HIDDEN_WRITE_METHODS = new Set<SpCoinWriteMethod>([
  'deleteRecipientSponsorships',
  'deleteRecipientSponsorshipTree',
  'deleteAgentSponsorships',
  'deleteRecipientSponsorRate',
  'deleteRecipientTransaction',
  'deleteAgentNode',
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
  addSponsorRecipient: 'addRecipient',
  addAccountRecipient: 'addRecipient',
  addRecipientTransaction: 'addRecipientTransaction',
  addRecipientRateAmount: 'addRecipientTransaction',
  addSponsorship: 'addRecipientTransaction',
  addAccountRecipientRate: 'addRecipientTransaction',
  addRecipientAgent: 'addAgent',
  addAgentTransaction: 'addAgentTransaction',
  addAgentRateAmount: 'addAgentTransaction',
  addAgentSponsorship: 'addAgentTransaction',
  addAccountAgentRate: 'addAgentTransaction',
  addBackDatedSponsorship: 'addBackDatedRecipientTransaction',
  addBackDatedRecipientSponsorship: 'addBackDatedRecipientTransaction',
  addBackDatedRecipientTransaction: 'addBackDatedRecipientTransaction',
  addAccountRecipientRateBackdated: 'addBackDatedRecipientTransaction',
  addBackDatedAgentSponsorship: 'addBackDatedAgentTransaction',
  addBackDatedAgentTransaction: 'addBackDatedAgentTransaction',
  addAccountAgentRateBackdated: 'addBackDatedAgentTransaction',
  deleteAccountTree: 'deleteAccountTree',
  delAccountTree: 'deleteAccountTree',
  deleteSponsorRecipient: 'deleteRecipient',
  deleteAgentRateNode: 'deleteAgentRate',
  deleteRecipientAgent: 'deleteAgentSponsorships',
  deleteRecipientSponsorship: 'deleteRecipientSponsorship',
  delRecipient: 'deleteRecipientSponsorship',
  delAccountRecipientSponsorship: 'deleteRecipientRate',
  delAccountRecipientRateAmount: 'deleteRecipientTransaction',
  deleteRecipientTransaction: 'deleteRecipientTransaction',
  deleteRecipientSponsorshipTree: 'deleteRecipientSponsorshipTree',
  delAccountAgent: 'deleteAgentNode',
  deleteAgentSponsorships: 'deleteAgentSponsorships',
  deleteAgentRateAmount: 'deleteAgentRate',
  delAccountAgentSponsorship: 'unSponsorAgent',
  deleteAgentSponsorship: 'unSponsorAgent',
  delAccountRecord: 'deleteAccountRecord',
  deleteAccountRecord: 'deleteAccountRecord',
  delAccountRecords: 'deleteAccountRecords',
  deleteAccountRecords: 'deleteAccountRecords',
  delAccountRecipientRate: 'deleteRecipientSponsorRate',
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
  if (
    (typeof read.getAccountKeys !== 'function' && typeof read.getMasterAccountKeys !== 'function') ||
    typeof read.getAccountRecipientList !== 'function'
  ) {
    throw new Error('updateMasterStakingRewards requires getAccountKeys() and getAccountRecipientList() read methods.');
  }
  const accountList = Array.from(
    (
      (typeof read.getAccountKeys === 'function'
        ? await read.getAccountKeys()
        : await read.getMasterAccountKeys?.()) || []
    ) as unknown[],
  ).map((value) => normalizeAddress(value));
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
  const findParamValue = (label: string) => {
    const index = activeDef.params.findIndex(
      (def) => String(def.label || '').trim().toLowerCase() === String(label || '').trim().toLowerCase(),
    );
    return index >= 0 ? String(spWriteParams[index] || '').trim() : '';
  };
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
      const spCoinError = decodeSpCoinError(error);
      if (
        errorCode === 'CALL_EXCEPTION' &&
        /INSUFFICIENT_BAL/i.test(`${errorReason} ${errorMessage}`) &&
        activeContract &&
        activeSigner &&
        typeof (activeContract as any).balanceOf === 'function'
      ) {
        try {
          const sponsorKey =
            findParamValue('Sponsor Key') ||
            findParamValue('Sponsor Account') ||
            String(activeSigner?.address || selectedHardhatAddress || '').trim();
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
              spCoinError,
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
        : spCoinError || String(error);
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

  const withAccess = async <T,>(
    label: string,
    callback: (access: ReturnType<typeof createSpCoinModuleAccess>, signer: any) => Promise<T>,
  ): Promise<T> =>
    executeWriteConnected(
      label,
      async (contract: Contract, signer: any) =>
        callback(createSpCoinModuleAccess(contract, signer, spCoinAccessSource, appendWriteTrace), signer),
      selectedHardhatAddress,
    );

  const toNormalizedList = (value: unknown): string[] =>
    Array.from(Array.isArray(value) ? value : []).map((entry) => normalizeAddress(entry)).filter(Boolean);

  const callFirstListMethod = async (
    access: ReturnType<typeof createSpCoinModuleAccess>,
    methodNames: string[],
    methodArgsForRead: unknown[],
  ): Promise<string[]> => {
    const hosts = [access.read, access.contract] as Array<Record<string, unknown>>;
    for (const methodName of methodNames) {
      for (const host of hosts) {
        const method = getDynamicMethod(host, methodName);
        if (method) {
          return toNormalizedList(await method(...methodArgsForRead));
        }
      }
    }
    throw new Error(`${methodNames[0]} is not available on the current SpCoin contract access path.`);
  };

  const loadRecipientKeys = async (sponsorKey: string) =>
    withAccess(`loadRecipientKeys(${sponsorKey})`, (access) =>
      callFirstListMethod(access, ['getRecipientKeys', 'getAccountRecipientList', 'getRecipientList'], [sponsorKey]),
    );

  const loadRecipientRateKeys = async (sponsorKey: string, recipientKey: string) =>
    withAccess(`loadRecipientRateList(${sponsorKey}, ${recipientKey})`, (access) =>
      callFirstListMethod(access, ['getRecipientRateList', 'getRecipientRateKeys'], [sponsorKey, recipientKey]),
    );

  const loadRecipientRateAgentKeys = async (sponsorKey: string, recipientKey: string, recipientRateKey: string | number) =>
    withAccess(`loadRecipientRateAgentList(${sponsorKey}, ${recipientKey}, ${recipientRateKey})`, (access) =>
      callFirstListMethod(
        access,
        ['getRecipientRateAgentList', 'getRecipientRateAgentKeys'],
        [sponsorKey, recipientKey, recipientRateKey],
      ),
    );

  const loadAgentRateKeys = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number,
    agentKey: string,
  ) =>
    withAccess(`loadAgentRateList(${sponsorKey}, ${recipientKey}, ${recipientRateKey}, ${agentKey})`, (access) =>
      callFirstListMethod(
        access,
        ['getAgentRateList', 'getAgentRateKeys'],
        [sponsorKey, recipientKey, recipientRateKey, agentKey],
      ),
    );

  const deleteAgentRate = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number,
    agentKey: string,
    agentRateKey: string | number,
  ) =>
    submitWrite(
      `deleteAgentRate(${sponsorKey}, ${recipientKey}, ${recipientRateKey}, ${agentKey}, ${agentRateKey})`,
      (access) => {
        const method = access.contract.deleteAgentRate;
        if (typeof method !== 'function') {
          throw new Error('deleteAgentRate is not available on the current SpCoin contract access path.');
        }
        return method(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
      },
    );

  const deleteRecipientAgentNode = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number,
    agentKey: string,
  ) =>
    submitWrite(`deleteRecipientAgent(${sponsorKey}, ${recipientKey}, ${recipientRateKey}, ${agentKey})`, (access) => {
      const method = access.contract.deleteRecipientAgent;
      if (typeof method !== 'function') {
        throw new Error('deleteRecipientAgent is not available on the current SpCoin contract access path.');
      }
      return method(sponsorKey, recipientKey, recipientRateKey, agentKey);
    });

  const deleteRecipientRate = async (sponsorKey: string, recipientKey: string, recipientRateKey: string | number) =>
    submitWrite(`deleteRecipientRate(${sponsorKey}, ${recipientKey}, ${recipientRateKey})`, (access) => {
      const method = access.contract.deleteRecipientRate;
      if (typeof method !== 'function') {
        throw new Error('deleteRecipientRate is not available on the current SpCoin contract access path.');
      }
      return method(sponsorKey, recipientKey, recipientRateKey);
    });

  const deleteRecipientNode = async (sponsorKey: string, recipientKey: string) =>
    submitWrite(`deleteRecipient(${sponsorKey}, ${recipientKey})`, (access) => {
      const method = access.contract.deleteRecipient;
      if (typeof method !== 'function') {
        throw new Error('deleteRecipient is not available on the current SpCoin contract access path.');
      }
      return method(sponsorKey, recipientKey);
    });

  const deleteAgentTree = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string | number,
    agentKey: string,
  ) => {
    let agentRateKeys = await loadAgentRateKeys(sponsorKey, recipientKey, recipientRateKey, agentKey);
    while (agentRateKeys.length > 0) {
      await deleteAgentRate(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKeys[0]);
      agentRateKeys = await loadAgentRateKeys(sponsorKey, recipientKey, recipientRateKey, agentKey);
    }
    const remainingAgents = await loadRecipientRateAgentKeys(sponsorKey, recipientKey, recipientRateKey);
    if (remainingAgents.includes(normalizeAddress(agentKey))) {
      await deleteRecipientAgentNode(sponsorKey, recipientKey, recipientRateKey, agentKey);
    }
  };

  const deleteRecipientRateTree = async (sponsorKey: string, recipientKey: string, recipientRateKey: string | number) => {
    const agentKeys = await loadRecipientRateAgentKeys(sponsorKey, recipientKey, recipientRateKey);
    for (const agentKey of agentKeys) {
      await deleteAgentTree(sponsorKey, recipientKey, recipientRateKey, agentKey);
    }
    const remainingRateKeys = await loadRecipientRateKeys(sponsorKey, recipientKey);
    if (remainingRateKeys.includes(normalizeAddress(recipientRateKey))) {
      await deleteRecipientRate(sponsorKey, recipientKey, recipientRateKey);
    }
  };

  const deleteSponsorRecipientTree = async (sponsorKey: string, recipientKey: string) => {
    let rateKeys = await loadRecipientRateKeys(sponsorKey, recipientKey);
    while (rateKeys.length > 0) {
      await deleteRecipientRateTree(sponsorKey, recipientKey, rateKeys[0]);
      rateKeys = await loadRecipientRateKeys(sponsorKey, recipientKey);
    }
    const remainingRecipients = await loadRecipientKeys(sponsorKey);
    if (remainingRecipients.includes(normalizeAddress(recipientKey))) {
      await deleteRecipientNode(sponsorKey, recipientKey);
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
    case 'deleteRecipientSponsorRate': {
      await submitWrite(activeDef.title, (access, signer) => {
        const method = access.contract.deleteRecipientRate;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientRate is not available on the current SpCoin contract access path.');
        }
        return method(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]), asStringOrNumber(methodArgs[1]));
      });
      break;
    }
    case 'deleteRecipientTransaction': {
      await submitWrite(activeDef.title, (access, signer) => {
        const method = access.contract.deleteRecipientRate;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientRate is not available on the current SpCoin contract access path.');
        }
        return method(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]), asStringOrNumber(methodArgs[1]));
      });
      break;
    }
    case 'deleteAgentNode': {
      await submitWrite(activeDef.title, (access, signer) => {
        const method = access.contract.deleteRecipientAgent;
        if (typeof method !== 'function') {
          throw new Error('deleteRecipientAgent is not available on the current SpCoin contract access path.');
        }
        return method(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]), asStringOrNumber(methodArgs[1]), asString(methodArgs[2]));
      });
      break;
    }
    case 'addBackDatedRecipientTransaction': {
      const qty = String(methodArgs[3]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedRecipientTransaction(
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
    case 'addBackDatedAgentTransaction': {
      const qty = String(methodArgs[5]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedAgentTransaction(
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
    case 'backDateRecipientTransaction': {
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.backDateRecipientTransaction(
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
    case 'backDateAgentTransaction': {
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.backDateAgentTransaction(
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
    case 'addRecipient': {
      await submitWrite(activeDef.title, (access) => {
        const method = access.add.addSponsorRecipient;
        if (typeof method === 'function') {
          return method(asString(methodArgs[0]), asString(methodArgs[1]));
        }
        const contractMethod = access.contract.addSponsorRecipient;
        if (typeof contractMethod !== 'function') {
          throw new Error('addSponsorRecipient is not available on the current SpCoin contract access path.');
        }
        return contractMethod(asString(methodArgs[0]), asString(methodArgs[1]));
      });
      break;
    }
    case 'addRecipientTransaction': {
      const qty = String(methodArgs[3]);
      await submitWrite(activeDef.title, (access, signer) => {
        const sponsorKey = asString(methodArgs[0]);
        const signerAddress = asString(signer?.address || selectedHardhatAddress || '');
        const sponsorMatchesSigner =
          sponsorKey.trim().toLowerCase() === signerAddress.trim().toLowerCase();
        if (sponsorMatchesSigner && typeof access.add.addSponsorship === 'function') {
          return access.add.addSponsorship(
            signer,
            asString(methodArgs[1]),
            asStringOrNumber(methodArgs[2]),
            qty,
          );
        }
        const addRecipientTransaction = access.add.addRecipientTransaction ?? access.add.addRecipientTransaction;
        if (typeof addRecipientTransaction !== 'function') {
          throw new Error('addRecipientTransaction is not available on the current SpCoin access path.');
        }
        return addRecipientTransaction(
          sponsorKey,
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          qty,
        );
      });
      break;
    }
    case 'addAgent': {
      await submitWrite(activeDef.title, (access) =>
        access.add.addRecipientAgent(
          asString(methodArgs[0]),
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
        ),
      );
      break;
    }
    case 'addAgentTransaction': {
      const qty = String(methodArgs[5]);
      await submitWriteWithFetchRetry(activeDef.title, (access, signer) => {
        const sponsorKey = asString(methodArgs[0]);
        const signerAddress = asString(signer?.address || selectedHardhatAddress || '');
        const sponsorMatchesSigner =
          sponsorKey.trim().toLowerCase() === signerAddress.trim().toLowerCase();
        if (sponsorMatchesSigner && typeof access.add.addAgentSponsorship === 'function') {
          return access.add.addAgentSponsorship(
            signer,
            asString(methodArgs[1]),
            asStringOrNumber(methodArgs[2]),
            asString(methodArgs[3]),
            asStringOrNumber(methodArgs[4]),
            qty,
          );
        }
        const addAgentTransaction = access.add.addAgentTransaction ?? access.add.addAgentTransaction;
        if (typeof addAgentTransaction !== 'function') {
          throw new Error('addAgentTransaction is not available on the current SpCoin access path.');
        }
        return addAgentTransaction(
          sponsorKey,
          asString(methodArgs[1]),
          asStringOrNumber(methodArgs[2]),
          asString(methodArgs[3]),
          asStringOrNumber(methodArgs[4]),
          qty,
        );
      });
      break;
    }
    case 'deleteRecipient': {
      const sponsorKey = normalizeAddress(methodArgs[0]);
      const recipientKey = normalizeAddress(methodArgs[1]);
      await deleteSponsorRecipientTree(sponsorKey, recipientKey);
      appendLog(`${activeDef.title} -> deleted recipient sponsorship tree ${sponsorKey} -> ${recipientKey}.`);
      break;
    }
    case 'deleteRecipientRate':
    case 'deleteRecipientSponsorshipTree': {
      const sponsorKey = normalizeAddress(methodArgs[0]);
      const recipientKey = normalizeAddress(methodArgs[1]);
      const recipientRateKey = asStringOrNumber(methodArgs[2]);
      await deleteRecipientRateTree(sponsorKey, recipientKey, recipientRateKey);
      appendLog(`${activeDef.title} -> deleted recipient-rate branch ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}.`);
      break;
    }
    case 'deleteRecipientSponsorships': {
      const sponsorKey = normalizeAddress(methodArgs[0]);
      const recipientKey = normalizeAddress(methodArgs[1]);
      await deleteSponsorRecipientTree(sponsorKey, recipientKey);
      appendLog(`${activeDef.title} -> deleted all recipient sponsorships ${sponsorKey} -> ${recipientKey}.`);
      break;
    }
    case 'deleteAgent':
    case 'deleteAgentSponsorships': {
      const sponsorKey =
        canonicalMethod === 'deleteAgent'
          ? normalizeAddress(await withAccess('resolveSignerForDeleteAgent', async (_access, signer) => asString(signer?.address || selectedHardhatAddress || '')))
          : normalizeAddress(methodArgs[0]);
      if (!sponsorKey) {
        throw new Error(`${activeDef.title} requires a connected signer or selected Hardhat sponsor account.`);
      }
      const recipientKey = normalizeAddress(canonicalMethod === 'deleteAgent' ? methodArgs[0] : methodArgs[1]);
      const recipientRateKey = asStringOrNumber(canonicalMethod === 'deleteAgent' ? methodArgs[1] : methodArgs[2]);
      const agentKey = normalizeAddress(canonicalMethod === 'deleteAgent' ? methodArgs[2] : methodArgs[3]);
      await deleteAgentTree(sponsorKey, recipientKey, recipientRateKey, agentKey);
      appendLog(`${activeDef.title} -> deleted agent sponsorship tree ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}.`);
      break;
    }
    case 'deleteAgentRate': {
      const sponsorKey = normalizeAddress(methodArgs[0]);
      const recipientKey = normalizeAddress(methodArgs[1]);
      const recipientRateKey = asStringOrNumber(methodArgs[2]);
      const agentKey = normalizeAddress(methodArgs[3]);
      const agentRateKey = asStringOrNumber(methodArgs[4]);
      await deleteAgentRate(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
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
        const deleteRecipient = access.contract.deleteRecipient;
        if (typeof deleteRecipient !== 'function') {
          throw new Error('deleteRecipient is not available on the current SpCoin contract access path.');
        }
        return deleteRecipient(asString(signer?.address || selectedHardhatAddress || ''), asString(methodArgs[0]));
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
        const deleteAgentRate = access.contract.deleteAgentRate;
        if (typeof deleteAgentRate !== 'function') {
          throw new Error('deleteAgentRate is not available on the current SpCoin contract access path.');
        }
        return deleteAgentRate(
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

