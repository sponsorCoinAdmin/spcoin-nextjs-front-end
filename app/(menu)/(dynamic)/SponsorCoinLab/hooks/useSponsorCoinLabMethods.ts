import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { MethodDef, ParamDef } from '../jsonMethods/shared/types';
import {
  getErc20ReadLabels,
  runErc20ReadMethod,
  type Erc20ReadMethod,
} from '../jsonMethods/erc20/read';
import {
  getErc20WriteLabels,
  runErc20WriteMethod,
  type Erc20WriteMethod,
} from '../jsonMethods/erc20/write';
import { runSpCoinReadMethod, type SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { normalizeSpCoinReadMethod } from '../jsonMethods/spCoin/read';
import {
  normalizeSpCoinWriteMethod,
  runSpCoinWriteMethod,
  type SpCoinWriteMethod,
} from '../jsonMethods/spCoin/write';
import {
  runSerializationTestMethod,
  type SerializationTestMethod,
} from '../jsonMethods/serializationTests';
import { createSpCoinContract, createSpCoinLibraryAccess, type SpCoinContractAccess, type SpCoinReadAccess } from '../jsonMethods/shared';
import { getTransactionList as localGetTransactionList } from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getTransactionList';
import { getAccountTransactionList as localGetAccountTransactionList } from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountTransactionList';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import { normalizeStringListResult } from '../jsonMethods/shared/normalizeListResult';
import type { ConnectionMode, LabScriptStep, MethodPanelMode } from '../scriptBuilder/types';
import {
  attachExecutionMeta,
  attachReadDebugTrace,
  buildExecutionMeta,
  enrichDirectReadError,
  getErrorDebugTrace,
  getExecutionMetaFromError,
  isAbortError,
  isEmptyAccountRateListReadError,
  isMalformedAccountRateListInput,
  parseComparableUint,
  type MethodExecutionMeta,
} from './methodExecutionHelpers';
import {
  deriveReadWarningPayload,
  mergeFormattedOutput,
  normalizeWriteResultForDisplay,
} from './methodOutputFormatting';

type Entry = { id: string; label: string };
type ScriptRunResult = {
  success: boolean;
  formattedOutput: string;
};
type MethodParamEntry = { key: string; value: string };
type MethodExecutionDescriptor = {
  panel: MethodPanelMode;
  method: string;
  params: MethodParamEntry[];
  sender?: string;
};

type MethodExecutionResult = {
  call: { method: string; parameters: { label: string; value: unknown }[] };
  result: unknown;
  warning?: any;
  meta?: MethodExecutionMeta;
};

type MethodExecutionOptions = {
  executionLabel?: string;
  executionSignal?: AbortSignal;
  skipValidation?: boolean;
};

type MethodDefMap = Record<string, MethodDef>;

type Params = {
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
  setSpWriteParams: Dispatch<SetStateAction<string[]>>;
  serializationTestParams: string[];
  spCoinReadMethodDefs: MethodDefMap;
  spCoinWriteMethodDefs: MethodDefMap;
  serializationTestMethodDefs: MethodDefMap;
  activeSpCoinReadDef: MethodDef;
  activeSpCoinWriteDef: MethodDef;
  activeSerializationTestDef: MethodDef;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  selectedHardhatAddress?: string;
  effectiveConnectedAddress: string;
  ownerAddress?: string;
  useLocalSpCoinAccessPackage: boolean;
  appendLog: (line: string) => void;
  appendWriteTrace: (line: string) => void;
  getRecentWriteTrace: () => string[];
  traceEnabled: boolean;
  setStatus: (value: string) => void;
  formattedOutputDisplay: string;
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
  recipientRateRange?: [number, number];
  agentRateRange?: [number, number];
};

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
  useLocalSpCoinAccessPackage,
  appendLog,
  appendWriteTrace,
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

  const runServerBackedSpCoinStep = useCallback(
    async (
      panel: 'spcoin_rread' | 'spcoin_write',
      method: string,
      params: Array<{ key: string; value: string }>,
      sender?: string,
      executionSignal?: AbortSignal,
    ) => {
      const target = requireContractAddress();
      const response = await fetch('/api/spCoin/run-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: executionSignal,
        body: JSON.stringify({
          contractAddress: target,
          rpcUrl,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          script: {
            id: `spcoin-rread-${method}-${Date.now()}`,
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
        results?: Array<{
          success?: boolean;
          payload?: {
            result?: unknown;
            warning?: Record<string, unknown> | undefined;
            error?: { message?: string };
            meta?: MethodExecutionMeta;
          };
        }>;
      };
      if (!response.ok) {
        throw new Error(String(payload?.message || `Unable to run ${method} (${response.status})`));
      }
      const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
      if (!firstResult?.success) {
        const nextError = new Error(String(firstResult?.payload?.error?.message || `Unable to run ${method}.`));
        attachExecutionMeta(nextError, firstResult?.payload?.meta);
        throw nextError;
      }
      return {
        result: firstResult?.payload?.result,
        warning: firstResult?.payload?.warning as Record<string, unknown> | undefined,
        meta: firstResult?.payload?.meta,
      };
    },
    [mode, requireContractAddress, rpcUrl, useLocalSpCoinAccessPackage],
  );

  useEffect(() => {
    treeAccountListCacheRef.current = null;
    treeAccountRecordCacheRef.current.clear();
    setRecipientRateKeyOptions([]);
    setAgentRateKeyOptions([]);
    setRecipientRateKeyHelpText('');
    setAgentRateKeyHelpText('');
    setTreeAccountOptions([]);
    setSelectedTreeAccount('');
    setTreeAccountRefreshToken(0);
  }, [activeContractAddress]);

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
          network: mode === 'hardhat' ? 'hardhat' : 'metamask',
              steps: [
                {
                  step: 1,
                  name: 'getMasterAccountKeys',
                  panel: 'spcoin_rread',
                  method: 'getMasterAccountKeys',
                  mode,
                  params: [],
                },
          ],
        },
      }),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      message?: string;
      results?: Array<{ success?: boolean; payload?: { result?: unknown; error?: { message?: string } } }>;
    };
    if (!response.ok) {
      throw new Error(String(payload?.message || `Unable to load account list (${response.status})`));
    }
    const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
    if (!firstResult?.success) {
      throw new Error(String(firstResult?.payload?.error?.message || 'Unable to load account list.'));
    }
    const list = normalizeStringListResult(firstResult?.payload?.result);
    treeAccountListCacheRef.current = list;
    syncTreeAccountOptions(list);
    return { list };
  }, [mode, normalizeStringListResult, requireContractAddress, rpcUrl, syncTreeAccountOptions]);
  const formatFormattedPanelPayload = useCallback(
    (payload: unknown) => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return formatOutputDisplayValue(payload);
      }
      const nextPayload = { ...(payload as Record<string, unknown>) };
      const normalizeInflationRateDisplay = (value: unknown) => {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) return '';
        return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
      };
      const stripSponsorRewardRateFromTree = (value: unknown): unknown => {
        if (!value || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map((entry) => stripSponsorRewardRateFromTree(entry));

        const record = value as Record<string, unknown>;
        const nextRecord: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(record)) {
          if (key === 'totalSpCoins' && nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
            const totalSpCoinsRecord = { ...(nestedValue as Record<string, unknown>) };
            delete totalSpCoinsRecord.sponsorRewardRate;
            nextRecord[key] = Object.fromEntries(
              Object.entries(totalSpCoinsRecord).map(([nestedKey, nestedEntry]) => [nestedKey, stripSponsorRewardRateFromTree(nestedEntry)]),
            );
            continue;
          }
          nextRecord[key] = stripSponsorRewardRateFromTree(nestedValue);
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

        return stripSponsorRewardRateFromTree(normalizedEntry) as Record<string, unknown>;
      };
      const normalizedPayloadMethod =
        nextPayload.call &&
        typeof nextPayload.call === 'object' &&
        !Array.isArray(nextPayload.call)
          ? String((nextPayload.call as Record<string, unknown>).method || '').trim()
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

        nextPayload.result = {
          spCoinMetaData: normalizedMetadata || { __lazySpCoinMetaData: true },
          [entryListKey]: normalizedEntries.map((entry) => normalizeMasterSponsorEntry(entry, isAccountListPayload)),
        };
        delete nextPayload.spCoinMetaData;
      }
      if (
        nextPayload.call &&
        typeof nextPayload.call === 'object' &&
        !Array.isArray(nextPayload.call) &&
        String((nextPayload.call as Record<string, unknown>).method || '').trim() === 'getSpCoinMetaData' &&
        nextPayload.result &&
        typeof nextPayload.result === 'object' &&
        !Array.isArray(nextPayload.result)
      ) {
        const resultRecord = nextPayload.result as Record<string, unknown>;
        if (resultRecord.inflationRate !== undefined) {
          nextPayload.result = {
            ...resultRecord,
            inflationRate: normalizeInflationRateDisplay(resultRecord.inflationRate),
          };
        }
      }
      return formatOutputDisplayValue(nextPayload);
    },
    [formatOutputDisplayValue],
  );
  const executeMethodDescriptor = useCallback(
    async (
      descriptor: MethodExecutionDescriptor,
      options?: Pick<MethodExecutionOptions, 'executionSignal'>,
    ): Promise<MethodExecutionResult> => {
      const executionStartedAtMs = Date.now();
      const executionTimingCollector = traceEnabled ? createMethodTimingCollector(executionStartedAtMs) : null;
      const { panel, method, params, sender = '' } = descriptor;
      const executionSignal = options?.executionSignal;
      const finalizeMeta = () => (executionTimingCollector ? buildExecutionMeta(executionTimingCollector) : undefined);
      const findParamValue = (label: string) =>
        String(params.find((entry) => String(entry?.key || '') === label)?.value || '').trim();

      try {
      return executionTimingCollector
        ? await runWithMethodTimingCollector(executionTimingCollector, async () => {
      if (panel === 'ecr20_read') {
        const selectedMethod = method as Erc20ReadMethod;
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
        return { call, result, meta: finalizeMeta() };
      }

      if (panel === 'erc20_write') {
        const selectedMethod = method as Erc20WriteMethod;
        const labels = getErc20WriteLabels(selectedMethod);
        const writeAddressA = findParamValue(labels.addressALabel);
        const writeAddressB = labels.requiresAddressB ? findParamValue(labels.addressBLabel) : '';
        const amount = findParamValue('Amount');
        const signer = sender || (mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress);
        const call = buildMethodCallEntry(selectedMethod, [
          ...(mode === 'hardhat' || signer ? [{ label: 'msg.sender', value: signer }] : []),
          { label: labels.addressALabel, value: writeAddressA },
          ...(labels.requiresAddressB ? [{ label: labels.addressBLabel, value: writeAddressB }] : []),
          { label: 'Amount', value: amount },
        ]);
        const result = await runErc20WriteMethod({
          selectedWriteMethod: selectedMethod,
          activeWriteLabels: labels,
          writeAddressA,
          writeAddressB,
          writeAmountRaw: amount,
          selectedHardhatAddress: signer,
          executeWriteConnected,
          appendLog,
          setStatus,
        });
        return { call, result: normalizeWriteResultForDisplay(result), meta: finalizeMeta() };
      }

      if (panel === 'spcoin_rread') {
        const selectedMethod = method as SpCoinReadMethod;
        const normalizedSelectedMethod = normalizeSpCoinReadMethod(String(selectedMethod || ''));
        const def = spCoinReadMethodDefs[normalizedSelectedMethod] || spCoinReadMethodDefs[selectedMethod];
        if (!def) {
          throw new Error(`SpCoin read method ${String(selectedMethod || '')} is not registered.`);
        }
        const localParams = def.params.map((param) => findParamValue(param.label));
        const call = buildMethodCallEntry(
          selectedMethod,
          def.params.map((param, idx) => ({
            label: param.label,
            value: localParams[idx] || '',
          })),
        );
        const debugTrace = [
          `spcoin_rread start method=${String(selectedMethod || '')}`,
          `normalizedMethod=${normalizedSelectedMethod}`,
          `source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}`,
          `mode=${mode}`,
          `params=${JSON.stringify(def.params.map((param, idx) => ({ key: param.label, value: localParams[idx] || '' })))}`,
        ];
        let serverBackedMeta: MethodExecutionMeta | undefined;
        let warning: unknown;
        if (['getMasterAccountCount', 'getAccountKeyCount', 'getMasterAccountListSize', 'getAccountListSize'].includes(normalizedSelectedMethod)) {
          const target = requireContractAddress();
          const runner = await ensureReadRunner();
          const contract = createSpCoinContract(target, runner) as SpCoinContractAccess;
          if (typeof contract.getAccountKeyCount === 'function') {
            const raw = await contract.getAccountKeyCount();
            return { call, result: Number(raw), meta: finalizeMeta() };
          }
          const fallbackAccess = createSpCoinLibraryAccess(
            target,
            runner,
            undefined,
            useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          );
          const accountKeys =
            typeof contract.getMasterAccountKeys === 'function'
              ? await contract.getMasterAccountKeys()
              : typeof fallbackAccess.read.getAccountKeys === 'function'
                ? await fallbackAccess.read.getAccountKeys()
                : [];
          return { call, result: Array.isArray(accountKeys) ? accountKeys.length : 0, meta: finalizeMeta() };
        }
        const shouldUseServerBackedRead =
          useLocalSpCoinAccessPackage &&
          mode === 'hardhat' &&
          [
            'getAccountRecord',
            'getMasterAccountKeys',
            'getMasterAccountList',
            'getMasterAccountCount',
            'getAccountKeys',
            'getAccountKeyCount',
            'getMasterAccountListSize',
            'getAccountListSize',
          ].includes(normalizedSelectedMethod);
        let result: unknown;
        try {
          if (normalizedSelectedMethod === 'getAccountTransactionList') {
            debugTrace.push('using local account-rate parser fast path');
            const rateRewardList = parseListParam(localParams[0] || '');
            const hasMalformedRateRewardRow = rateRewardList.some((row) => {
              const fields = String(row || '').split(',');
              return fields.length < 2 || !String(fields[0] || '').trim() || !String(fields[1] || '').trim();
            });
            if (hasMalformedRateRewardRow) {
              debugTrace.push('detected malformed rate reward row; returning empty list with warning');
              result = {
                __spcoinWarningType: 'malformed_rate_reward_list',
                __spcoinWarningMessage:
                  'getAccountTransactionList received malformed rate reward data. Expected "rate,stakingRewards" rows, optionally followed by transaction lines.',
                items: [],
              };
            } else {
              const noopLogger = { logFunctionHeader: () => {}, logExitFunction: () => {} };
              result = localGetAccountTransactionList(
                {
                  spCoinLogger: noopLogger,
                  getTransactionList: (rows: string[]) => localGetTransactionList({ spCoinLogger: noopLogger }, rows),
                },
                rateRewardList,
              );
            }
          } else {
          if (shouldUseServerBackedRead) {
            const serverResult = await runServerBackedSpCoinStep(
              'spcoin_rread',
              normalizedSelectedMethod,
              def.params.map((param, idx) => ({
                key: param.label,
                value: localParams[idx] || '',
              })),
              undefined,
              executionSignal,
            );
            result = serverResult.result;
            warning = serverResult.warning;
            serverBackedMeta = serverResult.meta;
          } else {
            result = await runSpCoinReadMethod({
              selectedMethod,
              spReadParams: localParams,
              coerceParamValue,
              stringifyResult,
              spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
              requireContractAddress,
              ensureReadRunner,
              appendLog,
              setStatus,
            });
          }
          }
        } catch (error) {
          const selectedMethodName = String(selectedMethod || '').trim();
          if (
            selectedMethodName === 'getAccountTransactionList' &&
            isEmptyAccountRateListReadError(error)
          ) {
            result = [];
            appendLog(
              `[warn] ${selectedMethodName} received empty or undefined rate reward data; returning an empty list.`,
            );
            setStatus(`${selectedMethodName} returned empty data.`);
          } else if (
            selectedMethodName === 'getAccountTransactionList' &&
            isMalformedAccountRateListInput(error)
          ) {
            result = {
              __spcoinWarningType: 'malformed_rate_reward_list',
              __spcoinWarningMessage:
                `${selectedMethodName} received malformed rate reward data and returned an empty list.`,
              items: [],
            };
            appendLog(
              `[warn] ${selectedMethodName} received malformed rate reward data; returning an empty list.`,
            );
            setStatus(`${selectedMethodName} returned malformed input warning.`);
          } else {
            throw attachReadDebugTrace(error, debugTrace);
          }
        }
        warning = warning ?? deriveReadWarningPayload(selectedMethod, result, useLocalSpCoinAccessPackage);
        if (
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          String((result as Record<string, unknown>).__spcoinWarningType || '').trim() === 'malformed_rate_reward_list'
        ) {
          result = Array.isArray((result as Record<string, unknown>).items)
            ? (result as Record<string, unknown>).items
            : [];
        }
        if (['getMasterAccountKeys', 'getAccountKeys'].includes(normalizedSelectedMethod)) {
          try {
            const accountKeys = Array.isArray(result) ? result : [];
            const accounts = accountKeys.map((accountKey) => String(accountKey || ''));
            return {
              call,
              result: {
                spCoinMetaData: { __lazySpCoinMetaData: true },
                accounts,
              },
              ...(warning ? { warning } : {}),
              meta: serverBackedMeta || finalizeMeta(),
            };
          } catch {
            return { call, result, ...(warning ? { warning } : {}), meta: serverBackedMeta || finalizeMeta() };
          }
        }
        return { call, result, ...(warning ? { warning } : {}), meta: serverBackedMeta || finalizeMeta() };
      }

      if (panel === 'serialization_tests') {
        const selectedMethod = method as SerializationTestMethod;
        const def = serializationTestMethodDefs[selectedMethod];
        const localParams = def.params.map((param) => findParamValue(param.label));
        const call = buildMethodCallEntry(
          selectedMethod,
          def.params.map((param, idx) => ({
            label: param.label,
            value: localParams[idx] || '',
          })),
        );
        const result = await runSerializationTestMethod({
          selectedMethod,
          params: localParams,
          coerceParamValue,
          requireContractAddress,
          ensureReadRunner,
          mode,
          hardhatAccounts,
          executeWriteConnected,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          selectedHardhatAddress:
            mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress,
          appendLog,
          setStatus,
        });
        const extractedWarning =
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          '__warning' in (result as Record<string, unknown>) &&
          (result as Record<string, unknown>).__warning &&
          typeof (result as Record<string, unknown>).__warning === 'object' &&
          !Array.isArray((result as Record<string, unknown>).__warning)
            ? ((result as Record<string, unknown>).__warning as Record<string, unknown>)
            : undefined;
        const sanitizedSerializationResult =
          extractedWarning &&
          result &&
          typeof result === 'object' &&
          !Array.isArray(result)
            ? Object.fromEntries(
                Object.entries(result as Record<string, unknown>).filter(([key]) => key !== '__warning'),
              )
            : result;
        if (
          String(selectedMethod) === 'getMasterSponsorList' ||
          String(selectedMethod) === 'getMasterSponsorList_BAK'
        ) {
          const sponsorKeys = Array.isArray(sanitizedSerializationResult) ? sanitizedSerializationResult : [];
          const sponsors = sponsorKeys.map((accountKey) => ({ address: String(accountKey || '') }));
          appendLog(
            `${selectedMethod} debug -> sponsorKeys=${JSON.stringify(sponsorKeys)} sponsorEntryKinds=${JSON.stringify(
              sponsors.map((entry) => ({
                type: typeof entry,
                hasAddress: !!(entry && typeof entry === 'object' && !Array.isArray(entry) && 'address' in entry),
                keys:
                  entry && typeof entry === 'object' && !Array.isArray(entry)
                    ? Object.keys(entry as Record<string, unknown>)
                    : [],
              })),
            )}`,
          );
          return {
            call,
            result: {
              spCoinMetaData: { __lazySpCoinMetaData: true },
              sponsors,
            },
            ...(extractedWarning ? { warning: extractedWarning } : {}),
            meta: finalizeMeta(),
          };
        }
        return {
          call,
          result: sanitizedSerializationResult,
          ...(extractedWarning ? { warning: extractedWarning } : {}),
          meta: finalizeMeta(),
        };
      }

      const selectedMethod = normalizeSpCoinWriteMethod(method);
      const def = spCoinWriteMethodDefs[selectedMethod];
      if (!def) {
        throw new Error(`Unsupported SpCoin write method: ${String(method)}`);
      }
      const localParams = def.params.map((param) => findParamValue(param.label));
      const signer = sender || (mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress);
      const call = buildMethodCallEntry(selectedMethod, [
        ...(mode === 'hardhat' || signer ? [{ label: 'msg.sender', value: signer }] : []),
        ...def.params.map((param, idx) => ({
          label: param.label,
          value: localParams[idx] || '',
        })),
      ]);
      appendWriteTrace(
        `runMethod start; mode=${mode}; source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}; method=${selectedMethod}`,
      );
      const workflowWriteToUtilityMethod: Partial<Record<SpCoinWriteMethod, SerializationTestMethod>> = {
        deleteAccountTree: 'deleteAccountTree',
        deleteRecipient: 'deleteRecipient',
        deleteRecipientRate: 'deleteRecipientRate',
        deleteAgent: 'deleteAgent',
        deleteAgentRate: 'deleteAgentRate',
        deleteRecipientSponsorships: 'deleteRecipientSponsorships',
        deleteRecipientSponsorshipTree: 'deleteRecipientSponsorshipTree',
        deleteAgentSponsorships: 'deleteAgentSponsorships',
      };
      const utilityWorkflowMethod = workflowWriteToUtilityMethod[selectedMethod];
      if (utilityWorkflowMethod) {
        const result = await runSerializationTestMethod({
          selectedMethod: utilityWorkflowMethod,
          params: localParams,
          coerceParamValue,
          requireContractAddress,
          ensureReadRunner,
          mode,
          hardhatAccounts,
          executeWriteConnected,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          selectedHardhatAddress: signer,
          appendLog,
          setStatus,
        });
        return { call, result: normalizeWriteResultForDisplay(result), meta: finalizeMeta() };
      }
      const shouldUseServerBackedWrite = true;
      const result = shouldUseServerBackedWrite
        ? await runServerBackedSpCoinStep(
            'spcoin_write',
            selectedMethod,
            def.params.map((param, idx) => ({
              key: param.label,
              value: localParams[idx] || '',
            })),
            signer,
            executionSignal,
          )
        : await runSpCoinWriteMethod({
            selectedMethod,
            spWriteParams: localParams,
            coerceParamValue,
            executeWriteConnected,
            selectedHardhatAddress: signer,
            appendLog,
            appendWriteTrace,
            spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
            setStatus,
          });
      const serverResult = result as { result: unknown; warning: Record<string, unknown> | undefined; meta: MethodExecutionMeta | undefined };
      return { call, result: normalizeWriteResultForDisplay(serverResult.result), meta: serverResult.meta || finalizeMeta() };
      })
        : await (async () => {
      if (panel === 'ecr20_read') {
        const selectedMethod = method as Erc20ReadMethod;
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
        return { call, result, meta: finalizeMeta() };
      }

      if (panel === 'erc20_write') {
        const selectedMethod = method as Erc20WriteMethod;
        const labels = getErc20WriteLabels(selectedMethod);
        const writeAddressA = findParamValue(labels.addressALabel);
        const writeAddressB = labels.requiresAddressB ? findParamValue(labels.addressBLabel) : '';
        const amount = findParamValue('Amount');
        const signer = sender || (mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress);
        const call = buildMethodCallEntry(selectedMethod, [
          ...(mode === 'hardhat' || signer ? [{ label: 'msg.sender', value: signer }] : []),
          { label: labels.addressALabel, value: writeAddressA },
          ...(labels.requiresAddressB ? [{ label: labels.addressBLabel, value: writeAddressB }] : []),
          { label: 'Amount', value: amount },
        ]);
        const result = await runErc20WriteMethod({
          selectedWriteMethod: selectedMethod,
          activeWriteLabels: labels,
          writeAddressA,
          writeAddressB,
          writeAmountRaw: amount,
          selectedHardhatAddress: signer,
          executeWriteConnected,
          appendLog,
          setStatus,
        });
        return { call, result: normalizeWriteResultForDisplay(result), meta: finalizeMeta() };
      }

      if (panel === 'spcoin_rread') {
        const selectedMethod = method as SpCoinReadMethod;
        const normalizedSelectedMethod = normalizeSpCoinReadMethod(String(selectedMethod || ''));
        const def = spCoinReadMethodDefs[normalizedSelectedMethod] || spCoinReadMethodDefs[selectedMethod];
        if (!def) {
          throw new Error(`SpCoin read method ${String(selectedMethod || '')} is not registered.`);
        }
        const localParams = def.params.map((param) => findParamValue(param.label));
        const call = buildMethodCallEntry(
          selectedMethod,
          def.params.map((param, idx) => ({
            label: param.label,
            value: localParams[idx] || '',
          })),
        );
        const debugTrace = [
          `spcoin_rread start method=${String(selectedMethod || '')}`,
          `normalizedMethod=${normalizedSelectedMethod}`,
          `source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}`,
          `mode=${mode}`,
          `params=${JSON.stringify(def.params.map((param, idx) => ({ key: param.label, value: localParams[idx] || '' })))}`,
        ];
        let serverBackedMeta: MethodExecutionMeta | undefined;
        let warning: unknown;
        if (['getMasterAccountCount', 'getAccountKeyCount', 'getMasterAccountListSize', 'getAccountListSize'].includes(normalizedSelectedMethod)) {
          const target = requireContractAddress();
          const runner = await ensureReadRunner();
          const contract = createSpCoinContract(target, runner) as SpCoinContractAccess;
          if (typeof contract.getAccountKeyCount === 'function') {
            const raw = await contract.getAccountKeyCount();
            return { call, result: Number(raw), meta: finalizeMeta() };
          }
          const fallbackAccess = createSpCoinLibraryAccess(
            target,
            runner,
            undefined,
            useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          );
          const accountKeys =
            typeof contract.getMasterAccountKeys === 'function'
              ? await contract.getMasterAccountKeys()
              : typeof fallbackAccess.read.getAccountKeys === 'function'
                ? await fallbackAccess.read.getAccountKeys()
                : [];
          return { call, result: Array.isArray(accountKeys) ? accountKeys.length : 0, meta: finalizeMeta() };
        }
        const shouldUseServerBackedRead =
          useLocalSpCoinAccessPackage &&
          mode === 'hardhat' &&
          [
            'getAccountRecord',
            'getMasterAccountKeys',
            'getMasterAccountList',
            'getMasterAccountCount',
            'getAccountKeys',
            'getAccountKeyCount',
            'getMasterAccountListSize',
            'getAccountListSize',
          ].includes(normalizedSelectedMethod);
        let result: unknown;
        try {
          if (normalizedSelectedMethod === 'getAccountTransactionList') {
            debugTrace.push('using local account-rate parser fast path');
            const rateRewardList = parseListParam(localParams[0] || '');
            const hasMalformedRateRewardRow = rateRewardList.some((row) => {
              const fields = String(row || '').split(',');
              return fields.length < 2 || !String(fields[0] || '').trim() || !String(fields[1] || '').trim();
            });
            if (hasMalformedRateRewardRow) {
              debugTrace.push('detected malformed rate reward row; returning empty list with warning');
              result = {
                __spcoinWarningType: 'malformed_rate_reward_list',
                __spcoinWarningMessage:
                  'getAccountTransactionList received malformed rate reward data. Expected "rate,stakingRewards" rows, optionally followed by transaction lines.',
                items: [],
              };
            } else {
              const noopLogger = { logFunctionHeader: () => {}, logExitFunction: () => {} };
              result = localGetAccountTransactionList(
                {
                  spCoinLogger: noopLogger,
                  getTransactionList: (rows: string[]) => localGetTransactionList({ spCoinLogger: noopLogger }, rows),
                },
                rateRewardList,
              );
            }
          } else {
            if (shouldUseServerBackedRead) {
              const serverResult = await runServerBackedSpCoinStep(
                'spcoin_rread',
                normalizedSelectedMethod,
                def.params.map((param, idx) => ({
                  key: param.label,
                  value: localParams[idx] || '',
                })),
                undefined,
                executionSignal,
              );
              result = serverResult.result;
              warning = serverResult.warning;
              serverBackedMeta = serverResult.meta;
            } else {
              result = await runSpCoinReadMethod({
                selectedMethod,
                spReadParams: localParams,
                coerceParamValue,
                stringifyResult,
                spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                requireContractAddress,
                ensureReadRunner,
                appendLog,
                setStatus,
              });
            }
          }
        } catch (error) {
          const selectedMethodName = String(selectedMethod || '').trim();
          if (
            selectedMethodName === 'getAccountTransactionList' &&
            isEmptyAccountRateListReadError(error)
          ) {
            result = [];
            appendLog(
              `[warn] ${selectedMethodName} received empty or undefined rate reward data; returning an empty list.`,
            );
            setStatus(`${selectedMethodName} returned empty data.`);
          } else if (
            selectedMethodName === 'getAccountTransactionList' &&
            isMalformedAccountRateListInput(error)
          ) {
            result = {
              __spcoinWarningType: 'malformed_rate_reward_list',
              __spcoinWarningMessage:
                `${selectedMethodName} received malformed rate reward data and returned an empty list.`,
              items: [],
            };
            appendLog(
              `[warn] ${selectedMethodName} received malformed rate reward data; returning an empty list.`,
            );
            setStatus(`${selectedMethodName} returned malformed input warning.`);
          } else {
            throw attachReadDebugTrace(error, debugTrace);
          }
        }
        warning = warning ?? deriveReadWarningPayload(selectedMethod, result, useLocalSpCoinAccessPackage);
        if (
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          String((result as Record<string, unknown>).__spcoinWarningType || '').trim() === 'malformed_rate_reward_list'
        ) {
          result = Array.isArray((result as Record<string, unknown>).items)
            ? (result as Record<string, unknown>).items
            : [];
        }
        if (['getMasterAccountKeys', 'getAccountKeys'].includes(normalizedSelectedMethod)) {
          try {
            const accountKeys = Array.isArray(result) ? result : [];
            const accounts = accountKeys.map((accountKey) => String(accountKey || ''));
            return {
              call,
              result: {
                spCoinMetaData: { __lazySpCoinMetaData: true },
                accounts,
              },
              ...(warning ? { warning } : {}),
              meta: serverBackedMeta || finalizeMeta(),
            };
          } catch {
            return { call, result, ...(warning ? { warning } : {}), meta: serverBackedMeta || finalizeMeta() };
          }
        }
        return { call, result, ...(warning ? { warning } : {}), meta: serverBackedMeta || finalizeMeta() };
      }

      if (panel === 'serialization_tests') {
        const selectedMethod = method as SerializationTestMethod;
        const def = serializationTestMethodDefs[selectedMethod];
        const localParams = def.params.map((param) => findParamValue(param.label));
        const call = buildMethodCallEntry(
          selectedMethod,
          def.params.map((param, idx) => ({
            label: param.label,
            value: localParams[idx] || '',
          })),
        );
        const result = await runSerializationTestMethod({
          selectedMethod,
          params: localParams,
          coerceParamValue,
          requireContractAddress,
          ensureReadRunner,
          mode,
          hardhatAccounts,
          executeWriteConnected,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          selectedHardhatAddress:
            mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress,
          appendLog,
          setStatus,
        });
        const extractedWarning =
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          '__warning' in (result as Record<string, unknown>) &&
          (result as Record<string, unknown>).__warning &&
          typeof (result as Record<string, unknown>).__warning === 'object' &&
          !Array.isArray((result as Record<string, unknown>).__warning)
            ? ((result as Record<string, unknown>).__warning as Record<string, unknown>)
            : undefined;
        const sanitizedSerializationResult =
          extractedWarning &&
          result &&
          typeof result === 'object' &&
          !Array.isArray(result)
            ? Object.fromEntries(
                Object.entries(result as Record<string, unknown>).filter(([key]) => key !== '__warning'),
              )
            : result;
        if (
          String(selectedMethod) === 'getMasterSponsorList' ||
          String(selectedMethod) === 'getMasterSponsorList_BAK'
        ) {
          const sponsorKeys = Array.isArray(sanitizedSerializationResult) ? sanitizedSerializationResult : [];
          const sponsors = sponsorKeys.map((accountKey) => ({ address: String(accountKey || '') }));
          appendLog(
            `${selectedMethod} debug -> sponsorKeys=${JSON.stringify(sponsorKeys)} sponsorEntryKinds=${JSON.stringify(
              sponsors.map((entry) => ({
                type: typeof entry,
                hasAddress: !!(entry && typeof entry === 'object' && !Array.isArray(entry) && 'address' in entry),
                keys:
                  entry && typeof entry === 'object' && !Array.isArray(entry)
                    ? Object.keys(entry as Record<string, unknown>)
                    : [],
              })),
            )}`,
          );
          return {
            call,
            result: {
              spCoinMetaData: { __lazySpCoinMetaData: true },
              sponsors,
            },
            ...(extractedWarning ? { warning: extractedWarning } : {}),
            meta: finalizeMeta(),
          };
        }
        return {
          call,
          result: sanitizedSerializationResult,
          ...(extractedWarning ? { warning: extractedWarning } : {}),
          meta: finalizeMeta(),
        };
      }

      const selectedMethod = normalizeSpCoinWriteMethod(method);
      const def = spCoinWriteMethodDefs[selectedMethod];
      if (!def) {
        throw new Error(`Unsupported SpCoin write method: ${String(method)}`);
      }
      const localParams = def.params.map((param) => findParamValue(param.label));
      const signer = sender || (mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress);
      const call = buildMethodCallEntry(selectedMethod, [
        ...(mode === 'hardhat' || signer ? [{ label: 'msg.sender', value: signer }] : []),
        ...def.params.map((param, idx) => ({
          label: param.label,
          value: localParams[idx] || '',
        })),
      ]);
      appendWriteTrace(
        `runMethod start; mode=${mode}; source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}; method=${selectedMethod}`,
      );
      const workflowWriteToUtilityMethod: Partial<Record<SpCoinWriteMethod, SerializationTestMethod>> = {
        deleteAccountTree: 'deleteAccountTree',
        deleteRecipient: 'deleteRecipient',
        deleteRecipientRate: 'deleteRecipientRate',
        deleteAgent: 'deleteAgent',
        deleteAgentRate: 'deleteAgentRate',
        deleteRecipientSponsorships: 'deleteRecipientSponsorships',
        deleteRecipientSponsorshipTree: 'deleteRecipientSponsorshipTree',
        deleteAgentSponsorships: 'deleteAgentSponsorships',
      };
      const utilityWorkflowMethod = workflowWriteToUtilityMethod[selectedMethod];
      if (utilityWorkflowMethod) {
        const result = await runSerializationTestMethod({
          selectedMethod: utilityWorkflowMethod,
          params: localParams,
          coerceParamValue,
          requireContractAddress,
          ensureReadRunner,
          mode,
          hardhatAccounts,
          executeWriteConnected,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          selectedHardhatAddress: signer,
          appendLog,
          setStatus,
        });
        return { call, result: normalizeWriteResultForDisplay(result), meta: finalizeMeta() };
      }
      const shouldUseServerBackedWrite = false;
      const result = shouldUseServerBackedWrite
        ? await runServerBackedSpCoinStep(
            'spcoin_write',
            selectedMethod,
            def.params.map((param, idx) => ({
              key: param.label,
              value: localParams[idx] || '',
            })),
            signer,
            executionSignal,
          )
        : await runSpCoinWriteMethod({
            selectedMethod,
            spWriteParams: localParams,
            coerceParamValue,
            executeWriteConnected,
            selectedHardhatAddress: signer,
            appendLog,
            appendWriteTrace,
            spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
            setStatus,
            timingCollector: executionTimingCollector,
          });
      if (shouldUseServerBackedWrite) {
        const serverResult = result as { result: unknown; warning: Record<string, unknown> | undefined; meta: MethodExecutionMeta | undefined };
        return { call, result: normalizeWriteResultForDisplay(serverResult.result), meta: serverResult.meta || finalizeMeta() };
      } else {
        const writeResult = result as { receipts: Array<{ label: string; txHash: string; receiptHash: string; blockNumber: string; status: string }>; meta: MethodExecutionMeta | undefined };
        return { call, result: normalizeWriteResultForDisplay(writeResult.receipts), meta: writeResult.meta || finalizeMeta() };
      }
      })();
      } catch (error) {
        throw attachExecutionMeta(error, finalizeMeta());
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
      hardhatAccounts,
      mode,
      requireContractAddress,
      runServerBackedSpCoinStep,
      selectedHardhatAddress,
      setStatus,
      spCoinReadMethodDefs,
      serializationTestMethodDefs,
      spCoinWriteMethodDefs,
      stringifyResult,
      traceEnabled,
      useLocalSpCoinAccessPackage,
    ],
  );

  const runHeaderRead = useCallback(async () => {
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
      appendLog(`spCoinReadMethods/getSpCoinMetaData -> ${result}`);
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
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
  ]);

  const runAccountListRead = useCallback(async () => {
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
    ensureReadRunner,
    loadTreeAccountOptions,
    requireContractAddress,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
  ]);

  const runTreeAccountsRead = useCallback(async () => {
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
            ? ((await (access.read as SpCoinReadAccess).getMasterAccountKeys?.()) as string[])
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
            ? ((await (access.read as SpCoinReadAccess).getMasterAccountKeys?.()) as string[])
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

  const loadAccountRecordForAddress = useCallback(
    async (account: string, options?: { force?: boolean }) => {
      const normalizedAccount = normalizeAddressValue(account);
      let tree = options?.force ? undefined : treeAccountRecordCacheRef.current.get(normalizedAccount);
      if (!tree) {
        const target = requireContractAddress();
        const response = await fetch('/api/spCoin/run-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: target,
            rpcUrl,
            spCoinAccessSource: 'local',
            script: {
              id: `expand-account-record-${Date.now()}`,
              name: 'Expand Account Record',
              network: mode === 'hardhat' ? 'hardhat' : 'metamask',
              steps: [
                {
                  step: 1,
                  name: 'getAccountRecord',
                  panel: 'spcoin_rread',
                  method: 'getAccountRecord',
                  mode,
                  params: [{ key: 'Account Key', value: normalizedAccount }],
                },
              ],
            },
          }),
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          results?: Array<{
            success?: boolean;
            payload?: {
              result?: unknown;
              warning?: Record<string, unknown>;
              error?: { message?: string };
              meta?: MethodExecutionMeta;
            };
          }>;
        };
        if (!response.ok) {
          throw new Error(String(payload?.message || `Unable to load account record (${response.status})`));
        }
        const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
        const warning = firstResult?.payload?.warning as Record<string, unknown> | undefined;
        if (!firstResult?.success) {
          throw new Error(String(firstResult?.payload?.error?.message || 'Unable to load account record.'));
        }
        tree = firstResult?.payload?.result;
        if (!tree || typeof tree !== 'object' || Array.isArray(tree)) {
          tree = { value: tree ?? null };
        }
        if (tree && typeof tree === 'object' && !Array.isArray(tree)) {
          const treeRecord = tree as Record<string, unknown>;
          if (!String(treeRecord.accountKey || '').trim()) {
            treeRecord.accountKey = normalizedAccount;
          }
          treeRecord.__showEmptyFields = true;
          if (warning) {
            treeRecord.warning = warning;
          }
          if (firstResult?.payload?.meta) {
            treeRecord.meta = firstResult.payload.meta;
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: target,
              rpcUrl,
              spCoinAccessSource: 'local',
              script: {
                id: `expand-account-recipient-list-${Date.now()}`,
                name: 'Expand Account Recipient List',
                network: mode === 'hardhat' ? 'hardhat' : 'metamask',
                steps: [
                  {
                    step: 1,
                    name: 'getRecipientKeys',
                    panel: 'spcoin_rread',
                    method: 'getRecipientKeys',
                    mode,
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  },
                ],
              },
            }),
          });
          const recipientListPayload = (await recipientListResponse.json()) as {
            ok?: boolean;
            message?: string;
            results?: Array<{ success?: boolean; payload?: { result?: unknown; error?: { message?: string } } }>;
          };
          if (recipientListResponse.ok) {
            const recipientListResult = Array.isArray(recipientListPayload?.results) ? recipientListPayload.results[0] : null;
            const rawRecipientKeys = recipientListResult?.success ? recipientListResult?.payload?.result : [];
            const recipientKeys = Array.isArray(rawRecipientKeys)
              ? rawRecipientKeys
                  .map((value) => String(value || '').trim())
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: target,
              rpcUrl,
              spCoinAccessSource: 'local',
              script: {
                id: `expand-account-agent-list-${Date.now()}`,
                name: 'Expand Account Agent List',
                network: mode === 'hardhat' ? 'hardhat' : 'metamask',
                steps: [
                  {
                    step: 1,
                    name: 'getAgentKeys',
                    panel: 'spcoin_rread',
                    method: 'getAgentKeys',
                    mode,
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  },
                ],
              },
            }),
          });
          const agentListPayload = (await agentListResponse.json()) as {
            ok?: boolean;
            message?: string;
            results?: Array<{ success?: boolean; payload?: { result?: unknown; error?: { message?: string } } }>;
          };
          if (agentListResponse.ok) {
            const agentListResult = Array.isArray(agentListPayload?.results) ? agentListPayload.results[0] : null;
            const rawAgentKeys = agentListResult?.success ? agentListResult?.payload?.result : [];
            const agentKeys = Array.isArray(rawAgentKeys)
              ? rawAgentKeys
                  .map((value) => String(value || '').trim())
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

  const runTreeDump = useCallback(async (accountOverride?: string, options?: { force?: boolean }) => {
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
    loadAccountRecordForAddress,
    loadTreeAccountOptions,
    selectedTreeAccount,
    setOutputPanelMode,
    setStatus,
    setTreeOutputDisplay,
    traceEnabled,
  ]);

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
      const normalizedPathHint = String(pathHint || '').trim();
      if (!normalizedPathHint.includes('.result.spCoinMetaData')) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplay || '').trim();
      if (!trimmedDisplay || trimmedDisplay === '(no output yet)') return 'unhandled';

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
      const rootPathMatch = normalizedPathHint.match(/^(?:step|output)-(\d+)(?:\.|$)/i);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload || !payload.result || typeof payload.result !== 'object' || Array.isArray(payload.result)) continue;
        const resultRecord = payload.result as Record<string, unknown>;
        if (!resultRecord.spCoinMetaData || typeof resultRecord.spCoinMetaData !== 'object' || Array.isArray(resultRecord.spCoinMetaData)) continue;

        try {
          setStatus('Loading spCoin metadata...');
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
              appendLog: () => {},
              setStatus: () => {},
            }),
          );
          const metadataMeta = buildExecutionMeta(metadataTimingCollector);
          const metadataRecord =
            metadataResult && typeof metadataResult === 'object' && !Array.isArray(metadataResult)
              ? {
                  ...(metadataResult as Record<string, unknown>),
                  meta: metadataMeta,
                }
              : {
                  value: metadataResult,
                  meta: metadataMeta,
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
          const message = String(error instanceof Error ? error.message : error || '').trim() || 'Unable to load spCoin metadata.';
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
      formattedOutputDisplay,
      requireContractAddress,
      setFormattedOutputDisplay,
      setStatus,
      stringifyResult,
      useLocalSpCoinAccessPackage,
    ],
  );

  const expandMasterSponsorListAccountInline = useCallback(
    async (account: string, pathHint?: string): Promise<'expanded' | 'handled' | 'unhandled'> => {
      const normalizedAccount = normalizeAddressValue(account);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplay || '').trim();
      if (!trimmedDisplay) return 'unhandled';
      const normalizedPathHint = String(pathHint || '').trim();
      const pathRootMatch = normalizedPathHint.match(/^(?:step|output)-(\d+)(?:\.|$)/i);
      if (!pathRootMatch) return 'unhandled';
      const pathSegments = normalizedPathHint.split('.').filter(Boolean);
      if (pathSegments.length < 2) return 'unhandled';
      const payloadPath = pathSegments.slice(1);
      const targetKey = payloadPath[payloadPath.length - 1] || '';
      if (!/^\d+$/.test(targetKey)) return 'unhandled';

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

      const blocks = trimmedDisplay
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);
      const blockEntries =
        blocks.length > 1
          ? blocks.map((raw, index) => ({ raw, index, payload: parsePayload(raw) }))
          : [{ raw: trimmedDisplay, index: 0, payload: parsePayload(trimmedDisplay) }];
      const rootPathMatch = normalizedPathHint.match(/^(?:step|output)-(\d+)(?:\.|$)/i);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) continue;
        const targetEntry = readPathValue(payload, payloadPath);
        const targetAddress =
          typeof targetEntry === 'string'
            ? normalizeAddressValue(targetEntry)
            : targetEntry && typeof targetEntry === 'object' && !Array.isArray(targetEntry)
              ? normalizeAddressValue(String((targetEntry as Record<string, unknown>).address || (targetEntry as Record<string, unknown>).accountKey || ''))
              : '';
        if (targetAddress !== normalizedAccount) continue;
        appendLog(
          `expandAccountInline debug -> path=${String(pathHint || '')} account=${normalizedAccount} targetKind=${typeof targetEntry}`,
        );
        try {
          const accountRecord = await loadAccountRecordForAddress(normalizedAccount, { force: true });
          const nextAccountEntry = {
            address: normalizedAccount,
            ...(targetEntry && typeof targetEntry === 'object' && !Array.isArray(targetEntry)
              ? (targetEntry as Record<string, unknown>)
              : {}),
            ...(accountRecord && typeof accountRecord === 'object' && !Array.isArray(accountRecord)
              ? (accountRecord as Record<string, unknown>)
              : { value: accountRecord }),
          };
          const nextRootPayload = writePathValue(payload, payloadPath, nextAccountEntry) as Record<string, unknown>;
          const nextPayload = formatFormattedPanelPayload({
            ...nextRootPayload,
          });
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            setFormattedOutputDisplay(nextBlocks.join('\n\n'));
          } else {
            setFormattedOutputDisplay(nextPayload);
          }
          setStatus(`Loaded account record for ${normalizedAccount}.`);
          appendLog(`Inline account record loaded for ${normalizedAccount}.`);
          return 'expanded';
        } catch (error) {
          const message = String(error instanceof Error ? error.message : error || '').trim() || 'Unable to load account record.';
          setStatus(`Unable to load account record for ${normalizedAccount}.`);
          appendLog(`Inline account record load failed for ${normalizedAccount}: ${message}`);
          return 'handled';
        }
      }
      return 'unhandled';
    },
    [
      appendLog,
      formatFormattedPanelPayload,
      formattedOutputDisplay,
      loadAccountRecordForAddress,
      normalizeAddressValue,
      setFormattedOutputDisplay,
      setStatus,
    ],
  );

  const openAccountFromAddress = useCallback(
    async (account: string, pathHint?: string) => {
      if (String(account || '').trim() === '__load_spcoin_metadata__') {
        const metadataResult = await expandSpCoinMetaDataInline(pathHint);
        if (metadataResult === 'expanded' || metadataResult === 'handled') {
          setOutputPanelMode('formatted');
        }
        return;
      }
      const inTreePanel = /^tree-/i.test(String(pathHint || '').trim());
      const inlineResult = await expandMasterSponsorListAccountInline(account, pathHint);
      if (inlineResult === 'expanded' || inlineResult === 'handled') {
        setOutputPanelMode('formatted');
        return;
      }
      if (!inTreePanel) return;
      const normalizedAccount = normalizeAddressValue(account);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return;
      setSelectedTreeAccount(normalizedAccount);
      setOutputPanelMode('tree');
      await runTreeDump(normalizedAccount);
    },
    [expandMasterSponsorListAccountInline, expandSpCoinMetaDataInline, normalizeAddressValue, runTreeDump, setOutputPanelMode],
  );

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

    const descriptor: MethodExecutionDescriptor = {
      panel: 'erc20_write',
      method: selectedWriteMethod,
      sender: mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress,
      params: [
        { key: activeWriteLabels.addressALabel, value: writeAddressA },
        ...(activeWriteLabels.requiresAddressB ? [{ key: activeWriteLabels.addressBLabel, value: writeAddressB }] : []),
        { key: 'Amount', value: writeAmountRaw },
      ],
    };

    try {
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, warning, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, ...(warning ? { warning } : {}), meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel || activeWriteLabels.title} cancelled.`;
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
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, warning, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, ...(warning ? { warning } : {}), meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel || activeReadLabels.title} cancelled.`;
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
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel || activeSpCoinReadDef.title} cancelled.`;
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
                ? String((error as Error & { cause?: unknown }).cause ?? '')
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
      sender: mode === 'hardhat' ? selectedHardhatAddress || effectiveConnectedAddress : effectiveConnectedAddress,
      params: activeSpCoinWriteDef.params.map((param, idx) => ({
        key: param.label,
        value: spWriteParams[idx] || '',
      })),
    };

    try {
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel || activeSpCoinWriteDef.title} cancelled.`;
        setStatus(message);
        appendLog(message);
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown SpCoin write error.';
      const call = buildMethodCallEntry(descriptor.method, [
        ...(descriptor.sender ? [{ label: 'msg.sender', value: descriptor.sender }] : []),
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
                ? String((error as Error & { cause?: unknown }).cause ?? '')
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
        value: serializationTestParams[idx] || '',
      })),
    };

    try {
      setFormattedOutputDisplay('(no output yet)');
      const { call, result, meta } = await executeMethodDescriptor(descriptor, {
        executionSignal: options?.executionSignal,
      });
      setFormattedOutputDisplay(formatFormattedPanelPayload({ call, result, meta }));
    } catch (error) {
      if (isAbortError(error)) {
        const message = `${options?.executionLabel || activeSerializationTestDef.title} cancelled.`;
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
    setFormattedOutputDisplay,
    setStatus,
    showValidationPopup,
  ]);
  const runScriptStep = useCallback(
    async (step: LabScriptStep, options?: { formattedOutputBase?: string }): Promise<ScriptRunResult> => {
      const formattedOutputBase = options?.formattedOutputBase;
      const paramEntries = Array.isArray(step.params) ? step.params : [];
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
        const { call, result, warning, meta } = await executeMethodDescriptor({
          panel: step.panel,
          method: step.method,
          params: paramEntries.map((entry) => ({ key: String(entry.key || ''), value: String(entry.value || '') })),
          sender: stepSender,
        });
        return commitResult({ call, result, ...(warning ? { warning } : {}), meta }, true);
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
        return commitResult(
          {
            call,
            meta: getExecutionMetaFromError(error),
            error: {
              message,
              name: error instanceof Error ? error.name : typeof error,
              stack: error instanceof Error ? error.stack : undefined,
              cause:
                error instanceof Error && 'cause' in error
                  ? String((error as Error & { cause?: unknown }).cause ?? '')
                  : undefined,
              debug: {
                panel: step.panel,
                source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                method: step.method,
                trace:
                  step.panel === 'spcoin_write' || step.panel === 'erc20_write'
                    ? getRecentWriteTrace()
                    : getErrorDebugTrace(error),
              },
            },
          },
          false,
        );
      }
    },
    [
      appendLog,
      buildMethodCallEntry,
      executeMethodDescriptor,
      formatFormattedPanelPayload,
      setFormattedOutputDisplay,
      setStatus,
      useLocalSpCoinAccessPackage,
      getRecentWriteTrace,
    ],
  );

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
      const findParamIndex = (labels: string[]) =>
        activeSpCoinWriteDef.params.findIndex((param) => labels.includes(param.label));
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
          const access = createSpCoinLibraryAccess(
            target,
            runner,
            undefined,
            useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          );
          const rates =
            (await (access.contract as SpCoinContractAccess).getRecipientRateList?.(sponsorKey, recipientKey)) ?? [];
          if (!cancelled) {
            const normalizedRates = rates.map((value) => String(value));
            setRecipientRateKeyOptions(normalizedRates);
            setRecipientRateKeyHelpText(
              rates.length > 0
                ? 'Select a Recipient Rate Key from the contract list.'
                : 'No Recipient Rate Keys found for this sponsor/recipient pair.',
            );
            const recipientRateIdx = findParamIndex(['Recipient Rate Key', 'Recipient Rate']);
            if (
              recipientRateIdx >= 0 &&
              !String(spWriteParams[recipientRateIdx] || '').trim() &&
              normalizedRates.length > 0
            ) {
              setSpWriteParams((prev) => {
                if (String(prev[recipientRateIdx] || '').trim()) return prev;
                const next = [...prev];
                next[recipientRateIdx] = normalizedRates[0];
                return next;
              });
            }
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
        const access = createSpCoinLibraryAccess(
          target,
          runner,
          undefined,
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        );
        const rates = (await (access.contract as SpCoinContractAccess).getAgentRateList?.(
          sponsorKey,
          recipientKey,
          recipientRateKey,
          agentKey,
        )) as Array<string | bigint> | undefined;
        if (!cancelled) {
          const normalizedRates = (rates ?? []).map((value) => String(value));
          setAgentRateKeyOptions(normalizedRates);
          setAgentRateKeyHelpText(
            (rates ?? []).length > 0
              ? 'Select an Agent Rate Key from the contract list.'
              : 'No Agent Rate Keys found for this sponsor/recipient/agent combination.',
          );
          const agentRateIdx = findParamIndex(['Agent Rate Key', 'Agent Rate']);
          if (
            agentRateIdx >= 0 &&
            !String(spWriteParams[agentRateIdx] || '').trim() &&
            normalizedRates.length > 0
          ) {
            setSpWriteParams((prev) => {
              if (String(prev[agentRateIdx] || '').trim()) return prev;
              const next = [...prev];
              next[agentRateIdx] = normalizedRates[0];
              return next;
            });
          }
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
    setSpWriteParams,
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
