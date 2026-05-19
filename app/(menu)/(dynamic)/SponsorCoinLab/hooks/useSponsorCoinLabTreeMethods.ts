import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import { runSpCoinReadMethod, type SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { runSpCoinWriteMethod, type SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import { createSpCoinContract, createSpCoinLibraryAccess, type SpCoinReadAccess } from '../jsonMethods/shared';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import { normalizeStringListResult } from '../jsonMethods/shared/normalizeListResult';
import type { ConnectionMode } from '../scriptBuilder/types';
import {
  buildExecutionMeta,
  enrichDirectReadError,
  type MethodExecutionMeta,
} from './methodExecutionHelpers';
import type { AccessMethodCaller } from './useAccessMethodCaller';
import { normalizeExecutionPayload } from './executionPayload';
import {
  applyLazyAccountRelationBuckets,
  parseLazyAccountRelationClick,
  useLazyAccountRelationExpansion,
} from './useLazyAccountRelationExpansion';
import {
  getSpCoinLabAccountRecord,
  invalidateSpCoinLabAccountRecord,
  setSpCoinLabAccountRecord,
} from '@/lib/spCoinLab/accountRecordStore';
import {
  calculateFormattedDT,
  normalizePendingRewardsDisplayResult,
} from '@/lib/spCoinLab/pendingRewards';

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status' | 'debug';

const noop = () => undefined;

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return toDisplayString(error, fallback).trim() || fallback;
}

function isAccountAddressPathKey(key: string): boolean {
  const normalized = String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    /^\d+$/.test(normalized) ||
    [
      'account',
      'accountkey',
      'address',
      'agent',
      'agentkey',
      'msgsender',
      'owner',
      'owneraddress',
      'recipient',
      'recipientkey',
      'sender',
      'sponsor',
      'sponsorkey',
    ].includes(normalized)
  );
}

type PendingRewardsActionClick = {
  accountKey: string;
  action: 'claim' | 'estimate';
  method?:
    | 'estimateOffChainTotalRewards'
    | 'estimateOffChainSponsorRewards'
    | 'estimateOffChainRecipientRewards'
    | 'estimateOffChainAgentRewards'
    | 'claimOnChainTotalRewards'
    | 'claimOnChainSponsorRewards'
    | 'claimOnChainRecipientRewards'
    | 'claimOnChainAgentRewards';
};

const PENDING_REWARDS_ESTIMATE_METHODS = new Set([
  'estimateOffChainTotalRewards',
  'estimateOffChainSponsorRewards',
  'estimateOffChainRecipientRewards',
  'estimateOffChainAgentRewards',
]);

const PENDING_REWARDS_CLAIM_METHODS = new Set([
  'claimOnChainTotalRewards',
  'claimOnChainSponsorRewards',
  'claimOnChainRecipientRewards',
  'claimOnChainAgentRewards',
]);

const PENDING_REWARDS_METHOD_KEYS = [
  'estimateOffChainTotalRewards',
  'claimOnChainTotalRewards',
  'estimateOffChainSponsorRewards',
  'claimOnChainSponsorRewards',
  'estimateOffChainRecipientRewards',
  'claimOnChainRecipientRewards',
  'estimateOffChainAgentRewards',
  'claimOnChainAgentRewards',
] as const;

const PENDING_REWARDS_INLINE_REFRESH_MS = 10_000;

const PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD: Record<string, PendingRewardsActionClick['method']> = {
  claimOnChainTotalRewards: 'estimateOffChainTotalRewards',
  claimOnChainSponsorRewards: 'estimateOffChainSponsorRewards',
  claimOnChainRecipientRewards: 'estimateOffChainRecipientRewards',
  claimOnChainAgentRewards: 'estimateOffChainAgentRewards',
};

function parsePendingRewardsActionClick(
  value: string,
  normalizeAddressValue: (value: string) => string,
): PendingRewardsActionClick | null {
  try {
    const parsed = JSON.parse(String(value || '')) as Record<string, unknown>;
    if (!parsed || parsed.__loadPendingRewardsAction !== true) return null;
    const action = String(parsed.action || '').trim().toLowerCase();
    if (action !== 'claim' && action !== 'estimate') return null;
    return {
      accountKey: normalizeAddressValue(toDisplayString(parsed.accountKey)),
      action,
    };
  } catch {
    return null;
  }
}

function parsePendingRewardsMethodClick(
  value: string,
  normalizeAddressValue: (value: string) => string,
): PendingRewardsActionClick | null {
  try {
    const parsed = JSON.parse(String(value || '')) as Record<string, unknown>;
    if (!parsed || parsed.__loadPendingRewardsMethod !== true) return null;
    const method = String(parsed.method || '').trim();
    if (!PENDING_REWARDS_ESTIMATE_METHODS.has(method) && !PENDING_REWARDS_CLAIM_METHODS.has(method)) return null;
    return {
      accountKey: normalizeAddressValue(toDisplayString(parsed.accountKey)),
      action: PENDING_REWARDS_ESTIMATE_METHODS.has(method) ? 'estimate' : 'claim',
      method: method as PendingRewardsActionClick['method'],
    };
  } catch {
    return null;
  }
}

function hasLazyPendingRewardsAction(value: unknown) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).__lazyPendingRewardsAction === true,
  );
}

function hasLazyPendingRewardsMethod(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.call !== undefined || record.result !== undefined || record.meta !== undefined) return false;
  return record.__lazyPendingRewardsMethod === true;
}

function hasPendingRewardsRefreshAction(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).__pendingRewardsRefreshAction === true
  ) {
    return true;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const estimate = (value as Record<string, unknown>).estimate;
  if (!estimate || typeof estimate !== 'object' || Array.isArray(estimate)) return false;
  const result = (estimate as Record<string, unknown>).result;
  return Boolean(
    result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      (result as Record<string, unknown>).__pendingRewardsRefreshAction === true,
  );
}

function readPendingRewardsAmount(value: unknown) {
  const normalized = normalizePendingRewardsDisplayResult(value);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return null;
  const record = normalized as Record<string, unknown>;
  const amount =
    record.pendingRewards ??
    record.pendingTotalRewards ??
    record.totalRewards ??
    record.totalRewardsClaimed ??
    record.claimedAmount;
  if (amount === undefined || amount === null) return null;
  return String(amount);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isLoadedPendingRewardsMethodNode(value: unknown) {
  const record = asRecord(value);
  return Boolean(record && (record.call || record.meta || record.result || record.onChainCalls));
}

function buildLazyPendingRewardsMethod(accountKey: string, method: string) {
  return {
    __lazyPendingRewardsMethod: true,
    accountKey,
    method,
  };
}

function normalizePendingRewardsEstimateResult(value: unknown) {
  return normalizePendingRewardsDisplayResult(value);
}

function readPendingRewardsMethodAmount(pendingRewardsBranch: unknown, method: string) {
  const normalized = normalizePendingRewardsDisplayResult(pendingRewardsBranch);
  const record = asRecord(normalized) ?? asRecord(pendingRewardsBranch);
  if (!record) return null;

  const keys =
    method === 'estimateOffChainRecipientRewards'
      ? ['pendingRecipientRewards', 'recipientRewards', 'pendingRewards']
      : method === 'estimateOffChainAgentRewards'
        ? ['pendingAgentRewards', 'agentRewards', 'pendingRewards']
        : method === 'estimateOffChainSponsorRewards'
          ? ['pendingSponsorRewards', 'sponsorRewards', 'pendingRewards']
          : ['pendingTotalRewards', 'totalRewards', 'pendingRewards'];

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return readPendingRewardsAmount(record);
}

function mergeMethodResultAmount(methodNode: unknown, amount: string | null, method: string) {
  if (amount === null || !isLoadedPendingRewardsMethodNode(methodNode)) return methodNode;
  const record = asRecord(methodNode);
  const result = asRecord(record?.result);
  if (!record || !result) return methodNode;

  const nextResult = { ...result };
  const commonKeys = ['pendingRewards', 'pendingTotalRewards', 'totalRewards'];
  for (const key of commonKeys) {
    if (key in nextResult) nextResult[key] = amount;
  }
  if (method === 'estimateOffChainSponsorRewards' && 'pendingSponsorRewards' in nextResult) {
    nextResult.pendingSponsorRewards = amount;
  }
  if (method === 'estimateOffChainRecipientRewards' && 'pendingRecipientRewards' in nextResult) {
    nextResult.pendingRecipientRewards = amount;
  }
  if (method === 'estimateOffChainAgentRewards' && 'pendingAgentRewards' in nextResult) {
    nextResult.pendingAgentRewards = amount;
  }

  return {
    ...record,
    result: nextResult,
  };
}

function mergePendingRewardsBranchForAccountRefresh(
  existingNode: unknown,
  refreshedNode: unknown,
  normalizedAccount: string,
  loadedMethod: string,
  loadedMethodNode: unknown,
  action: PendingRewardsActionClick['action'],
  refreshAtMs: number,
) {
  const existing = asRecord(existingNode) ?? {};
  const refreshed = asRecord(refreshedNode) ?? {};
  const next: Record<string, unknown> = {
    ...refreshed,
    TYPE: refreshed.TYPE ?? existing.TYPE ?? '--PENDING_REWARDS--',
  };

  for (const method of PENDING_REWARDS_METHOD_KEYS) {
    const methodName = String(method);
    const candidate =
      loadedMethod === methodName
        ? loadedMethodNode
        : isLoadedPendingRewardsMethodNode(existing[method])
          ? existing[method]
          : refreshed[method] ?? existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, methodName);

    next[method] = PENDING_REWARDS_ESTIMATE_METHODS.has(methodName)
      ? mergeMethodResultAmount(
          candidate,
          readPendingRewardsMethodAmount(refreshed, methodName) ?? readPendingRewardsMethodAmount(existing, methodName),
          methodName,
        )
      : candidate;
  }

  next.pendingRewards = String(refreshed.pendingRewards ?? existing.pendingRewards ?? '0');
  next.__pendingRewardsRefreshAction = true;
  next.__pendingRewardsRefreshAtMs = refreshAtMs;
  next.__pendingRewardsRefreshActionName = action;
  return next;
}

function mergePendingRewardsSummaryNode(
  existingNode: unknown,
  pendingResult: unknown,
  normalizedAccount: string,
  action: PendingRewardsActionClick['action'],
  refreshAtMs: number,
  loadedMethod: string,
  loadedMethodNode: unknown,
) {
  const existing =
    existingNode && typeof existingNode === 'object' && !Array.isArray(existingNode)
      ? (existingNode as Record<string, unknown>)
      : {};
  const result =
    pendingResult && typeof pendingResult === 'object' && !Array.isArray(pendingResult)
      ? (normalizePendingRewardsEstimateResult(pendingResult) as Record<string, unknown>)
      : {};
  const getMethodNode = (method: string) =>
    loadedMethod === method
      ? loadedMethodNode
      : existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, method);
  const estimateOffChainTotalRewards = getMethodNode('estimateOffChainTotalRewards');
  const claimOnChainTotalRewards = getMethodNode('claimOnChainTotalRewards');
  const estimateOffChainSponsorRewards = getMethodNode('estimateOffChainSponsorRewards');
  const claimOnChainSponsorRewards = getMethodNode('claimOnChainSponsorRewards');
  const estimateOffChainRecipientRewards = getMethodNode('estimateOffChainRecipientRewards');
  const claimOnChainRecipientRewards = getMethodNode('claimOnChainRecipientRewards');
  const estimateOffChainAgentRewards = getMethodNode('estimateOffChainAgentRewards');
  const claimOnChainAgentRewards = getMethodNode('claimOnChainAgentRewards');
  return {
    ...existing,
    TYPE: existing.TYPE ?? '--PENDING_REWARDS--',
    estimateOffChainTotalRewards,
    claimOnChainTotalRewards,
    estimateOffChainSponsorRewards,
    claimOnChainSponsorRewards,
    estimateOffChainRecipientRewards,
    claimOnChainRecipientRewards,
    estimateOffChainAgentRewards,
    claimOnChainAgentRewards,
    pendingRewards: String(result.pendingRewards ?? existing.pendingRewards ?? '0'),
    __pendingRewardsRefreshAction: true,
    __pendingRewardsRefreshAtMs: refreshAtMs,
    __pendingRewardsRefreshActionName: action,
  };
}

function toRewardsBigInt(value: unknown) {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized) return 0n;
  try {
    return BigInt(normalized);
  } catch {
    return 0n;
  }
}

function readAccountRecordBalanceOf(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const totalSpCoins = record.totalSpCoins;
  if (totalSpCoins && typeof totalSpCoins === 'object' && !Array.isArray(totalSpCoins)) {
    const balance = (totalSpCoins as Record<string, unknown>).balanceOf;
    if (balance !== undefined && balance !== null) return String(balance);
  }
  const balance = record.balanceOf ?? record.accountBalance;
  return balance === undefined || balance === null ? null : String(balance);
}

function readAccountRecordTimestamp(value: unknown, timestampKey: string, pendingRewardsKey: string): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const direct = record[timestampKey];
  if (direct !== undefined && direct !== null) return String(direct);
  const totalSpCoins = record.totalSpCoins;
  const pendingRewards =
    totalSpCoins && typeof totalSpCoins === 'object' && !Array.isArray(totalSpCoins)
      ? (totalSpCoins as Record<string, unknown>).pendingRewards
      : null;
  if (pendingRewards && typeof pendingRewards === 'object' && !Array.isArray(pendingRewards)) {
    const nested = (pendingRewards as Record<string, unknown>)[pendingRewardsKey];
    if (nested !== undefined && nested !== null) return String(nested);
  }
  return null;
}

function buildAccountRecordMetaPatch(value: unknown): Record<string, unknown> {
  const lastSponsorUpdateTimeStamp = readAccountRecordTimestamp(value, 'lastSponsorUpdateTimeStamp', 'lastSponsorUpdate');
  const lastRecipientUpdateTimeStamp = readAccountRecordTimestamp(value, 'lastRecipientUpdateTimeStamp', 'lastRecipientUpdate');
  const lastAgentUpdateTimeStamp = readAccountRecordTimestamp(value, 'lastAgentUpdateTimeStamp', 'lastAgentUpdate');
  return {
    ...(lastSponsorUpdateTimeStamp ? { lastSponsorUpdateTimeStamp: calculateFormattedDT(lastSponsorUpdateTimeStamp) } : {}),
    ...(lastRecipientUpdateTimeStamp ? { lastRecipientUpdateTimeStamp: calculateFormattedDT(lastRecipientUpdateTimeStamp) } : {}),
    ...(lastAgentUpdateTimeStamp ? { lastAgentUpdateTimeStamp: calculateFormattedDT(lastAgentUpdateTimeStamp) } : {}),
  };
}

function readRefreshedAccountRecordFromClaim(value: unknown): unknown | null {
  const visit = (entry: unknown): unknown | null => {
    if (!entry || typeof entry !== 'object') return null;
    if (Array.isArray(entry)) {
      for (const item of entry) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }
    const record = entry as Record<string, unknown>;
    if (record.refreshedAccountRecord) return record.refreshedAccountRecord;
    if (record.result) {
      const found = visit(record.result);
      if (found) return found;
    }
    if (record.receipts) {
      const found = visit(record.receipts);
      if (found) return found;
    }
    return null;
  };
  return visit(value);
}

function getClaimBalanceRecord(value: unknown): Record<string, unknown> | null {
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as Record<string, unknown>).receipts)
      ? ((value as Record<string, unknown>).receipts as unknown[])
      : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    if (record.claimedAmount !== undefined || (record.balanceBefore !== undefined && record.balanceAfter !== undefined)) return record;
  }
  return null;
}

function buildClaimedBalanceSummary(updateResult: unknown, fallback?: {
  balanceBefore?: string;
  balanceAfter?: string;
  claimedAmount?: string;
}) {
  const balanceRecord = getClaimBalanceRecord(updateResult);
  const balanceBefore = String(balanceRecord?.balanceBefore ?? fallback?.balanceBefore ?? '0');
  const balanceAfter = String(balanceRecord?.balanceAfter ?? fallback?.balanceAfter ?? '0');
  const claimedAmount = String(
    balanceRecord?.claimedAmount ??
      fallback?.claimedAmount ??
      (toRewardsBigInt(balanceAfter) - toRewardsBigInt(balanceBefore)).toString(),
  );
  return {
    balanceBefore,
    balanceAfter,
    claimedAmount,
    totalRewardsClaimed: claimedAmount,
  };
}

interface MethodCallEntry {
  method: string;
  parameters: { label: string; value: unknown }[];
}

interface Params {
  activeContractAddress: string;
  rpcUrl?: string;
  mode: ConnectionMode;
  traceEnabled: boolean;
  formattedOutputDisplay: string;
  useLocalSpCoinAccessPackage: boolean;
  useReadCache?: boolean;
  readCacheNamespace?: string;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
  setFormattedOutputDisplay: (value: string) => void;
  setTreeOutputDisplay: (value: string) => void;
  setOutputPanelMode: (value: OutputPanelMode) => void;
  showValidationPopup: (
    fieldIds: string[],
    labels: string[],
    message?: string,
    options?: {
      title?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm?: () => void | Promise<void>;
    },
  ) => void;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<any>;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: any, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  selectedHardhatAddress?: string;
  appendWriteTrace?: (line: string) => void;
  normalizeAddressValue: (value: string) => string;
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  stringifyResult: (result: unknown) => string;
  buildMethodCallEntry: (
    method: string,
    params?: { label: string; value: unknown }[],
  ) => MethodCallEntry;
  formatOutputDisplayValue: (value: unknown) => string;
  formatFormattedPanelPayload: (payload: unknown) => string;
  callAccessMethod?: AccessMethodCaller;
}

export function useSponsorCoinLabTreeMethods({
  activeContractAddress,
  rpcUrl,
  mode,
  traceEnabled,
  formattedOutputDisplay,
  useLocalSpCoinAccessPackage,
  useReadCache,
  readCacheNamespace,
  appendLog,
  setStatus,
  setFormattedOutputDisplay,
  setTreeOutputDisplay,
  setOutputPanelMode,
  showValidationPopup,
  requireContractAddress,
  ensureReadRunner,
  executeWriteConnected,
  selectedHardhatAddress,
  appendWriteTrace,
  normalizeAddressValue,
  coerceParamValue,
  stringifyResult,
  buildMethodCallEntry,
  formatOutputDisplayValue,
  formatFormattedPanelPayload,
  callAccessMethod,
}: Params) {
  const [treeAccountOptions, setTreeAccountOptions] = useState<string[]>([]);
  const [selectedTreeAccount, setSelectedTreeAccount] = useState('');
  const [treeAccountRefreshToken, setTreeAccountRefreshToken] = useState(0);
  const treeAccountListCacheRef = useRef<string[] | null>(null);
  const treeAccountRecordCacheRef = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    treeAccountListCacheRef.current = null;
    treeAccountRecordCacheRef.current.clear();
    setTreeAccountOptions([]);
    setSelectedTreeAccount('');
    setTreeAccountRefreshToken(0);
  }, [activeContractAddress]);

  const syncTreeAccountOptions = useCallback((list: string[]) => {
    setTreeAccountOptions(list);
    setSelectedTreeAccount((current) => {
      if (current && list.includes(current)) return current;
      return list[0] || '';
    });
    return list;
  }, []);

  const loadTreeAccountOptions = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force && treeAccountListCacheRef.current) {
      const cachedList = treeAccountListCacheRef.current;
      syncTreeAccountOptions(cachedList);
      return { list: cachedList };
    }
    const target = requireContractAddress();
    const response = await fetch('/api/spCoin/run-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress: target,
        rpcUrl,
        spCoinAccessSource: 'local',
        cacheNamespace: readCacheNamespace,
        script: {
          id: `load-account-list-${Date.now()}`,
          name: 'Load Account List',
          network: 'hardhat',
          steps: [
            {
              step: 1,
              name: 'getMasterAccountKeys',
              panel: 'spcoin_rread',
              method: 'getMasterAccountKeys',
              mode: 'hardhat',
              params: [],
            },
          ],
        },
      }),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      message?: string;
      results?: { success?: boolean; payload?: { result?: unknown; error?: { message?: string } } }[];
    };
    if (!response.ok) {
      throw new Error(payload?.message ?? `Unable to load account list (${response.status})`);
    }
    const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
    if (!firstResult?.success) {
      throw new Error(firstResult?.payload?.error?.message ?? 'Unable to load account list.');
    }
    const list = normalizeStringListResult(firstResult?.payload?.result);
    treeAccountListCacheRef.current = list;
    syncTreeAccountOptions(list);
    return { list };
  }, [mode, readCacheNamespace, requireContractAddress, rpcUrl, syncTreeAccountOptions]);

  const runServerBackedTreeSpCoinMethod = useCallback(
    async ({
      panel,
      method,
      params,
      sender,
      useCacheOverride,
    }: {
      panel: 'spcoin_rread' | 'spcoin_write';
      method: string;
      params: { key: string; value: string }[];
      sender?: string;
      useCacheOverride?: boolean;
    }) => {
      const target = requireContractAddress();
      appendWriteTrace?.(
        `[SPCOIN_RPC_TRACE] tree server-backed dispatch panel=${panel} method=${method} mode=${mode} sender=${String(sender || '')}`,
      );
      const response = await fetch('/api/spCoin/run-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: target,
          rpcUrl,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          ...(useCacheOverride === undefined
            ? useReadCache === undefined
              ? {}
              : { useCache: useReadCache }
            : { useCache: useCacheOverride }),
          cacheNamespace: readCacheNamespace,
          script: {
            id: `tree-${method}-${Date.now()}`,
            name: method,
            network: mode === 'hardhat' ? 'hardhat' : 'metamask',
            steps: [
              {
                step: 1,
                name: method,
                panel,
                method,
                mode,
                ...(sender ? { 'msg.sender': sender } : {}),
                params,
              },
            ],
          },
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        results?: {
          success?: boolean;
          payload?: {
            result?: unknown;
            warning?: unknown;
            meta?: MethodExecutionMeta;
            onChainCalls?: MethodExecutionMeta['onChainCalls'];
            error?: { message?: unknown; debug?: { trace?: unknown } };
            debug?: { trace?: unknown };
          };
        }[];
      };
      if (!response.ok) {
        throw new Error(payload?.message ?? `Unable to run ${method} (${response.status})`);
      }
      const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
      const serverTrace = (
        firstResult?.payload?.debug?.trace ??
        firstResult?.payload?.error?.debug?.trace ??
        []
      ) as unknown;
      if (Array.isArray(serverTrace)) {
        serverTrace.forEach((line) => appendWriteTrace?.(`server ${String(line)}`));
      }
      if (!firstResult?.success) {
        throw new Error(toDisplayString(firstResult?.payload?.error?.message, `Unable to run ${method}.`));
      }
      return {
        result: firstResult.payload?.result,
        warning: firstResult.payload?.warning,
        meta: firstResult.payload?.meta,
        onChainCalls: firstResult.payload?.onChainCalls,
      };
    },
    [appendWriteTrace, mode, readCacheNamespace, requireContractAddress, rpcUrl, useLocalSpCoinAccessPackage, useReadCache],
  );

  const formattedOutputDisplayRef = useRef(formattedOutputDisplay);
  useEffect(() => {
    formattedOutputDisplayRef.current = formattedOutputDisplay;
  }, [formattedOutputDisplay]);
  const treeOutputDisplayRef = useRef('(no tree yet)');
  const setTrackedTreeOutputDisplay = useCallback(
    (value: string) => {
      treeOutputDisplayRef.current = value;
      setTreeOutputDisplay(value);
    },
    [setTreeOutputDisplay],
  );
  const expandAccountRelationInline = useLazyAccountRelationExpansion({
    appendLog,
    formatFormattedPanelPayload,
    formattedOutputDisplayRef,
    treeOutputDisplayRef,
    normalizeAddressValue,
    requireContractAddress,
    rpcUrl,
    callAccessMethod,
    readCacheNamespace,
    setFormattedOutputDisplay,
    setStatus,
    setTrackedTreeOutputDisplay,
  });

  const callTreeAccessMethod = useCallback(
    async <T,>(methodName: string, runner: () => Promise<T> | T) => {
      if (callAccessMethod) {
        return callAccessMethod(methodName, () => runner());
      }
      return runner();
    },
    [callAccessMethod],
  );

  const runHeaderReadBase = useCallback(async () => {
    const startedAtMs = Date.now();
    const executionTimingCollector = traceEnabled ? createMethodTimingCollector(startedAtMs) : null;
    const call = buildMethodCallEntry('getSpCoinMetaData');
    try {
      const result = executionTimingCollector
        ? await runWithMethodTimingCollector(executionTimingCollector, async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading SponsorCoin metadata...');
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(
          target,
          runner,
          undefined,
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        );
        try {
          return await (access.read as SpCoinReadAccess).getSpCoinMetaData();
        } catch (error) {
          throw await enrichDirectReadError({
            error,
            method: 'getSpCoinMetaData',
            target,
            runner,
          });
        }
      })
        : await (async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading SponsorCoin metadata...');
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(
          target,
          runner,
          undefined,
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        );
        try {
          return await (access.read as SpCoinReadAccess).getSpCoinMetaData();
        } catch (error) {
          throw await enrichDirectReadError({
            error,
            method: 'getSpCoinMetaData',
            target,
            runner,
          });
        }
      })();
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call, result, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      appendLog(`spCoinReadMethods/getSpCoinMetaData -> ${toDisplayString(result)}`);
      setStatus('Metadata read complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown metadata read error.';
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      setStatus(`Metadata read failed: ${message}`);
      appendLog(`Metadata read failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    ensureReadRunner,
    formatOutputDisplayValue,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTrackedTreeOutputDisplay,
    traceEnabled,
    useLocalSpCoinAccessPackage,
  ]);

  const runHeaderRead = useCallback(
    () => callTreeAccessMethod('getSpCoinMetaData', runHeaderReadBase),
    [callTreeAccessMethod, runHeaderReadBase],
  );

  const runAccountListReadBase = useCallback(async () => {
    const startedAtMs = Date.now();
    const executionTimingCollector = traceEnabled ? createMethodTimingCollector(startedAtMs) : null;
    const call = buildMethodCallEntry('getMasterAccountKeys');
    try {
      const { list } = executionTimingCollector
        ? await runWithMethodTimingCollector(executionTimingCollector, async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading account list...');
        return loadTreeAccountOptions();
      })
        : await (async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading account list...');
        return loadTreeAccountOptions();
      })();
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call, result: list, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      appendLog(`spCoinReadMethods/getMasterAccountKeys -> ${JSON.stringify(list)}`);
      setStatus(`Account read complete (${list.length} account(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown account list read error.';
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      setStatus(`Account list read failed: ${message}`);
      appendLog(`Account list read failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    formatOutputDisplayValue,
    loadTreeAccountOptions,
    setOutputPanelMode,
    setStatus,
    setTrackedTreeOutputDisplay,
    traceEnabled,
  ]);

  const runAccountListRead = useCallback(
    () => callTreeAccessMethod('getMasterAccountKeys', runAccountListReadBase),
    [callTreeAccessMethod, runAccountListReadBase],
  );

  const runTreeAccountsReadBase = useCallback(async () => {
    const startedAtMs = Date.now();
    const executionTimingCollector = traceEnabled ? createMethodTimingCollector(startedAtMs) : null;
    const call = {
      method: 'getTreeAccounts',
      parameters: [
        { label: 'via', value: 'getMasterAccountKeys' },
        { label: 'expand', value: 'lazy getAccountRecord(on open)' },
      ],
    };
    try {
      const accountKeys = executionTimingCollector
        ? await runWithMethodTimingCollector(executionTimingCollector, async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading all tree accounts...');
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(
          target,
          runner,
          undefined,
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        );
        try {
          return typeof (access.read as SpCoinReadAccess).getMasterAccountKeys === 'function'
            ? ((await (access.read as SpCoinReadAccess).getMasterAccountKeys?.())!)
            : ((await (access.read as SpCoinReadAccess).getAccountKeys()) as string[]);
        } catch (error) {
          throw await enrichDirectReadError({
            error,
            method: 'getMasterAccountKeys',
            target,
            runner,
          });
        }
      })
        : await (async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading all tree accounts...');
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(
          target,
          runner,
          undefined,
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        );
        try {
          return typeof (access.read as SpCoinReadAccess).getMasterAccountKeys === 'function'
            ? ((await (access.read as SpCoinReadAccess).getMasterAccountKeys?.())!)
            : ((await (access.read as SpCoinReadAccess).getAccountKeys()) as string[]);
        } catch (error) {
          throw await enrichDirectReadError({
            error,
            method: 'getMasterAccountKeys',
            target,
            runner,
          });
        }
      })();
      const result = (accountKeys ?? []).map((accountKey) => ({
        address: String(accountKey || ''),
      }));
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call, result, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      appendLog(`spCoinReadMethods/getTreeAccounts -> ${JSON.stringify(result)}`);
      setStatus(`Tree accounts read complete (${result.length} account stub(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree accounts read error.';
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      setStatus(`Tree accounts read failed: ${message}`);
      appendLog(`Tree accounts read failed: ${message}`);
    }
  }, [
    appendLog,
    ensureReadRunner,
    formatOutputDisplayValue,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTrackedTreeOutputDisplay,
    traceEnabled,
    useLocalSpCoinAccessPackage,
  ]);

  const runTreeAccountsRead = useCallback(
    () => callTreeAccessMethod('getTreeAccounts', runTreeAccountsReadBase),
    [callTreeAccessMethod, runTreeAccountsReadBase],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrateTreeAccountOptions = async () => {
      try {
        const { list } = await loadTreeAccountOptions();
        if (!cancelled) syncTreeAccountOptions(list);
      } catch {
        if (!cancelled) {
          setTreeAccountOptions([]);
          setSelectedTreeAccount('');
        }
      }
    };

    void hydrateTreeAccountOptions();
    return () => {
      cancelled = true;
    };
  }, [loadTreeAccountOptions, syncTreeAccountOptions]);

  const loadAccountRecordForAddress = useCallback(
    async (account: string, options?: { force?: boolean; signal?: AbortSignal }) => {
      const normalizedAccount = normalizeAddressValue(account);
      let tree = options?.force
        ? undefined
        : treeAccountRecordCacheRef.current.get(normalizedAccount) ?? getSpCoinLabAccountRecord(normalizedAccount);
      if (!tree) {
        const target = requireContractAddress();
        const response = await fetch('/api/spCoin/run-script', {
          method: 'POST',
          signal: options?.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: target,
            rpcUrl,
            spCoinAccessSource: 'local',
            cacheNamespace: readCacheNamespace,
            ...(options?.force ? { cacheMode: 'bypass' } : {}),
            script: {
              id: `expand-account-record-${Date.now()}`,
              name: 'Expand Account Record',
              network: 'hardhat',
              steps: [
                {
                  step: 1,
                  name: 'getAccountRecord',
                  panel: 'spcoin_rread',
                  method: 'getAccountRecord',
                  mode: 'hardhat',
                  params: [{ key: 'Account Key', value: normalizedAccount }],
                },
              ],
            },
          }),
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          results?: {
            success?: boolean;
            payload?: {
              result?: unknown;
              warning?: Record<string, unknown>;
              error?: { message?: string };
              meta?: MethodExecutionMeta;
              onChainCalls?: unknown;
            };
          }[];
        };
        if (!response.ok) {
          throw new Error(payload?.message ?? `Unable to load account record (${response.status})`);
        }
        const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
        const warning = firstResult?.payload?.warning as Record<string, unknown> | undefined;
        if (!firstResult?.success) {
          throw new Error(firstResult?.payload?.error?.message ?? 'Unable to load account record.');
        }
        tree = firstResult?.payload?.result;
        if (!tree || typeof tree !== 'object' || Array.isArray(tree)) {
          tree = { value: tree ?? null };
        }
        if (tree && typeof tree === 'object' && !Array.isArray(tree)) {
          const treeRecord = tree as Record<string, unknown>;
          if (!toDisplayString(treeRecord.accountKey).trim()) {
            treeRecord.accountKey = normalizedAccount;
          }
          treeRecord.__showEmptyFields = true;
          if (warning) {
            treeRecord.warning = warning;
          }
          if (firstResult?.payload?.meta) {
            treeRecord.meta = firstResult.payload.meta;
          }
          if (firstResult?.payload?.onChainCalls) {
            treeRecord.onChainCalls = firstResult.payload.onChainCalls;
          }
          applyLazyAccountRelationBuckets(treeRecord, normalizedAccount);
        }
        treeAccountRecordCacheRef.current.set(normalizedAccount, tree);
        setSpCoinLabAccountRecord(normalizedAccount, tree);
      }
      return tree;
    },
    [mode, normalizeAddressValue, readCacheNamespace, requireContractAddress, rpcUrl],
  );

  const runTreeDumpBase = useCallback(async (accountOverride?: string, options?: { force?: boolean }) => {
    const startedAtMs = Date.now();
    const executionTimingCollector = traceEnabled ? createMethodTimingCollector(startedAtMs) : null;
    const listCall = buildMethodCallEntry('getMasterAccountKeys');
    try {
      const { list } = executionTimingCollector
        ? await runWithMethodTimingCollector(executionTimingCollector, async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Building tree dump...');
        return loadTreeAccountOptions({ force: options?.force });
      })
        : await (async () => {
        setTrackedTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Building tree dump...');
        return loadTreeAccountOptions({ force: options?.force });
      })();
      if (list.length === 0) {
        setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, result: [], ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
        appendLog('Tree dump skipped: no accounts available.');
        setStatus('Tree dump skipped (no accounts).');
        return;
      }
      const requestedAccount = String(accountOverride ?? '').trim();
      const activeAccount =
        requestedAccount && list.includes(requestedAccount)
          ? requestedAccount
          : list.includes(selectedTreeAccount)
            ? selectedTreeAccount
            : list[0];
      setSelectedTreeAccount(activeAccount);
      const treeCall = buildMethodCallEntry('getAccountRecord', [{ label: 'Account', value: activeAccount }]);
      let tree = treeAccountRecordCacheRef.current.get(activeAccount);
      if (!tree || options?.force) {
        tree = executionTimingCollector
          ? await runWithMethodTimingCollector(executionTimingCollector, async () =>
              loadAccountRecordForAddress(activeAccount, { force: options?.force }),
            )
          : await loadAccountRecordForAddress(activeAccount, { force: options?.force });
        treeAccountRecordCacheRef.current.set(activeAccount, tree);
      }
      setTrackedTreeOutputDisplay(
        formatOutputDisplayValue({
          call: treeCall,
          result: tree,
          ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}),
        }),
      );
      appendLog(`spCoinReadMethods/getAccountRecord(${activeAccount}) -> ${JSON.stringify(tree)}`);
      setStatus('Tree dump complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree dump error.';
      setTrackedTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      setStatus(`Tree dump failed: ${message}`);
      appendLog(`Tree dump failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    formatOutputDisplayValue,
    loadAccountRecordForAddress,
    loadTreeAccountOptions,
    selectedTreeAccount,
    setOutputPanelMode,
    setStatus,
    setTrackedTreeOutputDisplay,
    traceEnabled,
  ]);

  const runTreeDump = useCallback(
    (accountOverride?: string, options?: { force?: boolean }) =>
      callTreeAccessMethod('getAccountRecord', () => runTreeDumpBase(accountOverride, options)),
    [callTreeAccessMethod, runTreeDumpBase],
  );

  const refreshSelectedTreeAccount = useCallback(async () => {
    const activeAccount = String(selectedTreeAccount || '').trim();
    if (!activeAccount) {
      setStatus('Refresh skipped: no active account selected.');
      appendLog('Refresh skipped: no active account selected.');
      return;
    }

    treeAccountListCacheRef.current = null;
    treeAccountRecordCacheRef.current.delete(activeAccount);
    invalidateSpCoinLabAccountRecord(activeAccount);
    setTreeAccountRefreshToken((prev) => prev + 1);
    await runTreeDump(activeAccount, { force: true });
  }, [appendLog, runTreeDump, selectedTreeAccount, setStatus]);

  const requestRefreshSelectedTreeAccount = useCallback(() => {
    showValidationPopup([], [], 'Reload Data Confirm', {
      title: 'Reload Data Confirm',
      confirmLabel: 'Reload Data',
      cancelLabel: 'Reject',
      onConfirm: () => refreshSelectedTreeAccount(),
    });
  }, [refreshSelectedTreeAccount, showValidationPopup]);

  const expandSpCoinMetaDataInline = useCallback(
    async (pathHint?: string): Promise<'expanded' | 'handled' | 'unhandled'> => {
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint.includes('.result.spCoinMetaData')) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplayRef.current ?? '').trim();
      if (trimmedDisplay.length === 0 || trimmedDisplay === '(no output yet)') return 'unhandled';

      const parsePayload = (raw: string) => {
        try {
          return JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return null;
        }
      };
      const blocks = trimmedDisplay
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);
      const blockEntries =
        blocks.length > 1
          ? blocks.map((raw, index) => ({ raw, index, payload: parsePayload(raw) }))
          : [{ raw: trimmedDisplay, index: 0, payload: parsePayload(trimmedDisplay) }];
      const rootPathMatch = /^(?:step|output)-(\d+)(?:\.|$)/i.exec(normalizedPathHint);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload?.result || typeof payload.result !== 'object' || Array.isArray(payload.result)) continue;
        const resultRecord = payload.result as Record<string, unknown>;
        if (!resultRecord.spCoinMetaData || typeof resultRecord.spCoinMetaData !== 'object' || Array.isArray(resultRecord.spCoinMetaData)) continue;

        try {
          setStatus('Loading spCoin metadata...');
          const loadMetadata = async () => {
            const metadataTimingCollector = createMethodTimingCollector();
            const metadataResult = await runWithMethodTimingCollector(metadataTimingCollector, async () =>
              runSpCoinReadMethod({
                selectedMethod: 'getSpCoinMetaData',
                spReadParams: [],
                coerceParamValue,
                stringifyResult,
                spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                requireContractAddress,
                ensureReadRunner,
                appendLog: noop,
                setStatus: noop,
                useReadCache,
                readCacheNamespace,
              }),
            );
            return {
              metadataResult,
              metadataMeta: buildExecutionMeta(metadataTimingCollector),
            };
          };
          const loadedMetadata = callAccessMethod
            ? await callAccessMethod('getSpCoinMetaData', () => loadMetadata())
            : await loadMetadata();
          if (!loadedMetadata) return 'handled';
          const { metadataResult, metadataMeta } = loadedMetadata;
          const metadataOnChainCalls =
            metadataMeta && typeof metadataMeta === 'object' && !Array.isArray(metadataMeta)
              ? (metadataMeta as Record<string, unknown>).onChainCalls
              : undefined;
          const sanitizedMetadataMeta =
            metadataMeta && typeof metadataMeta === 'object' && !Array.isArray(metadataMeta)
              ? ({ ...(metadataMeta as Record<string, unknown>) } as Record<string, unknown>)
              : metadataMeta;
          if (sanitizedMetadataMeta && typeof sanitizedMetadataMeta === 'object' && 'onChainCalls' in sanitizedMetadataMeta) {
            delete sanitizedMetadataMeta.onChainCalls;
          }
          const metadataRecord =
            metadataResult && typeof metadataResult === 'object' && !Array.isArray(metadataResult)
              ? {
                  result: {
                    ...(metadataResult as Record<string, unknown>),
                  },
                  ...(metadataOnChainCalls ? { onChainCalls: metadataOnChainCalls } : {}),
                  meta: sanitizedMetadataMeta,
                }
              : {
                  result: metadataResult,
                  ...(metadataOnChainCalls ? { onChainCalls: metadataOnChainCalls } : {}),
                  meta: sanitizedMetadataMeta,
                };
          const nextPayload = formatFormattedPanelPayload({
            ...payload,
            result: {
              ...resultRecord,
              spCoinMetaData: metadataRecord,
            },
          });
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            setFormattedOutputDisplay(nextBlocks.join('\n\n'));
          } else {
            setFormattedOutputDisplay(nextPayload);
          }
          setStatus('Loaded spCoin metadata.');
          appendLog('Lazy-loaded spCoinMetaData.');
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, 'Unable to load spCoin metadata.');
          setStatus('Unable to load spCoin metadata.');
          appendLog(`Lazy spCoinMetaData load failed: ${message}`);
          return 'handled';
        }
      }
      return 'unhandled';
    },
    [
      appendLog,
      coerceParamValue,
      ensureReadRunner,
      formatFormattedPanelPayload,
      requireContractAddress,
      setFormattedOutputDisplay,
      setStatus,
      stringifyResult,
      callAccessMethod,
      useLocalSpCoinAccessPackage,
    ],
  );

  const expandMasterAccountKeysInline = useCallback(
    async (pathHint?: string): Promise<'expanded' | 'handled' | 'unhandled'> => {
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint.includes('.result.masterAccountKeys')) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplayRef.current ?? '').trim();
      if (trimmedDisplay.length === 0 || trimmedDisplay === '(no output yet)') return 'unhandled';

      const parsePayload = (raw: string) => {
        try {
          return JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return null;
        }
      };
      const blocks = trimmedDisplay
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);
      const blockEntries =
        blocks.length > 1
          ? blocks.map((raw, index) => ({ raw, index, payload: parsePayload(raw) }))
          : [{ raw: trimmedDisplay, index: 0, payload: parsePayload(trimmedDisplay) }];
      const rootPathMatch = /^(?:step|output)-(\d+)(?:\.|$)/i.exec(normalizedPathHint);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload?.result || typeof payload.result !== 'object' || Array.isArray(payload.result)) continue;
        const resultRecord = payload.result as Record<string, unknown>;
        const masterAccountKeys = resultRecord.masterAccountKeys;
        if (
          !masterAccountKeys ||
          typeof masterAccountKeys !== 'object' ||
          Array.isArray(masterAccountKeys) ||
          (masterAccountKeys as Record<string, unknown>).__lazyMasterAccountKeys !== true
        ) {
          continue;
        }

        try {
          setStatus('Loading master account keys...');
          const loadMasterAccountKeys = () =>
            runSpCoinReadMethod({
              selectedMethod: 'getMasterAccountKeys',
              spReadParams: [],
              coerceParamValue,
              stringifyResult,
              spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
              requireContractAddress,
              ensureReadRunner,
              appendLog: noop,
              setStatus: noop,
              useReadCache,
              readCacheNamespace,
            });
          const accountKeysResult = callAccessMethod
            ? await callAccessMethod('getMasterAccountKeys', () => loadMasterAccountKeys())
            : await loadMasterAccountKeys();
          if (accountKeysResult === undefined) return 'handled';
          const nextPayload = formatFormattedPanelPayload({
            ...payload,
            result: {
              ...resultRecord,
              masterAccountKeys: normalizeStringListResult(accountKeysResult ?? []),
            },
          });
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            setFormattedOutputDisplay(nextBlocks.join('\n\n'));
          } else {
            setFormattedOutputDisplay(nextPayload);
          }
          setStatus('Loaded master account keys.');
          appendLog('Lazy-loaded masterAccountKeys via getMasterAccountKeys.');
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, 'Unable to load master account keys.');
          setStatus('Unable to load master account keys.');
          appendLog(`Lazy masterAccountKeys load failed: ${message}`);
          return 'handled';
        }
      }
      return 'unhandled';
    },
    [
      appendLog,
      coerceParamValue,
      ensureReadRunner,
      formatFormattedPanelPayload,
      requireContractAddress,
      setFormattedOutputDisplay,
      setStatus,
      stringifyResult,
      callAccessMethod,
      useLocalSpCoinAccessPackage,
    ],
  );

  const expandMasterSponsorListAccountInline = useCallback(
    async (account: string, pathHint?: string): Promise<'expanded' | 'handled' | 'unhandled'> => {
      const normalizedAccount = normalizeAddressValue(account);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplayRef.current ?? '').trim();
      if (!trimmedDisplay) return 'unhandled';
      const normalizedPathHint = String(pathHint ?? '').trim();
      const pathSegments = normalizedPathHint.split('.').filter(Boolean);
      if (pathSegments.length < 2) return 'unhandled';
      const rootSegment = pathSegments[0] || '';
      const pathRootMatch = /^(?:step|output|script|tree)-(\d+)$/i.exec(rootSegment);
      const hintedBlockIndex = pathRootMatch ? Number(pathRootMatch[1]) : Number.NaN;
      const payloadPathCandidates = [
        pathRootMatch ? pathSegments.slice(1) : pathSegments,
        pathSegments.slice(1),
      ].filter((segments, index, allSegments) => {
        if (segments.length === 0) return false;
        const targetKey = segments[segments.length - 1] || '';
        if (!isAccountAddressPathKey(targetKey)) return false;
        return allSegments.findIndex((candidate) => candidate.join('.') === segments.join('.')) === index;
      });
      if (payloadPathCandidates.length === 0) return 'unhandled';

      const parsePayload = (raw: string): Record<string, unknown> | null => {
        try {
          const parsed = JSON.parse(raw);
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
        } catch {
          return null;
        }
      };
      const readPathValue = (source: unknown, segments: string[]): unknown => {
        return segments.reduce<unknown>((currentValue, segment) => {
          if (currentValue == null) return undefined;
          if (Array.isArray(currentValue)) {
            const index = Number(segment);
            return Number.isInteger(index) ? currentValue[index] : undefined;
          }
          if (typeof currentValue !== 'object') return undefined;
          return (currentValue as Record<string, unknown>)[segment];
        }, source);
      };
      const writePathValue = (source: unknown, segments: string[], nextValue: unknown): unknown => {
        if (segments.length === 0) return nextValue;
        const [head, ...tail] = segments;
        if (Array.isArray(source)) {
          const index = Number(head);
          if (!Number.isInteger(index) || index < 0 || index >= source.length) return source;
          const nextArray = [...source];
          nextArray[index] = writePathValue(nextArray[index], tail, nextValue);
          return nextArray;
        }
        if (!source || typeof source !== 'object') return source;
        return {
          ...(source as Record<string, unknown>),
          [head]: writePathValue((source as Record<string, unknown>)[head], tail, nextValue),
        };
      };
      const getAccountAddressFromEntry = (entry: unknown) => {
        if (typeof entry === 'string') return normalizeAddressValue(entry);
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return '';
        return normalizeAddressValue(
          toDisplayString((entry as Record<string, unknown>).address ?? (entry as Record<string, unknown>).accountKey),
        );
      };
      const hasLoadedAccountRecordEntry = (entry: unknown) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
        const record = entry as Record<string, unknown>;
        return Boolean(record.TYPE ?? record.totalSpCoins ?? record.accountRecord);
      };
      const buildExpandedAccountEntry = (accountRecord: unknown) => {
        const recordObject =
          accountRecord && typeof accountRecord === 'object' && !Array.isArray(accountRecord)
            ? { ...(accountRecord as Record<string, unknown>) }
            : null;
        const accountKeyForBuckets =
          recordObject
            ? normalizeAddressValue(toDisplayString(recordObject.accountKey || normalizedAccount))
            : normalizedAccount;
        if (recordObject) {
          applyLazyAccountRelationBuckets(recordObject, accountKeyForBuckets);
        }
        let callMeta = recordObject && 'meta' in recordObject ? (recordObject.meta as unknown) : undefined;
        const topLevelOnChainCalls = recordObject && 'onChainCalls' in recordObject ? recordObject.onChainCalls : undefined;
        const nestedMetaOnChainCalls =
          recordObject &&
          typeof recordObject.meta === 'object' &&
          recordObject.meta !== null &&
          !Array.isArray(recordObject.meta) &&
          'onChainCalls' in recordObject.meta
            ? (recordObject.meta as Record<string, unknown>).onChainCalls
            : undefined;
        const callOnChainCalls = topLevelOnChainCalls ?? nestedMetaOnChainCalls;
        if (nestedMetaOnChainCalls && recordObject && typeof recordObject.meta === 'object' && !Array.isArray(recordObject.meta)) {
          const sanitizedMeta = { ...(recordObject.meta as Record<string, unknown>) };
          delete sanitizedMeta.onChainCalls;
          callMeta = Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : undefined;
        }

        const expandedResult = recordObject
          ? Object.fromEntries(Object.entries(recordObject).filter(([key]) => key !== 'meta' && key !== 'onChainCalls'))
          : { value: accountRecord };
        return {
          call: {
            method: 'getAccountRecord',
            parameters: {
              'Account Key': normalizedAccount,
            },
          },
          ...(callMeta ? { meta: callMeta } : {}),
          ...(callOnChainCalls ? { onChainCalls: callOnChainCalls } : {}),
          result: expandedResult,
          __forceExpanded: true,
          __showEmptyFields: true,
        };
      };
      interface InlineAccountTarget {
        targetEntry: unknown;
        path: string[];
        sourcePath?: string[];
        matchKind?: string;
      }
      const findInlineAccountTarget = (
        source: unknown,
        segments: string[] = [],
      ): InlineAccountTarget | null => {
        if (!source || typeof source !== 'object') return null;
        if (!Array.isArray(source)) {
          const record = source as Record<string, unknown>;
          if (getAccountAddressFromEntry(record) === normalizedAccount && !hasLoadedAccountRecordEntry(record)) {
            return { targetEntry: record, path: segments, matchKind: 'object-address' };
          }
          for (const [key, value] of Object.entries(record)) {
            if (
              isAccountAddressPathKey(key) &&
              typeof value === 'string' &&
              normalizeAddressValue(value) === normalizedAccount
            ) {
              return { targetEntry: value, path: [...segments, key], matchKind: 'leaf-address' };
            }
            const nested = findInlineAccountTarget(value, [...segments, key]);
            if (nested) return nested;
          }
          return null;
        }
        for (let index = 0; index < source.length; index += 1) {
          const nested = findInlineAccountTarget(source[index], [...segments, String(index)]);
          if (nested) return nested;
        }
        return null;
      };
      const normalizeExactTargetPath = (payload: Record<string, unknown>, payloadPath: string[]): InlineAccountTarget | null => {
        const targetEntry = readPathValue(payload, payloadPath);
        if (getAccountAddressFromEntry(targetEntry) !== normalizedAccount) return null;
        const lastSegment = payloadPath[payloadPath.length - 1] ?? '';
        if (isAccountAddressPathKey(lastSegment) && payloadPath.length > 0) {
          const parentPath = payloadPath.slice(0, -1);
          const parentEntry = readPathValue(payload, parentPath);
          if (
            parentEntry &&
            typeof parentEntry === 'object' &&
            !Array.isArray(parentEntry) &&
            getAccountAddressFromEntry(parentEntry) === normalizedAccount &&
            !hasLoadedAccountRecordEntry(parentEntry)
          ) {
            return {
              targetEntry: parentEntry,
              path: parentPath,
              sourcePath: payloadPath,
              matchKind: 'parent-from-address-leaf',
            };
          }
        }
        return {
          targetEntry,
          path: payloadPath,
          sourcePath: payloadPath,
          matchKind: 'exact-leaf',
        };
      };

      const blocks = trimmedDisplay
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);
      const blockEntries =
        blocks.length > 1
          ? blocks.map((raw, index) => ({ raw, index, payload: parsePayload(raw) }))
          : [{ raw: trimmedDisplay, index: 0, payload: parsePayload(trimmedDisplay) }];
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) continue;
        const exactTargets = payloadPathCandidates
          .map((payloadPath) => normalizeExactTargetPath(payload, payloadPath))
          .filter((target): target is InlineAccountTarget => Boolean(target));
        const fallbackTarget = exactTargets.length > 0 ? null : findInlineAccountTarget(payload);
        const targets = fallbackTarget ? [...exactTargets, fallbackTarget] : exactTargets;
        for (const target of targets) {
          try {
            setStatus(`Loading account record for ${normalizedAccount}...`);
            const loadInlineAccountRecord = (signal?: AbortSignal) =>
              loadAccountRecordForAddress(normalizedAccount, { force: true, signal });
            const accountRecord = callAccessMethod
              ? await callAccessMethod('getAccountRecord', ({ executionSignal }) => loadInlineAccountRecord(executionSignal))
              : await loadInlineAccountRecord();
            if (accountRecord === undefined) return 'handled';
            const nextAccountEntry = buildExpandedAccountEntry(accountRecord);
            const nextRootPayload = normalizeExecutionPayload(
              writePathValue(payload, target.path, nextAccountEntry),
            ) as Record<string, unknown>;
            const nextPayload = formatFormattedPanelPayload(nextRootPayload);
            if (blocks.length > 1) {
              const nextBlocks = [...blocks];
              nextBlocks[entry.index] = nextPayload;
              setFormattedOutputDisplay(nextBlocks.join('\n\n'));
            } else {
              setFormattedOutputDisplay(nextPayload);
            }
            setStatus(`Loaded account record for ${normalizedAccount}.`);
            appendLog(`Inline account record loaded for ${normalizedAccount}`);
            return 'expanded';
          } catch (error) {
            const message = getErrorMessage(error, 'Unable to load account record.');
            setStatus(`Unable to load account record for ${normalizedAccount}.`);
            appendLog(`Inline account record load failed for ${normalizedAccount}: ${message}`);
            if (/server runner only supports hardhat/i.test(message)) {
              showValidationPopup(
                [],
                [],
                `Account expansion requires Hardhat mode. Current mode is metamask. Switch to Hardhat in the Network settings and try again.`,
                { title: 'Mode Mismatch', confirmLabel: 'OK' },
              );
            }
            return 'handled';
          }
        }
      }
      return 'unhandled';
    },
    [
      appendLog,
      formatFormattedPanelPayload,
      loadAccountRecordForAddress,
      normalizeAddressValue,
      setFormattedOutputDisplay,
      setStatus,
      showValidationPopup,
    ],
  );

  const expandPendingRewardsActionInline = useCallback(
    async (
      click: PendingRewardsActionClick,
      pathHint?: string,
      rawDisplayOverride?: string,
    ): Promise<'expanded' | 'handled' | 'unhandled'> => {
      const normalizedAccount = normalizeAddressValue(click.accountKey);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return 'unhandled';
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint) return 'unhandled';
      const rootSegment = normalizedPathHint.split('.')[0] || '';
      const rootPathMatch = /^(?:step|output|script|tree)-(\d+)$/i.exec(rootSegment);
      const inTreePanel = /^tree-/i.test(rootSegment);
      const rawDisplay = String(
        rawDisplayOverride ?? (inTreePanel ? treeOutputDisplayRef.current : formattedOutputDisplayRef.current),
      ).trim();
      appendLog(
        `[PENDING_REWARDS_TRACE] expand start account=${normalizedAccount} action=${click.action} method=${String(click.method || '')} path=${normalizedPathHint} tree=${String(inTreePanel)} rawOverride=${String(rawDisplayOverride !== undefined)} rawLength=${String(rawDisplay.length)}`,
      );
      if (!rawDisplay || rawDisplay === '(no tree yet)' || rawDisplay === '(no output yet)') {
        appendLog(`[PENDING_REWARDS_TRACE] expand stop empty-display path=${normalizedPathHint}`);
        return 'unhandled';
      }

      const parsePayload = (raw: string): Record<string, unknown> | null => {
        try {
          const parsed = JSON.parse(raw);
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
        } catch {
          return null;
        }
      };
      const readPathValue = (source: unknown, segments: string[]): unknown => {
        return segments.reduce<unknown>((currentValue, segment) => {
          if (currentValue == null) return undefined;
          if (Array.isArray(currentValue)) {
            const index = Number(segment);
            return Number.isInteger(index) ? currentValue[index] : undefined;
          }
          if (typeof currentValue !== 'object') return undefined;
          return (currentValue as Record<string, unknown>)[segment];
        }, source);
      };
      const writePathValue = (source: unknown, segments: string[], nextValue: unknown): unknown => {
        if (segments.length === 0) return nextValue;
        const [head, ...tail] = segments;
        if (Array.isArray(source)) {
          const index = Number(head);
          if (!Number.isInteger(index) || index < 0 || index >= source.length) return source;
          const nextArray = [...source];
          nextArray[index] = writePathValue(nextArray[index], tail, nextValue);
          return nextArray;
        }
        if (!source || typeof source !== 'object') return source;
        return {
          ...(source as Record<string, unknown>),
          [head]: writePathValue((source as Record<string, unknown>)[head], tail, nextValue),
        };
      };
      const writePendingRewardsPathValue = (source: unknown, segments: string[], nextValue: unknown): unknown => {
        return writePathValue(source, segments, nextValue);
      };
      const readDisplayPathValue = (source: unknown, segments: string[]): unknown => {
        const directValue = readPathValue(source, segments);
        if (directValue !== undefined) return directValue;
        const parametersIndex = segments.findIndex((segment) => segment === 'parameters');
        if (parametersIndex < 1) return directValue;
        return readPathValue(source, [
          ...segments.slice(0, parametersIndex),
          'call',
          ...segments.slice(parametersIndex),
        ]);
      };

      const blocks = rawDisplay
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);
      const blockEntries =
        blocks.length > 1
          ? blocks.map((raw, index) => ({ raw, index, payload: parsePayload(raw) }))
          : [{ raw: rawDisplay, index: 0, payload: parsePayload(rawDisplay) }];
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;
      const payloadPath = normalizedPathHint.split('.').filter(Boolean).slice(1);
      appendLog(
        `[PENDING_REWARDS_TRACE] expand blocks=${String(blockEntries.length)} candidates=${String(candidateEntries.length)} payloadPath=${payloadPath.join('.')}`,
      );
      if (payloadPath.length === 0) {
        appendLog(`[PENDING_REWARDS_TRACE] expand stop empty-payload-path path=${normalizedPathHint}`);
        return 'unhandled';
      }

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) {
          appendLog(`[PENDING_REWARDS_TRACE] candidate skip unparsable block=${String(entry.index)}`);
          continue;
        }
        const targetNode = readDisplayPathValue(payload, payloadPath);
        const targetPath =
          hasPendingRewardsRefreshAction(targetNode) && payloadPath.at(-1) === 'result'
            ? payloadPath.slice(0, -1)
          : hasPendingRewardsRefreshAction(targetNode) && payloadPath.at(-1) === 'pendingRewards'
              ? [...payloadPath, 'estimateOffChainTotalRewards']
            : (payloadPath.at(-1) === 'claim' || payloadPath.at(-1) === 'update') && payloadPath.at(-2) !== 'pendingRewards'
              ? [...payloadPath.slice(0, -1), 'pendingRewards', 'estimateOffChainTotalRewards']
              : payloadPath;
        const actionNode = readPathValue(payload, targetPath) ?? readPathValue(payload, payloadPath);
        const targetLeaf = targetPath.at(-1);
        const isPendingRewardsMethodLeaf =
          typeof targetLeaf === 'string' &&
          (PENDING_REWARDS_ESTIMATE_METHODS.has(targetLeaf) || PENDING_REWARDS_CLAIM_METHODS.has(targetLeaf));
        const targetNodeResult =
          targetNode && typeof targetNode === 'object' && !Array.isArray(targetNode)
            ? (targetNode as Record<string, unknown>).result
            : null;
        const isRerunnablePendingRewardsMethod =
          Boolean(click.method) &&
          isPendingRewardsMethodLeaf &&
          Boolean(readPendingRewardsAmount(targetNode) ?? readPendingRewardsAmount(targetNodeResult));
        const pendingRewardsNode = isPendingRewardsMethodLeaf ? readPathValue(payload, targetPath.slice(0, -1)) : null;
        const pendingRewardsRecord =
          pendingRewardsNode && typeof pendingRewardsNode === 'object' && !Array.isArray(pendingRewardsNode)
            ? (pendingRewardsNode as Record<string, unknown>)
            : null;
        const pairedEstimateMethod =
          click.method && PENDING_REWARDS_CLAIM_METHODS.has(click.method)
            ? PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD[click.method]
            : null;
        const shouldRefreshPairedEstimate =
          Boolean(
            click.action === 'claim' &&
              pairedEstimateMethod &&
              pendingRewardsRecord &&
              isLoadedPendingRewardsMethodNode(pendingRewardsRecord[pairedEstimateMethod]),
          );
        const fallbackActionNode = pendingRewardsRecord
          ? pendingRewardsRecord[click.action] ?? pendingRewardsRecord.estimate ?? pendingRewardsRecord.claim
          : null;
        appendLog(
          `[PENDING_REWARDS_TRACE] candidate target=${targetPath.join('.')} leaf=${String(targetLeaf || '')} method=${String(click.method || '')} action=${click.action} rerun=${String(isRerunnablePendingRewardsMethod)} lazy=${String(hasLazyPendingRewardsAction(actionNode) || hasLazyPendingRewardsMethod(actionNode))}`,
        );
        if (
          !hasLazyPendingRewardsAction(actionNode) &&
          !hasLazyPendingRewardsMethod(actionNode) &&
          !hasLazyPendingRewardsAction(fallbackActionNode) &&
          !hasLazyPendingRewardsMethod(fallbackActionNode) &&
          !hasPendingRewardsRefreshAction(targetNode) &&
          !isRerunnablePendingRewardsMethod
        ) {
          appendLog(`[PENDING_REWARDS_TRACE] candidate skip no-action target=${targetPath.join('.')}`);
          continue;
        }

        try {
          const actionLabel = click.method || (click.action === 'estimate' ? 'pending rewards estimate' : 'pending rewards claim');
          setStatus(`Loading ${actionLabel} for ${normalizedAccount}...`);
          const loadPendingRewardsEstimate = async (
            methodOverride?: PendingRewardsActionClick['method'],
            options?: { bypassCache?: boolean },
          ) => {
            const pendingTimingCollector = createMethodTimingCollector();
            const selectedEstimateMethod =
              methodOverride && PENDING_REWARDS_ESTIMATE_METHODS.has(methodOverride)
                ? methodOverride
                : click.method && PENDING_REWARDS_ESTIMATE_METHODS.has(click.method)
                ? click.method
                : 'estimateOffChainTotalRewards';
            appendLog(
              `[PENDING_REWARDS_TRACE] run estimate method=${selectedEstimateMethod} account=${normalizedAccount} target=${targetPath.join('.')}`,
            );
            if (mode === 'hardhat') {
              const serverResult = await runServerBackedTreeSpCoinMethod({
                panel: 'spcoin_rread',
                method: selectedEstimateMethod,
                params: [{ key: 'Account Key', value: normalizedAccount }],
                ...(options?.bypassCache ? { useCacheOverride: false } : {}),
              });
              return {
                pendingResult: serverResult.result,
                pendingMeta: serverResult.meta ?? buildExecutionMeta(pendingTimingCollector),
              };
            }
            const pendingResult = await runWithMethodTimingCollector(pendingTimingCollector, async () =>
              runSpCoinReadMethod({
                selectedMethod: selectedEstimateMethod as SpCoinReadMethod,
                spReadParams: [normalizedAccount],
                coerceParamValue,
                stringifyResult,
                spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                requireContractAddress,
                ensureReadRunner,
                     appendLog: noop,
                     setStatus: noop,
                      useReadCache,
                      ...(options?.bypassCache ? { useReadCache: false } : {}),
                      readCacheNamespace,
                    }),
            );
            return {
              pendingResult,
              pendingMeta: buildExecutionMeta(pendingTimingCollector),
            };
          };
          const getTopLevelGetAccountRecordKey = (candidate: unknown) => {
            if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return '';
            const call = (candidate as Record<string, unknown>).call;
            if (!call || typeof call !== 'object' || Array.isArray(call)) return '';
            if (String((call as Record<string, unknown>).method || '').trim() !== 'getAccountRecord') return '';
            const parameters = (call as Record<string, unknown>).parameters;
            if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return '';
            return normalizeAddressValue(
              toDisplayString(
                (parameters as Record<string, unknown>)['Account Key'] ??
                  (parameters as Record<string, unknown>).Account ??
                  (parameters as Record<string, unknown>).accountKey,
              ),
            );
          };

          const claimPendingRewards = async () => {
            const claimTimingCollector = createMethodTimingCollector();
            const selectedClaimMethod =
              click.method && PENDING_REWARDS_CLAIM_METHODS.has(click.method)
                ? click.method
                : 'claimOnChainTotalRewards';
            appendLog(
              `[PENDING_REWARDS_TRACE] run claim method=${selectedClaimMethod} account=${normalizedAccount} target=${targetPath.join('.')}`,
            );
            const readBalanceOf = async () =>
              runWithMethodTimingCollector(claimTimingCollector, async () => {
                const target = requireContractAddress();
                const runner = await ensureReadRunner();
                const contract = createSpCoinContract(target, runner) as unknown as {
                  balanceOf?: (accountKey: string) => Promise<unknown>;
                };
                if (typeof contract.balanceOf !== 'function') {
                  throw new Error('balanceOf is not available on the current SpCoin contract.');
                }
                return String(await contract.balanceOf(normalizedAccount));
              });
            const balanceBefore = mode === 'hardhat' ? undefined : await readBalanceOf();
            const updateResult =
              mode === 'hardhat'
                ? await runServerBackedTreeSpCoinMethod({
                    panel: 'spcoin_write',
                    method: selectedClaimMethod,
                    sender: selectedHardhatAddress || normalizedAccount,
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  })
                : await runSpCoinWriteMethod({
                    selectedMethod: selectedClaimMethod as SpCoinWriteMethod,
                    spWriteParams: [normalizedAccount],
                    coerceParamValue,
                    executeWriteConnected,
                    selectedHardhatAddress: selectedHardhatAddress || normalizedAccount,
                    appendLog,
                    appendWriteTrace,
                    spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                    setStatus: noop,
                    timingCollector: claimTimingCollector,
                  });
            let refreshedAccountRecord: unknown | null = null;
            if (mode !== 'hardhat') {
              treeAccountRecordCacheRef.current.delete(normalizedAccount);
              invalidateSpCoinLabAccountRecord(normalizedAccount);
              refreshedAccountRecord = await loadAccountRecordForAddress(normalizedAccount, { force: true });
            }
            const balanceAfter =
              mode === 'hardhat'
                ? undefined
                : readAccountRecordBalanceOf(refreshedAccountRecord) ?? await readBalanceOf();
            const balanceClaimSummary = buildClaimedBalanceSummary(
              mode === 'hardhat' ? (updateResult as { result?: unknown }).result : updateResult,
              balanceBefore !== undefined && balanceAfter !== undefined
                ? {
                    balanceBefore,
                    balanceAfter,
                    claimedAmount: (toRewardsBigInt(balanceAfter) - toRewardsBigInt(balanceBefore)).toString(),
                  }
                : undefined,
            );
            const serverClaimResult = mode === 'hardhat' ? (updateResult as { result?: unknown }).result : null;
            const effectiveRefreshedAccountRecord =
              refreshedAccountRecord ?? readRefreshedAccountRecordFromClaim(serverClaimResult);
            return {
              pendingResult: {
                ...balanceClaimSummary,
                ...(effectiveRefreshedAccountRecord ? { refreshedAccountRecord: effectiveRefreshedAccountRecord } : {}),
                receipts: mode === 'hardhat' ? serverClaimResult : (updateResult as { receipts?: unknown }).receipts,
              },
              pendingMeta:
                (updateResult as { meta?: MethodExecutionMeta }).meta ?? buildExecutionMeta(claimTimingCollector),
            };
          };

          const isEstimatePendingRewardsRequest =
            (click.method && PENDING_REWARDS_ESTIMATE_METHODS.has(click.method)) || click.action === 'estimate';
          const loadedPending = isEstimatePendingRewardsRequest
            ? callAccessMethod
              ? await callAccessMethod(click.method || 'estimateOffChainTotalRewards', () => loadPendingRewardsEstimate())
              : await loadPendingRewardsEstimate()
            : callAccessMethod
              ? await callAccessMethod(click.method || 'claimOnChainTotalRewards', () => claimPendingRewards())
              : await claimPendingRewards();
          if (!loadedPending) return 'handled';
          const { pendingResult, pendingMeta } = loadedPending;
          const refreshedAccountRecord =
            click.action === 'claim' ? readRefreshedAccountRecordFromClaim(pendingResult) : null;
          if (refreshedAccountRecord) {
            treeAccountRecordCacheRef.current.set(normalizedAccount, refreshedAccountRecord);
            setSpCoinLabAccountRecord(normalizedAccount, refreshedAccountRecord);
          }
          const methodName = click.method
            ? click.method
            : click.action === 'claim'
              ? 'claimPendingRewards'
              : 'estimateOffChainTotalRewards';
          const expandedCallMethod = click.method ?? methodName;
          const refreshablePendingResult =
            click.action === 'estimate' && pendingResult && typeof pendingResult === 'object' && !Array.isArray(pendingResult)
              ? {
                  ...(normalizePendingRewardsEstimateResult(pendingResult) as Record<string, unknown>),
                  __pendingRewardsRefreshAction: true,
                  __pendingRewardsRefreshAtMs: Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS,
                  __pendingRewardsRefreshActionName: 'estimate',
                }
              : pendingResult;
          const expandedNode = {
            call: {
              method: expandedCallMethod,
              parameters: {
                'Account Key': normalizedAccount,
              },
              selectedMethod: methodName,
              ...(click.action === 'claim'
                ? { sequence: ['balanceOf', expandedCallMethod, 'getAccountRecord'] }
                : {}),
            },
            ...(pendingMeta ? { meta: pendingMeta } : {}),
            result: refreshablePendingResult,
            __forceExpanded: true,
            __showEmptyFields: true,
          };
          let pairedEstimateExpandedNode: Record<string, unknown> | null = null;
          if (!isEstimatePendingRewardsRequest && shouldRefreshPairedEstimate && pairedEstimateMethod) {
            try {
              const pairedLoaded = callAccessMethod
                ? await callAccessMethod(pairedEstimateMethod, () =>
                    loadPendingRewardsEstimate(pairedEstimateMethod, { bypassCache: true }),
                  )
                : await loadPendingRewardsEstimate(pairedEstimateMethod, { bypassCache: true });
              if (pairedLoaded) {
                const pairedRefreshableResult =
                  pairedLoaded.pendingResult &&
                  typeof pairedLoaded.pendingResult === 'object' &&
                  !Array.isArray(pairedLoaded.pendingResult)
                    ? {
                        ...(normalizePendingRewardsEstimateResult(pairedLoaded.pendingResult) as Record<string, unknown>),
                        __pendingRewardsRefreshAction: true,
                        __pendingRewardsRefreshAtMs: Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS,
                        __pendingRewardsRefreshActionName: 'estimate',
                      }
                    : pairedLoaded.pendingResult;
                const existingPairedEstimateNode = asRecord(pendingRewardsRecord?.[pairedEstimateMethod]);
                pairedEstimateExpandedNode = {
                  call: {
                    method: pairedEstimateMethod,
                    parameters: {
                      'Account Key': normalizedAccount,
                    },
                    selectedMethod: pairedEstimateMethod,
                  },
                  ...(pairedLoaded.pendingMeta ? { meta: pairedLoaded.pendingMeta } : {}),
                  result: pairedRefreshableResult,
                  ...(existingPairedEstimateNode?.__forceExpanded === true ? { __forceExpanded: true } : {}),
                  ...(existingPairedEstimateNode?.__showEmptyFields === true ? { __showEmptyFields: true } : {}),
                };
              }
            } catch (error) {
              appendLog(
                `Unable to refresh paired estimate ${pairedEstimateMethod} after claim: ${getErrorMessage(error, 'Unknown error')}`,
              );
            }
          }
          const pendingRewardsAmount = readPendingRewardsAmount(pendingResult);
          const pendingRewardsRefreshAtMs = Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS;
          const pendingRewardsPath =
            targetLeaf === 'estimate' ||
            targetLeaf === 'claim' ||
            isPendingRewardsMethodLeaf
              ? targetPath.slice(0, -1)
              : targetLeaf === 'pendingRewards'
                ? targetPath
              : [];
          const shouldPreservePendingRewardsShape =
            targetLeaf === 'estimate' ||
            targetLeaf === 'claim' ||
            isPendingRewardsMethodLeaf ||
            targetLeaf === 'pendingRewards';
          const payloadWithExpandedNode =
            isPendingRewardsMethodLeaf
              ? writePendingRewardsPathValue(payload, targetPath, expandedNode)
              : targetLeaf === 'estimate' || targetLeaf === 'claim'
              ? writePendingRewardsPathValue(
                  payload,
                  targetPath,
                  buildLazyPendingRewardsMethod(normalizedAccount, click.action === 'claim' ? 'claimOnChainTotalRewards' : 'estimateOffChainTotalRewards'),
                )
              : shouldPreservePendingRewardsShape
                ? payload
                : writePathValue(payload, targetPath, expandedNode);
          const payloadWithRefreshedPairedEstimate =
            pairedEstimateExpandedNode && pairedEstimateMethod && pendingRewardsPath.length > 0
              ? writePendingRewardsPathValue(
                  payloadWithExpandedNode,
                  [...pendingRewardsPath, pairedEstimateMethod],
                  pairedEstimateExpandedNode,
                )
              : payloadWithExpandedNode;
          const existingPendingRewardsNode = readPathValue(payloadWithRefreshedPairedEstimate, pendingRewardsPath);
          const payloadWithPendingRewardsSummary =
            pendingRewardsAmount !== null &&
            pendingRewardsPath.length > 0 &&
            existingPendingRewardsNode &&
            typeof existingPendingRewardsNode === 'object' &&
            !Array.isArray(existingPendingRewardsNode)
              ? writePendingRewardsPathValue(
                  payloadWithRefreshedPairedEstimate,
                  pendingRewardsPath,
                  mergePendingRewardsSummaryNode(
                    existingPendingRewardsNode,
                    pendingResult,
                    normalizedAccount,
                    click.action,
                    pendingRewardsRefreshAtMs,
                    expandedCallMethod,
                    expandedNode,
                  ),
                )
              : payloadWithExpandedNode;
          const owningAccountRecordKey = getTopLevelGetAccountRecordKey(payload);
          const shouldReplaceOwningAccountRecord =
            click.action === 'claim' &&
            refreshedAccountRecord &&
            owningAccountRecordKey === normalizedAccount &&
            targetPath[0] === 'result';
          if (click.action === 'claim') {
            appendLog(
              `[PENDING_REWARDS_TRACE] account refresh replace=${String(Boolean(shouldReplaceOwningAccountRecord))} owner=${owningAccountRecordKey} account=${normalizedAccount} hasRecord=${String(Boolean(refreshedAccountRecord))}`,
            );
          }
          const payloadAfterAccountRefresh = shouldReplaceOwningAccountRecord
            ? (() => {
                setSpCoinLabAccountRecord(normalizedAccount, refreshedAccountRecord);
                treeAccountRecordCacheRef.current.set(normalizedAccount, refreshedAccountRecord);
                const refreshedPayloadBase = {
                  ...payload,
                  meta: {
                    ...((payload.meta && typeof payload.meta === 'object' && !Array.isArray(payload.meta)
                      ? payload.meta
                      : {}) as Record<string, unknown>),
                    ...buildAccountRecordMetaPatch(refreshedAccountRecord),
                  },
                  result: refreshedAccountRecord,
                };
                const existingPendingRewardsForDisplay = readPathValue(
                  payloadWithPendingRewardsSummary,
                  pendingRewardsPath,
                );
                const refreshedPendingRewardsForDisplay = readPathValue(refreshedPayloadBase, pendingRewardsPath);
                const refreshedPayload =
                  pendingRewardsPath.length > 0 &&
                  (existingPendingRewardsForDisplay || refreshedPendingRewardsForDisplay)
                    ? writePendingRewardsPathValue(
                        refreshedPayloadBase,
                        pendingRewardsPath,
                        mergePendingRewardsBranchForAccountRefresh(
                          existingPendingRewardsForDisplay,
                          refreshedPendingRewardsForDisplay,
                          normalizedAccount,
                          expandedCallMethod,
                          expandedNode,
                          click.action,
                          pendingRewardsRefreshAtMs,
                        ),
                      )
                    : refreshedPayloadBase;
                const refreshedWithExpandedNode = isPendingRewardsMethodLeaf
                  ? writePendingRewardsPathValue(refreshedPayload, targetPath, expandedNode)
                  : refreshedPayload;
                return refreshedWithExpandedNode;
              })()
            : payloadWithPendingRewardsSummary;
          const nextRootPayload = normalizeExecutionPayload(
            payloadAfterAccountRefresh,
          ) as Record<string, unknown>;
          const nextPayload = formatFormattedPanelPayload(nextRootPayload);
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            if (inTreePanel) {
              setTrackedTreeOutputDisplay(nextBlocks.join('\n\n'));
            } else {
              setFormattedOutputDisplay(nextBlocks.join('\n\n'));
            }
          } else if (inTreePanel) {
            setTrackedTreeOutputDisplay(nextPayload);
          } else {
            setFormattedOutputDisplay(nextPayload);
          }
          setStatus(`Loaded ${actionLabel} for ${normalizedAccount}.`);
          appendLog(`Inline ${actionLabel} loaded for ${normalizedAccount}`);
          appendLog(
            `[PENDING_REWARDS_TRACE] expand success method=${String(expandedCallMethod)} account=${normalizedAccount} target=${targetPath.join('.')} pendingPath=${pendingRewardsPath.join('.')}`,
          );
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, 'Unable to load pending rewards.');
          setStatus(`Unable to load pending rewards for ${normalizedAccount}.`);
          appendLog(`Inline pending rewards ${click.action} failed for ${normalizedAccount}: ${message}`);
          appendLog(
            `[PENDING_REWARDS_TRACE] expand error action=${click.action} method=${String(click.method || '')} account=${normalizedAccount} target=${targetPath.join('.')} message=${message}`,
          );
          return 'handled';
        }
      }
      appendLog(`[PENDING_REWARDS_TRACE] expand stop unhandled path=${normalizedPathHint}`);
      return 'unhandled';
    },
    [
      appendLog,
      appendWriteTrace,
      callAccessMethod,
      coerceParamValue,
      executeWriteConnected,
      ensureReadRunner,
      formatFormattedPanelPayload,
      loadAccountRecordForAddress,
      mode,
      normalizeAddressValue,
      readCacheNamespace,
      requireContractAddress,
      runServerBackedTreeSpCoinMethod,
      selectedHardhatAddress,
      setFormattedOutputDisplay,
      setStatus,
      setTrackedTreeOutputDisplay,
      stringifyResult,
      useLocalSpCoinAccessPackage,
      useReadCache,
    ],
  );

  const openAccountFromAddress = useCallback(
    async (account: string, pathHint?: string, rawDisplayOverride?: string) => {
      const relationClick = parseLazyAccountRelationClick(account, normalizeAddressValue);
      const pendingRewardsClick =
        parsePendingRewardsMethodClick(account, normalizeAddressValue) ??
        parsePendingRewardsActionClick(account, normalizeAddressValue);
      if (pendingRewardsClick || /PendingRewards/i.test(String(account ?? ''))) {
        appendLog(
          `[PENDING_REWARDS_TRACE] dispatch accountArg=${String(account ?? '')} path=${String(pathHint ?? '')} rawOverride=${String(rawDisplayOverride !== undefined)} action=${String(pendingRewardsClick?.action || '')} method=${String(pendingRewardsClick?.method || '')} parsedAccount=${String(pendingRewardsClick?.accountKey || '')}`,
        );
      }
      if (String(account ?? '').trim() === '__load_spcoin_metadata__') {
        const metadataResult = await expandSpCoinMetaDataInline(pathHint);
        if (metadataResult === 'expanded' || metadataResult === 'handled') {
          setOutputPanelMode('formatted');
        }
        return;
      }
      if (String(account ?? '').trim() === '__load_master_account_keys__') {
        const keysResult = await expandMasterAccountKeysInline(pathHint);
        if (keysResult === 'expanded' || keysResult === 'handled') {
          setOutputPanelMode('formatted');
        }
        return;
      }
      if (pendingRewardsClick) {
        const pendingResult = await expandPendingRewardsActionInline(pendingRewardsClick, pathHint, rawDisplayOverride);
        appendLog(`[PENDING_REWARDS_TRACE] action result=${pendingResult} path=${String(pathHint ?? '')}`);
        if (pendingResult === 'expanded' || pendingResult === 'handled') {
          setOutputPanelMode(/^tree-/i.test(String(pathHint ?? '').trim()) ? 'tree' : 'formatted');
        }
        return;
      }
      if (relationClick || String(account ?? '').trim() === '__load_account_relation__') {
        const relationResult = await expandAccountRelationInline(pathHint, rawDisplayOverride, relationClick ?? undefined);
        if (relationResult === 'expanded' || relationResult === 'handled') {
          setOutputPanelMode(/^tree-/i.test(String(pathHint ?? '').trim()) ? 'tree' : 'formatted');
        }
        return;
      }
      const inTreePanel = /^tree-/i.test(String(pathHint ?? '').trim());
      const inlineResult = await expandMasterSponsorListAccountInline(account, pathHint);
      if (inlineResult === 'expanded' || inlineResult === 'handled') {
        setOutputPanelMode('formatted');
        return;
      }
      const normalizedAccount = normalizeAddressValue(account);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return;
      if (!inTreePanel) {
        setSelectedTreeAccount(normalizedAccount);
        setOutputPanelMode('tree');
        await runTreeDump(normalizedAccount);
        return;
      }
      setSelectedTreeAccount(normalizedAccount);
      setOutputPanelMode('tree');
      await runTreeDump(normalizedAccount);
    },
    [
      appendLog,
      expandAccountRelationInline,
      expandMasterAccountKeysInline,
      expandMasterSponsorListAccountInline,
      expandPendingRewardsActionInline,
      expandSpCoinMetaDataInline,
      normalizeAddressValue,
      runTreeDump,
      setOutputPanelMode,
    ],
  );

  return {
    treeAccountOptions,
    selectedTreeAccount,
    setSelectedTreeAccount,
    treeAccountRefreshToken,
    requestRefreshSelectedTreeAccount,
    openAccountFromAddress,
    runHeaderRead,
    runAccountListRead,
    runTreeAccountsRead,
    runTreeDump,
  };
}
