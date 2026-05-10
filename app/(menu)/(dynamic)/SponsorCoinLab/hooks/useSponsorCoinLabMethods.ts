import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { MethodDef, ParamDef } from '../jsonMethods/shared/types';
import type { Erc20ReadMethod } from '../jsonMethods/erc20/read';
import type { Erc20WriteMethod } from '../jsonMethods/erc20/write';
import type { SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { normalizeSpCoinWriteMethod, type SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import type { SerializationTestMethod } from '../jsonMethods/serializationTests';
import type { ConnectionMode, MethodPanelMode } from '../scriptBuilder/types';
import {
  getErrorDebugTrace,
  getExecutionMetaFromError,
  isAbortError,
  parseComparableUint,
} from './methodExecutionHelpers';
import { useSponsorCoinLabMethodExecution, type MethodExecutionDescriptor } from './useSponsorCoinLabMethodExecution';
import { useSponsorCoinLabRateKeyOptions } from './useSponsorCoinLabRateKeyOptions';
import { useSponsorCoinLabScriptRunner } from './useSponsorCoinLabScriptRunner';
import { useSponsorCoinLabTreeMethods } from './useSponsorCoinLabTreeMethods';
import type { AccessMethodCaller } from './useAccessMethodCaller';
import { normalizeExecutionPayload } from './executionPayload';
import { isAmountParam, normalizeAmountForMethod, type AmountUnit } from '../utils/amountUnits';

interface Entry { id: string; label: string }
interface MethodExecutionOptions {
  executionLabel?: string;
  executionSignal?: AbortSignal;
  skipValidation?: boolean;
}

type MethodDefMap = Record<string, MethodDef>;

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

interface Params {
  activeContractAddress: string;
  rpcUrl?: string;
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
  writeAmountUnit: AmountUnit;
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
  selectedSerializationTestMethod: SerializationTestMethod;
  setSelectedSerializationTestMethod: (value: SerializationTestMethod) => void;
  spReadParams: string[];
  spWriteParams: string[];
  spWriteAmountUnits: Record<number, AmountUnit>;
  setSpWriteParams: Dispatch<SetStateAction<string[]>>;
  serializationTestParams: string[];
  spCoinReadMethodDefs: MethodDefMap;
  spCoinWriteMethodDefs: MethodDefMap;
  serializationTestMethodDefs: MethodDefMap;
  activeSpCoinReadDef: MethodDef;
  activeSpCoinWriteDef: MethodDef;
  activeSerializationTestDef: MethodDef;
  hardhatAccounts: { address: string; privateKey?: string }[];
  selectedHardhatAddress?: string;
  effectiveConnectedAddress: string;
  ownerAddress?: string;
  useLocalSpCoinAccessPackage: boolean;
  useReadCache: boolean;
  appendLog: (line: string) => void;
  appendWriteTrace: (line: string) => void;
  resetWriteTrace: () => void;
  getRecentWriteTrace: () => string[];
  traceEnabled: boolean;
  setStatus: (value: string) => void;
  formattedOutputDisplay: string;
  setFormattedOutputDisplay: (value: string) => void;
  setTreeOutputDisplay: (value: string) => void;
  setOutputPanelMode: (value: 'execution' | 'formatted' | 'tree' | 'raw_status' | 'debug') => void;
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
    params?: { label: string; value: unknown }[],
  ) => { method: string; parameters: { label: string; value: unknown }[] };
  formatOutputDisplayValue: (value: unknown) => string;
  recipientRateRange?: [number, number];
  agentRateRange?: [number, number];
  callAccessMethod?: AccessMethodCaller;
  readCacheNamespace?: string;
  activeTokenDecimals: number;
}

export function useSponsorCoinLabMethods({
  activeContractAddress,
  rpcUrl,
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
  writeAmountUnit,
  activeReadLabels,
  activeWriteLabels,
  selectedSpCoinReadMethod,
  setSelectedSpCoinReadMethod,
  selectedSpCoinWriteMethod,
  setSelectedSpCoinWriteMethod,
  selectedSerializationTestMethod,
  setSelectedSerializationTestMethod,
  spReadParams,
  spWriteParams,
  spWriteAmountUnits,
  setSpWriteParams,
  serializationTestParams,
  spCoinReadMethodDefs,
  spCoinWriteMethodDefs,
  serializationTestMethodDefs,
  activeSpCoinReadDef,
  activeSpCoinWriteDef,
  activeSerializationTestDef,
  hardhatAccounts,
  selectedHardhatAddress,
  effectiveConnectedAddress,
  ownerAddress,
  useLocalSpCoinAccessPackage,
  useReadCache,
  appendLog,
  appendWriteTrace,
  resetWriteTrace,
  getRecentWriteTrace,
  traceEnabled,
  setStatus,
  formattedOutputDisplay,
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
  recipientRateRange,
  agentRateRange,
  callAccessMethod,
  readCacheNamespace,
  activeTokenDecimals,
}: Params) {
  const startRunTrace = useCallback(
    (descriptor: MethodExecutionDescriptor) => {
      resetWriteTrace();
      appendWriteTrace(
        `run start; panel=${descriptor.panel}; mode=${descriptor.mode ?? mode}; source=${
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules'
        }; method=${descriptor.method}`,
      );
      if (descriptor.sender) {
        appendWriteTrace(`sender=${descriptor.sender}`);
      }
      appendWriteTrace(`params=${JSON.stringify(descriptor.params)}`);
    },
    [appendWriteTrace, mode, resetWriteTrace, useLocalSpCoinAccessPackage],
  );

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
    writeAmountUnit,
    activeTokenDecimals,
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
      const fieldId = `spcoin-write-param-${idx}`;
      const rawValue = String(spWriteParams[idx] || '').trim();
      if (param.type !== 'date' && !rawValue) {
        missingEntries.push({ id: fieldId, label: param.label });
        return;
      }

      const normalizedLabel = String(param.label || '').trim().toLowerCase();
      const parsedValue = parseComparableUint(rawValue);
      if (normalizedLabel === 'recipient rate key' || normalizedLabel === 'recipient rate') {
        if (rawValue && parsedValue === null) {
          missingEntries.push({ id: fieldId, label: `${param.label} must be an integer.` });
          return;
        }
        if (
          parsedValue !== null &&
          Array.isArray(recipientRateRange) &&
          Number.isFinite(recipientRateRange[0]) &&
          Number.isFinite(recipientRateRange[1])
        ) {
          const lower = BigInt(recipientRateRange[0]);
          const upper = BigInt(recipientRateRange[1]);
          if (parsedValue < lower || parsedValue > upper) {
            missingEntries.push({
              id: fieldId,
              label: `${param.label} must be between ${recipientRateRange[0]} and ${recipientRateRange[1]}.`,
            });
          }
        }
        return;
      }

      if (normalizedLabel === 'agent rate key' || normalizedLabel === 'agent rate') {
        if (rawValue && parsedValue === null) {
          missingEntries.push({ id: fieldId, label: `${param.label} must be an integer.` });
          return;
        }
        if (
          parsedValue !== null &&
          Array.isArray(agentRateRange) &&
          Number.isFinite(agentRateRange[0]) &&
          Number.isFinite(agentRateRange[1])
        ) {
          const lower = BigInt(agentRateRange[0]);
          const upper = BigInt(agentRateRange[1]);
          if (parsedValue < lower || parsedValue > upper) {
            missingEntries.push({
              id: fieldId,
              label: `${param.label} must be between ${agentRateRange[0]} and ${agentRateRange[1]}.`,
            });
          }
        }
      }
    });
    return missingEntries;
  }, [
    activeSpCoinWriteDef.params,
    agentRateRange,
    mode,
    recipientRateRange,
    selectedWriteSenderAddress,
    spWriteParams,
  ]);

  const serializationTestMissingEntries = useMemo(
    () => {
      const fundAllHardhatAccounts =
        String(selectedSerializationTestMethod || '') === 'hhFundAccounts' &&
        ['true', '1'].includes(String(serializationTestParams[1] || '').trim().toLowerCase());
      return activeSerializationTestDef.params
        .map((param, idx) => ({
          id: `serialization-test-param-${idx}`,
          label: param.label,
          value: String(serializationTestParams[idx] || '').trim(),
        }))
        .filter((entry) => {
          if (String(selectedSerializationTestMethod || '') === 'hhFundAccounts' && entry.label === 'HH Funding Account') return false;
          if (fundAllHardhatAccounts && entry.label === 'Fund HH Account') return false;
          return !entry.value;
        })
        .map(({ id, label }) => ({ id, label }));
    },
    [activeSerializationTestDef.params, selectedSerializationTestMethod, serializationTestParams],
  );

  const canRunErc20WriteMethod = erc20WriteMissingEntries.length === 0;
  const canRunErc20ReadMethod = erc20ReadMissingEntries.length === 0;
  const canRunSpCoinReadMethod = spCoinReadMissingEntries.length === 0;
  const canRunSpCoinWriteMethod = spCoinWriteMissingEntries.length === 0;
  const canRunSerializationTestMethod = serializationTestMissingEntries.length === 0;

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
      if (def.type === 'address' || def.type === 'contract_address') {
        if (value === '*') return '*';
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
    return JSON.stringify(result, (_key: string, value: unknown) =>
      (typeof value === 'bigint' ? value.toString() : value)) ?? '';
  }, []);
  const formatFormattedPanelPayload = useCallback(
    (payload: unknown) => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return formatOutputDisplayValue(payload);
      }
      let nextPayload = { ...(payload as Record<string, unknown>) };
      const normalizeInflationRateDisplay = (value: unknown) => {
        const trimmed = toDisplayString(value).trim();
        if (!trimmed) return '';
        return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
      };
      const stripAnnualInflationRateFromTree = (value: unknown): unknown => {
        if (!value || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map((entry) => stripAnnualInflationRateFromTree(entry));

        const record = value as Record<string, unknown>;
        const nextRecord: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(record)) {
          if (key === 'totalSpCoins' && nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
            const totalSpCoinsRecord = { ...(nestedValue as Record<string, unknown>) };
            delete totalSpCoinsRecord.annualInflationRate;
            nextRecord[key] = Object.fromEntries(
              Object.entries(totalSpCoinsRecord).map(([nestedKey, nestedEntry]) => [nestedKey, stripAnnualInflationRateFromTree(nestedEntry)]),
            );
            continue;
          }
          nextRecord[key] = stripAnnualInflationRateFromTree(nestedValue);
        }
        return nextRecord;
      };
      const normalizeMasterSponsorEntry = (entry: unknown, preserveAddressStrings = false) => {
        if (typeof entry === 'string') {
          return preserveAddressStrings ? entry : { address: entry };
        }
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          return entry;
        }
        const record = entry as Record<string, unknown>;
        let normalizedEntry: Record<string, unknown>;
        if (
          typeof record.address === 'string' &&
          record.accountRecord &&
          typeof record.accountRecord === 'object' &&
          !Array.isArray(record.accountRecord)
        ) {
          normalizedEntry = {
            address: record.address,
            ...(record.accountRecord as Record<string, unknown>),
          };
        } else if (typeof record.address === 'string') {
          normalizedEntry = { ...record };
        } else {
          const keys = Object.keys(record);
          if (keys.length === 1 && /^0x[0-9a-f]{40}$/i.test(keys[0] || '')) {
            const nestedRecord = record[keys[0]];
            if (nestedRecord && typeof nestedRecord === 'object' && !Array.isArray(nestedRecord)) {
              normalizedEntry = {
                address: keys[0],
                ...(nestedRecord as Record<string, unknown>),
              };
            } else {
              normalizedEntry = {
                address: keys[0],
                value: nestedRecord,
              };
            }
          } else {
            normalizedEntry = { ...record };
          }
        }

        return stripAnnualInflationRateFromTree(normalizedEntry) as Record<string, unknown>;
      };
      const normalizedPayloadMethod =
        nextPayload.call &&
        typeof nextPayload.call === 'object' &&
        !Array.isArray(nextPayload.call)
          ? toDisplayString((nextPayload.call as Record<string, unknown>).method).trim()
          : '';
      if (
        normalizedPayloadMethod === 'getMasterSponsorList' ||
        normalizedPayloadMethod === 'getMasterAccountKeys' ||
        normalizedPayloadMethod === 'getAccountKeys'
      ) {
        const rawResult = nextPayload.result;
        const entryListKey =
          normalizedPayloadMethod === 'getMasterAccountKeys' || normalizedPayloadMethod === 'getAccountKeys'
            ? 'accounts'
            : 'sponsors';
        const normalizedEntries = Array.isArray(rawResult)
          ? rawResult
          : rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult)
            ? Array.isArray((rawResult as Record<string, unknown>)[entryListKey])
              ? (((rawResult as Record<string, unknown>)[entryListKey] as unknown[]) ?? [])
              : []
            : [];
        const rawMetadata =
          nextPayload.spCoinMetaData && typeof nextPayload.spCoinMetaData === 'object' && !Array.isArray(nextPayload.spCoinMetaData)
            ? (nextPayload.spCoinMetaData as Record<string, unknown>)
            : rawResult && typeof rawResult === 'object' && !Array.isArray(rawResult) &&
                (rawResult as Record<string, unknown>).spCoinMetaData &&
                typeof (rawResult as Record<string, unknown>).spCoinMetaData === 'object' &&
                !Array.isArray((rawResult as Record<string, unknown>).spCoinMetaData)
              ? ((rawResult as Record<string, unknown>).spCoinMetaData as Record<string, unknown>)
              : null;
        const isLazyMetadata = rawMetadata?.__lazySpCoinMetaData === true;
        const normalizedMetadata = rawMetadata && !isLazyMetadata
          ? {
              ...rawMetadata,
              inflationRate: normalizeInflationRateDisplay(rawMetadata.inflationRate),
            }
          : null;
        const isAccountListPayload = normalizedPayloadMethod === 'getMasterAccountKeys' || normalizedPayloadMethod === 'getAccountKeys';
        // Preserve already-expanded account entries (objects with accountKey/TYPE/totalSpCoins)
        const isExpandedEntry = (entry: unknown) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
          const record = entry as Record<string, unknown>;
          return Boolean(record.__forceExpanded || record.result !== undefined || record.TYPE || record.totalSpCoins || record.accountKey || record.call);
        };
        nextPayload.result = {
          spCoinMetaData: normalizedMetadata ?? { __lazySpCoinMetaData: true },
          [entryListKey]: normalizedEntries.map((entry) => {
            if (isExpandedEntry(entry)) return entry;
            return normalizeMasterSponsorEntry(entry, isAccountListPayload);
          }),
        };
        delete nextPayload.spCoinMetaData;
      }
      if (
        nextPayload.call &&
        typeof nextPayload.call === 'object' &&
        !Array.isArray(nextPayload.call) &&
        toDisplayString((nextPayload.call as Record<string, unknown>).method).trim() === 'getSpCoinMetaData'
      ) {
        if (!nextPayload.result || typeof nextPayload.result !== 'object' || Array.isArray(nextPayload.result)) {
          nextPayload.result = {};
        }
        const resultRecord = nextPayload.result as Record<string, unknown>;
        if (resultRecord.inflationRate !== undefined) {
          nextPayload.result = {
            ...resultRecord,
            inflationRate: normalizeInflationRateDisplay(resultRecord.inflationRate),
          };
        }
        if (recipientRateRange) {
          (nextPayload.result as Record<string, unknown>).recipientRateRange = recipientRateRange;
        }
        if (agentRateRange) {
          (nextPayload.result as Record<string, unknown>).agentRateRange = agentRateRange;
        }
      }
      return formatOutputDisplayValue(normalizeExecutionPayload(nextPayload));
    },
    [formatOutputDisplayValue, recipientRateRange, agentRateRange],
  );
  useEffect(() => {
    const trimmed = String(formattedOutputDisplay || '').trim();
    if (!trimmed || trimmed === '(no output yet)' || trimmed === '(no script yet)') return;
    const blocks = trimmed.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    try {
      const parsed = blocks.map((b) => JSON.parse(b) as Record<string, unknown>);
      const rewritten = parsed.map((block) => normalizeExecutionPayload(block));
      if (rewritten.every((b, i) => b === parsed[i])) return;
      const next = rewritten.map((b) => JSON.stringify(b, null, 2)).join('\n\n');
      if (next !== trimmed) setFormattedOutputDisplay(next);
    } catch {
      // malformed JSON — leave as-is
    }
  }, [formattedOutputDisplay, setFormattedOutputDisplay]);

  const { executeMethodDescriptor } = useSponsorCoinLabMethodExecution({
    rpcUrl,
    mode,
    selectedHardhatAddress,
    effectiveConnectedAddress,
    ownerAddress,
    hardhatAccounts,
    useLocalSpCoinAccessPackage,
    useReadCache,
    traceEnabled,
    readCacheNamespace,
    appendLog,
    appendWriteTrace,
    setStatus,
    requireContractAddress,
    ensureReadRunner,
    executeWriteConnected,
    coerceParamValue,
    stringifyResult,
    parseListParam,
    buildMethodCallEntry,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    serializationTestMethodDefs,
  });

  const {
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
  } = useSponsorCoinLabTreeMethods({
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
    readCacheNamespace,
  });
  const runSelectedWriteMethod = useCallback(async (options?: MethodExecutionOptions) => {
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

    const rawAmount = normalizeAmountForMethod(writeAmountRaw, writeAmountUnit, activeTokenDecimals);
    const descriptor: MethodExecutionDescriptor = {
      panel: 'erc20_write',
      method: selectedWriteMethod,
      sender: mode === 'hardhat' ? (selectedHardhatAddress ?? effectiveConnectedAddress) : effectiveConnectedAddress,
      params: [
        { key: activeWriteLabels.addressALabel, value: writeAddressA },
        ...(activeWriteLabels.requiresAddressB ? [{ key: activeWriteLabels.addressBLabel, value: writeAddressB }] : []),
        { key: 'Amount', value: rawAmount },
      ],
    };

    try {
      startRunTrace(descriptor);
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, warning, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, ...(warning ? { warning } : {}), meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel ?? activeWriteLabels.title} cancelled.`;
        setStatus(message);
        appendLog(message);
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown write method error.';
      const call = buildMethodCallEntry(descriptor.method, [
        ...(descriptor.sender ? [{ label: 'msg.sender', value: descriptor.sender }] : []),
        ...descriptor.params.map((entry) => ({ label: entry.key, value: entry.value })),
      ]);
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, error: message, meta: getExecutionMetaFromError(error) }));
      setStatus(`${activeWriteLabels.title} failed: ${message}`);
      appendLog(`${activeWriteLabels.title} failed: ${message}`);
    }
  }, [
    activeWriteLabels,
    appendLog,
    erc20WriteMissingEntries,
    executeMethodDescriptor,
    formatFormattedPanelPayload,
    buildMethodCallEntry,
    effectiveConnectedAddress,
    mode,
    selectedHardhatAddress,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    selectedWriteMethod,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    writeAmountUnit,
    activeTokenDecimals,
    startRunTrace,
  ]);

  const runSelectedReadMethod = useCallback(async (options?: MethodExecutionOptions) => {
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

    const descriptor: MethodExecutionDescriptor = {
      panel: 'ecr20_read',
      method: selectedReadMethod,
      params: [
        ...(activeReadLabels.requiresAddressA ? [{ key: activeReadLabels.addressALabel, value: readAddressA }] : []),
        ...(activeReadLabels.requiresAddressB ? [{ key: activeReadLabels.addressBLabel, value: readAddressB }] : []),
      ],
    };

    try {
      startRunTrace(descriptor);
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, warning, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, ...(warning ? { warning } : {}), meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel ?? activeReadLabels.title} cancelled.`;
        setStatus(message);
        appendLog(message);
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown read method error.';
      const call = buildMethodCallEntry(descriptor.method, descriptor.params.map((entry) => ({ label: entry.key, value: entry.value })));
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, error: message, meta: getExecutionMetaFromError(error) }));
      setStatus(`${activeReadLabels.title} failed: ${message}`);
      appendLog(`${activeReadLabels.title} failed: ${message}`);
    }
  }, [
    activeReadLabels,
    appendLog,
    buildMethodCallEntry,
    erc20ReadMissingEntries,
    executeMethodDescriptor,
    formatFormattedPanelPayload,
    readAddressA,
    readAddressB,
    selectedReadMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    startRunTrace,
  ]);

  const runSelectedSpCoinReadMethod = useCallback(async (options?: MethodExecutionOptions) => {
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

    const descriptor: MethodExecutionDescriptor = {
      panel: 'spcoin_rread',
      method: selectedSpCoinReadMethod,
      params: activeSpCoinReadDef.params.map((param, idx) => ({
        key: param.label,
        value: spReadParams[idx] || '',
      })),
    };

    try {
      startRunTrace(descriptor);
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, meta, onChainCalls } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, meta, ...(onChainCalls ? { onChainCalls } : {}), result }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel ?? activeSpCoinReadDef.title} cancelled.`;
        setStatus(message);
        appendLog(message);
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown SpCoin read error.';
      const call = buildMethodCallEntry(descriptor.method, descriptor.params.map((entry) => ({ label: entry.key, value: entry.value })));
      setFormattedOutputDisplay(
        formatFormattedPanelPayload({
          call,
          meta: getExecutionMetaFromError(error),
          error: {
            message,
            name: error instanceof Error ? error.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined,
            cause:
              error instanceof Error && 'cause' in error
                ? toDisplayString((error as Error & { cause?: unknown }).cause)
                : undefined,
            debug: {
              panel: 'spcoin_rread',
              source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
              method: selectedSpCoinReadMethod,
              trace: getErrorDebugTrace(error),
            },
          },
        }),
      );
      setStatus(`${activeSpCoinReadDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinReadDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinReadDef,
    appendLog,
    buildMethodCallEntry,
    executeMethodDescriptor,
    formatFormattedPanelPayload,
    getRecentWriteTrace,
    selectedSpCoinReadMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    spCoinReadMissingEntries,
    spReadParams,
    useLocalSpCoinAccessPackage,
    startRunTrace,
  ]);

  const runSelectedSpCoinWriteMethod = useCallback(async (options?: MethodExecutionOptions) => {
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

    const descriptor: MethodExecutionDescriptor = {
      panel: 'spcoin_write',
      method: selectedSpCoinWriteMethod,
      sender: mode === 'hardhat' ? (selectedHardhatAddress ?? effectiveConnectedAddress) : effectiveConnectedAddress,
      params: activeSpCoinWriteDef.params.map((param, idx) => ({
        key: param.label,
        value: isAmountParam(param)
          ? normalizeAmountForMethod(spWriteParams[idx] || '', spWriteAmountUnits[idx] || 'RAW', activeTokenDecimals)
          : spWriteParams[idx] || '',
      })),
    };

    try {
      startRunTrace(descriptor);
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, meta, onChainCalls } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, meta, ...(onChainCalls ? { onChainCalls } : {}) }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel ?? activeSpCoinWriteDef.title} cancelled.`;
        setStatus(message);
        appendLog(message);
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown SpCoin write error.';
      const actualSigner = toDisplayString((error as { spCoinActualSigner?: unknown } | null)?.spCoinActualSigner).trim();
      const call = buildMethodCallEntry(descriptor.method, [
        ...(actualSigner || descriptor.sender ? [{ label: 'msg.sender', value: actualSigner || descriptor.sender }] : []),
        ...descriptor.params.map((entry) => ({ label: entry.key, value: entry.value })),
      ]);
      setFormattedOutputDisplay(
        formatFormattedPanelPayload({
          call,
          meta: getExecutionMetaFromError(error),
          error: {
            message,
            name: error instanceof Error ? error.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined,
            cause:
              error instanceof Error && 'cause' in error
                ? toDisplayString((error as Error & { cause?: unknown }).cause)
                : undefined,
            debug: {
              panel: 'spcoin_write',
              source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
              method: selectedSpCoinWriteMethod,
              trace: getRecentWriteTrace(),
            },
          },
        }),
      );
      setStatus(`${activeSpCoinWriteDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinWriteDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinWriteDef,
    appendLog,
    buildMethodCallEntry,
    effectiveConnectedAddress,
    executeMethodDescriptor,
    formatFormattedPanelPayload,
    getRecentWriteTrace,
    mode,
    selectedHardhatAddress,
    selectedSpCoinWriteMethod,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    useLocalSpCoinAccessPackage,
    spCoinWriteMissingEntries,
    spWriteParams,
    spWriteAmountUnits,
    activeTokenDecimals,
    startRunTrace,
  ]);
  const runSelectedSerializationTestMethod = useCallback(async (options?: MethodExecutionOptions) => {
    if (!options?.skipValidation && serializationTestMissingEntries.length > 0) {
      showValidationPopup(
        serializationTestMissingEntries.map((entry) => entry.id),
        serializationTestMissingEntries.map((entry) => entry.label),
        undefined,
        {
          confirmLabel: 'Run Anyway',
          onConfirm: () => runSelectedSerializationTestMethod({ skipValidation: true }),
        },
      );
      return;
    }

    const descriptor: MethodExecutionDescriptor = {
      panel: 'serialization_tests',
      method: selectedSerializationTestMethod,
      params: activeSerializationTestDef.params.map((param, idx) => ({
        key: param.label,
        value: isAmountParam(param)
          ? normalizeAmountForMethod(serializationTestParams[idx] || '', spWriteAmountUnits[idx] || 'RAW', activeTokenDecimals)
          : serializationTestParams[idx] || '',
      })),
    };

    try {
      startRunTrace(descriptor);
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel ?? activeSerializationTestDef.title} cancelled.`;
        setStatus(message);
        appendLog(message);
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown serialization test error.';
      const call = buildMethodCallEntry(
        descriptor.method,
        descriptor.params.map((entry) => ({ label: entry.key, value: entry.value })),
      );
      setFormattedOutputDisplay(
        formatFormattedPanelPayload({
          call,
          meta: getExecutionMetaFromError(error),
          error: {
            message,
            name: error instanceof Error ? error.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined,
            debug: {
              panel: 'serialization_tests',
              source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
              method: selectedSerializationTestMethod,
              trace: getErrorDebugTrace(error),
            },
          },
        }),
      );
      setStatus(`${activeSerializationTestDef.title} failed: ${message}`);
      appendLog(`${activeSerializationTestDef.title} failed: ${message}`);
    }
  }, [
    activeSerializationTestDef,
    appendLog,
    buildMethodCallEntry,
    executeMethodDescriptor,
    formatFormattedPanelPayload,
    selectedSerializationTestMethod,
    serializationTestMissingEntries,
    serializationTestParams,
    spWriteAmountUnits,
    activeTokenDecimals,
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
    startRunTrace,
  ]);
  const { runScriptStep } = useSponsorCoinLabScriptRunner({
    appendLog,
    setStatus,
    setFormattedOutputDisplay,
    useLocalSpCoinAccessPackage,
    appendWriteTrace,
    resetWriteTrace,
    getRecentWriteTrace,
    executeMethodDescriptor,
    buildMethodCallEntry,
    formatFormattedPanelPayload,
  });

  useEffect(() => {
    const activeReadDef = spCoinReadMethodDefs[selectedSpCoinReadMethod];
    if (!activeReadDef) {
      const next = Object.keys(spCoinReadMethodDefs).find((key) => spCoinReadMethodDefs[key as SpCoinReadMethod].executable !== false);
      if (next) {
        setSelectedSpCoinReadMethod(next as SpCoinReadMethod);
      }
      return;
    }
    if (activeReadDef.executable === false) {
      const next = Object.keys(spCoinReadMethodDefs).find((key) => spCoinReadMethodDefs[key as SpCoinReadMethod].executable !== false);
      if (next) {
        setSelectedSpCoinReadMethod(next as SpCoinReadMethod);
      }
    }
  }, [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod, spCoinReadMethodDefs]);

  useEffect(() => {
    const activeWriteDef = spCoinWriteMethodDefs[normalizeSpCoinWriteMethod(selectedSpCoinWriteMethod)];
    if (!activeWriteDef) {
      const next = Object.keys(spCoinWriteMethodDefs).find((key) => spCoinWriteMethodDefs[key as SpCoinWriteMethod].executable !== false);
      if (next) {
        setSelectedSpCoinWriteMethod(next as SpCoinWriteMethod);
      }
      return;
    }
    if (activeWriteDef.executable === false) {
      const next = Object.keys(spCoinWriteMethodDefs).find((key) => spCoinWriteMethodDefs[key as SpCoinWriteMethod].executable !== false);
      if (next) {
        setSelectedSpCoinWriteMethod(next as SpCoinWriteMethod);
      }
    }
  }, [selectedSpCoinWriteMethod, setSelectedSpCoinWriteMethod, spCoinWriteMethodDefs]);

  useEffect(() => {
    const activeDef = serializationTestMethodDefs[selectedSerializationTestMethod];
    if (!activeDef) {
      const next = Object.keys(serializationTestMethodDefs).find(
        (key) => serializationTestMethodDefs[key as SerializationTestMethod].executable !== false,
      );
      if (next) {
        setSelectedSerializationTestMethod(next as SerializationTestMethod);
      }
      return;
    }
    if (activeDef.executable === false) {
      const next = Object.keys(serializationTestMethodDefs).find(
        (key) => serializationTestMethodDefs[key as SerializationTestMethod].executable !== false,
      );
      if (next) {
        setSelectedSerializationTestMethod(next as SerializationTestMethod);
      }
    }
  }, [selectedSerializationTestMethod, serializationTestMethodDefs, setSelectedSerializationTestMethod]);

  const {
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
  } = useSponsorCoinLabRateKeyOptions({
    activeContractAddress,
    methodPanelMode,
    activeSpCoinWriteDef,
    selectedWriteSenderAddress,
    spWriteParams,
    setSpWriteParams,
    requireContractAddress,
    ensureReadRunner,
    useLocalSpCoinAccessPackage,
  });
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
    serializationTestMissingEntries,
    canRunErc20WriteMethod,
    canRunErc20ReadMethod,
    canRunSpCoinReadMethod,
    canRunSpCoinWriteMethod,
    canRunSerializationTestMethod,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
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
    runSelectedWriteMethod,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod,
    runSelectedSerializationTestMethod,
    runScriptStep,
  };
}
