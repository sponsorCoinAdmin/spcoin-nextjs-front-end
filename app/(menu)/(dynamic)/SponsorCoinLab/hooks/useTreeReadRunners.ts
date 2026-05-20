import { useCallback } from 'react';
import { createSpCoinLibraryAccess, type SpCoinReadAccess } from '../jsonMethods/shared';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import {
  buildExecutionMeta,
  enrichDirectReadError,
} from './methodExecutionHelpers';

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status' | 'debug';

interface MethodCallEntry {
  method: string;
  parameters: { label: string; value: unknown }[];
}

interface UseTreeReadRunnersParams {
  appendLog: (line: string) => void;
  buildMethodCallEntry: (
    method: string,
    params?: { label: string; value: unknown }[],
  ) => MethodCallEntry;
  callTreeAccessMethod: (methodName: string, runner: () => Promise<void>) => Promise<void>;
  ensureReadRunner: () => Promise<any>;
  formatOutputDisplayValue: (value: unknown) => string;
  loadTreeAccountOptions: (options?: { force?: boolean }) => Promise<{ list: string[] }>;
  requireContractAddress: () => string;
  setOutputPanelMode: (value: OutputPanelMode) => void;
  setStatus: (value: string) => void;
  setTrackedTreeOutputDisplay: (value: string) => void;
  traceEnabled: boolean;
  useLocalSpCoinAccessPackage: boolean;
}

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function useTreeReadRunners({
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
}: UseTreeReadRunnersParams) {
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

  return {
    runAccountListRead,
    runHeaderRead,
    runTreeAccountsRead,
  };
}
