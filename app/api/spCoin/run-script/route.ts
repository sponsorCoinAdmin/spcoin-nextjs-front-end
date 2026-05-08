import { promises as fs } from 'fs';
import path from 'path';
import { JsonRpcProvider, Wallet, Contract, Interface, Transaction } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import { createSpCoinModuleAccess, type SpCoinAccessSource } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessIncludes';
import { getSpCoinLabAbi } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAbi';
import {
  attachReceiptGasToOnChainCall,
  buildMethodTimingMeta,
  createMethodTimingCollector,
  runWithMethodTimingCollector,
  wrapContractWithTiming,
  type MethodTimingCollector,
  type MethodTimingMeta,
} from '@/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import { CHAIN_ID } from '@/lib/structure';
import { getDefaultNetworkSettings } from '@/lib/utils/network/defaultSettings';
import {
  getCachedAccountRecord,
  setCachedAccountRecord,
  invalidateCachedAccountRecord as invalidatePersistentAccountRecord,
} from '@/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/accountCache';
import { invalidateReadCacheForAccount } from '@/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/readCache';

type LabScriptParam = {
  key: string;
  value: string;
};

function invalidateCachedAccountRecord(contractAddress: string, accountKey: string): void {
  invalidatePersistentAccountRecord(contractAddress, accountKey);
  invalidateReadCacheForAccount(accountKey);
}

type LabScriptStep = {
  step: number;
  name: string;
  panel: string;
  method: string;
  params?: LabScriptParam[] | Record<string, unknown>;
  breakpoint?: boolean;
  hasMissingRequiredParams?: boolean;
  network?: string;
  mode?: 'metamask' | 'hardhat';
  'msg.sender'?: string;
};

type LabScript = {
  id: string;
  name: string;
  network?: string;
  steps: LabScriptStep[];
};

type RunScriptRequest = {
  script?: LabScript;
  contractAddress?: string;
  rpcUrl?: string;
  writeRpcUrl?: string;
  startIndex?: number;
  stopAfterCurrentStep?: boolean;
  spCoinAccessSource?: SpCoinAccessSource;
  compareOfflineRewards?: boolean;
  useCache?: boolean;
  cacheMode?: 'default' | 'refresh' | 'bypass' | 'only';
  cacheNamespace?: string;
  traceCache?: boolean;
};

type StepPayload =
  | {
      call: {
        method: string;
        parameters: Record<string, string> | [];
      };
      result?: unknown;
      warning?: unknown;
      meta?: Partial<MethodTimingMeta> & Record<string, unknown>;
      onChainCalls?: MethodTimingMeta['onChainCalls'];
    }
  | {
      call: {
        method: string;
        parameters: Record<string, string> | [];
      };
      error: {
        message: string;
        name: string;
        classification?: 'token_state' | 'token_revert' | 'transport' | 'server';
        stack?: { message?: string };
        debug: {
          panel: string;
          source: string;
          method: string;
          trace: string[];
          rpcTransport?: RpcTransportDiagnostic;
        };
      };
      rpcTransport?: RpcTransportDiagnostic;
      meta?: MethodTimingMeta;
    };

type StepResult = {
  step: number;
  success: boolean;
  payload: StepPayload;
};

const hardhatDefaultSettings = getDefaultNetworkSettings(CHAIN_ID.HARDHAT_BASE) as {
  networkHeader?: { rpcUrl?: string };
};
const DEFAULT_SERVER_HARDHAT_RPC_URL =
  String(hardhatDefaultSettings?.networkHeader?.rpcUrl || '').trim() ||
  'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a';
const DEFAULT_SERVER_HARDHAT_WRITE_RPC_URL = String(
  process.env.SPCOIN_HARDHAT_WRITE_RPC_URL ||
    process.env.HARDHAT_WRITE_RPC_URL ||
    process.env.SPCOIN_WRITE_RPC_URL ||
    '',
).trim();
const RPC_TRANSPORT_PROBE_TIMEOUT_MS = 5_000;
const TEST_ACCOUNTS_PATH = path.join(
  process.cwd(),
  'public',
  'assets',
  'spCoinLab',
  'networks',
  '31337',
  'testAccounts.json',
);

function createServerHardhatProvider(rpcUrl: string) {
  return new JsonRpcProvider(rpcUrl, CHAIN_ID.HARDHAT_BASE, {
    batchMaxCount: 1,
    staticNetwork: true,
  });
}

type RpcTransportDiagnostic = {
  probedAt: string;
  rpcHost: string;
  rpcPathLength: number;
  role: 'read' | 'write';
  method: string;
  httpStatus?: number;
  httpStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBodyPreview?: string;
  responseJsonRpcError?: unknown;
  durationMs: number;
  error?: string;
};

const SP_COIN_ERROR_MESSAGES: Record<number, string> = {
  0: 'RECIP_RATE_NOT_FOUND',
  1: 'AGENT_RATE_NOT_FOUND',
  2: 'RECIP_RATE_HAS_AGENT',
  3: 'AGENT_NOT_FOUND',
  4: 'OWNER_OR_ROOT: msg.sender must be the Sponsor Key or the contract owner/root admin.',
  5: 'ZERO_ADDRESS',
  6: 'INSUFFICIENT_BALANCE',
  7: 'ROOT_ADMIN_ONLY',
  8: 'DUPLICATE_RELATIONSHIP',
  9: 'INFLATION_OUT_OF_RANGE',
  10: 'RECIPIENT_RATE_OUT_OF_RANGE',
  11: 'RECIPIENT_RATE_INCREMENT',
  12: 'RECIPIENT_INCREMENT_ZERO',
  13: 'AGENT_RATE_OUT_OF_RANGE',
  14: 'AGENT_RATE_INCREMENT',
  15: 'AGENT_INCREMENT_ZERO',
  16: 'AMOUNT_ZERO',
  17: 'ACCOUNT_NOT_FOUND',
  18: 'RECIPIENT_NOT_FOUND',
  19: 'RECIPIENT_HAS_SPONSOR',
  20: 'AGENT_HAS_PARENT',
  21: 'SPONSOR_HAS_RECIPIENT',
  22: 'RECIPIENT_TRANSACTION_OOB',
  23: 'AGENT_TRANSACTION_OOB',
};
const SP_COIN_ERROR_INTERFACE = new Interface(['error SpCoinError(uint8 code)']);
const MASTER_ACCOUNT_METADATA_INTERFACE = new Interface([
  'function getMasterAccountMetaData() view returns (uint256 masterAccountSize, uint256 activeAccountCount, uint256 inactiveAccountCount, uint256 totalSponsorLinks, uint256 totalRecipientLinks, uint256 totalAgentLinks, uint256 totalParentRecipientLinks)',
]);
const MASTER_ACCOUNT_METADATA_ABI_FIELDS = [
  'masterAccountSize',
  'activeAccountCount',
  'inactiveAccountCount',
  'totalSponsorLinks',
  'totalRecipientLinks',
  'totalAgentLinks',
  'totalParentRecipientLinks',
] as const;
const MASTER_ACCOUNT_METADATA_FIELDS = [...MASTER_ACCOUNT_METADATA_ABI_FIELDS].sort((a, b) => a.localeCompare(b));

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
      // Keep looking through nested provider error payloads.
    }
  }
  return null;
}

function isMissingContractReadError(error: unknown) {
  const source = (error && typeof error === 'object' ? error : {}) as Record<string, unknown>;
  const nested = ((source.error || source.info || source.cause) && typeof (source.error || source.info || source.cause) === 'object'
    ? (source.error || source.info || source.cause)
    : {}) as Record<string, unknown>;
  const code = String(source.code || nested.code || '');
  const data = String(source.data || nested.data || '');
  const message = String(source.message || nested.message || '');
  return code === 'CALL_EXCEPTION' || data === '0x' || /execution reverted|require\(false\)|no matching fragment/i.test(message);
}

function normalizeMasterAccountMetaData(result: unknown) {
  const source = (result && typeof result === 'object' ? result : []) as Record<string, unknown> & { [index: number]: unknown };
  const values = Object.fromEntries(
    MASTER_ACCOUNT_METADATA_ABI_FIELDS.map((field, index) => [field, source[field] ?? source[index]]),
  );
  return Object.fromEntries(MASTER_ACCOUNT_METADATA_FIELDS.map((field) => [field, values[field]]));
}

async function callMasterAccountMetaData(contract: unknown) {
  const source = contract as {
    target?: unknown;
    getAddress?: () => Promise<string>;
    runner?: { call?: (transaction: { to: string; data: string }) => Promise<string> };
  };
  const target = String(source?.target || (typeof source?.getAddress === 'function' ? await source.getAddress() : ''));
  const runner = source?.runner;
  if (!target || typeof runner?.call !== 'function') {
    throw new Error('getMasterAccountMetaData is not available on the current SpCoin contract.');
  }
  const data = MASTER_ACCOUNT_METADATA_INTERFACE.encodeFunctionData('getMasterAccountMetaData', []);
  const raw = await runner.call({ to: target, data });
  return normalizeMasterAccountMetaData(MASTER_ACCOUNT_METADATA_INTERFACE.decodeFunctionResult('getMasterAccountMetaData', raw));
}

function getMasterAccountMetaDataCount(metaData: unknown) {
  const source = (metaData && typeof metaData === 'object' ? metaData : []) as Record<string, unknown> & { [index: number]: unknown };
  return Number(source.masterAccountSize ?? source.numberOfAccounts ?? source[0] ?? 0);
}

function classifyScriptError(error: unknown, trace: string[]): 'token_state' | 'token_revert' | 'transport' | 'server' {
  const message = String((error as { message?: unknown } | null)?.message || error || '').toLowerCase();
  const stack = String((error as { stack?: unknown } | null)?.stack || '').toLowerCase();
  const combined = `${message}\n${stack}\n${trace.join('\n').toLowerCase()}`;

  if (
    combined.includes('receipt was mined but neither isaccountinserted') ||
    combined.includes('recipient inserted visibility fallback') ||
    combined.includes('sponsor recipient visibility fallback')
  ) {
    return 'token_state';
  }

  if (
    combined.includes('execution reverted') ||
    combined.includes('reverted on-chain') ||
    combined.includes('recip_') ||
    combined.includes('agent_') ||
    combined.includes('account_not_found') ||
    combined.includes('owner_or_root') ||
    combined.includes('root_only')
  ) {
    return 'token_revert';
  }

  if (
    combined.includes('econnrefused') ||
    combined.includes('failed to fetch') ||
    combined.includes('network error') ||
    combined.includes('503 service temporarily unavailable') ||
    combined.includes('server response 503') ||
    combined.includes('socket hang up') ||
    combined.includes('timeout') ||
    combined.includes('missing response') ||
    combined.includes('could not coalesce error')
  ) {
    return 'transport';
  }

  return 'server';
}

function getRpcEndpointIdentity(rpcUrl: string) {
  try {
    const parsed = new URL(rpcUrl);
    return {
      rpcHost: parsed.host,
      rpcPathLength: parsed.pathname.length,
    };
  } catch {
    return {
      rpcHost: '(invalid rpc url)',
      rpcPathLength: 0,
    };
  }
}

function pickRpcDiagnosticHeaders(headers: Headers) {
  const names = [
    'server',
    'date',
    'retry-after',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
    'x-request-id',
    'via',
  ];
  return names.reduce<Record<string, string>>((next, name) => {
    const value = headers.get(name);
    if (value) next[name] = value;
    return next;
  }, {});
}

async function probeRpcTransport(rpcUrl: string, role: 'read' | 'write'): Promise<RpcTransportDiagnostic> {
  const startedAtMs = Date.now();
  const { rpcHost, rpcPathLength } = getRpcEndpointIdentity(rpcUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TRANSPORT_PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    const responseText = await response.text();
    let responseJsonRpcError: unknown;
    try {
      const parsed = JSON.parse(responseText) as { error?: unknown };
      responseJsonRpcError = parsed?.error;
    } catch {
      responseJsonRpcError = undefined;
    }

    return {
      probedAt: new Date().toISOString(),
      rpcHost,
      rpcPathLength,
      role,
      method: 'eth_blockNumber',
      httpStatus: response.status,
      httpStatusText: response.statusText,
      responseHeaders: pickRpcDiagnosticHeaders(response.headers),
      responseBodyPreview: responseText.slice(0, 240),
      ...(responseJsonRpcError ? { responseJsonRpcError } : {}),
      durationMs: Math.max(0, Date.now() - startedAtMs),
    };
  } catch (error) {
    return {
      probedAt: new Date().toISOString(),
      rpcHost,
      rpcPathLength,
      role,
      method: 'eth_blockNumber',
      durationMs: Math.max(0, Date.now() - startedAtMs),
      error: getNestedErrorText(error) || String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

function toComparableString(value: unknown) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return '';
}

function isSameAddress(left: unknown, right: unknown) {
  const normalizedLeft = normalizeAddress(toComparableString(left));
  const normalizedRight = normalizeAddress(toComparableString(right));
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function normalizeParams(params: LabScriptStep['params']): Array<{ key: string; value: string }> {
  if (Array.isArray(params)) {
    return params.map((entry) => ({
      key: String(entry?.key || '').trim(),
      value: String(entry?.value || '').trim(),
    }));
  }

  if (params && typeof params === 'object') {
    return Object.entries(params).map(([key, value]) => ({
      key: String(key || '').trim(),
      value: String(value ?? '').trim(),
    }));
  }

  return [];
}

function sanitizeJsonValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeJsonValue(entry));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const entries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
    key,
    sanitizeJsonValue(entryValue),
  ]);
  return Object.fromEntries(entries);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isMasterAccountMetaDataStep(step: LabScriptStep) {
  return step.panel === 'spcoin_rread' && String(step.method || '').trim() === 'getMasterAccountMetaData';
}

function buildMasterAccountMetaDataPayload(
  call: { method: string; parameters: Record<string, string> | [] },
  result: unknown,
  warning: unknown,
  meta: MethodTimingMeta,
) {
  const metadata = isObjectRecord(result) ? result : {};
  return {
    call,
    ...(warning ? { warning } : {}),
    meta: {
      startedAt: meta.startedAt,
      completedAt: meta.completedAt,
      offChainRunTimeMs: meta.offChainRunTimeMs,
      onChainRunTimeMs: meta.onChainRunTimeMs,
      totalRunTimeMS: meta.totalRunTimeMs,
      onChainCallCount: meta.onChainCallCount,
      activeAccountCount: metadata.activeAccountCount,
      inactiveAccountCount: metadata.inactiveAccountCount,
      masterAccountSize: metadata.masterAccountSize ?? metadata.numberOfAccounts,
    },
    result: {
      masterAccountKeys: { __lazyMasterAccountKeys: true },
    },
    onChainCalls: meta.onChainCalls,
  };
}

function normalizeAddressDisplay(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function toNonNegativeCount(value: unknown): number {
  const count = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function normalizeAddressListResult(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  if (typeof (value as { toArray?: () => unknown[] }).toArray === 'function') {
    return (value as { toArray: () => unknown[] }).toArray().map((entry) => String(entry));
  }
  if (typeof (value as { length?: unknown })?.length === 'number') {
    return Array.from(value as ArrayLike<unknown>, (entry) => String(entry));
  }
  return [];
}

function buildLazyAccountRelation(accountKey: string, relation: string, countValue: unknown) {
  return {
    __lazyAccountRelation: true,
    accountKey,
    relation,
    count: toNonNegativeCount(countValue),
  };
}

function hasAccountRecordCounts(result: unknown) {
  return Boolean(
    result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      ('sponsorCount' in result ||
        'recipientCount' in result ||
        'agentCount' in result ||
        'parentRecipientCount' in result ||
        'active' in result),
  );
}

function normalizeOnChainAccountRecordResult(result: unknown, requestedAccountKey: unknown) {
  if (!Array.isArray(result) || result.length < 10) return result;
  const [
    accountKey,
    creationTime,
    accountBalance,
    stakedAccountSPCoins,
    accountStakingRewards,
    sponsorCount,
    recipientCount,
    agentCount,
    parentRecipientCount,
    active,
  ] = result;
  const normalizedCreationTime = String(creationTime ?? '0').trim();
  const normalizedBalance = String(accountBalance ?? '0').trim();
  const normalizedStaked = String(stakedAccountSPCoins ?? '0').trim();
  const normalizedStakingRewards = String(accountStakingRewards ?? '0').trim();
  const normalizedAccountKey = normalizeAddressDisplay(accountKey || requestedAccountKey);
  return {
    TYPE: '--ACCOUNT--',
    accountKey: normalizedAccountKey,
    creationTime: normalizedCreationTime === '0' ? '' : normalizedCreationTime,
    accountStakingRewards: normalizedStakingRewards,
    totalSpCoins: {
      TYPE: '--TOTAL_SP_COINS--',
      totalSpCoins: (BigInt(normalizedBalance || '0') + BigInt(normalizedStaked || '0')).toString(),
      balanceOf: normalizedBalance,
      stakedBalance: normalizedStaked,
      sponsorRewardRate: '0%',
      pendingRewards: {
        TYPE: '--PENDING_REWARDS--',
        pendingRewards: '0',
        pendingSponsorRewards: '0',
        pendingRecipientRewards: '0',
        pendingAgentRewards: '0',
      },
    },
    sponsorCount: String(sponsorCount ?? '0'),
    recipientCount: String(recipientCount ?? '0'),
    agentCount: String(agentCount ?? '0'),
    parentRecipientCount: String(parentRecipientCount ?? '0'),
    active: Boolean(active),
    sponsorKeys: buildLazyAccountRelation(normalizedAccountKey, 'sponsorKeys', sponsorCount),
    recipientKeys: buildLazyAccountRelation(normalizedAccountKey, 'recipientKeys', recipientCount),
    recipientRates: {},
    agentKeys: buildLazyAccountRelation(normalizedAccountKey, 'agentKeys', agentCount),
    agentRates: {},
    parentRecipientKeys: buildLazyAccountRelation(normalizedAccountKey, 'parentRecipientKeys', parentRecipientCount),
  };
}

function isEmptyNormalizedAccountRecord(result: unknown) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return false;
  const record = result as Record<string, unknown>;
  const totalSpCoins =
    record.totalSpCoins && typeof record.totalSpCoins === 'object' && !Array.isArray(record.totalSpCoins)
      ? (record.totalSpCoins as Record<string, unknown>)
      : null;
  const sponsorKeys = Array.isArray(record.sponsorKeys) ? record.sponsorKeys : [];
  const recipientKeys = Array.isArray(record.recipientKeys) ? record.recipientKeys : [];
  const agentKeys = Array.isArray(record.agentKeys) ? record.agentKeys : [];
  const parentRecipientKeys = Array.isArray(record.parentRecipientKeys) ? record.parentRecipientKeys : [];
  return (
    String(record.creationTime ?? '').trim() === '' &&
    String(totalSpCoins?.totalSpCoins ?? '0').trim() === '0' &&
    sponsorKeys.length === 0 &&
    recipientKeys.length === 0 &&
    agentKeys.length === 0 &&
    parentRecipientKeys.length === 0
  );
}

function buildCall(step: LabScriptStep, sender: string, paramEntries: Array<{ key: string; value: string }>) {
  const parameters: Record<string, string> = {};
  if (sender) {
    parameters['msg.sender'] = sender;
  }
  paramEntries.forEach((entry) => {
    if (entry.key) parameters[entry.key] = entry.value;
  });
  return {
    method: String(step.method || '').trim(),
    parameters,
  };
}

async function readHardhatAccounts() {
  const raw = await fs.readFile(TEST_ACCOUNTS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Array<{ address?: string; privateKey?: string }>;
  if (!Array.isArray(parsed)) {
    throw new Error('Hardhat testAccounts.json must contain an array.');
  }
  return parsed
    .map((entry) => ({
      address: String(entry?.address || '').trim(),
      privateKey: String(entry?.privateKey || '').trim(),
    }))
    .filter((entry) => entry.address && entry.privateKey);
}

function formatReceiptResult(
  label: string,
  tx: { hash?: string } | null | undefined,
  receipt:
    | {
        hash?: string;
        blockNumber?: bigint | number | null;
        status?: number | bigint | null;
        gasUsed?: bigint | number | string | null;
        gasPrice?: bigint | number | string | null;
        effectiveGasPrice?: bigint | number | string | null;
        fee?: bigint | number | string | null;
      }
    | null
    | undefined,
  timingCollector?: MethodTimingCollector,
) {
  attachReceiptGasToOnChainCall(timingCollector, label, tx, receipt);
  return [
    {
      label,
      txHash: String(tx?.hash || ''),
      receiptHash: String(receipt?.hash || tx?.hash || ''),
      blockNumber: String(receipt?.blockNumber ?? ''),
      status: String(receipt?.status ?? ''),
    },
  ];
}

type SignedTransactionResult = {
  hash: string;
  wait: () => Promise<unknown>;
  gasPrice?: bigint | null;
};

function isRetryableRpcTransportError(error: unknown) {
  const message = String((error as { message?: unknown } | null)?.message || error || '').toLowerCase();
  const code = String((error as { code?: unknown } | null)?.code || '').toLowerCase();
  return (
    code === 'server_error' ||
    message.includes('503') ||
    message.includes('service temporarily unavailable') ||
    message.includes('missing response') ||
    message.includes('socket hang up') ||
    message.includes('timeout') ||
    message.includes('network error') ||
    message.includes('could not coalesce error')
  );
}

async function sendSignedContractTransaction(params: {
  label: string;
  contract: Contract;
  signer: Wallet;
  provider: JsonRpcProvider;
  method: string;
  args: unknown[];
  timingCollector?: MethodTimingCollector;
}) {
  const { label, contract, signer, provider, method, args, timingCollector } = params;
  const fn = contract.getFunction(method);
  const request = await fn.populateTransaction(...args);
  const populated = await signer.populateTransaction({
    ...request,
    from: signer.address,
  });
  const signedTransaction = await signer.signTransaction(populated);
  const hash = String(Transaction.from(signedTransaction).hash || '');
  const startedAtMs = Date.now();
  let response: SignedTransactionResult | null = null;
  let lastError: unknown = null;
  let timingEntry: { onChainRunTimeMs: number; broadcastMs?: string; receiptWaitMs?: string } | null = null;

  try {
    response = await provider.broadcastTransaction(signedTransaction);
  } catch (error) {
    lastError = error;
    const knownReceipt = hash ? await provider.getTransactionReceipt(hash).catch(() => null) : null;
    if (knownReceipt) {
      response = {
        hash,
        gasPrice: knownReceipt.gasPrice,
        wait: async () => knownReceipt,
      };
    } else {
      const knownTransaction = hash ? await provider.getTransaction(hash).catch(() => null) : null;
      if (knownTransaction) {
        response = {
          hash,
          gasPrice: knownTransaction.gasPrice,
          wait: () => knownTransaction.wait(),
        };
      } else if (!isRetryableRpcTransportError(error)) {
        throw error;
      }
    }
  }

  const broadcastMs = Math.max(0, Date.now() - startedAtMs);
  if (timingCollector) {
    timingEntry = {
      method: label,
      onChainRunTimeMs: broadcastMs,
      broadcastMs: String(broadcastMs),
    } as { onChainRunTimeMs: number; broadcastMs?: string; receiptWaitMs?: string };
    timingCollector.onChainCalls.push(timingEntry as (typeof timingCollector.onChainCalls)[number]);
  }

  if (!response) {
    const message =
      `RPC did not confirm broadcast for signed transaction ${hash || '(hash unavailable)'}. ` +
      `The same signed transaction was submitted without changing nonce or payload.`;
    const nextError = new Error(message);
    (nextError as Error & { cause?: unknown; code?: string; txHash?: string }).cause = lastError;
    (nextError as Error & { cause?: unknown; code?: string; txHash?: string }).code = 'BROADCAST_UNCONFIRMED';
    (nextError as Error & { cause?: unknown; code?: string; txHash?: string }).txHash = hash;
    throw nextError;
  }

  const rawWait = response.wait.bind(response);
  return {
    ...response,
    wait: async () => {
      const waitStartedAtMs = Date.now();
      const receipt = await rawWait();
      const receiptWaitMs = Math.max(0, Date.now() - waitStartedAtMs);
      if (timingEntry) {
        timingEntry.receiptWaitMs = String(receiptWaitMs);
        timingEntry.onChainRunTimeMs += receiptWaitMs;
      }
      return receipt;
    },
  };
}

type AccountRewardSnapshot = {
  accountStakingRewards: string;
  sponsorRewards: string;
  recipientRewards: string;
  agentRewards: string;
};

type PendingAccountRewardsReader = {
  getPendingAccountStakingRewards?: (
    accountKey: string,
    optionsOrTimestampOverride?: unknown,
    timestampOverride?: string | number | bigint,
  ) => Promise<unknown>;
};

function toBigIntAmount(value: unknown) {
  const text = String(value ?? '0').replace(/,/g, '').trim();
  if (!text) return 0n;
  try {
    return BigInt(text);
  } catch {
    return 0n;
  }
}

function diffRewardSnapshot(after: AccountRewardSnapshot, before: AccountRewardSnapshot): AccountRewardSnapshot {
  return {
    accountStakingRewards: (toBigIntAmount(after.accountStakingRewards) - toBigIntAmount(before.accountStakingRewards)).toString(),
    sponsorRewards: (toBigIntAmount(after.sponsorRewards) - toBigIntAmount(before.sponsorRewards)).toString(),
    recipientRewards: (toBigIntAmount(after.recipientRewards) - toBigIntAmount(before.recipientRewards)).toString(),
    agentRewards: (toBigIntAmount(after.agentRewards) - toBigIntAmount(before.agentRewards)).toString(),
  };
}

function pendingRewardsToSnapshot(value: unknown): AccountRewardSnapshot {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    accountStakingRewards: toBigIntAmount(record.pendingRewards).toString(),
    sponsorRewards: toBigIntAmount(record.pendingSponsorRewards).toString(),
    recipientRewards: toBigIntAmount(record.pendingRecipientRewards).toString(),
    agentRewards: toBigIntAmount(record.pendingAgentRewards).toString(),
  };
}

async function getReceiptBlockTimestamp(provider: JsonRpcProvider, receipt: { blockNumber?: bigint | number | null }) {
  if (receipt.blockNumber == null) return null;
  const blockNumber = Number(receipt.blockNumber);
  if (!Number.isFinite(blockNumber)) return null;
  const block = await provider.getBlock(blockNumber);
  return block?.timestamp == null ? null : String(block.timestamp);
}

async function readAccountRewardSnapshot(contract: Contract, accountKey: string): Promise<AccountRewardSnapshot> {
  const readableContract = contract as unknown as {
    getAccountRecord?: (accountKey: string) => Promise<unknown>;
    getAccountRewardTotals?: (accountKey: string) => Promise<unknown>;
  };
  if (typeof readableContract.getAccountRecord !== 'function') {
    throw new Error('getAccountRecord is not available on the current SpCoin contract access path.');
  }
  if (typeof readableContract.getAccountRewardTotals !== 'function') {
    throw new Error('getAccountRewardTotals is not available on the current SpCoin contract access path.');
  }

  const accountRecord = await readableContract.getAccountRecord(accountKey);
  const rewardTotals = await readableContract.getAccountRewardTotals(accountKey);
  const accountRecordValues = Array.isArray(accountRecord) ? accountRecord : [];
  const rewardTotalValues = Array.isArray(rewardTotals) ? rewardTotals : [];

  return {
    accountStakingRewards: toBigIntAmount(accountRecordValues[4]).toString(),
    sponsorRewards: toBigIntAmount(rewardTotalValues[0]).toString(),
    recipientRewards: toBigIntAmount(rewardTotalValues[1]).toString(),
    agentRewards: toBigIntAmount(rewardTotalValues[2]).toString(),
  };
}

function resolveStepMode(step: LabScriptStep, script: LabScript) {
  if (step.mode === 'hardhat') return 'hardhat';
  const stepNetwork = String(step.network || '').trim();
  const scriptNetwork = String(script.network || '').trim();
  if (/hardhat/i.test(stepNetwork) || /hardhat/i.test(scriptNetwork)) return 'hardhat';
  return 'metamask';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RunScriptRequest;
    const script = body?.script;
    const contractAddress = String(body?.contractAddress || '').trim();
    const rpcUrl = String(body?.rpcUrl || DEFAULT_SERVER_HARDHAT_RPC_URL).trim() || DEFAULT_SERVER_HARDHAT_RPC_URL;
    const writeRpcUrl = String(body?.writeRpcUrl || DEFAULT_SERVER_HARDHAT_WRITE_RPC_URL || rpcUrl).trim() || rpcUrl;
    const startIndex = Math.max(0, Number(body?.startIndex ?? 0) || 0);
    const stopAfterCurrentStep = body?.stopAfterCurrentStep === true;
    const source: SpCoinAccessSource = body?.spCoinAccessSource === 'local' ? 'local' : 'node_modules';
    const compareOfflineRewards = body?.compareOfflineRewards === true;
    const cacheMode =
      body?.cacheMode === 'refresh' || body?.cacheMode === 'bypass' || body?.cacheMode === 'only'
        ? body.cacheMode
        : body?.useCache === false
          ? 'refresh'
          : 'default';
    const readCacheOptions = {
      cache: cacheMode,
      cacheNamespace: String(body?.cacheNamespace || '').trim() || undefined,
      traceCache: body?.traceCache === true,
    };

    if (!script || !Array.isArray(script.steps)) {
      return NextResponse.json({ ok: false, message: 'A script with steps is required.' }, { status: 400 });
    }
    if (!/^0[xX][a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ ok: false, message: 'A valid contract address is required.' }, { status: 400 });
    }

    const provider = createServerHardhatProvider(rpcUrl);
    const writeProvider = writeRpcUrl === rpcUrl ? provider : createServerHardhatProvider(writeRpcUrl);

    const hardhatAccounts = await readHardhatAccounts();
    const traceBase = [
      `server run-script start; rpc=${rpcUrl}; writeRpc=${writeRpcUrl}; contract=${contractAddress}; script=${script.name || script.id}`,
    ];
    const abi = getSpCoinLabAbi();
    const results: StepResult[] = [];

    let haltedReason: 'completed' | 'breakpoint' | 'step' | 'error' = 'completed';
    let nextStepNumber: number | null = null;
    let sharedRelationshipReadCache: Record<string, unknown> | undefined;

    for (let idx = startIndex; idx < script.steps.length; idx += 1) {
      const step = script.steps[idx];
      const paramEntries = normalizeParams(step.params);
      const explicitSender = String(step['msg.sender'] || '').trim();
      const stepMode = resolveStepMode(step, script);
      const stepTrace: string[] = [...traceBase, `step=${String(step.step)}`, `panel=${String(step.panel || '')}`, `method=${String(step.method || '')}`];
      const timingCollector = createMethodTimingCollector();
      let resolvedSenderAddress = explicitSender;

      try {
        if (stepMode !== 'hardhat') {
          throw new Error(`Server runner only supports hardhat steps right now. Step ${String(step.step)} is ${stepMode}.`);
        }

        const senderEntry = explicitSender
          ? hardhatAccounts.find((entry) => normalizeAddress(entry.address) === normalizeAddress(explicitSender))
          : hardhatAccounts[0];
        if (!senderEntry?.privateKey) {
          throw new Error(`Unable to resolve a hardhat signer for ${explicitSender || 'the requested step'}.`);
        }

        const signer = new Wallet(senderEntry.privateKey, provider);
        const writeSigner = writeProvider === provider ? signer : new Wallet(senderEntry.privateKey, writeProvider);
        const senderAddress = signer.address;
        resolvedSenderAddress = senderAddress;
        const contract = wrapContractWithTiming(new Contract(contractAddress, abi, signer));
        const writeContract = writeProvider === provider ? contract : wrapContractWithTiming(new Contract(contractAddress, abi, writeSigner));
        const appendTrace = (line: string) => {
          const text = String(line || '').trim();
          if (text) stepTrace.push(text);
        };
        appendTrace(`resolved hardhat sender=${senderAddress}`);
        appendTrace(`spCoinAccessSource=${source}`);
        const access = createSpCoinModuleAccess(contract, signer, source, appendTrace);
        if (source === 'local') {
          const readWithRelationshipCache = access.read as Record<string, unknown>;
          readWithRelationshipCache.__relationshipReadCache = sharedRelationshipReadCache;
          sharedRelationshipReadCache = readWithRelationshipCache.__relationshipReadCache as Record<string, unknown> | undefined;
        }
        const findParam = (label: string) =>
          String(paramEntries.find((entry) => entry.key === label)?.value || '').trim();
        const call = buildCall(step, senderAddress, paramEntries);
        let contractOwnerAddress: string | null | undefined;
        const getContractOwnerAddress = async () => {
          if (contractOwnerAddress !== undefined) return contractOwnerAddress;
          const owner = (contract as unknown as { owner?: () => Promise<unknown> }).owner;
          if (typeof owner !== 'function') {
            contractOwnerAddress = null;
            return contractOwnerAddress;
          }
          try {
            contractOwnerAddress = normalizeAddress(String(await owner()));
          } catch {
            contractOwnerAddress = null;
          }
          return contractOwnerAddress;
        };
        const assertOwnerOrRootSigner = async (methodName: string, accountLabel: string, accountKey: string) => {
          if (!accountKey || isSameAddress(senderAddress, accountKey)) return;
          const ownerAddress = await getContractOwnerAddress();
          if (ownerAddress && isSameAddress(senderAddress, ownerAddress)) return;
          throw new Error(
            `${methodName} requires msg.sender to be ${accountLabel} or the contract owner. ` +
              `Actual signer is ${senderAddress}; ${accountLabel} is ${accountKey}.` +
              (ownerAddress ? ` Contract owner is ${ownerAddress}.` : ''),
          );
        };
        const assertRootSigner = async (methodName: string) => {
          const ownerAddress = await getContractOwnerAddress();
          if (!ownerAddress || isSameAddress(senderAddress, ownerAddress)) return;
          throw new Error(
            `${methodName} requires the contract owner signer. ` +
              `Actual signer is ${senderAddress}; contract owner is ${ownerAddress}.`,
          );
        };

        const result = await runWithMethodTimingCollector(timingCollector, async () => {
          let stepResult: unknown;
          if (step.panel === 'spcoin_rread') {
            switch (step.method) {
            case 'getAccountKeys':
            case 'getMasterAccountKeys':
            case 'getMasterAccountList':
              if (typeof access.read.getMasterAccountKeys === 'function') {
                stepResult = await access.read.getMasterAccountKeys();
              } else if (typeof access.read.getAccountKeys === 'function') {
                stepResult = await access.read.getAccountKeys();
              } else {
                if (typeof (contract as Record<string, unknown>).getMasterAccountKeys === 'function') {
                  try {
                    stepResult = await (contract as unknown as { getMasterAccountKeys: () => Promise<unknown> }).getMasterAccountKeys();
                  } catch (error) {
                    if (!isMissingContractReadError(error)) throw error;
                  }
                }
                if ((!Array.isArray(stepResult) || stepResult.length === 0) && typeof (contract as Record<string, unknown>).getAccountList === 'function') {
                  try {
                    stepResult = await (contract as unknown as { getAccountList: () => Promise<unknown> }).getAccountList();
                  } catch (error) {
                    if (!isMissingContractReadError(error)) throw error;
                  }
                }
                stepResult ??= [];
              }
              break;
            case 'getMasterAccountMetaData':
              if (typeof (access.read as Record<string, unknown>).getMasterAccountMetaData === 'function') {
                stepResult = normalizeMasterAccountMetaData(
                  await (
                    access.read as unknown as { getMasterAccountMetaData: () => Promise<unknown> }
                  ).getMasterAccountMetaData(),
                );
              } else {
                stepResult = await callMasterAccountMetaData(contract);
              }
              break;
            case 'getActiveAccountKeys':
            case 'getActiveAccountList':
              stepResult =
                typeof (contract as Record<string, unknown>).getActiveAccountKeys === 'function'
                  ? await (contract as unknown as { getActiveAccountKeys: () => Promise<unknown> }).getActiveAccountKeys()
                  : typeof (access.read as Record<string, unknown>).getActiveAccountKeys === 'function'
                    ? await (access.read as unknown as { getActiveAccountKeys: () => Promise<unknown> }).getActiveAccountKeys()
                    : typeof (access.read as Record<string, unknown>).getActiveAccountList === 'function'
                      ? await (access.read as unknown as { getActiveAccountList: () => Promise<unknown> }).getActiveAccountList()
                      : [];
              break;
            case 'getActiveAccountKeyAt':
            case 'getActiveAccountElement':
              if (typeof (contract as Record<string, unknown>).getActiveAccountKeyAt === 'function') {
                stepResult = await (contract as unknown as { getActiveAccountKeyAt: (index: string) => Promise<unknown> }).getActiveAccountKeyAt(findParam('Index'));
              } else if (typeof (access.read as Record<string, unknown>).getActiveAccountKeyAt === 'function') {
                stepResult = await (access.read as unknown as { getActiveAccountKeyAt: (index: string) => Promise<unknown> }).getActiveAccountKeyAt(findParam('Index'));
              } else {
                throw new Error('getActiveAccountKeyAt is not available on the current SpCoin contract.');
              }
              break;
            case 'getAccountRecord':
              appendTrace(`getAccountRecord path start; accountKey=${findParam('Account Key')}`);
              if (typeof (access.read as Record<string, unknown>).getAccountRecord === 'function') {
                appendTrace('getAccountRecord using access.read.getAccountRecord');
                stepResult = await access.read.getAccountRecord(findParam('Account Key'), readCacheOptions);
              } else if (typeof (contract as Record<string, unknown>).getAccountRecord === 'function') {
                const cachedRecord = getCachedAccountRecord(contractAddress, findParam('Account Key'));
                if (cachedRecord !== null && hasAccountRecordCounts(cachedRecord)) {
                  appendTrace('getAccountRecord using cached normalized contract record');
                  stepResult = cachedRecord;
                } else {
                  if (cachedRecord !== null) {
                    appendTrace('getAccountRecord invalidating incomplete cached record');
                    invalidateCachedAccountRecord(contractAddress, findParam('Account Key'));
                  }
                  appendTrace('getAccountRecord using direct contract fallback');
                  stepResult = normalizeOnChainAccountRecordResult(await (
                    contract as unknown as { getAccountRecord: (accountKey: string) => Promise<unknown> }
                  ).getAccountRecord(findParam('Account Key')), findParam('Account Key'));
                  setCachedAccountRecord(contractAddress, findParam('Account Key'), stepResult);
                }
              } else {
                throw new Error('getAccountRecord is not available on the current SpCoin access path.');
              }
              break;
            case 'getAccountRecordShallow':
              if (typeof (access.read as Record<string, unknown>).getAccountRecordShallow !== 'function') {
                throw new Error('getAccountRecordShallow is not available on the current SpCoin access path.');
              }
              stepResult = await (
                access.read as unknown as { getAccountRecordShallow: (accountKey: string, options?: unknown) => Promise<unknown> }
              ).getAccountRecordShallow(findParam('Account Key'), readCacheOptions);
              break;
            case 'getPendingAccountStakingRewards':
              if (typeof (access.read as Record<string, unknown>).getPendingAccountStakingRewards !== 'function') {
                throw new Error('getPendingAccountStakingRewards is not available on the current SpCoin access path.');
              }
              stepResult = await (
                access.read as unknown as { getPendingAccountStakingRewards: (accountKey: string, options?: unknown) => Promise<unknown> }
              ).getPendingAccountStakingRewards(findParam('Account Key'), readCacheOptions);
              break;
            case 'getSponsorKeys':
            case 'getRecipientKeys':
            case 'getAgentKeys':
            case 'getParentRecipientKeys': {
              const accountKey = findParam('Account Key');
              const methodName = String(step.method);
              const contractMethod = (contract as Record<string, unknown>)[methodName];
              if (typeof contractMethod === 'function') {
                stepResult = normalizeAddressListResult(await (contractMethod as (accountKey: string) => Promise<unknown>)(accountKey));
              } else if (typeof (access.read as Record<string, unknown>)[methodName] === 'function') {
                stepResult = normalizeAddressListResult(
                  await ((access.read as Record<string, unknown>)[methodName] as (accountKey: string) => Promise<unknown>)(accountKey),
                );
              } else if (typeof (contract as Record<string, unknown>).getAccountLinks === 'function') {
                const links = await (
                  contract as unknown as { getAccountLinks: (accountKey: string) => Promise<unknown> }
                ).getAccountLinks(accountKey);
                const relationMap: Record<string, string> = {
                  getSponsorKeys: 'sponsorKeys',
                  getRecipientKeys: 'recipientKeys',
                  getAgentKeys: 'agentKeys',
                  getParentRecipientKeys: 'parentRecipientKeys',
                };
                const relation = relationMap[methodName];
                const source = links && typeof links === 'object' ? (links as Record<string, unknown> & { [index: number]: unknown }) : {};
                const fallbackIndex = methodName === 'getSponsorKeys' ? 0 : methodName === 'getRecipientKeys' ? 1 : methodName === 'getAgentKeys' ? 2 : 3;
                stepResult = normalizeAddressListResult(source[relation] ?? source[fallbackIndex] ?? []);
              } else {
                throw new Error(`${methodName} is not available on the current SpCoin contract.`);
              }
              break;
            }
            case 'getAccountLinks': {
              const accountKey = findParam('Account Key');
              if (typeof (contract as Record<string, unknown>).getAccountLinks === 'function') {
                const links = await (
                  contract as unknown as { getAccountLinks: (accountKey: string) => Promise<unknown> }
                ).getAccountLinks(accountKey);
                const source = links && typeof links === 'object' ? (links as Record<string, unknown> & { [index: number]: unknown }) : {};
                stepResult = {
                  sponsorKeys: normalizeAddressListResult(source.sponsorKeys ?? source[0] ?? []),
                  recipientKeys: normalizeAddressListResult(source.recipientKeys ?? source[1] ?? []),
                  agentKeys: normalizeAddressListResult(source.agentKeys ?? source[2] ?? []),
                  parentRecipientKeys: normalizeAddressListResult(source.parentRecipientKeys ?? source[3] ?? []),
                };
              } else if (typeof (access.read as Record<string, unknown>).getAccountLinks === 'function') {
                const links = await (
                  access.read as unknown as { getAccountLinks: (accountKey: string) => Promise<unknown> }
                ).getAccountLinks(accountKey);
                const source = links && typeof links === 'object' ? (links as Record<string, unknown> & { [index: number]: unknown }) : {};
                stepResult = {
                  sponsorKeys: normalizeAddressListResult(source.sponsorKeys ?? source[0] ?? []),
                  recipientKeys: normalizeAddressListResult(source.recipientKeys ?? source[1] ?? []),
                  agentKeys: normalizeAddressListResult(source.agentKeys ?? source[2] ?? []),
                  parentRecipientKeys: normalizeAddressListResult(source.parentRecipientKeys ?? source[3] ?? []),
                };
              } else {
                throw new Error('getAccountLinks is not available on the current SpCoin contract.');
              }
              break;
            }
            case 'getAccountRoleSummary':
              if (typeof (access.read as Record<string, unknown>).getAccountRoleSummary !== 'function') {
                throw new Error('getAccountRoleSummary is not available on the current SpCoin read access path.');
              }
              stepResult = await (
                access.read as unknown as { getAccountRoleSummary: (accountKey: string) => Promise<unknown> }
              ).getAccountRoleSummary(findParam('Account Key'));
              break;
            case 'getAccountRoles':
              if (typeof (access.read as Record<string, unknown>).getAccountRoles !== 'function') {
                throw new Error('getAccountRoles is not available on the current SpCoin read access path.');
              }
              stepResult = await (
                access.read as unknown as { getAccountRoles: (accountKey: string) => Promise<unknown> }
              ).getAccountRoles(findParam('Account Key'));
              break;
            case 'isSponsor':
              if (typeof (access.read as Record<string, unknown>).isSponsor !== 'function') {
                throw new Error('isSponsor is not available on the current SpCoin read access path.');
              }
              stepResult = await (
                access.read as unknown as { isSponsor: (accountKey: string) => Promise<boolean> }
              ).isSponsor(findParam('Account Key'));
              break;
            case 'isRecipient':
              if (typeof (access.read as Record<string, unknown>).isRecipient !== 'function') {
                throw new Error('isRecipient is not available on the current SpCoin read access path.');
              }
              stepResult = await (
                access.read as unknown as { isRecipient: (accountKey: string) => Promise<boolean> }
              ).isRecipient(findParam('Account Key'));
              break;
            case 'isAgent':
              if (typeof (access.read as Record<string, unknown>).isAgent !== 'function') {
                throw new Error('isAgent is not available on the current SpCoin read access path.');
              }
              stepResult = await (
                access.read as unknown as { isAgent: (accountKey: string) => Promise<boolean> }
              ).isAgent(findParam('Account Key'));
              break;
            case 'getTransactionRecord':
              if (typeof (contract as Record<string, unknown>).getTransactionRecord === 'function') {
                stepResult = await (contract as unknown as { getTransactionRecord: (transactionId: string) => Promise<unknown> })
                  .getTransactionRecord(findParam('Transaction Id'));
              } else if (typeof (access.read as Record<string, unknown>).getTransactionRecord === 'function') {
                stepResult = await (access.read as unknown as { getTransactionRecord: (transactionId: string) => Promise<unknown> })
                  .getTransactionRecord(findParam('Transaction Id'));
              } else {
                throw new Error('getTransactionRecord is not available on the current SpCoin contract.');
              }
              break;
            case 'getRecipientTransactionIdKeys':
              if (typeof (contract as Record<string, unknown>).getRecipientTransactionIdKeys === 'function') {
                stepResult = await (contract as unknown as {
                  getRecipientTransactionIdKeys: (sponsorKey: string, recipientKey: string, recipientRateKey: string) => Promise<unknown>;
                }).getRecipientTransactionIdKeys(findParam('Sponsor Key'), findParam('Recipient Key'), findParam('Recipient Rate Key'));
              } else if (typeof (access.read as Record<string, unknown>).getRecipientTransactionIdKeys === 'function') {
                stepResult = await (access.read as unknown as {
                  getRecipientTransactionIdKeys: (sponsorKey: string, recipientKey: string, recipientRateKey: string) => Promise<unknown>;
                }).getRecipientTransactionIdKeys(findParam('Sponsor Key'), findParam('Recipient Key'), findParam('Recipient Rate Key'));
              } else {
                throw new Error('getRecipientTransactionIdKeys is not available on the current SpCoin contract.');
              }
              break;
            case 'getAgentTransactionIdKeys':
              if (typeof (contract as Record<string, unknown>).getAgentTransactionIdKeys === 'function') {
                stepResult = await (contract as unknown as {
                  getAgentTransactionIdKeys: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string,
                    agentKey: string,
                    agentRateKey: string,
                  ) => Promise<unknown>;
                }).getAgentTransactionIdKeys(
                  findParam('Sponsor Key'),
                  findParam('Recipient Key'),
                  findParam('Recipient Rate Key'),
                  findParam('Agent Key'),
                  findParam('Agent Rate Key'),
                );
              } else if (typeof (access.read as Record<string, unknown>).getAgentTransactionIdKeys === 'function') {
                stepResult = await (access.read as unknown as {
                  getAgentTransactionIdKeys: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string,
                    agentKey: string,
                    agentRateKey: string,
                  ) => Promise<unknown>;
                }).getAgentTransactionIdKeys(
                  findParam('Sponsor Key'),
                  findParam('Recipient Key'),
                  findParam('Recipient Rate Key'),
                  findParam('Agent Key'),
                  findParam('Agent Rate Key'),
                );
              } else {
                throw new Error('getAgentTransactionIdKeys is not available on the current SpCoin contract.');
              }
              break;
            case 'getMasterAccountCount':
            case 'getMasterAccountKeyCount':
            case 'getAccountKeyCount':
            case 'getAccountListSize':
            case 'getMasterAccountListSize':
              if (typeof (access.read as Record<string, unknown>).getMasterAccountKeyCount === 'function') {
                stepResult = Number(
                  await (access.read as unknown as { getMasterAccountKeyCount: () => Promise<unknown> }).getMasterAccountKeyCount(),
                );
              } else if (typeof (access.read as Record<string, unknown>).getMasterAccountMetaData === 'function') {
                stepResult = getMasterAccountMetaDataCount(
                  await (
                    access.read as unknown as { getMasterAccountMetaData: () => Promise<unknown> }
                  ).getMasterAccountMetaData(),
                );
              } else {
                try {
                  stepResult = getMasterAccountMetaDataCount(await callMasterAccountMetaData(contract));
                } catch (error) {
                  if (!isMissingContractReadError(error)) throw error;
                }
              }
              if (stepResult == null && typeof (contract as Record<string, unknown>).getMasterAccountKeyCount === 'function') {
                try {
                  stepResult = Number(
                    await (contract as unknown as { getMasterAccountKeyCount: () => Promise<unknown> }).getMasterAccountKeyCount(),
                  );
                } catch (error) {
                  if (!isMissingContractReadError(error)) throw error;
                }
              }
              if (stepResult == null && typeof (contract as Record<string, unknown>).getAccountKeyCount === 'function') {
                try {
                  stepResult = Number(await (contract as unknown as { getAccountKeyCount: () => Promise<unknown> }).getAccountKeyCount());
                } catch (error) {
                  if (!isMissingContractReadError(error)) throw error;
                }
              }
              if (stepResult == null && typeof (access.read as Record<string, unknown>).getMasterAccountCount === 'function') {
                stepResult = await (access.read as unknown as { getMasterAccountCount: () => Promise<unknown> }).getMasterAccountCount();
              } else if (stepResult == null && typeof access.read.getAccountKeyCount === 'function') {
                stepResult = await access.read.getAccountKeyCount();
              } else if (stepResult == null && typeof (access.read as Record<string, unknown>).getAccountListSize === 'function') {
                stepResult = await (access.read as unknown as { getAccountListSize: () => Promise<unknown> }).getAccountListSize();
              } else if (stepResult == null) {
                let list: unknown = [];
                if (typeof access.read.getMasterAccountKeys === 'function') {
                  list = await access.read.getMasterAccountKeys();
                } else if (typeof access.read.getAccountKeys === 'function') {
                  list = await access.read.getAccountKeys();
                } else if (typeof (access.read as Record<string, unknown>).getMasterAccountList === 'function') {
                  list = await (access.read as unknown as { getMasterAccountList: () => Promise<unknown> }).getMasterAccountList();
                } else if (typeof (contract as Record<string, unknown>).getMasterAccountKeys === 'function') {
                  try {
                    list = await (contract as unknown as { getMasterAccountKeys: () => Promise<unknown> }).getMasterAccountKeys();
                  } catch (error) {
                    if (!isMissingContractReadError(error)) throw error;
                  }
                } else if (typeof (contract as Record<string, unknown>).getAccountList === 'function') {
                  try {
                    list = await (contract as unknown as { getAccountList: () => Promise<unknown> }).getAccountList();
                  } catch (error) {
                    if (!isMissingContractReadError(error)) throw error;
                  }
                }
                stepResult = Array.isArray(list) ? list.length : 0;
              }
              break;
            case 'getActiveAccountCount':
            case 'getActiveAccountListSize':
              if (typeof (contract as Record<string, unknown>).getActiveAccountCount === 'function') {
                stepResult = Number(await (contract as unknown as { getActiveAccountCount: () => Promise<unknown> }).getActiveAccountCount());
              } else if (typeof (access.read as Record<string, unknown>).getActiveAccountCount === 'function') {
                stepResult = await (access.read as unknown as { getActiveAccountCount: () => Promise<unknown> }).getActiveAccountCount();
              } else {
                const list =
                  typeof (contract as Record<string, unknown>).getActiveAccountKeys === 'function'
                    ? await (contract as unknown as { getActiveAccountKeys: () => Promise<unknown> }).getActiveAccountKeys()
                    : typeof (access.read as Record<string, unknown>).getActiveAccountKeys === 'function'
                      ? await (access.read as unknown as { getActiveAccountKeys: () => Promise<unknown> }).getActiveAccountKeys()
                      : [];
                stepResult = Array.isArray(list) ? list.length : 0;
              }
              break;
            default:
              throw new Error(`Server runner does not support read method ${String(step.method)} yet.`);
            }
          } else if (step.panel === 'spcoin_write') {
            switch (step.method) {
            case 'addRecipientTransaction':
            case 'addRecipientRateAmount':
            case 'addAccountRecipientRate':
            case 'addAccountRecipient':
            case 'addSponsorship': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              await assertOwnerOrRootSigner(String(step.method), 'Sponsor Key', sponsorKey);
              const addRecipientTransaction = access.add.addRecipientTransaction ?? access.add.addRecipientTransaction;
              if (typeof addRecipientTransaction !== 'function') {
                throw new Error('addRecipientTransaction is not available on the current SpCoin access path.');
              }
              const tx = await addRecipientTransaction(
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionQty,
              );
              const receipt = await tx.wait();
              stepResult = formatReceiptResult('addRecipientTransaction', tx, receipt, timingCollector);
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              break;
            }
            case 'addAgentTransaction':
            case 'addAgentRateAmount':
            case 'addAccountAgentRate':
            case 'addAgentSponsorship': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              await assertOwnerOrRootSigner(String(step.method), 'Sponsor Key', sponsorKey);
              const addAgentTransaction = access.add.addAgentTransaction ?? access.add.addAgentTransaction;
              if (typeof addAgentTransaction !== 'function') {
                throw new Error('addAgentTransaction is not available on the current SpCoin access path.');
              }
              const tx = await addAgentTransaction(
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionQty,
              );
              const receipt = await tx.wait();
              stepResult = formatReceiptResult('addAgentTransaction', tx, receipt, timingCollector);
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              invalidateCachedAccountRecord(contractAddress, agentKey);
              break;
            }
            case 'addBackDatedSponsorship':
            case 'addBackDatedRecipientSponsorship':
            case 'addBackDatedRecipientTransaction':
            case 'addAccountRecipientRateBackdated': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const wholeAmount = findParam('Whole Amount');
              const decimalAmount = findParam('Decimal Amount');
              const explicitQty = findParam('Transaction Quantity');
              const backDate = findParam('Transaction Back Date');
              const transactionQty = explicitQty || `${wholeAmount}.${decimalAmount}`;
              await assertRootSigner(String(step.method));
              const tx = await access.add.addBackDatedRecipientTransaction(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionQty,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              stepResult = formatReceiptResult('addBackDatedRecipientTransaction', tx, receipt, timingCollector);
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              break;
            }
            case 'addBackDatedAgentSponsorship':
            case 'addBackDatedAgentTransaction':
            case 'addAccountAgentRateBackdated': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const backDate = findParam('Transaction Back Date');
              await assertRootSigner(String(step.method));
              const tx = await access.add.addBackDatedAgentTransaction(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionQty,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              stepResult = formatReceiptResult('addBackDatedAgentTransaction', tx, receipt, timingCollector);
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              invalidateCachedAccountRecord(contractAddress, agentKey);
              break;
            }
            case 'backDateRecipientTransaction': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const transactionIndex = findParam('Transaction Row Id');
              const backDate = findParam('Transaction Back Date');
              await assertRootSigner(String(step.method));
              const tx = await access.add.backDateRecipientTransaction(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionIndex,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              stepResult = formatReceiptResult('backDateRecipientTransaction', tx, receipt, timingCollector);
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              break;
            }
            case 'backDateAgentTransaction': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionIndex = findParam('Transaction Row Id');
              const backDate = findParam('Transaction Back Date');
              await assertRootSigner(String(step.method));
              const tx = await access.add.backDateAgentTransaction(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionIndex,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              stepResult = formatReceiptResult('backDateAgentTransaction', tx, receipt, timingCollector);
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              invalidateCachedAccountRecord(contractAddress, agentKey);
              break;
            }
            case 'deleteRecipient': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              await assertOwnerOrRootSigner(String(step.method), 'Sponsor Key', sponsorKey);
              const deleteRecipient = (contract as unknown as { deleteRecipient?: (sponsor: string, recipient: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }> }).deleteRecipient;
              if (typeof deleteRecipient !== 'function') {
                throw new Error('deleteRecipient is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteRecipient(sponsorKey, recipientKey);
              const receipt = await tx.wait();
              stepResult = formatReceiptResult(
                'deleteRecipient',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
                timingCollector,
              );
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              break;
            }
            case 'deleteSponsor': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              await assertOwnerOrRootSigner(String(step.method), 'Sponsor Key', sponsorKey);
              const deleteSponsor = (
                contract as unknown as {
                  deleteSponsor?: (sponsor: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteSponsor;
              if (typeof deleteSponsor !== 'function') {
                throw new Error('deleteSponsor is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteSponsor(sponsorKey);
              const receipt = await tx.wait();
              stepResult = formatReceiptResult(
                'deleteSponsor',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
                timingCollector,
              );
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              break;
            }
            case 'deleteAgentNode': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              await assertOwnerOrRootSigner(String(step.method), 'Sponsor Key', sponsorKey);
              const deleteAgent = (
                contract as unknown as {
                  deleteAgent?: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string | number,
                    agentKey: string,
                  ) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteAgent;
              const deleteRecipientAgent = (
                contract as unknown as {
                  deleteRecipientAgent?: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string | number,
                    agentKey: string,
                  ) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteRecipientAgent;
              if (typeof deleteAgent !== 'function' && typeof deleteRecipientAgent !== 'function') {
                throw new Error('deleteAgent is not available on the current SpCoin contract access path.');
              }
              const tx =
                typeof deleteAgent === 'function'
                  ? await deleteAgent(sponsorKey, recipientKey, recipientRateKey, agentKey)
                  : await deleteRecipientAgent!(sponsorKey, recipientKey, recipientRateKey, agentKey);
              const receipt = await tx.wait();
              stepResult = formatReceiptResult(
                'deleteAgent',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
                timingCollector,
              );
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              invalidateCachedAccountRecord(contractAddress, agentKey);
              break;
            }
            case 'delAccountAgentSponsorship':
            case 'deleteAgentRateNode':
            case 'deleteAgentRate': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              await assertOwnerOrRootSigner(String(step.method), 'Sponsor Key', sponsorKey);
              const deleteAgentRate = (
                contract as unknown as {
                  deleteAgentRate?: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string | number,
                    agentKey: string,
                    agentRateKey: string | number,
                  ) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteAgentRate;
              if (typeof deleteAgentRate !== 'function') {
                throw new Error('deleteAgentRate is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteAgentRate(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
              const receipt = await tx.wait();
              stepResult = formatReceiptResult(
                String(step.method),
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
                timingCollector,
              );
              invalidateCachedAccountRecord(contractAddress, sponsorKey);
              invalidateCachedAccountRecord(contractAddress, recipientKey);
              invalidateCachedAccountRecord(contractAddress, agentKey);
              break;
            }
            case 'updateAccountStakingRewards': {
              const accountKey = findParam('Account Key') || senderAddress;
              const updateAccountStakingRewards = access.rewards.updateAccountStakingRewards;
              if (typeof updateAccountStakingRewards !== 'function') {
                throw new Error('updateAccountStakingRewards is not available on the current SpCoin access path.');
              }
              const pendingRewardsReader = access.read as PendingAccountRewardsReader;
              const latestBlockOfflinePreview =
                compareOfflineRewards && typeof pendingRewardsReader.getPendingAccountStakingRewards === 'function'
                  ? await pendingRewardsReader.getPendingAccountStakingRewards(accountKey)
                  : null;
              const beforeRewards = await readAccountRewardSnapshot(contract, accountKey);
              const tx = await sendSignedContractTransaction({
                label: 'updateAccountStakingRewards',
                contract: writeContract,
                signer: writeSigner,
                provider: writeProvider,
                method: 'updateAccountStakingRewards',
                args: [accountKey],
                timingCollector,
              });
              const receipt = (await tx.wait()) as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null };
              const settlementTimestamp = compareOfflineRewards ? await getReceiptBlockTimestamp(provider, receipt) : null;
              const settlementOfflinePreview =
                compareOfflineRewards && settlementTimestamp && typeof pendingRewardsReader.getPendingAccountStakingRewards === 'function'
                  ? await pendingRewardsReader.getPendingAccountStakingRewards(accountKey, settlementTimestamp)
                  : null;
              invalidateCachedAccountRecord(contractAddress, accountKey);
              const afterRewards = await readAccountRewardSnapshot(contract, accountKey);
              const delta = diffRewardSnapshot(afterRewards, beforeRewards);
              const settlementOfflineDelta = pendingRewardsToSnapshot(settlementOfflinePreview);
              stepResult = [
                ...formatReceiptResult('updateAccountStakingRewards', tx, receipt, timingCollector),
                {
                  label: 'updateAccountStakingRewards rewards',
                  accountKey,
                  before: beforeRewards,
                  after: afterRewards,
                  delta,
                  ...(compareOfflineRewards
                    ? {
                        offlineComparison: {
                          latestBlockPreview: latestBlockOfflinePreview,
                          settlementTimestamp,
                          settlementTimestampPreview: settlementOfflinePreview,
                          settlementTimestampDelta: settlementOfflineDelta,
                          difference: diffRewardSnapshot(delta, settlementOfflineDelta),
                        },
                      }
                    : {}),
                },
              ];
              break;
            }
            default:
              throw new Error(`Server runner does not support write method ${String(step.method)} yet.`);
            }
          } else {
            throw new Error(`Server runner does not support panel ${String(step.panel)} yet.`);
          }
          return stepResult;
        });
        if (step.panel === 'spcoin_write') {
          sharedRelationshipReadCache = undefined;
        } else if (source === 'local') {
          sharedRelationshipReadCache = (access.read as Record<string, unknown>).__relationshipReadCache as
            | Record<string, unknown>
            | undefined;
        }

        const warning =
          step.method === 'getAccountRecord' &&
          step.panel === 'spcoin_rread' &&
          isEmptyNormalizedAccountRecord(result)
            ? {
                type: 'not_found',
                message: `${String(step.method || '')} returned no account record for the supplied account key.`,
                debug: {
                  panel: 'spcoin_rread',
                  source,
                  method: String(step.method || ''),
                },
              }
            : undefined;

        const meta = buildMethodTimingMeta(timingCollector);
        const sanitizedResult = sanitizeJsonValue(result);
        const payload = isMasterAccountMetaDataStep(step)
          ? buildMasterAccountMetaDataPayload(call, sanitizedResult, warning, meta)
          : {
              call,
              result: sanitizedResult,
              ...(warning ? { warning } : {}),
              meta,
            };

        results.push({
          step: step.step,
          success: true,
          payload,
        });

        const nextStep = script.steps[idx + 1];
        if (stopAfterCurrentStep) {
          haltedReason = 'step';
          nextStepNumber = nextStep?.step ?? null;
          break;
        }
        if (nextStep?.breakpoint) {
          haltedReason = 'breakpoint';
          nextStepNumber = nextStep.step;
          break;
        }
      } catch (error) {
        const classification = classifyScriptError(error, stepTrace);
        const spCoinError = decodeSpCoinError(error);
        const rawErrorMessage = spCoinError || getNestedErrorText(error) || (error instanceof Error ? error.message : String(error));
        const errorMessage =
          classification === 'transport'
            ? `RPC transport error: ${rawErrorMessage}`
            : rawErrorMessage;
        const rpcTransport =
          classification === 'transport'
            ? await probeRpcTransport(step.panel === 'spcoin_write' ? writeRpcUrl : rpcUrl, step.panel === 'spcoin_write' ? 'write' : 'read')
            : undefined;
        if (rpcTransport) {
          stepTrace.push(
            `rpcTransport probe role=${rpcTransport.role}; method=${rpcTransport.method}; status=${
              rpcTransport.httpStatus ?? 'n/a'
            }; server=${rpcTransport.responseHeaders?.server ?? 'n/a'}; durationMs=${rpcTransport.durationMs}`,
          );
          console.error(
            '[spcoin-rpc-transport]',
            JSON.stringify({
              script: script.name || script.id,
              step: step.step,
              panel: String(step.panel || ''),
              method: String(step.method || ''),
              sender: resolvedSenderAddress,
              classification,
              error: rawErrorMessage,
              rpcTransport,
            }),
          );
        }
        results.push({
          step: step.step,
          success: false,
          payload: {
            call: buildCall(step, resolvedSenderAddress, paramEntries),
            error: {
              message: errorMessage,
              name: error instanceof Error ? error.name : typeof error,
              classification,
              ...(classification === 'transport'
                ? { action: 'No transaction hash was returned. Check the latest account state before retrying this write.' }
                : {}),
              ...(error instanceof Error && error.stack ? { stack: { message: error.stack } } : {}),
              debug: {
                panel: String(step.panel || ''),
                source,
                method: String(step.method || ''),
                trace: stepTrace,
                ...(rpcTransport ? { rpcTransport } : {}),
              },
            },
            ...(rpcTransport ? { rpcTransport } : {}),
            meta: buildMethodTimingMeta(timingCollector),
          },
        });
        haltedReason = 'error';
        nextStepNumber = step.step;
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      haltedReason,
      nextStepNumber,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server script execution error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
