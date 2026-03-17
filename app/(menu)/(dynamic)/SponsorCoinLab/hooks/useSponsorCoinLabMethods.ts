import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ParamDef } from '../methods/shared/types';
import {
  getErc20ReadLabels,
  runErc20ReadMethod,
  type Erc20ReadMethod,
} from '../methods/erc20/read';
import {
  getErc20WriteLabels,
  runErc20WriteMethod,
  type Erc20WriteMethod,
} from '../methods/erc20/write';
import { runSpCoinReadMethod, type SpCoinReadMethod } from '../methods/spcoin/read';
import { runSpCoinWriteMethod, type SpCoinWriteMethod } from '../methods/spcoin/write';
import { createSpCoinLibraryAccess } from '../methods/shared';
import type { ConnectionMode, LabScriptStep, MethodPanelMode } from '../scriptBuilder/types';

type Entry = { id: string; label: string };
type ScriptRunResult = {
  success: boolean;
  formattedOutput: string;
};

type Params = {
  mode: ConnectionMode;
  methodPanelMode: MethodPanelMode;
  selectedReadMethod: Erc20ReadMethod;
  readAddressA: string;
  readAddressB: string;
  selectedWriteMethod: Erc20WriteMethod;
  selectedWriteSenderAddress: string;
  writeAddressA: string;
  writeAddressB: string;
  writeAmountRaw: string;
  activeReadLabels: {
    title: string;
    addressALabel: string;
    addressBLabel: string;
    addressAPlaceholder: string;
    addressBPlaceholder: string;
    requiresAddressA: boolean;
    requiresAddressB: boolean;
  };
  activeWriteLabels: {
    title: string;
    addressALabel: string;
    addressBLabel: string;
    addressAPlaceholder: string;
    addressBPlaceholder: string;
    requiresAddressB: boolean;
  };
  selectedSpCoinReadMethod: SpCoinReadMethod;
  setSelectedSpCoinReadMethod: (value: SpCoinReadMethod) => void;
  selectedSpCoinWriteMethod: SpCoinWriteMethod;
  setSelectedSpCoinWriteMethod: (value: SpCoinWriteMethod) => void;
  spReadParams: string[];
  spWriteParams: string[];
  spCoinReadMethodDefs: Record<string, { title: string; params: ParamDef[]; executable?: boolean }>;
  spCoinWriteMethodDefs: Record<string, { title: string; params: ParamDef[]; executable?: boolean }>;
  activeSpCoinReadDef: { title: string; params: ParamDef[]; executable?: boolean };
  activeSpCoinWriteDef: { title: string; params: ParamDef[]; executable?: boolean };
  selectedHardhatAddress?: string;
  effectiveConnectedAddress: string;
  useLocalSpCoinAccessPackage: boolean;
  appendLog: (line: string) => void;
  appendWriteTrace: (line: string) => void;
  setStatus: (value: string) => void;
  setFormattedOutputDisplay: (value: string) => void;
  setTreeOutputDisplay: (value: string) => void;
  setOutputPanelMode: (value: 'execution' | 'formatted' | 'tree' | 'raw_status') => void;
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
  normalizeAddressValue: (value: string) => string;
  parseListParam: (raw: string) => string[];
  parseDateInput: (raw: string) => Date | null;
  backdateHours: string;
  backdateMinutes: string;
  backdateSeconds: string;
  buildMethodCallEntry: (
    method: string,
    params?: Array<{ label: string; value: unknown }>,
  ) => { method: string; parameters: Array<{ label: string; value: unknown }> };
  formatOutputDisplayValue: (value: unknown) => string;
};

export function useSponsorCoinLabMethods({
  mode,
  methodPanelMode,
  selectedReadMethod,
  readAddressA,
  readAddressB,
  selectedWriteMethod,
  selectedWriteSenderAddress,
  writeAddressA,
  writeAddressB,
  writeAmountRaw,
  activeReadLabels,
  activeWriteLabels,
  selectedSpCoinReadMethod,
  setSelectedSpCoinReadMethod,
  selectedSpCoinWriteMethod,
  setSelectedSpCoinWriteMethod,
  spReadParams,
  spWriteParams,
  spCoinReadMethodDefs,
  spCoinWriteMethodDefs,
  activeSpCoinReadDef,
  activeSpCoinWriteDef,
  selectedHardhatAddress,
  effectiveConnectedAddress,
  useLocalSpCoinAccessPackage,
  appendLog,
  appendWriteTrace,
  setStatus,
  setFormattedOutputDisplay,
  setTreeOutputDisplay,
  setOutputPanelMode,
  showValidationPopup,
  requireContractAddress,
  ensureReadRunner,
  executeWriteConnected,
  normalizeAddressValue,
  parseListParam,
  parseDateInput,
  backdateHours,
  backdateMinutes,
  backdateSeconds,
  buildMethodCallEntry,
  formatOutputDisplayValue,
}: Params) {
  const [recipientRateKeyOptions, setRecipientRateKeyOptions] = useState<string[]>([]);
  const [agentRateKeyOptions, setAgentRateKeyOptions] = useState<string[]>([]);
  const [recipientRateKeyHelpText, setRecipientRateKeyHelpText] = useState('');
  const [agentRateKeyHelpText, setAgentRateKeyHelpText] = useState('');
  const [treeAccountOptions, setTreeAccountOptions] = useState<string[]>([]);
  const [selectedTreeAccount, setSelectedTreeAccount] = useState('');
  const [treeAccountRefreshToken, setTreeAccountRefreshToken] = useState(0);
  const treeAccountListCacheRef = useRef<string[] | null>(null);
  const treeAccountRecordCacheRef = useRef<Map<string, unknown>>(new Map());

  const erc20WriteMissingEntries = useMemo(() => {
    const missingEntries: Entry[] = [];
    if (mode === 'hardhat' && !String(selectedWriteSenderAddress || '').trim()) {
      missingEntries.push({ id: 'erc20-write-sender', label: 'msg.sender' });
    }
    if (!String(writeAddressA || '').trim()) {
      missingEntries.push({ id: 'erc20-write-address-a', label: activeWriteLabels.addressALabel });
    }
    if (activeWriteLabels.requiresAddressB && !String(writeAddressB || '').trim()) {
      missingEntries.push({ id: 'erc20-write-address-b', label: activeWriteLabels.addressBLabel });
    }
    if (!String(writeAmountRaw || '').trim()) {
      missingEntries.push({ id: 'erc20-write-amount', label: 'Amount' });
    }
    return missingEntries;
  }, [
    activeWriteLabels.addressALabel,
    activeWriteLabels.addressBLabel,
    activeWriteLabels.requiresAddressB,
    mode,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);

  const erc20ReadMissingEntries = useMemo(() => {
    const missingEntries: Entry[] = [];
    if (activeReadLabels.requiresAddressA && !String(readAddressA || '').trim()) {
      missingEntries.push({ id: 'erc20-read-address-a', label: activeReadLabels.addressALabel });
    }
    if (activeReadLabels.requiresAddressB && !String(readAddressB || '').trim()) {
      missingEntries.push({ id: 'erc20-read-address-b', label: activeReadLabels.addressBLabel });
    }
    return missingEntries;
  }, [
    activeReadLabels.addressALabel,
    activeReadLabels.addressBLabel,
    activeReadLabels.requiresAddressA,
    activeReadLabels.requiresAddressB,
    readAddressA,
    readAddressB,
  ]);

  const spCoinReadMissingEntries = useMemo(
    () =>
      activeSpCoinReadDef.params
        .map((param, idx) => ({
          id: `spcoin-read-param-${idx}`,
          label: param.label,
          value: String(spReadParams[idx] || '').trim(),
        }))
        .filter((entry) => !entry.value)
        .map(({ id, label }) => ({ id, label })),
    [activeSpCoinReadDef.params, spReadParams],
  );

  const spCoinWriteMissingEntries = useMemo(() => {
    const missingEntries: Entry[] = [];
    if (mode === 'hardhat' && !String(selectedWriteSenderAddress || '').trim()) {
      missingEntries.push({ id: 'spcoin-write-sender', label: 'msg.sender' });
    }
    activeSpCoinWriteDef.params.forEach((param, idx) => {
      if (param.type === 'date') return;
      if (String(spWriteParams[idx] || '').trim()) return;
      missingEntries.push({ id: `spcoin-write-param-${idx}`, label: param.label });
    });
    return missingEntries;
  }, [activeSpCoinWriteDef.params, mode, selectedWriteSenderAddress, spWriteParams]);

  const canRunErc20WriteMethod = erc20WriteMissingEntries.length === 0;
  const canRunErc20ReadMethod = erc20ReadMissingEntries.length === 0;
  const canRunSpCoinReadMethod = spCoinReadMissingEntries.length === 0;
  const canRunSpCoinWriteMethod = spCoinWriteMissingEntries.length === 0;

  const coerceParamValue = useCallback(
    (raw: string, def: ParamDef) => {
      const value = String(raw || '').trim();
      if (def.type === 'date') {
        if (!value) {
          const now = new Date();
          return String(Math.trunc(now.getTime() / 1000));
        }
        const date = parseDateInput(value);
        if (!date) throw new Error(`${def.label} must be a valid date.`);
        date.setHours(Number(backdateHours || '0'), Number(backdateMinutes || '0'), Number(backdateSeconds || '0'), 0);
        const ms = date.getTime();
        if (!Number.isFinite(ms)) throw new Error(`${def.label} must be a valid date.`);
        return String(Math.trunc(ms / 1000));
      }
      if (!value) throw new Error(`${def.label} is required.`);
      if (def.type === 'bool') {
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new Error(`${def.label} must be true/false or 1/0.`);
      }
      if (def.type === 'address') {
        const normalized = normalizeAddressValue(value);
        if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
          throw new Error(`${def.label} must be a valid address.`);
        }
        return normalized;
      }
      if (def.type === 'address_array' || def.type === 'string_array') return parseListParam(value);
      return value;
    },
    [backdateHours, backdateMinutes, backdateSeconds, normalizeAddressValue, parseDateInput, parseListParam],
  );

  const stringifyResult = useCallback((result: unknown) => {
    if (typeof result === 'string') return result;
    return JSON.stringify(result, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  }, []);
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
    const runner = await ensureReadRunner();
    const access = createSpCoinLibraryAccess(target, runner);
    const list = (await (access.read as any).getAccountList()) as string[];
    treeAccountListCacheRef.current = list;
    syncTreeAccountOptions(list);
    return { list };
  }, [ensureReadRunner, requireContractAddress, syncTreeAccountOptions]);
  const mergeFormattedOutput = useCallback(
    (nextBlock: string, baseOutput?: string) => {
      const current = String(baseOutput || '').trim();
      if (!current || current === '(no output yet)') return nextBlock;
      return `${current}\n\n${nextBlock}`;
    },
    [],
  );
  const formatFormattedPanelPayload = useCallback(
    (payload: unknown) => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return formatOutputDisplayValue(payload);
      }
      const nextPayload = { ...(payload as Record<string, unknown>) };
      return formatOutputDisplayValue(nextPayload);
    },
    [formatOutputDisplayValue],
  );

  const runHeaderRead = useCallback(async () => {
    const call = buildMethodCallEntry('getSerializedSPCoinHeader');
    try {
      setTreeOutputDisplay('(no tree yet)');
      setOutputPanelMode('tree');
      setStatus('Reading SponsorCoin header...');
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      const result = (await (access.contract as any).getSerializedSPCoinHeader()) as string;
      setTreeOutputDisplay(formatOutputDisplayValue({ call, result }));
      appendLog(`spCoinReadMethods/getSerializedSPCoinHeader -> ${result}`);
      setStatus('Header read complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown header read error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`Header read failed: ${message}`);
      appendLog(`Header read failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    ensureReadRunner,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
  ]);

  const runAccountListRead = useCallback(async () => {
    const call = buildMethodCallEntry('getAccountList');
    try {
      setTreeOutputDisplay('(no tree yet)');
      setOutputPanelMode('tree');
      setStatus('Reading account list...');
      const { list } = await loadTreeAccountOptions();
      setTreeOutputDisplay(formatOutputDisplayValue({ call, result: list }));
      appendLog(`spCoinReadMethods/getAccountList -> ${JSON.stringify(list)}`);
      setStatus(`Account read complete (${list.length} account(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown account list read error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`Account list read failed: ${message}`);
      appendLog(`Account list read failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    ensureReadRunner,
    loadTreeAccountOptions,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
  ]);

  const runTreeDump = useCallback(async (accountOverride?: string, options?: { force?: boolean }) => {
    const listCall = buildMethodCallEntry('getAccountList');
    try {
      setTreeOutputDisplay('(no tree yet)');
      setOutputPanelMode('tree');
      setStatus('Building tree dump...');
      const { list } = await loadTreeAccountOptions({ force: options?.force });
      if (list.length === 0) {
        setTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, result: [] }));
        appendLog('Tree dump skipped: no accounts available.');
        setStatus('Tree dump skipped (no accounts).');
        return;
      }
      const requestedAccount = String(accountOverride || '').trim();
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
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(target, runner);
        tree = await (access.read as any).getAccountRecord(activeAccount);
        treeAccountRecordCacheRef.current.set(activeAccount, tree);
      }
      setTreeOutputDisplay(
        formatOutputDisplayValue({
          call: treeCall,
          result: tree,
        }),
      );
      appendLog(`spCoinReadMethods/getAccountRecord(${activeAccount}) -> ${JSON.stringify(tree)}`);
      setStatus('Tree dump complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree dump error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, error: message }));
      setStatus(`Tree dump failed: ${message}`);
      appendLog(`Tree dump failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    ensureReadRunner,
    loadTreeAccountOptions,
    requireContractAddress,
    selectedTreeAccount,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
  ]);
  const runTreeAccountsRead = useCallback(async () => {
    const call = buildMethodCallEntry('getAccountRecords');
    try {
      setTreeOutputDisplay('(no tree yet)');
      setOutputPanelMode('tree');
      setStatus('Reading all tree accounts...');
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      const result = (await (access.read as any).getAccountRecords()) as unknown[];
      setTreeOutputDisplay(formatOutputDisplayValue({ call, result }));
      appendLog(`spCoinReadMethods/getAccountRecords -> ${JSON.stringify(result)}`);
      setStatus(`Tree accounts read complete (${result.length} account record(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree accounts read error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`Tree accounts read failed: ${message}`);
      appendLog(`Tree accounts read failed: ${message}`);
    }
  }, [
    appendLog,
    buildMethodCallEntry,
    ensureReadRunner,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
  ]);

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

  const runSelectedWriteMethod = useCallback(async (options?: { skipValidation?: boolean }) => {
    if (!options?.skipValidation && erc20WriteMissingEntries.length > 0) {
      showValidationPopup(
        erc20WriteMissingEntries.map((entry) => entry.id),
        erc20WriteMissingEntries.map((entry) => entry.label),
        undefined,
        {
          confirmLabel: 'Run Anyway',
          onConfirm: () => runSelectedWriteMethod({ skipValidation: true }),
        },
      );
      return;
    }

    const call = buildMethodCallEntry(selectedWriteMethod, [
      ...(mode === 'hardhat' || effectiveConnectedAddress
        ? [{ label: 'msg.sender', value: selectedHardhatAddress || effectiveConnectedAddress }]
        : []),
      { label: activeWriteLabels.addressALabel, value: writeAddressA },
      ...(activeWriteLabels.requiresAddressB ? [{ label: activeWriteLabels.addressBLabel, value: writeAddressB }] : []),
      { label: 'Amount', value: writeAmountRaw },
    ]);

    try {
      setFormattedOutputDisplay('(no output yet)');
      const result = await runErc20WriteMethod({
        selectedWriteMethod,
        activeWriteLabels,
        writeAddressA,
        writeAddressB,
        writeAmountRaw,
        selectedHardhatAddress: mode === 'hardhat' ? selectedHardhatAddress : effectiveConnectedAddress,
        executeWriteConnected,
        appendLog,
        setStatus,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown write method error.';
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, error: message }));
      setStatus(`${activeWriteLabels.title} failed: ${message}`);
      appendLog(`${activeWriteLabels.title} failed: ${message}`);
    }
  }, [
    activeWriteLabels,
    appendLog,
    buildMethodCallEntry,
    effectiveConnectedAddress,
    erc20WriteMissingEntries,
    executeWriteConnected,
    formatFormattedPanelPayload,
    mode,
    selectedHardhatAddress,
    selectedWriteMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);

  const runSelectedReadMethod = useCallback(async (options?: { skipValidation?: boolean }) => {
    if (!options?.skipValidation && erc20ReadMissingEntries.length > 0) {
      showValidationPopup(
        erc20ReadMissingEntries.map((entry) => entry.id),
        erc20ReadMissingEntries.map((entry) => entry.label),
        undefined,
        {
          confirmLabel: 'Run Anyway',
          onConfirm: () => runSelectedReadMethod({ skipValidation: true }),
        },
      );
      return;
    }

    const call = buildMethodCallEntry(selectedReadMethod, [
      ...(activeReadLabels.requiresAddressA ? [{ label: activeReadLabels.addressALabel, value: readAddressA }] : []),
      ...(activeReadLabels.requiresAddressB ? [{ label: activeReadLabels.addressBLabel, value: readAddressB }] : []),
    ]);

    try {
      setFormattedOutputDisplay('(no output yet)');
      const result = await runErc20ReadMethod({
        selectedReadMethod,
        activeReadLabels,
        readAddressA,
        readAddressB,
        requireContractAddress,
        ensureReadRunner,
        appendLog,
        setStatus,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown read method error.';
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, error: message }));
      setStatus(`${activeReadLabels.title} failed: ${message}`);
      appendLog(`${activeReadLabels.title} failed: ${message}`);
    }
  }, [
    activeReadLabels,
    appendLog,
    buildMethodCallEntry,
    ensureReadRunner,
    erc20ReadMissingEntries,
    formatFormattedPanelPayload,
    readAddressA,
    readAddressB,
    requireContractAddress,
    selectedReadMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
  ]);

  const runSelectedSpCoinReadMethod = useCallback(async (options?: { skipValidation?: boolean }) => {
    if (!options?.skipValidation && spCoinReadMissingEntries.length > 0) {
      showValidationPopup(
        spCoinReadMissingEntries.map((entry) => entry.id),
        spCoinReadMissingEntries.map((entry) => entry.label),
        undefined,
        {
          confirmLabel: 'Run Anyway',
          onConfirm: () => runSelectedSpCoinReadMethod({ skipValidation: true }),
        },
      );
      return;
    }

    const call = buildMethodCallEntry(
      selectedSpCoinReadMethod,
      activeSpCoinReadDef.params.map((param, idx) => ({
        label: param.label,
        value: spReadParams[idx] || '',
      })),
    );

    try {
      setFormattedOutputDisplay('(no output yet)');
      const result = await runSpCoinReadMethod({
        selectedMethod: selectedSpCoinReadMethod,
        spReadParams,
        coerceParamValue,
        stringifyResult,
        requireContractAddress,
        ensureReadRunner,
        appendLog,
        setStatus,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SpCoin read error.';
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, error: message }));
      setStatus(`${activeSpCoinReadDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinReadDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinReadDef,
    appendLog,
    buildMethodCallEntry,
    coerceParamValue,
    ensureReadRunner,
    formatFormattedPanelPayload,
    requireContractAddress,
    selectedSpCoinReadMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    spCoinReadMissingEntries,
    spReadParams,
    stringifyResult,
  ]);

  const runSelectedSpCoinWriteMethod = useCallback(async (options?: { skipValidation?: boolean }) => {
    if (!options?.skipValidation && spCoinWriteMissingEntries.length > 0) {
      showValidationPopup(
        spCoinWriteMissingEntries.map((entry) => entry.id),
        spCoinWriteMissingEntries.map((entry) => entry.label),
        undefined,
        {
          confirmLabel: 'Run Anyway',
          onConfirm: () => runSelectedSpCoinWriteMethod({ skipValidation: true }),
        },
      );
      return;
    }

    const call = buildMethodCallEntry(selectedSpCoinWriteMethod, [
      ...(mode === 'hardhat' || effectiveConnectedAddress
        ? [{ label: 'msg.sender', value: selectedHardhatAddress || effectiveConnectedAddress }]
        : []),
      ...activeSpCoinWriteDef.params.map((param, idx) => ({
        label: param.label,
        value: spWriteParams[idx] || '',
      })),
    ]);

    try {
      setFormattedOutputDisplay('(no output yet)');
      appendWriteTrace(
        `runSelectedSpCoinWriteMethod start; mode=${mode}; source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}; method=${selectedSpCoinWriteMethod}`,
      );
      const result = await runSpCoinWriteMethod({
        selectedMethod: selectedSpCoinWriteMethod,
        spWriteParams,
        coerceParamValue,
        executeWriteConnected,
        selectedHardhatAddress: mode === 'hardhat' ? selectedHardhatAddress : effectiveConnectedAddress,
        appendLog,
        appendWriteTrace,
        spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        setStatus,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SpCoin write error.';
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, error: message }));
      setStatus(`${activeSpCoinWriteDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinWriteDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinWriteDef,
    appendLog,
    appendWriteTrace,
    buildMethodCallEntry,
    coerceParamValue,
    effectiveConnectedAddress,
    executeWriteConnected,
    formatFormattedPanelPayload,
    mode,
    selectedHardhatAddress,
    selectedSpCoinWriteMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    spCoinWriteMissingEntries,
    spWriteParams,
    useLocalSpCoinAccessPackage,
  ]);
  const runScriptStep = useCallback(
    async (step: LabScriptStep, options?: { formattedOutputBase?: string }): Promise<ScriptRunResult> => {
      const formattedOutputBase = options?.formattedOutputBase;
      const paramEntries = Array.isArray(step.params) ? step.params : [];
      const findParamValue = (label: string) =>
        String(paramEntries.find((entry) => String(entry?.key || '') === label)?.value || '').trim();
      const stepSender = String(step['msg.sender'] || '').trim();

      const commitResult = (payload: unknown, success: boolean) => {
        const nextFormattedOutput = mergeFormattedOutput(formatFormattedPanelPayload(payload), formattedOutputBase);
        setFormattedOutputDisplay(nextFormattedOutput);
        return {
          success,
          formattedOutput: nextFormattedOutput,
        };
      };

      try {
        if (step.panel === 'ecr20_read') {
          const selectedMethod = step.method as Erc20ReadMethod;
          const labels = getErc20ReadLabels(selectedMethod);
          const readAddressA = labels.requiresAddressA ? findParamValue(labels.addressALabel) : '';
          const readAddressB = labels.requiresAddressB ? findParamValue(labels.addressBLabel) : '';
          const call = buildMethodCallEntry(selectedMethod, [
            ...(labels.requiresAddressA ? [{ label: labels.addressALabel, value: readAddressA }] : []),
            ...(labels.requiresAddressB ? [{ label: labels.addressBLabel, value: readAddressB }] : []),
          ]);
          const result = await runErc20ReadMethod({
            selectedReadMethod: selectedMethod,
            activeReadLabels: labels,
            readAddressA,
            readAddressB,
            requireContractAddress,
            ensureReadRunner,
            appendLog,
            setStatus,
          });
          return commitResult({ call, result }, true);
        }

        if (step.panel === 'erc20_write') {
          const selectedMethod = step.method as Erc20WriteMethod;
          const labels = getErc20WriteLabels(selectedMethod);
          const writeAddressA = findParamValue(labels.addressALabel);
          const writeAddressB = labels.requiresAddressB ? findParamValue(labels.addressBLabel) : '';
          const writeAmountRaw = findParamValue('Amount');
          const stepSigner =
            stepSender || (mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress);
          const call = buildMethodCallEntry(selectedMethod, [
            ...(mode === 'hardhat' || stepSigner ? [{ label: 'msg.sender', value: stepSigner }] : []),
            { label: labels.addressALabel, value: writeAddressA },
            ...(labels.requiresAddressB ? [{ label: labels.addressBLabel, value: writeAddressB }] : []),
            { label: 'Amount', value: writeAmountRaw },
          ]);
          const result = await runErc20WriteMethod({
            selectedWriteMethod: selectedMethod,
            activeWriteLabels: labels,
            writeAddressA,
            writeAddressB,
            writeAmountRaw,
            selectedHardhatAddress: stepSigner,
            executeWriteConnected,
            appendLog,
            setStatus,
          });
          return commitResult({ call, result }, true);
        }

        if (step.panel === 'spcoin_rread') {
          const selectedMethod = step.method as SpCoinReadMethod;
          const def = spCoinReadMethodDefs[selectedMethod];
          const localParams = def.params.map((param) => findParamValue(param.label));
          const call = buildMethodCallEntry(
            selectedMethod,
            def.params.map((param, idx) => ({
              label: param.label,
              value: localParams[idx] || '',
            })),
          );
          const result = await runSpCoinReadMethod({
            selectedMethod,
            spReadParams: localParams,
            coerceParamValue,
            stringifyResult,
            requireContractAddress,
            ensureReadRunner,
            appendLog,
            setStatus,
          });
          return commitResult({ call, result }, true);
        }

        const selectedMethod = step.method as SpCoinWriteMethod;
        const def = spCoinWriteMethodDefs[selectedMethod];
        const localParams = def.params.map((param) => findParamValue(param.label));
        const stepSigner =
          stepSender || (mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress);
        const call = buildMethodCallEntry(selectedMethod, [
          ...(mode === 'hardhat' || stepSigner ? [{ label: 'msg.sender', value: stepSigner }] : []),
          ...def.params.map((param, idx) => ({
            label: param.label,
            value: localParams[idx] || '',
          })),
        ]);
        appendWriteTrace(
          `runScriptStep start; mode=${mode}; source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}; method=${selectedMethod}`,
        );
        const result = await runSpCoinWriteMethod({
          selectedMethod,
          spWriteParams: localParams,
          coerceParamValue,
          executeWriteConnected,
          selectedHardhatAddress: stepSigner,
          appendLog,
          appendWriteTrace,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          setStatus,
        });
        return commitResult({ call, result }, true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Unknown ${step.panel === 'erc20_write' || step.panel === 'spcoin_write' ? 'write' : 'read'} method error.`;
        const call = buildMethodCallEntry(
          step.method,
          [
            ...(stepSender ? [{ label: 'msg.sender', value: stepSender }] : []),
            ...paramEntries.map((entry) => ({ label: entry.key, value: entry.value })),
          ],
        );
        appendLog(`${step.name || step.method} failed: ${message}`);
        setStatus(`${step.name || step.method} failed: ${message}`);
        return commitResult({ call, error: message }, false);
      }
    },
    [
      appendLog,
      appendWriteTrace,
      buildMethodCallEntry,
      coerceParamValue,
      effectiveConnectedAddress,
      ensureReadRunner,
      executeWriteConnected,
      formatFormattedPanelPayload,
      mergeFormattedOutput,
      mode,
      requireContractAddress,
      selectedHardhatAddress,
      setFormattedOutputDisplay,
      setOutputPanelMode,
      setStatus,
      spCoinReadMethodDefs,
      spCoinWriteMethodDefs,
      stringifyResult,
      useLocalSpCoinAccessPackage,
    ],
  );

  useEffect(() => {
    if (spCoinReadMethodDefs[selectedSpCoinReadMethod].executable === false) {
      const next = Object.keys(spCoinReadMethodDefs).find((key) => spCoinReadMethodDefs[key as SpCoinReadMethod].executable !== false);
      if (next) {
        setSelectedSpCoinReadMethod(next as SpCoinReadMethod);
      }
    }
  }, [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod, spCoinReadMethodDefs]);

  useEffect(() => {
    if (spCoinWriteMethodDefs[selectedSpCoinWriteMethod].executable === false) {
      const next = Object.keys(spCoinWriteMethodDefs).find((key) => spCoinWriteMethodDefs[key as SpCoinWriteMethod].executable !== false);
      if (next) {
        setSelectedSpCoinWriteMethod(next as SpCoinWriteMethod);
      }
    }
  }, [selectedSpCoinWriteMethod, setSelectedSpCoinWriteMethod, spCoinWriteMethodDefs]);

  useEffect(() => {
    let cancelled = false;

    const loadRateKeyOptions = async () => {
      if (methodPanelMode !== 'spcoin_write') {
        if (!cancelled) {
          setRecipientRateKeyOptions([]);
          setAgentRateKeyOptions([]);
          setRecipientRateKeyHelpText('');
          setAgentRateKeyHelpText('');
        }
        return;
      }

      const findValue = (labels: string[]) => {
        const idx = activeSpCoinWriteDef.params.findIndex((param) => labels.includes(param.label));
        return idx >= 0 ? String(spWriteParams[idx] || '').trim() : '';
      };
      const hasRecipientRateField = activeSpCoinWriteDef.params.some((param) =>
        ['Recipient Rate Key', 'Recipient Rate'].includes(param.label),
      );
      const hasAgentRateField = activeSpCoinWriteDef.params.some((param) =>
        ['Agent Rate Key', 'Agent Rate'].includes(param.label),
      );
      const sponsorKey =
        findValue(['Sponsor Key', 'Sponsor Account']) || String(selectedWriteSenderAddress || '').trim();
      const recipientKey = findValue(['Recipient Key', 'Recipient Account']);
      const recipientRateKey = findValue(['Recipient Rate Key', 'Recipient Rate']);
      const agentKey = findValue(['Agent Key', 'Agent Account']);
      const isAddress = (value: string) => /^0[xX][0-9a-fA-F]{40}$/.test(value);

      if (!hasRecipientRateField || !isAddress(sponsorKey) || !isAddress(recipientKey)) {
        if (!cancelled) {
          setRecipientRateKeyOptions([]);
          setRecipientRateKeyHelpText(
            hasRecipientRateField
              ? 'Select msg.sender/Sponsor and Recipient first to load Recipient Rate Keys.'
              : '',
          );
        }
      } else {
        try {
          const target = requireContractAddress();
          const runner = await ensureReadRunner();
          const access = createSpCoinLibraryAccess(target, runner);
          const rates = (await (access.contract as any).getRecipientRateList(sponsorKey, recipientKey)) as Array<string | bigint>;
          if (!cancelled) {
            setRecipientRateKeyOptions(rates.map((value) => String(value)));
            setRecipientRateKeyHelpText(
              rates.length > 0
                ? 'Select a Recipient Rate Key from the contract list.'
                : 'No Recipient Rate Keys found for this sponsor/recipient pair.',
            );
          }
        } catch {
          if (!cancelled) {
            setRecipientRateKeyOptions([]);
            setRecipientRateKeyHelpText('Unable to load Recipient Rate Keys from the active contract.');
          }
        }
      }

      if (!hasAgentRateField || !isAddress(sponsorKey) || !isAddress(recipientKey) || !recipientRateKey || !isAddress(agentKey)) {
        if (!cancelled) {
          setAgentRateKeyOptions([]);
          setAgentRateKeyHelpText(
            hasAgentRateField
              ? 'Select Sponsor, Recipient, Recipient Rate, and Agent first to load Agent Rate Keys.'
              : '',
          );
        }
        return;
      }

      try {
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(target, runner);
        const rates = (await (access.contract as any).getAgentRateList(
          sponsorKey,
          recipientKey,
          recipientRateKey,
          agentKey,
        )) as Array<string | bigint>;
        if (!cancelled) {
          setAgentRateKeyOptions(rates.map((value) => String(value)));
          setAgentRateKeyHelpText(
            rates.length > 0
              ? 'Select an Agent Rate Key from the contract list.'
              : 'No Agent Rate Keys found for this sponsor/recipient/agent combination.',
          );
        }
      } catch {
        if (!cancelled) {
          setAgentRateKeyOptions([]);
          setAgentRateKeyHelpText('Unable to load Agent Rate Keys from the active contract.');
        }
      }
    };

    void loadRateKeyOptions();
    return () => {
      cancelled = true;
    };
  }, [
    activeSpCoinWriteDef.params,
    ensureReadRunner,
    methodPanelMode,
    requireContractAddress,
    selectedWriteSenderAddress,
    spWriteParams,
  ]);

  return {
    activeWriteLabels,
    activeReadLabels,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    activeSpCoinReadDef,
    activeSpCoinWriteDef,
    erc20WriteMissingEntries,
    erc20ReadMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    canRunErc20WriteMethod,
    canRunErc20ReadMethod,
    canRunSpCoinReadMethod,
    canRunSpCoinWriteMethod,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    treeAccountOptions,
    selectedTreeAccount,
    setSelectedTreeAccount,
    treeAccountRefreshToken,
    requestRefreshSelectedTreeAccount,
    runHeaderRead,
    runAccountListRead,
    runTreeAccountsRead,
    runTreeDump,
    runSelectedWriteMethod,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod,
    runScriptStep,
  };
}
