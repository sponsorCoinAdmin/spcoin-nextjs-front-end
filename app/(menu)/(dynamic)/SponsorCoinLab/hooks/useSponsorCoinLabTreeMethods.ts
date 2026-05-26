import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import { normalizeStringListResult } from '../jsonMethods/shared/normalizeListResult';
import type { ConnectionMode } from '../scriptBuilder/types';
import {
  buildExecutionMeta,
  type MethodExecutionMeta,
} from './methodExecutionHelpers';
import type { AccessMethodCaller } from './useAccessMethodCaller';
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
  parsePendingRewardsActionClick,
  parsePendingRewardsMethodClick,
} from './pendingRewardsTreeUtils';
import { useMasterSponsorListInlineExpansion } from './useMasterSponsorListInlineExpansion';
import { useMetadataInlineExpansion } from './useMetadataInlineExpansion';
import { usePendingRewardsInlineExpansion } from './usePendingRewardsInlineExpansion';
import { useServerBackedTreeSpCoinMethod } from './useServerBackedTreeSpCoinMethod';
import { useTreeReadRunners } from './useTreeReadRunners';

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status' | 'debug';

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
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

  const runServerBackedTreeSpCoinMethod = useServerBackedTreeSpCoinMethod({
    appendWriteTrace,
    mode,
    readCacheNamespace,
    requireContractAddress,
    rpcUrl,
    useLocalSpCoinAccessPackage,
    useReadCache,
  });

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

  const {
    runAccountListRead,
    runHeaderRead,
    runTreeAccountsRead,
  } = useTreeReadRunners({
    appendLog,
    buildMethodCallEntry,
    callTreeAccessMethod,
    ensureReadRunner,
    formatOutputDisplayValue,
    loadTreeAccountOptions,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTrackedTreeOutputDisplay,
    traceEnabled,
    useLocalSpCoinAccessPackage,
  });

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

  const {
    expandMasterAccountKeysInline,
    expandSpCoinMetaDataInline,
  } = useMetadataInlineExpansion({
    appendLog,
    callAccessMethod,
    coerceParamValue,
    ensureReadRunner,
    formatFormattedPanelPayload,
    formattedOutputDisplayRef,
    readCacheNamespace,
    requireContractAddress,
    setFormattedOutputDisplay,
    setStatus,
    stringifyResult,
    useLocalSpCoinAccessPackage,
    useReadCache,
  });

  const expandMasterSponsorListAccountInline = useMasterSponsorListInlineExpansion({
    appendLog,
    callAccessMethod,
    formatFormattedPanelPayload,
    formattedOutputDisplayRef,
    treeOutputDisplayRef,
    loadAccountRecordForAddress,
    normalizeAddressValue,
    setFormattedOutputDisplay,
    setTrackedTreeOutputDisplay,
    setStatus,
    showValidationPopup,
  });

  const expandPendingRewardsActionInline = usePendingRewardsInlineExpansion({
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
  });
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
        setOutputPanelMode(inTreePanel ? 'tree' : 'formatted');
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
