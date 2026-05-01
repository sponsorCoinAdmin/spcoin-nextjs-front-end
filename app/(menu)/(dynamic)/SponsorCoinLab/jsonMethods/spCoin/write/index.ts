import { Interface, type Contract } from 'ethers';
import { SPCOIN_WRITE_METHOD_DEFS } from './defs';
export { SPCOIN_WRITE_METHOD_DEFS };
import type { ParamDef } from '../../shared/types';
import {
  attachReceiptGasToOnChainCall,
  buildMethodTimingMeta,
  type MethodTimingCollector,
  type MethodTimingMeta,
} from '@/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
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
  4: 'OWNER_OR_ROOT: msg.sender must be the Sponsor Key or the contract owner/root admin.',
  5: 'Transaction Row Id is out of range for this agent-rate transaction list.',
  6: 'Transaction Row Id does not resolve to an inserted master transaction record.',
  7: 'Transaction Row Id does not match the supplied agent-rate branch keys.',
};
const SP_COIN_ERROR_INTERFACE = new Interface(['error SpCoinError(uint8 code)']);

function getNestedErrorText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const source = value as Record<string, unknown>;
  return [
    source.message,
    source.reason,
    source.shortMessage,
    source.code,
    source.action,
    source.data,
    source.error,
    source.info,
    source.cause,
  ]
    .map(getNestedErrorText)
    .filter(Boolean)
    .join(' ');
}

function decodeSpCoinError(error: unknown): string | null {
  const errorText = getNestedErrorText(error);
  if (/\b(AGENT_TX_OOB|AGENT_TXID_OOB|TX_OOB)\b/i.test(errorText)) {
    return 'Transaction Row Id is out of range for this agent-rate transaction list.';
  }
  if (/\bAGENT_TX_NOT_FOUND\b/i.test(errorText)) {
    return 'Transaction Row Id does not resolve to an inserted master transaction record.';
  }

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
  | 'addRecipientTransaction'
  | 'addAgentTransaction'
  | 'deleteAccountTree'
  | 'deleteSponsor'
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
  | 'setAgentRateRange';

export type SpCoinWriteAlterMode = 'Standard' | 'All' | 'Test' | 'Todo';

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
];

export const SPCOIN_SENDER_WRITE_METHODS: SpCoinWriteMethod[] = [
  'addRecipientTransaction',
  'addAgentTransaction',
  'updateAccountStakingRewards',
  'deleteAccountTree',
  'deleteSponsor',
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
  'deleteAccountRecords',
];

export const SPCOIN_OFFCHAIN_WRITE_METHODS: SpCoinWriteMethod[] = [
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

const OWNER_OR_SPONSOR_WRITE_METHODS = new Set<SpCoinWriteMethod>([
  'addRecipientTransaction',
  'addAgentTransaction',
  'deleteSponsor',
  'deleteRecipient',
  'deleteRecipientRate',
  'deleteAgent',
  'deleteAgentNode',
  'deleteAgentRate',
  'deleteRecipientSponsorships',
  'deleteRecipientSponsorshipTree',
  'deleteAgentSponsorships',
]);

const OWNER_ONLY_WRITE_METHODS = new Set<SpCoinWriteMethod>([
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
]);

const OWNER_OR_ACCOUNT_WRITE_METHODS = new Set<SpCoinWriteMethod>([
  'deleteAccountRecord',
]);

export const SPCOIN_ONCHAIN_WRITE_METHODS: SpCoinWriteMethod[] = (
  Object.keys(SPCOIN_WRITE_METHOD_DEFS) as SpCoinWriteMethod[]
).filter((name) => !SPCOIN_OFFCHAIN_WRITE_METHODS.includes(name));

const ALL_SPCOIN_WRITE_METHODS = Object.keys(SPCOIN_WRITE_METHOD_DEFS) as SpCoinWriteMethod[];

function buildSpCoinWriteMemberList(
  predicate: (name: SpCoinWriteMethod) => boolean,
): Record<SpCoinWriteMethod, boolean> {
  return Object.fromEntries(
    ALL_SPCOIN_WRITE_METHODS.map((name) => [name, predicate(name)]),
  ) as Record<SpCoinWriteMethod, boolean>;
}

export const SPCOIN_WRITE_METHOD_MEMBER_LISTS: Record<
  SpCoinWriteAlterMode,
  Record<SpCoinWriteMethod, boolean>
> = {
  Standard: buildSpCoinWriteMemberList(
    (name) =>
      !SPCOIN_ADMIN_WRITE_METHODS.includes(name) &&
      !SPCOIN_OFFCHAIN_WRITE_METHODS.includes(name) &&
      !SPCOIN_TODO_WRITE_METHODS.includes(name),
  ),
  All: buildSpCoinWriteMemberList(() => true),
  Test: buildSpCoinWriteMemberList(
    (name) => SPCOIN_OFFCHAIN_WRITE_METHODS.includes(name) || SPCOIN_TODO_WRITE_METHODS.includes(name),
  ),
  Todo: buildSpCoinWriteMemberList((name) => SPCOIN_TODO_WRITE_METHODS.includes(name)),
};

export function filterSpCoinWriteMethodsByAlterMode(
  methods: SpCoinWriteMethod[],
  mode: SpCoinWriteAlterMode,
): SpCoinWriteMethod[] {
  const memberList = SPCOIN_WRITE_METHOD_MEMBER_LISTS[mode];
  return methods.filter((name) => Boolean(memberList?.[name]));
}

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
  addAccountRecipient: 'addRecipientTransaction',
  addRecipientTransaction: 'addRecipientTransaction',
  addRecipientRateAmount: 'addRecipientTransaction',
  addSponsorship: 'addRecipientTransaction',
  addAccountRecipientRate: 'addRecipientTransaction',
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
  timingCollector?: MethodTimingCollector | null;
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

function isSameAddress(left: unknown, right: unknown) {
  const normalizedLeft = normalizeAddress(left).toLowerCase();
  const normalizedRight = normalizeAddress(right).toLowerCase();
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function attachActualSigner<T extends Error>(error: T, signerAddress: string) {
  (error as T & { spCoinActualSigner?: string }).spCoinActualSigner = signerAddress;
  return error;
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
  {
    receipts: Array<{
      label: string;
      txHash: string;
      receiptHash: string;
      blockNumber: string;
      status: string;
    }>;
    meta?: MethodTimingMeta;
  }
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
    timingCollector,
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
  const getSignerAddress = async (signer: unknown) => {
    const directAddress = String((signer as { address?: unknown } | null)?.address || '').trim();
    if (directAddress) return directAddress;
    const getAddress = (signer as { getAddress?: unknown } | null)?.getAddress;
    if (typeof getAddress !== 'function') return '';
    return String(await (getAddress as () => Promise<unknown>)()).trim();
  };
  const resolveContractOwner = async (contract: Contract | null) => {
    const owner = (contract as unknown as { owner?: unknown } | null)?.owner;
    if (typeof owner !== 'function') return '';
    try {
      return String(await (owner as () => Promise<unknown>)()).trim();
    } catch {
      return '';
    }
  };
  const assertActualWriteAuthorization = async (contract: Contract | null, signer: unknown) => {
    const signerAddress = await getSignerAddress(signer);
    if (!signerAddress) return;

    const ownerOnly = OWNER_ONLY_WRITE_METHODS.has(canonicalMethod);
    const guardedAccountLabel = OWNER_OR_SPONSOR_WRITE_METHODS.has(canonicalMethod)
      ? 'Sponsor Key'
      : OWNER_OR_ACCOUNT_WRITE_METHODS.has(canonicalMethod)
        ? 'Account Key'
        : '';
    if (!ownerOnly && !guardedAccountLabel) return;

    const contractOwner = await resolveContractOwner(contract);
    if (contractOwner && isSameAddress(signerAddress, contractOwner)) return;

    if (ownerOnly) {
      throw attachActualSigner(
        new Error(
          `${canonicalMethod} requires the contract owner signer. Actual signer is ${signerAddress}.` +
            (contractOwner ? ` Contract owner is ${contractOwner}.` : ''),
        ),
        signerAddress,
      );
    }

    const guardedAccount = findParamValue(guardedAccountLabel);
    if (!guardedAccount || isSameAddress(signerAddress, guardedAccount)) return;

    throw attachActualSigner(
      new Error(
        `${canonicalMethod} requires msg.sender to be ${guardedAccountLabel} or the contract owner. ` +
          `Actual signer is ${signerAddress}; ${guardedAccountLabel} is ${guardedAccount}.` +
          (contractOwner ? ` Contract owner is ${contractOwner}.` : ''),
      ),
      signerAddress,
    );
  };
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
          async (contract: Contract, signer: any) => {
            activeContract = contract;
            activeSigner = signer;
            const access = createSpCoinModuleAccess(contract, signer, spCoinAccessSource, appendWriteTrace);
            appendWriteTrace?.(
              `submitWrite(${label}) contract target=${String((contract as any)?.target || (contract as any)?.address || '')} signer=${String(signer?.address || '')}`,
            );
            await assertActualWriteAuthorization(contract, signer);
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
        attachReceiptGasToOnChainCall(timingCollector, canonicalMethod, tx, receipt);
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
        if (spCoinError) {
          const sponsorKeyParam = findParamValue('Sponsor Key');
          const sponsorKeyAccount = findParamValue('Sponsor Account');
          const sponsorKey = sponsorKeyParam ? sponsorKeyParam : sponsorKeyAccount;
          const signerAddress = String(activeSigner?.address ?? selectedHardhatAddress ?? '').trim();
          const contextMessage =
            spCoinError.startsWith('OWNER_OR_ROOT')
              ? `${spCoinError} signer=${signerAddress ? signerAddress : '(unknown)'} sponsor=${sponsorKey ? sponsorKey : '(unknown)'}`
              : spCoinError;
          const enrichedError = new Error(contextMessage);
          if (signerAddress) {
            (enrichedError as { spCoinActualSigner?: string }).spCoinActualSigner = signerAddress;
          }
          (enrichedError as { code?: unknown }).code = errorCode ? errorCode : 'CALL_EXCEPTION';
          (enrichedError as { reason?: unknown }).reason = spCoinError;
          (enrichedError as { cause?: unknown }).cause = error;
          throw enrichedError;
        }
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
    submitWrite(`deleteAgent(${sponsorKey}, ${recipientKey}, ${recipientRateKey}, ${agentKey})`, (access) => {
      const method = access.contract.deleteAgent ?? access.contract.deleteRecipientAgent;
      if (typeof method !== 'function') {
        throw new Error('deleteAgent is not available on the current SpCoin contract access path.');
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

  const deleteSponsorTree = async (sponsorKey: string) =>
    submitWrite(`deleteSponsor(${sponsorKey})`, (access) => {
      const method = access.contract.deleteSponsor;
      if (typeof method !== 'function') {
        throw new Error('deleteSponsor is not available on the current SpCoin contract access path.');
      }
      return method(sponsorKey);
    });

  switch (canonicalMethod) {
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
        const method = access.contract.deleteAgent ?? access.contract.deleteRecipientAgent;
        if (typeof method !== 'function') {
          throw new Error('deleteAgent is not available on the current SpCoin contract access path.');
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
    case 'deleteSponsor': {
      const sponsorKey = normalizeAddress(methodArgs[0]);
      await deleteSponsorTree(sponsorKey);
      appendLog(`${activeDef.title} -> deleted sponsor tree ${sponsorKey}.`);
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
      const sponsorKey = normalizeAddress(methodArgs[0]);
      if (!sponsorKey) {
        throw new Error(`${activeDef.title} requires Sponsor Key.`);
      }
      const recipientKey = normalizeAddress(methodArgs[1]);
      const recipientRateKey = asStringOrNumber(methodArgs[2]);
      const agentKey = normalizeAddress(methodArgs[3]);
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
  return {
    receipts,
    meta: timingCollector ? buildMethodTimingMeta(timingCollector) : undefined,
  };
}

