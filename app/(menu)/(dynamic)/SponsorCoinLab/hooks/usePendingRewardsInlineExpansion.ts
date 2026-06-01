import { useCallback, type MutableRefObject } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import { runSpCoinReadMethod, type SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { runSpCoinWriteMethod, type SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import type { ConnectionMode } from '../scriptBuilder/types';
import { buildExecutionMeta, type MethodExecutionMeta } from './methodExecutionHelpers';
import type { AccessMethodCaller } from './useAccessMethodCaller';
import { normalizeExecutionPayload } from './executionPayload';
import {
  getSpCoinLabAccountRecord,
  markSpCoinLabAccountRecordRefreshFailed,
  markSpCoinLabAccountRecordRefreshing,
  mirrorSpCoinLabAccountRecord,
  notifySpCoinLabAccountRecordsChanged,
} from '@/lib/spCoinLab/accountRecordStore';
import {
  asRecord,
  buildClaimedRewardsByAccount,
  buildClaimedRewardsSummary,
  buildClaimedRewardsByAccountFromPendingRewards,
  buildLazyPendingRewardsMethod,
  buildZeroPendingRewardsEstimateResult,
  buildZeroClaimedRewardsByAccount,
  buildZeroPendingRewardsByAccount,
  findPendingRewardsByAccount,
  hasLazyPendingRewardsAction,
  hasLazyPendingRewardsMethod,
  hasPendingRewardsRefreshAction,
  mergeClaimedRewardsByAccountIntoTree,
  mergePendingRewardsByAccountIntoTree,
  mergePendingRewardsSummaryNode,
  normalizePendingRewardsEstimateResult,
  PENDING_REWARDS_CLAIM_METHODS,
  PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD,
  PENDING_REWARDS_ESTIMATE_METHODS,
  PENDING_REWARDS_INLINE_REFRESH_MS,
  readClaimedRewardsByAccount,
  readPendingRewardsByAccount,
  readPendingRewardsAmount,
  withPendingRewardsRoleMeta,
  type PendingRewardsActionClick,
  type PendingRewardsByAccount,
} from './pendingRewardsTreeUtils';
import {
  buildTreePayloadBlockEntries,
  readDisplayPathValue,
  readPathValue,
  selectTreePayloadCandidateEntries,
  writePathValue,
} from './treePayloadUtils';

const noop = () => undefined;

type InlineExpansionResult = 'expanded' | 'handled' | 'unhandled';

function mergeRewardsByAccountMaps(
  ...maps: (PendingRewardsByAccount | null | undefined)[]
): PendingRewardsByAccount | null {
  const merged: PendingRewardsByAccount = {};
  for (const map of maps) {
    if (!map) continue;
    for (const [accountKey, accountRewards] of Object.entries(map)) {
      const normalizedAccountKey = toDisplayString(accountRewards.accountKey, accountKey).trim().toLowerCase() || accountKey;
      merged[normalizedAccountKey] = {
        ...(merged[normalizedAccountKey] ?? {}),
        ...accountRewards,
        accountKey: accountRewards.accountKey ?? merged[normalizedAccountKey]?.accountKey ?? accountKey,
      };
    }
  }
  return Object.keys(merged).length > 0 ? merged : null;
}

type ServerBackedTreeMethodRunner = (args: {
  panel: 'spcoin_rread' | 'spcoin_write';
  method: string;
  params: { key: string; value: string }[];
  sender?: string;
  cacheMode?: 'default' | 'refresh' | 'bypass' | 'only';
  useCache?: boolean;
}) => Promise<{
  result?: unknown;
  warning?: unknown;
  meta?: MethodExecutionMeta;
  onChainCalls?: MethodExecutionMeta['onChainCalls'];
}>;

interface UsePendingRewardsInlineExpansionParams {
  appendLog: (line: string) => void;
  appendWriteTrace?: (line: string) => void;
  callAccessMethod?: AccessMethodCaller;
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: any, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  ensureReadRunner: () => Promise<any>;
  formatFormattedPanelPayload: (payload: unknown) => string;
  formattedOutputDisplayRef: MutableRefObject<string>;
  loadAccountRecordForAddress: (
    account: string,
    options?: { force?: boolean; signal?: AbortSignal },
  ) => Promise<unknown>;
  mode: ConnectionMode;
  normalizeAddressValue: (value: string) => string;
  readCacheNamespace?: string;
  requireContractAddress: () => string;
  runServerBackedTreeSpCoinMethod: ServerBackedTreeMethodRunner;
  selectedHardhatAddress?: string;
  setFormattedOutputDisplay: (value: string) => void;
  setStatus: (value: string) => void;
  setTrackedTreeOutputDisplay: (value: string) => void;
  stringifyResult: (result: unknown) => string;
  treeAccountRecordCacheRef: MutableRefObject<Map<string, unknown>>;
  treeOutputDisplayRef: MutableRefObject<string>;
  useLocalSpCoinAccessPackage: boolean;
  useReadCache?: boolean;
}

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

function resolveTargetPath(targetNode: unknown, payloadPath: string[]) {
  if (hasPendingRewardsRefreshAction(targetNode) && payloadPath.at(-1) === 'result') {
    return payloadPath.slice(0, -1);
  }
  if (hasPendingRewardsRefreshAction(targetNode) && payloadPath.at(-1) === 'pendingRewards') {
    return [...payloadPath, 'estimateOffChainTotalRewards'];
  }
  if ((payloadPath.at(-1) === 'claim' || payloadPath.at(-1) === 'update') && payloadPath.at(-2) !== 'pendingRewards') {
    return [...payloadPath.slice(0, -1), 'pendingRewards', 'estimateOffChainTotalRewards'];
  }
  return payloadPath;
}

function resolveLiftedPendingRewardsPayloadPath(payload: unknown, payloadPath: string[]) {
  const pendingRewardsIndex = payloadPath.findIndex((segment) => segment === 'pendingRewards');
  if (pendingRewardsIndex < 1 || payloadPath[pendingRewardsIndex - 1] === 'totalSpCoins') return payloadPath;
  const storedPath = [
    ...payloadPath.slice(0, pendingRewardsIndex),
    'totalSpCoins',
    ...payloadPath.slice(pendingRewardsIndex),
  ];
  return readPathValue(payload, storedPath) === undefined ? payloadPath : storedPath;
}

function resolveWritablePendingRewardsPath(payload: unknown, candidatePath: string[]) {
  if (candidatePath.length === 0) return candidatePath;
  const hasObjectParentAt = (path: string[]) => {
    const parentPath = path.slice(0, -1);
    const parentNode = readPathValue(payload, parentPath);
    return Boolean(parentNode && typeof parentNode === 'object' && !Array.isArray(parentNode));
  };
  if (hasObjectParentAt(candidatePath)) return candidatePath;
  const pendingRewardsIndex = candidatePath.findIndex((segment) => segment === 'pendingRewards');
  if (pendingRewardsIndex < 1) return candidatePath;
  if (candidatePath[pendingRewardsIndex - 1] === 'totalSpCoins') {
    const unliftedPath = [
      ...candidatePath.slice(0, pendingRewardsIndex - 1),
      ...candidatePath.slice(pendingRewardsIndex),
    ];
    return hasObjectParentAt(unliftedPath) ? unliftedPath : candidatePath;
  }
  const liftedPath = [
    ...candidatePath.slice(0, pendingRewardsIndex),
    'totalSpCoins',
    ...candidatePath.slice(pendingRewardsIndex),
  ];
  return hasObjectParentAt(liftedPath) ? liftedPath : candidatePath;
}

function replaceDisplayBlocks(
  blocks: string[],
  nextPayloadByBlockIndex: Map<number, string>,
  inTreePanel: boolean,
  setFormattedOutputDisplay: (value: string) => void,
  setTrackedTreeOutputDisplay: (value: string) => void,
) {
  const nextDisplay =
    blocks.length > 1
      ? blocks.map((block, index) => nextPayloadByBlockIndex.get(index) ?? block).join('\n\n')
      : nextPayloadByBlockIndex.get(0) ?? blocks[0] ?? '';
  if (inTreePanel) {
    setTrackedTreeOutputDisplay(nextDisplay);
  } else {
    setFormattedOutputDisplay(nextDisplay);
  }
}

function readClaimedRewardsAmount(value: unknown) {
  const record = asRecord(value);
  if (!record) return undefined;
  const result = asRecord(record.result);
  return record.totalRewardsClaimed ?? record.claimedAmount ?? result?.totalRewardsClaimed ?? result?.claimedAmount;
}

function describeRewardsByAccountMap(map: PendingRewardsByAccount | null | undefined) {
  if (!map) return 'none';
  return Object.entries(map)
    .map(([accountKey, accountRewards]) => {
      const normalizedAccountKey = toDisplayString(accountRewards.accountKey, accountKey).trim().toLowerCase() || accountKey;
      return [
        normalizedAccountKey,
        `claimed=${toDisplayString(accountRewards.claimedRewards)}`,
        `s=${toDisplayString(accountRewards.claimedSponsorRewards)}`,
        `r=${toDisplayString(accountRewards.claimedRecipientRewards)}`,
        `a=${toDisplayString(accountRewards.claimedAgentRewards)}`,
      ].join(' ');
    })
    .join(' | ') || 'none';
}

function describeTraceNode(value: unknown): string {
  const record = asRecord(value);
  const result = asRecord(record?.result);
  const source = result ?? record;
  if (!record && !result) return 'none';
  return [
    `keys=${record ? Object.keys(record).join(',') : 'none'}`,
    `resultKeys=${result ? Object.keys(result).join(',') : 'none'}`,
    `call=${String(asRecord(record?.call)?.method ?? '')}`,
    `role=${String(source?.role ?? record?.role ?? '')}`,
    `roles=${String(source?.roles ?? record?.roles ?? '')}`,
    `isSponsor=${String(source?.isSponsor ?? record?.isSponsor ?? '')}`,
    `pendingRewards=${String(source?.pendingRewards ?? '')}`,
    `pendingTotalRewards=${String(source?.pendingTotalRewards ?? '')}`,
    `pendingSponsorRewards=${String(source?.pendingSponsorRewards ?? '')}`,
    `claimed=${String(source?.totalRewardsClaimed ?? source?.claimedAmount ?? '')}`,
    `allRoles=${String(Boolean(asRecord(source?.__pendingRewardsAllRoles) ?? asRecord(record?.__pendingRewardsAllRoles)))}`,
    `byAccount=${String(Boolean(asRecord(source?.__pendingRewardsByAccount) ?? asRecord(record?.__pendingRewardsByAccount)))}`,
  ].join(' ');
}

interface AccountRecordMirrorScan {
  mirrored: number;
  matched: number;
  mismatched: number;
  mirroredAccounts: Set<string>;
  mismatchedAccounts: Set<string>;
}

interface AccountRecordStoreSyncScan {
  value: unknown;
  synced: number;
  missing: number;
  syncedAccounts: Set<string>;
  missingAccounts: Set<string>;
}

type TreePayloadBlockEntry = ReturnType<typeof buildTreePayloadBlockEntries>['blockEntries'][number];

interface PendingRewardsAccountRecordUpdateResult {
  locallyAffectedAccounts: Set<string>;
  mirrorScan: AccountRecordMirrorScan;
  mirrorCoversAffectedAccounts: boolean;
  autoSyncedBlockCount: number;
  accountRefreshDecision: string;
}

function createAccountRecordMirrorScan(): AccountRecordMirrorScan {
  return {
    mirrored: 0,
    matched: 0,
    mismatched: 0,
    mirroredAccounts: new Set<string>(),
    mismatchedAccounts: new Set<string>(),
  };
}

function mergeAccountRecordMirrorScan(target: AccountRecordMirrorScan, source: AccountRecordMirrorScan) {
  target.mirrored += source.mirrored;
  target.matched += source.matched;
  target.mismatched += source.mismatched;
  for (const accountKey of source.mirroredAccounts) {
    target.mirroredAccounts.add(accountKey);
  }
  for (const accountKey of source.mismatchedAccounts) {
    target.mismatchedAccounts.add(accountKey);
  }
}

function accountRecordMirrorScanCoversAccounts(scan: AccountRecordMirrorScan, accounts: Set<string>) {
  for (const accountKey of accounts) {
    if (!scan.mirroredAccounts.has(accountKey)) return false;
  }
  return true;
}

function cacheAccountRecordsFromPayload(
  value: unknown,
  affectedAccounts: Set<string>,
  normalizeAddressValue: (value: string) => string,
  treeAccountRecordCacheRef: MutableRefObject<Map<string, unknown>>,
): AccountRecordMirrorScan {
  const scan = createAccountRecordMirrorScan();
  if (!value || typeof value !== 'object') return scan;
  if (Array.isArray(value)) {
    for (const entry of value) {
      mergeAccountRecordMirrorScan(
        scan,
        cacheAccountRecordsFromPayload(entry, affectedAccounts, normalizeAddressValue, treeAccountRecordCacheRef),
      );
    }
    return scan;
  }
  const record = value as Record<string, unknown>;
  const accountKey = normalizeAddressValue(toDisplayString(record.accountKey));
  if (record.TYPE === '--ACCOUNT--' && affectedAccounts.has(accountKey)) {
    treeAccountRecordCacheRef.current.set(accountKey, record);
    const mirrorResult = mirrorSpCoinLabAccountRecord(accountKey, record);
    scan.mirrored += mirrorResult ? 1 : 0;
    if (mirrorResult) {
      scan.mirroredAccounts.add(mirrorResult.accountKey);
    }
    if (mirrorResult?.mismatchedFields.length) {
      scan.mismatched += 1;
      scan.mismatchedAccounts.add(mirrorResult.accountKey);
    } else if (mirrorResult) {
      scan.matched += 1;
    }
  }
  for (const [key, entry] of Object.entries(record)) {
    if (key === 'call' || key === 'meta' || key === 'onChainCalls') continue;
    mergeAccountRecordMirrorScan(
      scan,
      cacheAccountRecordsFromPayload(entry, affectedAccounts, normalizeAddressValue, treeAccountRecordCacheRef),
    );
  }
  return scan;
}

function syncAccountRecordsFromStoreIntoPayload(
  value: unknown,
  affectedAccounts: Set<string>,
  normalizeAddressValue: (value: string) => string,
): AccountRecordStoreSyncScan {
  const scan: AccountRecordStoreSyncScan = {
    value,
    synced: 0,
    missing: 0,
    syncedAccounts: new Set<string>(),
    missingAccounts: new Set<string>(),
  };
  if (!value || typeof value !== 'object') return scan;
  if (Array.isArray(value)) {
    let changed = false;
    const nextEntries = value.map((entry) => {
      const nextEntry = syncAccountRecordsFromStoreIntoPayload(entry, affectedAccounts, normalizeAddressValue);
      scan.synced += nextEntry.synced;
      scan.missing += nextEntry.missing;
      for (const accountKey of nextEntry.syncedAccounts) scan.syncedAccounts.add(accountKey);
      for (const accountKey of nextEntry.missingAccounts) scan.missingAccounts.add(accountKey);
      changed ||= nextEntry.value !== entry;
      return nextEntry.value;
    });
    scan.value = changed ? nextEntries : value;
    return scan;
  }

  const record = value as Record<string, unknown>;
  const accountKey = normalizeAddressValue(toDisplayString(record.accountKey));
  if (record.TYPE === '--ACCOUNT--' && affectedAccounts.has(accountKey)) {
    const storeValue = getSpCoinLabAccountRecord(accountKey);
    if (storeValue === undefined) {
      scan.missing = 1;
      scan.missingAccounts.add(accountKey);
      return scan;
    }
    scan.value = storeValue;
    scan.synced = 1;
    scan.syncedAccounts.add(accountKey);
    return scan;
  }

  let changed = false;
  const nextRecord: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (key === 'call' || key === 'meta' || key === 'onChainCalls') {
      nextRecord[key] = entry;
      continue;
    }
    const nextEntry = syncAccountRecordsFromStoreIntoPayload(entry, affectedAccounts, normalizeAddressValue);
    scan.synced += nextEntry.synced;
    scan.missing += nextEntry.missing;
    for (const accountKey of nextEntry.syncedAccounts) scan.syncedAccounts.add(accountKey);
    for (const accountKey of nextEntry.missingAccounts) scan.missingAccounts.add(accountKey);
    changed ||= nextEntry.value !== entry;
    nextRecord[key] = nextEntry.value;
  }
  scan.value = changed ? nextRecord : value;
  return scan;
}

function mergePendingRewardsAccountUpdates(
  payload: unknown,
  pendingRewardsByAccount: PendingRewardsByAccount | null,
  claimedRewardsByAccount: PendingRewardsByAccount | null,
  pendingRewardsRefreshAtMs: number,
) {
  return normalizeExecutionPayload(
    mergeClaimedRewardsByAccountIntoTree(
      mergePendingRewardsByAccountIntoTree(payload, pendingRewardsByAccount, pendingRewardsRefreshAtMs),
      claimedRewardsByAccount,
    ),
  ) as Record<string, unknown>;
}

function applyPendingRewardsAccountRecordUpdates({
  blockEntries,
  primaryBlockIndex,
  nextRootPayload,
  pendingRewardsByAccountForDisplay,
  claimedRewardsByAccountForDisplay,
  pendingRewardsRefreshAtMs,
  blocks,
  inTreePanel,
  isEstimatePendingRewardsRequest,
  expandedCallMethod,
  formatFormattedPanelPayload,
  normalizeAddressValue,
  treeAccountRecordCacheRef,
  setFormattedOutputDisplay,
  setTrackedTreeOutputDisplay,
  loadAccountRecordForAddress,
  appendLog,
}: {
  blockEntries: TreePayloadBlockEntry[];
  primaryBlockIndex: number;
  nextRootPayload: Record<string, unknown>;
  pendingRewardsByAccountForDisplay: PendingRewardsByAccount | null;
  claimedRewardsByAccountForDisplay: PendingRewardsByAccount | null;
  pendingRewardsRefreshAtMs: number;
  blocks: string[];
  inTreePanel: boolean;
  isEstimatePendingRewardsRequest: boolean;
  expandedCallMethod: string;
  formatFormattedPanelPayload: (payload: unknown) => string;
  normalizeAddressValue: (value: string) => string;
  treeAccountRecordCacheRef: MutableRefObject<Map<string, unknown>>;
  setFormattedOutputDisplay: (value: string) => void;
  setTrackedTreeOutputDisplay: (value: string) => void;
  loadAccountRecordForAddress: (
    account: string,
    options?: { force?: boolean; signal?: AbortSignal },
  ) => Promise<unknown>;
  appendLog: (line: string) => void;
}): PendingRewardsAccountRecordUpdateResult {
  const locallyAffectedAccounts = new Set(
    [
      ...Object.keys(pendingRewardsByAccountForDisplay ?? {}),
      ...Object.keys(claimedRewardsByAccountForDisplay ?? {}),
    ].map((accountKey) => normalizeAddressValue(accountKey)),
  );
  const nextPayloadByBlockIndex = new Map<number, string>();
  let autoSyncedBlockCount = 0;
  const mirrorScan = createAccountRecordMirrorScan();
  let storeSyncedNodeCount = 0;
  let storeMissingNodeCount = 0;
  const storeSyncedAccounts = new Set<string>();
  const storeMissingAccounts = new Set<string>();

  for (const blockEntry of blockEntries) {
    if (!blockEntry.payload) continue;
    const nextBlockPayload =
      blockEntry.index === primaryBlockIndex
        ? nextRootPayload
        : mergePendingRewardsAccountUpdates(
            blockEntry.payload,
            pendingRewardsByAccountForDisplay,
            claimedRewardsByAccountForDisplay,
            pendingRewardsRefreshAtMs,
          );
    if (blockEntry.index !== primaryBlockIndex) autoSyncedBlockCount += 1;
    if (locallyAffectedAccounts.size > 0) {
      mergeAccountRecordMirrorScan(
        mirrorScan,
        cacheAccountRecordsFromPayload(
          nextBlockPayload,
          locallyAffectedAccounts,
          normalizeAddressValue,
          treeAccountRecordCacheRef,
        ),
      );
    }
    const storeSyncScan =
      locallyAffectedAccounts.size > 0
        ? syncAccountRecordsFromStoreIntoPayload(nextBlockPayload, locallyAffectedAccounts, normalizeAddressValue)
        : {
            value: nextBlockPayload,
            synced: 0,
            missing: 0,
            syncedAccounts: new Set<string>(),
            missingAccounts: new Set<string>(),
          };
    storeSyncedNodeCount += storeSyncScan.synced;
    storeMissingNodeCount += storeSyncScan.missing;
    for (const accountKey of storeSyncScan.syncedAccounts) storeSyncedAccounts.add(accountKey);
    for (const accountKey of storeSyncScan.missingAccounts) storeMissingAccounts.add(accountKey);
    nextPayloadByBlockIndex.set(blockEntry.index, formatFormattedPanelPayload(storeSyncScan.value));
  }

  replaceDisplayBlocks(
    blocks,
    nextPayloadByBlockIndex,
    inTreePanel,
    setFormattedOutputDisplay,
    setTrackedTreeOutputDisplay,
  );

  const mirrorCoversAffectedAccounts = accountRecordMirrorScanCoversAccounts(
    mirrorScan,
    locallyAffectedAccounts,
  );
  const storeCoversAffectedAccountNodes = storeMissingNodeCount === 0;
  const fallbackRefreshReason = !mirrorCoversAffectedAccounts
    ? 'mirror-missing'
    : mirrorScan.mismatched > 0
      ? 'mirror-mismatch'
      : !storeCoversAffectedAccountNodes
        ? 'store-missing'
        : 'none';
  const accountRefreshDecision = isEstimatePendingRewardsRequest
    ? 'not-applicable-estimate'
    : fallbackRefreshReason === 'none'
      ? 'skip-mirror-match'
      : `fallback-${fallbackRefreshReason}`;
  const shouldRefreshChangedAccountRecords =
    !isEstimatePendingRewardsRequest &&
    locallyAffectedAccounts.size > 0 &&
    fallbackRefreshReason !== 'none';

  if (autoSyncedBlockCount > 0 && locallyAffectedAccounts.size > 0) {
    appendLog(
      `[PENDING_REWARDS_TRACE] auto-sync account records blocks=${String(autoSyncedBlockCount)} mirrored=${String(mirrorScan.mirrored)} compare=${mirrorScan.mismatched === 0 ? 'match' : 'mismatch'} matched=${String(mirrorScan.matched)} mismatched=${String(mirrorScan.mismatched)} refresh=${accountRefreshDecision} storeSynced=${String(storeSyncedNodeCount)} storeMissing=${String(storeMissingNodeCount)} mirroredAccounts=${Array.from(mirrorScan.mirroredAccounts).join(',') || 'none'} mismatchAccounts=${Array.from(mirrorScan.mismatchedAccounts).join(',') || 'none'} storeSyncedAccounts=${Array.from(storeSyncedAccounts).join(',') || 'none'} storeMissingAccounts=${Array.from(storeMissingAccounts).join(',') || 'none'} accounts=${Array.from(locallyAffectedAccounts).join(',')}`,
    );
    appendLog(
      `[ACCOUNT_RECORD_STORE_TRACE] mirror scan source=pendingRewardsTree mirrored=${String(mirrorScan.mirrored)} compare=${mirrorScan.mismatched === 0 ? 'match' : 'mismatch'} matched=${String(mirrorScan.matched)} mismatched=${String(mirrorScan.mismatched)} storeSynced=${String(storeSyncedNodeCount)} storeMissing=${String(storeMissingNodeCount)} mirroredAccounts=${Array.from(mirrorScan.mirroredAccounts).join(',') || 'none'} mismatchAccounts=${Array.from(mirrorScan.mismatchedAccounts).join(',') || 'none'} storeSyncedAccounts=${Array.from(storeSyncedAccounts).join(',') || 'none'} storeMissingAccounts=${Array.from(storeMissingAccounts).join(',') || 'none'} blocks=${String(autoSyncedBlockCount)} accounts=${Array.from(locallyAffectedAccounts).join(',')}`,
    );
  }

  if (!isEstimatePendingRewardsRequest && locallyAffectedAccounts.size > 0) {
    if (!shouldRefreshChangedAccountRecords) {
      appendLog(
        `[ACCOUNT_RECORD_SYNC_TRACE] refresh skipped reason=mirror-match method=${expandedCallMethod} mirrored=${String(mirrorScan.mirrored)} storeSynced=${String(storeSyncedNodeCount)} storeMissing=${String(storeMissingNodeCount)} accounts=${Array.from(locallyAffectedAccounts).join(',')}`,
      );
    } else {
      appendLog(
        `[ACCOUNT_RECORD_SYNC_TRACE] refresh fallback reason=${fallbackRefreshReason} method=${expandedCallMethod} mirrored=${String(mirrorScan.mirrored)} mismatched=${String(mirrorScan.mismatched)} storeSynced=${String(storeSyncedNodeCount)} storeMissing=${String(storeMissingNodeCount)} mirroredAccounts=${Array.from(mirrorScan.mirroredAccounts).join(',') || 'none'} mismatchAccounts=${Array.from(mirrorScan.mismatchedAccounts).join(',') || 'none'} storeSyncedAccounts=${Array.from(storeSyncedAccounts).join(',') || 'none'} storeMissingAccounts=${Array.from(storeMissingAccounts).join(',') || 'none'} accounts=${Array.from(locallyAffectedAccounts).join(',')}`,
      );
      void refreshChangedAccountRecords(
        locallyAffectedAccounts,
        expandedCallMethod,
        loadAccountRecordForAddress,
        appendLog,
      );
    }
  }

  return {
    locallyAffectedAccounts,
    mirrorScan,
    mirrorCoversAffectedAccounts,
    autoSyncedBlockCount,
    accountRefreshDecision,
  };
}

async function refreshChangedAccountRecords(
  accounts: Iterable<string>,
  reason: string,
  loadAccountRecordForAddress: (
    account: string,
    options?: { force?: boolean; signal?: AbortSignal },
  ) => Promise<unknown>,
  appendLog: (line: string) => void,
) {
  const uniqueAccounts = notifySpCoinLabAccountRecordsChanged(accounts, reason);
  if (uniqueAccounts.length === 0) return;
  appendLog(`[ACCOUNT_RECORD_SYNC_TRACE] changed reason=${reason} accounts=${uniqueAccounts.join(',')}`);
  await Promise.allSettled(
    uniqueAccounts.map(async (accountKey) => {
      markSpCoinLabAccountRecordRefreshing(accountKey, true, reason);
      try {
        await loadAccountRecordForAddress(accountKey, { force: true });
        appendLog(`[ACCOUNT_RECORD_SYNC_TRACE] refreshed reason=${reason} account=${accountKey}`);
      } catch (error) {
        markSpCoinLabAccountRecordRefreshFailed(accountKey, error, reason);
        appendLog(
          `[ACCOUNT_RECORD_SYNC_TRACE] refresh failed reason=${reason} account=${accountKey} message=${getErrorMessage(error, 'Unable to refresh account record.')}`,
        );
      }
    }),
  );
}

export function usePendingRewardsInlineExpansion({
  appendLog,
  appendWriteTrace,
  callAccessMethod,
  coerceParamValue,
  executeWriteConnected,
  ensureReadRunner,
  formatFormattedPanelPayload,
  formattedOutputDisplayRef,
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
  treeAccountRecordCacheRef,
  treeOutputDisplayRef,
  useLocalSpCoinAccessPackage,
  useReadCache,
}: UsePendingRewardsInlineExpansionParams) {
  return useCallback(
    async (
      click: PendingRewardsActionClick,
      pathHint?: string,
      rawDisplayOverride?: string,
    ): Promise<InlineExpansionResult> => {
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
        `[PENDING_REWARDS_TRACE] expand start account=${normalizedAccount} action=${click.action} method=${String(click.method ?? '')} path=${normalizedPathHint} tree=${String(inTreePanel)} rawOverride=${String(rawDisplayOverride !== undefined)} rawLength=${String(rawDisplay.length)}`,
      );
      if (!rawDisplay || rawDisplay === '(no tree yet)' || rawDisplay === '(no output yet)') {
        appendLog(`[PENDING_REWARDS_TRACE] expand stop empty-display path=${normalizedPathHint}`);
        return 'unhandled';
      }

      const { blocks, blockEntries } = buildTreePayloadBlockEntries(rawDisplay);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries = selectTreePayloadCandidateEntries(blockEntries, hintedBlockIndex);
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

        const storedPayloadPath = resolveLiftedPendingRewardsPayloadPath(payload, payloadPath);
        const targetNode = readDisplayPathValue(payload, payloadPath) ?? readPathValue(payload, storedPayloadPath);
        const targetPath = resolveTargetPath(targetNode, storedPayloadPath);
        const writableTargetPath = resolveWritablePendingRewardsPath(payload, targetPath);
        const actionNode = readPathValue(payload, targetPath) ?? readPathValue(payload, payloadPath);
        const targetLeaf = writableTargetPath.at(-1);
        const isPendingRewardsMethodLeaf =
          typeof targetLeaf === 'string' &&
          (PENDING_REWARDS_ESTIMATE_METHODS.has(targetLeaf) || PENDING_REWARDS_CLAIM_METHODS.has(targetLeaf));
        const targetNodeResult = asRecord(targetNode)?.result ?? null;
        const isRerunnablePendingRewardsMethod =
          Boolean(click.method) &&
          isPendingRewardsMethodLeaf &&
          Boolean(readPendingRewardsAmount(targetNode) ?? readPendingRewardsAmount(targetNodeResult));
        const isPendingRewardsMethodClickTarget =
          Boolean(click.method) &&
          isPendingRewardsMethodLeaf &&
          click.method === targetLeaf;
        const pendingRewardsRecord = isPendingRewardsMethodLeaf
          ? asRecord(readPathValue(payload, targetPath.slice(0, -1)))
          : null;
        const pairedEstimateMethod =
          click.method && PENDING_REWARDS_CLAIM_METHODS.has(click.method)
            ? PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD[click.method]
            : null;
        const pairedEstimatePath = pairedEstimateMethod && isPendingRewardsMethodLeaf
          ? [...writableTargetPath.slice(0, -1), pairedEstimateMethod]
          : [];
        const writablePairedEstimatePath = resolveWritablePendingRewardsPath(payload, pairedEstimatePath);
        const pairedEstimateNode = writablePairedEstimatePath.length > 0 ? readPathValue(payload, writablePairedEstimatePath) : undefined;
        const shouldRefreshPairedEstimate = Boolean(
          click.action === 'claim' &&
            pairedEstimateMethod &&
            pairedEstimatePath.length > 0 &&
            pairedEstimateNode !== undefined,
        );

        appendLog(
          `[PENDING_REWARDS_TRACE] paired-estimate decision action=${click.action} claimMethod=${String(click.method ?? '')} target=${writableTargetPath.join('.')} pairedMethod=${String(pairedEstimateMethod ?? '')} pairedPath=${writablePairedEstimatePath.join('.')} pairedExists=${String(pairedEstimateNode !== undefined)} shouldRefresh=${String(shouldRefreshPairedEstimate)}`,
        );
        const fallbackActionNode = pendingRewardsRecord
          ? pendingRewardsRecord[click.action] ?? pendingRewardsRecord.estimate ?? pendingRewardsRecord.claim
          : null;
        appendLog(
          `[PENDING_REWARDS_TRACE] candidate target=${writableTargetPath.join('.')} leaf=${String(targetLeaf ?? '')} method=${String(click.method ?? '')} action=${click.action} rerun=${String(isRerunnablePendingRewardsMethod)} lazy=${String(hasLazyPendingRewardsAction(actionNode) || hasLazyPendingRewardsMethod(actionNode))}`,
        );
        if (
          !hasLazyPendingRewardsAction(actionNode) &&
          !hasLazyPendingRewardsMethod(actionNode) &&
          !hasLazyPendingRewardsAction(fallbackActionNode) &&
          !hasLazyPendingRewardsMethod(fallbackActionNode) &&
          !hasPendingRewardsRefreshAction(targetNode) &&
          !isPendingRewardsMethodClickTarget &&
          !isRerunnablePendingRewardsMethod
        ) {
          appendLog(`[PENDING_REWARDS_TRACE] candidate skip no-action target=${writableTargetPath.join('.')}`);
          continue;
        }

        try {
          const actionLabel = click.method ?? (click.action === 'estimate' ? 'pending rewards estimate' : 'pending rewards claim');
          setStatus(`Loading ${actionLabel} for ${normalizedAccount}...`);
          const loadPendingRewardsEstimate = async (methodOverride?: PendingRewardsActionClick['method']) => {
            const pendingTimingCollector = createMethodTimingCollector();
            const selectedEstimateMethod =
              methodOverride && PENDING_REWARDS_ESTIMATE_METHODS.has(methodOverride)
                ? methodOverride
                : click.method && PENDING_REWARDS_ESTIMATE_METHODS.has(click.method)
                  ? click.method
                  : 'estimateOffChainTotalRewards';
            appendLog(
              `[PENDING_REWARDS_TRACE] run estimate method=${selectedEstimateMethod} account=${normalizedAccount} target=${writableTargetPath.join('.')}`,
            );
            if (mode === 'hardhat') {
              const serverResult = await runServerBackedTreeSpCoinMethod({
                panel: 'spcoin_rread',
                method: selectedEstimateMethod,
                params: [{ key: 'Account Key', value: normalizedAccount }],
                cacheMode: 'bypass',
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
                useReadCache: false,
                readCacheNamespace,
              }),
            );
            return {
              pendingResult,
              pendingMeta: buildExecutionMeta(pendingTimingCollector),
            };
          };

          const claimPendingRewards = async () => {
            const claimTimingCollector = createMethodTimingCollector();
            const selectedClaimMethod =
              click.method && PENDING_REWARDS_CLAIM_METHODS.has(click.method)
                ? click.method
                : 'claimOnChainTotalRewards';
            appendLog(
              `[PENDING_REWARDS_TRACE] run claim method=${selectedClaimMethod} account=${normalizedAccount} target=${writableTargetPath.join('.')}`,
            );
            const claimSender = selectedHardhatAddress?.trim() ? selectedHardhatAddress : normalizedAccount;
            const updateResult =
              mode === 'hardhat'
                ? await runServerBackedTreeSpCoinMethod({
                    panel: 'spcoin_write',
                    method: selectedClaimMethod,
                    sender: claimSender,
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  })
                : await runSpCoinWriteMethod({
                    selectedMethod: selectedClaimMethod as SpCoinWriteMethod,
                    spWriteParams: [normalizedAccount],
                    coerceParamValue,
                    executeWriteConnected,
                    selectedHardhatAddress: claimSender,
                    appendLog,
                    appendWriteTrace,
                    spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                    setStatus: noop,
                    timingCollector: claimTimingCollector,
                  });
            const balanceClaimSummary =
              mode === 'hardhat'
                ? buildClaimedRewardsSummary((updateResult as { result?: unknown }).result)
                : {};
            return {
              pendingResult: {
                ...balanceClaimSummary,
                receipts: mode === 'hardhat' ? (updateResult as { result?: unknown }).result : (updateResult as { receipts?: unknown }).receipts,
              },
              pendingMeta:
                (updateResult as { meta?: MethodExecutionMeta }).meta ?? buildExecutionMeta(claimTimingCollector),
            };
          };

          const isEstimateMethod = click.method
            ? PENDING_REWARDS_ESTIMATE_METHODS.has(click.method)
            : false;
          const isEstimatePendingRewardsRequest =
            isEstimateMethod || click.action === 'estimate';
          const loadedPending = isEstimatePendingRewardsRequest
            ? callAccessMethod
              ? await callAccessMethod(click.method ?? 'estimateOffChainTotalRewards', () => loadPendingRewardsEstimate())
              : await loadPendingRewardsEstimate()
            : callAccessMethod
              ? await callAccessMethod(click.method ?? 'claimOnChainTotalRewards', () => claimPendingRewards())
              : await claimPendingRewards();
          if (!loadedPending) return 'handled';

          const { pendingResult, pendingMeta } = loadedPending;
          const methodName = click.method
            ?? (
              click.action === 'claim'
                ? 'claimPendingRewards'
                : 'estimateOffChainTotalRewards'
            );
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
          const directLastUpdatedRewardsClaim =
            !isEstimatePendingRewardsRequest && click.action === 'claim'
              ? readClaimedRewardsAmount(pendingResult)
              : undefined;
          const expandedMeta =
            withPendingRewardsRoleMeta(
              directLastUpdatedRewardsClaim !== undefined
                ? {
                    ...(asRecord(pendingMeta) ?? {}),
                    'Last Claimed Rewards': directLastUpdatedRewardsClaim,
                  }
                : pendingMeta,
              expandedCallMethod,
              pendingResult,
            );
          const expandedNode = {
            call: {
              method: expandedCallMethod,
              parameters: {
                'Account Key': normalizedAccount,
              },
              selectedMethod: methodName,
            },
            ...(expandedMeta ? { meta: expandedMeta } : {}),
            result: refreshablePendingResult,
            __forceExpanded: true,
            __showEmptyFields: true,
          };
          appendLog(
            `[PENDING_REWARDS_TRACE] step expanded-node method=${expandedCallMethod} pendingResult=(${describeTraceNode(pendingResult)}) expandedNode=(${describeTraceNode(expandedNode)}) metaKeys=${Object.keys(asRecord(expandedMeta) ?? {}).join(',') || 'none'}`,
          );

          let pairedEstimateExpandedNode: Record<string, unknown> | null = null;
          let pairedEstimatePendingResult: unknown | null = null;
          if (!isEstimatePendingRewardsRequest && shouldRefreshPairedEstimate && pairedEstimateMethod) {
            appendLog(
              `[PENDING_REWARDS_TRACE] paired-estimate zero after successful claim method=${pairedEstimateMethod} path=${pairedEstimatePath.join('.')} account=${normalizedAccount}`,
            );
            pairedEstimatePendingResult = buildZeroPendingRewardsEstimateResult(normalizedAccount, pairedEstimateMethod);
            const existingPairedEstimateNode = asRecord(pairedEstimateNode);
            pairedEstimateExpandedNode = {
              call: {
                method: pairedEstimateMethod,
                parameters: {
                  'Account Key': normalizedAccount,
                },
                selectedMethod: pairedEstimateMethod,
              },
              meta: withPendingRewardsRoleMeta(existingPairedEstimateNode?.meta, pairedEstimateMethod, pairedEstimatePendingResult),
              result: pairedEstimatePendingResult,
              ...(existingPairedEstimateNode?.__forceExpanded === true ? { __forceExpanded: true } : {}),
              ...(existingPairedEstimateNode?.__showEmptyFields === true ? { __showEmptyFields: true } : {}),
            };
          }

          const summaryPendingResult = pairedEstimatePendingResult ?? pendingResult;
          const pendingRewardsAmount = readPendingRewardsAmount(summaryPendingResult);
          const pendingRewardsRefreshAtMs = Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS;
          const pendingRewardsPath =
            targetLeaf === 'estimate' || targetLeaf === 'claim' || isPendingRewardsMethodLeaf
              ? writableTargetPath.slice(0, -1)
              : targetLeaf === 'pendingRewards'
                ? writableTargetPath
                : [];
          const writablePendingRewardsPath = resolveWritablePendingRewardsPath(payload, pendingRewardsPath);
          const pendingRewardsByAccountBeforePairedWrite =
            readPendingRewardsByAccount(expandedNode) ??
            readPendingRewardsByAccount(pendingResult) ??
            readPendingRewardsByAccount(pairedEstimateNode) ??
            findPendingRewardsByAccount(readPathValue(payload, pendingRewardsPath)) ??
            findPendingRewardsByAccount(payload);
          const shouldPreservePendingRewardsShape =
            targetLeaf === 'estimate' ||
            targetLeaf === 'claim' ||
            isPendingRewardsMethodLeaf ||
            targetLeaf === 'pendingRewards';
          const payloadWithExpandedNode =
            isPendingRewardsMethodLeaf
              ? writePathValue(payload, writableTargetPath, expandedNode)
              : targetLeaf === 'estimate' || targetLeaf === 'claim'
                ? writePathValue(
                    payload,
                    writableTargetPath,
                    buildLazyPendingRewardsMethod(
                      normalizedAccount,
                      click.action === 'claim' ? 'claimOnChainTotalRewards' : 'estimateOffChainTotalRewards',
                    ),
                  )
                : shouldPreservePendingRewardsShape
                  ? payload
                  : writePathValue(payload, targetPath, expandedNode);
          const payloadWithRefreshedPairedEstimate =
            pairedEstimateExpandedNode && writablePairedEstimatePath.length > 0
              ? (() => {
                  appendLog(
                    `[PENDING_REWARDS_TRACE] paired-estimate write path=${writablePairedEstimatePath.join('.')} method=${String(pairedEstimateMethod ?? '')}`,
                  );
                  return writePathValue(payloadWithExpandedNode, writablePairedEstimatePath, pairedEstimateExpandedNode);
                })()
              : (() => {
                  appendLog(
                    `[PENDING_REWARDS_TRACE] paired-estimate write skipped hasNode=${String(Boolean(pairedEstimateExpandedNode))} path=${writablePairedEstimatePath.join('.')}`,
                  );
                  return payloadWithExpandedNode;
                })();
          const existingPendingRewardsNode = readPathValue(payloadWithRefreshedPairedEstimate, writablePendingRewardsPath);
          const summaryLoadedMethod =
            pairedEstimateExpandedNode && pairedEstimateMethod
              ? pairedEstimateMethod
              : expandedCallMethod;
          const summaryLoadedNode = pairedEstimateExpandedNode ?? expandedNode;
          const payloadWithPendingRewardsSummary =
            pendingRewardsAmount !== null &&
            writablePendingRewardsPath.length > 0 &&
            existingPendingRewardsNode &&
            typeof existingPendingRewardsNode === 'object' &&
            !Array.isArray(existingPendingRewardsNode)
              ? writePathValue(
                  payloadWithRefreshedPairedEstimate,
                  writablePendingRewardsPath,
                  mergePendingRewardsSummaryNode(
                    existingPendingRewardsNode,
                    summaryPendingResult,
                    normalizedAccount,
                    click.action,
                    pendingRewardsRefreshAtMs,
                    summaryLoadedMethod,
                    summaryLoadedNode,
                  ),
                )
              : payloadWithRefreshedPairedEstimate;
          const mergedPendingRewardsNode = writablePendingRewardsPath.length > 0
            ? readPathValue(payloadWithPendingRewardsSummary, writablePendingRewardsPath)
            : undefined;
          const mergedTargetNode = readPathValue(payloadWithPendingRewardsSummary, writableTargetPath);
          appendLog(
            `[PENDING_REWARDS_TRACE] step merge-summary method=${expandedCallMethod} amount=${String(pendingRewardsAmount ?? 'null')} pendingPath=${writablePendingRewardsPath.join('.')} existing=(${describeTraceNode(existingPendingRewardsNode)}) mergedPending=(${describeTraceNode(mergedPendingRewardsNode)}) mergedTarget=(${describeTraceNode(mergedTargetNode)})`,
          );
          const pendingRewardsByAccount =
            readPendingRewardsByAccount(expandedNode) ??
            readPendingRewardsByAccount(summaryPendingResult) ??
            readPendingRewardsByAccount(pairedEstimateExpandedNode) ??
            pendingRewardsByAccountBeforePairedWrite ??
            findPendingRewardsByAccount(existingPendingRewardsNode);
          const claimedRewardsByAccount = isEstimatePendingRewardsRequest
            ? null
            : mergeRewardsByAccountMaps(
                buildClaimedRewardsByAccountFromPendingRewards(pendingRewardsByAccount, expandedCallMethod),
                readClaimedRewardsByAccount(expandedNode),
                readClaimedRewardsByAccount(pendingResult),
                directLastUpdatedRewardsClaim !== undefined
                  ? buildClaimedRewardsByAccount(normalizedAccount, expandedCallMethod, directLastUpdatedRewardsClaim)
                  : null,
              );
          const pendingRewardsByAccountForDisplay = isEstimatePendingRewardsRequest
            ? pendingRewardsByAccount
            : buildZeroPendingRewardsByAccount(pendingRewardsByAccount ?? claimedRewardsByAccount);
          if (pendingRewardsByAccountForDisplay) {
            appendLog(
              `[PENDING_REWARDS_TRACE] pending-rewards propagate method=${expandedCallMethod} accounts=${Object.keys(pendingRewardsByAccountForDisplay).join(',')} sourceAccounts=${Object.keys(pendingRewardsByAccount ?? {}).join(',') || 'none'}`,
            );
          }
          if (!isEstimatePendingRewardsRequest) {
            appendLog(
              `[PENDING_REWARDS_TRACE] claim pending-estimates zero map accounts=${Object.keys(pendingRewardsByAccountForDisplay ?? {}).join(',') || 'none'} sourceAccounts=${Object.keys(pendingRewardsByAccount ?? {}).join(',') || 'none'} claimedSourceAccounts=${Object.keys(claimedRewardsByAccount ?? {}).join(',') || 'none'}`,
            );
          }
          const claimedRewardsByAccountForDisplay = (() => {
            const zeroClaimedRewardsByAccount =
              !isEstimatePendingRewardsRequest
                ? buildZeroClaimedRewardsByAccount(pendingRewardsByAccount ?? claimedRewardsByAccount)
                : null;
            if (!zeroClaimedRewardsByAccount && !claimedRewardsByAccount) return null;

            const mergedClaimedRewardsByAccount = { ...(zeroClaimedRewardsByAccount ?? {}) };
            for (const [accountKey, accountClaims] of Object.entries(claimedRewardsByAccount ?? {})) {
              mergedClaimedRewardsByAccount[accountKey] = {
                ...(mergedClaimedRewardsByAccount[accountKey] ?? {}),
                ...accountClaims,
              };
            }
            return Object.keys(mergedClaimedRewardsByAccount).length > 0
              ? mergedClaimedRewardsByAccount
              : null;
          })();
          if (claimedRewardsByAccountForDisplay) {
            appendLog(
              `[PENDING_REWARDS_TRACE] claimed-rewards propagate method=${expandedCallMethod} accounts=${Object.keys(claimedRewardsByAccountForDisplay).join(',')} sourceAccounts=${Object.keys(claimedRewardsByAccount ?? {}).join(',') || 'none'}`,
            );
            appendLog(
              `[PENDING_REWARDS_TRACE] claimed-rewards amounts method=${expandedCallMethod} direct=${toDisplayString(directLastUpdatedRewardsClaim, 'undefined')} values=${describeRewardsByAccountMap(claimedRewardsByAccountForDisplay)}`,
            );
          }
          const payloadWithPropagatedPendingRewards = mergePendingRewardsByAccountIntoTree(
            payloadWithPendingRewardsSummary,
            pendingRewardsByAccountForDisplay,
            pendingRewardsRefreshAtMs,
          );
          const payloadWithPropagatedClaimedRewards = mergeClaimedRewardsByAccountIntoTree(
            payloadWithPropagatedPendingRewards,
            claimedRewardsByAccountForDisplay,
          );
          if (click.action === 'claim') {
            appendLog(
              `[PENDING_REWARDS_TRACE] local claim update account=${normalizedAccount} claimedKeys=${Object.keys(claimedRewardsByAccountForDisplay ?? {}).join(',') || 'none'}`,
            );
          }
          const payloadAfterFinalPairedEstimateWrite = payloadWithPropagatedClaimedRewards;
          if (pairedEstimateMethod && writablePairedEstimatePath.length > 0) {
            const finalPairedEstimateNode = readPathValue(payloadAfterFinalPairedEstimateWrite, writablePairedEstimatePath);
            appendLog(
              `[PENDING_REWARDS_TRACE] paired-estimate final path=${writablePairedEstimatePath.join('.')} method=${pairedEstimateMethod} amount=${String(readPendingRewardsAmount(finalPairedEstimateNode) ?? 'null')}`,
            );
          }
          const nextRootPayload = normalizeExecutionPayload(payloadAfterFinalPairedEstimateWrite) as Record<string, unknown>;
          const finalPendingRewardsNode = writablePendingRewardsPath.length > 0
            ? readPathValue(nextRootPayload, writablePendingRewardsPath)
            : undefined;
          const finalTargetNode = readPathValue(nextRootPayload, writableTargetPath);
          appendLog(
            `[PENDING_REWARDS_TRACE] step final-payload method=${expandedCallMethod} finalPending=(${describeTraceNode(finalPendingRewardsNode)}) finalTarget=(${describeTraceNode(finalTargetNode)})`,
          );
          applyPendingRewardsAccountRecordUpdates({
            blockEntries,
            primaryBlockIndex: entry.index,
            nextRootPayload,
            pendingRewardsByAccountForDisplay,
            claimedRewardsByAccountForDisplay,
            pendingRewardsRefreshAtMs,
            blocks,
            inTreePanel,
            isEstimatePendingRewardsRequest,
            expandedCallMethod: String(expandedCallMethod),
            formatFormattedPanelPayload,
            normalizeAddressValue,
            treeAccountRecordCacheRef,
            setFormattedOutputDisplay,
            setTrackedTreeOutputDisplay,
            loadAccountRecordForAddress,
            appendLog,
          });
          setStatus(`Loaded ${actionLabel} for ${normalizedAccount}.`);
          appendLog(`Inline ${actionLabel} loaded for ${normalizedAccount}`);
          appendLog(
            `[PENDING_REWARDS_TRACE] expand success method=${String(expandedCallMethod)} account=${normalizedAccount} target=${writableTargetPath.join('.')} pendingPath=${writablePendingRewardsPath.join('.')}`,
          );
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, 'Unable to load pending rewards.');
          setStatus(`Unable to load pending rewards for ${normalizedAccount}.`);
          appendLog(`Inline pending rewards ${click.action} failed for ${normalizedAccount}: ${message}`);
          appendLog(
            `[PENDING_REWARDS_TRACE] expand error action=${click.action} method=${String(click.method ?? '')} account=${normalizedAccount} target=${writableTargetPath.join('.')} message=${message}`,
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
      formattedOutputDisplayRef,
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
      treeAccountRecordCacheRef,
      treeOutputDisplayRef,
      useLocalSpCoinAccessPackage,
      useReadCache,
    ],
  );
}
