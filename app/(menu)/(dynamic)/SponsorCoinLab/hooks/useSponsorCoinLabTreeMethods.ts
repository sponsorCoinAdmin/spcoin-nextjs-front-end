import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import { runSpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { runSpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import { createSpCoinLibraryAccess, type SpCoinReadAccess } from '../jsonMethods/shared';
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
      let tree = options?.force ? undefined : treeAccountRecordCacheRef.current.get(normalizedAccount);
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
          ? await runWithMethodTimingCollector(executionTimingCollector, async () => loadAccountRecordForAddress(activeAccount))
          : await loadAccountRecordForAddress(activeAccount);
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
      if (!rawDisplay || rawDisplay === '(no tree yet)' || rawDisplay === '(no output yet)') return 'unhandled';

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
      if (payloadPath.length === 0) return 'unhandled';

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) continue;
        const targetNode = readPathValue(payload, payloadPath);
        if (
          !targetNode ||
          typeof targetNode !== 'object' ||
          Array.isArray(targetNode) ||
          (targetNode as Record<string, unknown>).__lazyPendingRewardsAction !== true
        ) {
          continue;
        }

        try {
          const actionLabel = click.action === 'estimate' ? 'pending rewards estimate' : 'pending rewards claim';
          setStatus(`Loading ${actionLabel} for ${normalizedAccount}...`);
          const loadPendingRewardsEstimate = async () => {
            const pendingTimingCollector = createMethodTimingCollector();
            const pendingResult = await runWithMethodTimingCollector(pendingTimingCollector, async () =>
              runSpCoinReadMethod({
                selectedMethod: 'getPendingRewards',
                spReadParams: [normalizedAccount],
                coerceParamValue,
                stringifyResult,
                spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                requireContractAddress,
                ensureReadRunner,
                appendLog: noop,
                setStatus: noop,
              }),
            );
            return {
              pendingResult,
              pendingMeta: buildExecutionMeta(pendingTimingCollector),
            };
          };

          const claimPendingRewards = async () => {
            const claimTimingCollector = createMethodTimingCollector();
            const updateResult = await runSpCoinWriteMethod({
              selectedMethod: 'updateAccountStakingRewards',
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
            treeAccountRecordCacheRef.current.delete(normalizedAccount);
            const rewardsResult = await runWithMethodTimingCollector(claimTimingCollector, async () =>
              runSpCoinReadMethod({
                selectedMethod: 'getAccountStakingRewards',
                spReadParams: [normalizedAccount],
                coerceParamValue,
                stringifyResult,
                spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                requireContractAddress,
                ensureReadRunner,
                appendLog: noop,
                setStatus: noop,
              }),
            );
            return {
              pendingResult: {
                updateAccountStakingRewards: updateResult.receipts,
                getAccountRewards: rewardsResult,
              },
              pendingMeta: buildExecutionMeta(claimTimingCollector),
            };
          };

          const loadedPending = click.action === 'claim'
            ? await claimPendingRewards()
            : callAccessMethod
              ? await callAccessMethod('getPendingRewards', () => loadPendingRewardsEstimate())
              : await loadPendingRewardsEstimate();
          if (!loadedPending) return 'handled';
          const { pendingResult, pendingMeta } = loadedPending;
          const methodName = click.action === 'claim' ? 'claimPendingRewards' : 'getPendingRewards';
          const expandedNode = {
            call: {
              method: methodName,
              parameters: {
                'Account Key': normalizedAccount,
                Mode: click.action === 'estimate' ? 'Off-chain estimate' : 'Claim preview',
              },
              ...(click.action === 'claim'
                ? { sequence: ['updateAccountStakingRewards', 'getAccountRewards'] }
                : {}),
            },
            ...(pendingMeta ? { meta: pendingMeta } : {}),
            result: pendingResult,
            __forceExpanded: true,
            __showEmptyFields: true,
          };
          const nextRootPayload = normalizeExecutionPayload(
            writePathValue(payload, payloadPath, expandedNode),
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
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, 'Unable to load pending rewards.');
          setStatus(`Unable to load pending rewards for ${normalizedAccount}.`);
          appendLog(`Inline pending rewards ${click.action} failed for ${normalizedAccount}: ${message}`);
          return 'handled';
        }
      }
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
      normalizeAddressValue,
      requireContractAddress,
      selectedHardhatAddress,
      setFormattedOutputDisplay,
      setStatus,
      setTrackedTreeOutputDisplay,
      stringifyResult,
      useLocalSpCoinAccessPackage,
    ],
  );

  const openAccountFromAddress = useCallback(
    async (account: string, pathHint?: string, rawDisplayOverride?: string) => {
      const relationClick = parseLazyAccountRelationClick(account, normalizeAddressValue);
      const pendingRewardsClick = parsePendingRewardsActionClick(account, normalizeAddressValue);
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
