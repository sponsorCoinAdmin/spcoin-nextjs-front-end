import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import { runSpCoinReadMethod } from '../jsonMethods/spCoin/read';
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
  appendLog,
  setStatus,
  setFormattedOutputDisplay,
  setTreeOutputDisplay,
  setOutputPanelMode,
  showValidationPopup,
  requireContractAddress,
  ensureReadRunner,
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
  }, [mode, requireContractAddress, rpcUrl, syncTreeAccountOptions]);

  const formattedOutputDisplayRef = useRef(formattedOutputDisplay);
  useEffect(() => {
    formattedOutputDisplayRef.current = formattedOutputDisplay;
  }, [formattedOutputDisplay]);

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
        setTreeOutputDisplay('(no tree yet)');
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
        setTreeOutputDisplay('(no tree yet)');
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
      setTreeOutputDisplay(formatOutputDisplayValue({ call, result, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      appendLog(`spCoinReadMethods/getSpCoinMetaData -> ${toDisplayString(result)}`);
      setStatus('Metadata read complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown metadata read error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
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
    setTreeOutputDisplay,
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
        setTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading account list...');
        return loadTreeAccountOptions();
      })
        : await (async () => {
        setTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Reading account list...');
        return loadTreeAccountOptions();
      })();
      setTreeOutputDisplay(formatOutputDisplayValue({ call, result: list, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      appendLog(`spCoinReadMethods/getMasterAccountKeys -> ${JSON.stringify(list)}`);
      setStatus(`Account read complete (${list.length} account(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown account list read error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
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
    setTreeOutputDisplay,
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
        setTreeOutputDisplay('(no tree yet)');
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
        setTreeOutputDisplay('(no tree yet)');
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
      setTreeOutputDisplay(formatOutputDisplayValue({ call, result, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
      appendLog(`spCoinReadMethods/getTreeAccounts -> ${JSON.stringify(result)}`);
      setStatus(`Tree accounts read complete (${result.length} account stub(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree accounts read error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
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
    setTreeOutputDisplay,
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
        }
        if (
          tree &&
          typeof tree === 'object' &&
          !Array.isArray(tree) &&
          (!Array.isArray((tree as Record<string, unknown>).recipientKeys) ||
            ((tree as Record<string, unknown>).recipientKeys as unknown[]).length === 0)
        ) {
          const recipientListResponse = await fetch('/api/spCoin/run-script', {
            method: 'POST',
            signal: options?.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: target,
              rpcUrl,
              spCoinAccessSource: 'local',
              script: {
                id: `expand-account-recipient-list-${Date.now()}`,
                name: 'Expand Account Recipient List',
                network: 'hardhat',
                steps: [
                  {
                    step: 1,
                    name: 'getRecipientKeys',
                    panel: 'spcoin_rread',
                    method: 'getRecipientKeys',
                    mode: 'hardhat',
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  },
                ],
              },
            }),
          });
          const recipientListPayload = (await recipientListResponse.json()) as {
            ok?: boolean;
            message?: string;
            results?: { success?: boolean; payload?: { result?: unknown; error?: { message?: string } } }[];
          };
          if (recipientListResponse.ok) {
            const recipientListResult = Array.isArray(recipientListPayload?.results) ? recipientListPayload.results[0] : null;
            const rawRecipientKeys = recipientListResult?.success ? recipientListResult?.payload?.result : [];
            const recipientKeys = Array.isArray(rawRecipientKeys)
              ? rawRecipientKeys
                  .map((value) => toDisplayString(value).trim())
                  .filter((value) => value.length > 0)
              : [];
            if (recipientKeys.length > 0) {
              (tree as Record<string, unknown>).recipientKeys = recipientKeys.map((address) => ({ address }));
            }
          }
        }
        if (
          tree &&
          typeof tree === 'object' &&
          !Array.isArray(tree) &&
          (!Array.isArray((tree as Record<string, unknown>).agentKeys) ||
            ((tree as Record<string, unknown>).agentKeys as unknown[]).length === 0)
        ) {
          const agentListResponse = await fetch('/api/spCoin/run-script', {
            method: 'POST',
            signal: options?.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: target,
              rpcUrl,
              spCoinAccessSource: 'local',
              script: {
                id: `expand-account-agent-list-${Date.now()}`,
                name: 'Expand Account Agent List',
                network: 'hardhat',
                steps: [
                  {
                    step: 1,
                    name: 'getAgentKeys',
                    panel: 'spcoin_rread',
                    method: 'getAgentKeys',
                    mode: 'hardhat',
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  },
                ],
              },
            }),
          });
          const agentListPayload = (await agentListResponse.json()) as {
            ok?: boolean;
            message?: string;
            results?: { success?: boolean; payload?: { result?: unknown; error?: { message?: string } } }[];
          };
          if (agentListResponse.ok) {
            const agentListResult = Array.isArray(agentListPayload?.results) ? agentListPayload.results[0] : null;
            const rawAgentKeys = agentListResult?.success ? agentListResult?.payload?.result : [];
            const agentKeys = Array.isArray(rawAgentKeys)
              ? rawAgentKeys
                  .map((value) => toDisplayString(value).trim())
                  .filter((value) => value.length > 0)
              : [];
            if (agentKeys.length > 0) {
              (tree as Record<string, unknown>).agentKeys = agentKeys.map((address) => ({ address }));
            }
          }
        }
        treeAccountRecordCacheRef.current.set(normalizedAccount, tree);
      }
      return tree;
    },
    [mode, normalizeAddressValue, requireContractAddress, rpcUrl],
  );

  const runTreeDumpBase = useCallback(async (accountOverride?: string, options?: { force?: boolean }) => {
    const startedAtMs = Date.now();
    const executionTimingCollector = traceEnabled ? createMethodTimingCollector(startedAtMs) : null;
    const listCall = buildMethodCallEntry('getMasterAccountKeys');
    try {
      const { list } = executionTimingCollector
        ? await runWithMethodTimingCollector(executionTimingCollector, async () => {
        setTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Building tree dump...');
        return loadTreeAccountOptions({ force: options?.force });
      })
        : await (async () => {
        setTreeOutputDisplay('(no tree yet)');
        setOutputPanelMode('tree');
        setStatus('Building tree dump...');
        return loadTreeAccountOptions({ force: options?.force });
      })();
      if (list.length === 0) {
        setTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, result: [], ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
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
      setTreeOutputDisplay(
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
      setTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, error: message, ...(executionTimingCollector ? { meta: buildExecutionMeta(executionTimingCollector) } : {}) }));
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
    setTreeOutputDisplay,
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
      appendLog(`[EXPAND] click account=${normalizedAccount} path=${normalizedPathHint || '(none)'}`);
      appendLog(`[EXPAND] trimmedDisplay length=${trimmedDisplay.length} first80=${trimmedDisplay.slice(0, 80)}`);
      const pathSegments = normalizedPathHint.split('.').filter(Boolean);
      if (pathSegments.length < 2) {
        appendLog(`[EXPAND] FAIL: path too short segments=${pathSegments.join('|')}`);
        return 'unhandled';
      }
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
      appendLog(
        `[EXPAND] path candidates=${payloadPathCandidates.map((segments) => segments.join('.')).join(' | ') || '(none)'}`,
      );
      if (payloadPathCandidates.length === 0) {
        appendLog(`[EXPAND] FAIL: no valid path candidates from pathSegments=${pathSegments.join('|')} lastKey=${pathSegments[pathSegments.length - 1]}`);
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
      appendLog(
        `[EXPAND] blocks=${blockEntries.length} hintedBlock=${Number.isInteger(hintedBlockIndex) ? hintedBlockIndex : 'none'} candidates=${candidateEntries.length}`,
      );

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) continue;
        const exactTargets = payloadPathCandidates
          .map((payloadPath) => normalizeExactTargetPath(payload, payloadPath))
          .filter((target): target is InlineAccountTarget => Boolean(target));
        const fallbackTarget = exactTargets.length > 0 ? null : findInlineAccountTarget(payload);
        const targets = fallbackTarget ? [...exactTargets, fallbackTarget] : exactTargets;
        const targetPathSummary =
          targets.length > 0
            ? targets.map((target) => `${target.path.join('.')}(${target.matchKind ?? 'unknown'})`).join('|')
            : 'none';
        appendLog(
          `[EXPAND] target search block=${entry.index} exact=${exactTargets.length} fallback=${fallbackTarget ? fallbackTarget.path.join('.') : 'none'} targetPaths=${
            targetPathSummary
          }`,
        );

        for (const target of targets) {
          appendLog(
            `[EXPAND] loading target path=${target.path.join('.')} source=${target.sourcePath?.join('.') ?? target.path.join('.')} match=${target.matchKind ?? 'unknown'} kind=${typeof target.targetEntry}`,
          );
          try {
            setStatus(`Loading account record for ${normalizedAccount}...`);
            const loadInlineAccountRecord = (signal?: AbortSignal) =>
              loadAccountRecordForAddress(normalizedAccount, { force: true, signal });
            const accountRecord = await loadInlineAccountRecord();
            if (accountRecord === undefined) return 'handled';
            const accountRecordKeys =
              accountRecord && typeof accountRecord === 'object' && !Array.isArray(accountRecord)
                ? Object.keys(accountRecord as Record<string, unknown>)
                : [];
            appendLog(`[EXPAND] loaded record keys=${accountRecordKeys.join(',') || '(scalar)'}`);
            const nextAccountEntry = buildExpandedAccountEntry(accountRecord);
            const nextRootPayload = writePathValue(payload, target.path, nextAccountEntry) as Record<string, unknown>;
            const nextPayload = formatFormattedPanelPayload({
              ...nextRootPayload,
            });
            appendLog(
              `[EXPAND] rewrite containsForce=${nextPayload.includes('__forceExpanded')} containsAccountKey=${nextPayload.includes('"accountKey"')}`,
            );
            if (blocks.length > 1) {
              const nextBlocks = [...blocks];
              nextBlocks[entry.index] = nextPayload;
              setFormattedOutputDisplay(nextBlocks.join('\n\n'));
            } else {
              setFormattedOutputDisplay(nextPayload);
            }
            appendLog(
              `[ACCOUNT_EXPAND_TRACE] wrote account record block=${entry.index} path=${target.path.join('.')} source=${target.sourcePath?.join('.') ?? target.path.join('.')} match=${target.matchKind ?? 'unknown'} payloadLength=${nextPayload.length}`,
            );
            setStatus(`Loaded account record for ${normalizedAccount}.`);
            appendLog(`Inline account record loaded for ${normalizedAccount}.`);
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
      appendLog(`[EXPAND] no matching displayed account node for ${normalizedAccount}`);
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

  const openAccountFromAddress = useCallback(
    async (account: string, pathHint?: string) => {
      appendLog(`[EXPAND] open request value=${String(account ?? '')} path=${String(pathHint ?? '')}`);
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
      expandMasterAccountKeysInline,
      expandMasterSponsorListAccountInline,
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
