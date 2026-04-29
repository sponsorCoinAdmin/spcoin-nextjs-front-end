import { useCallback } from 'react';
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
import {
  normalizeSpCoinReadMethod,
  runSpCoinReadMethod,
  type SpCoinReadMethod,
} from '../jsonMethods/spCoin/read';
import {
  normalizeSpCoinWriteMethod,
  runSpCoinWriteMethod,
  type SpCoinWriteMethod,
} from '../jsonMethods/spCoin/write';
import {
  runSerializationTestMethod,
  type SerializationTestMethod,
} from '../jsonMethods/serializationTests';
import { createSpCoinContract, createSpCoinLibraryAccess, type SpCoinContractAccess } from '../jsonMethods/shared';
import type { ConnectionMode, MethodPanelMode } from '../scriptBuilder/types';
import { getTransactionList as localGetTransactionList } from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getTransactionList';
import { getAccountTransactionList as localGetAccountTransactionList } from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountTransactionList';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import {
  attachExecutionMeta,
  attachReadDebugTrace,
  buildExecutionMeta,
  isEmptyAccountRateListReadError,
  isMalformedAccountRateListInput,
  type MethodExecutionMeta,
} from './methodExecutionHelpers';
import {
  deriveReadWarningPayload,
  normalizeWriteResultForDisplay,
} from './methodOutputFormatting';

interface MethodParamEntry { key: string; value: string }
type MethodDefMap = Record<string, MethodDef>;
interface MethodCallEntry {
  method: string;
  parameters: { label: string; value: unknown }[];
}

export interface MethodExecutionDescriptor {
  panel: MethodPanelMode;
  method: string;
  params: MethodParamEntry[];
  sender?: string;
}

export interface MethodExecutionResult {
  call: MethodCallEntry;
  result: unknown;
  warning?: unknown;
  meta?: MethodExecutionMeta;
}

interface ServerBackedStepResult {
  result: unknown;
  warning?: Record<string, unknown>;
  meta?: MethodExecutionMeta;
}

interface WriteReceipt {
  label: string;
  txHash: string;
  receiptHash: string;
  blockNumber: string;
  status: string;
}

type AccountKeyCountContract = SpCoinContractAccess & {
  getAccountKeyCount?: () => Promise<unknown>;
  getMasterAccountKeys?: () => Promise<unknown>;
};

interface Params {
  rpcUrl?: string;
  mode: ConnectionMode;
  selectedHardhatAddress?: string;
  effectiveConnectedAddress: string;
  hardhatAccounts: { address: string; privateKey?: string }[];
  useLocalSpCoinAccessPackage: boolean;
  traceEnabled: boolean;
  appendLog: (line: string) => void;
  appendWriteTrace: (line: string) => void;
  setStatus: (value: string) => void;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<unknown>;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: any, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  stringifyResult: (result: unknown) => string;
  parseListParam: (raw: string) => string[];
  buildMethodCallEntry: (
    method: string,
    params?: { label: string; value: unknown }[],
  ) => MethodCallEntry;
  spCoinReadMethodDefs: MethodDefMap;
  spCoinWriteMethodDefs: MethodDefMap;
  serializationTestMethodDefs: MethodDefMap;
}

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function useSponsorCoinLabMethodExecution({
  rpcUrl,
  mode,
  selectedHardhatAddress,
  effectiveConnectedAddress,
  hardhatAccounts,
  useLocalSpCoinAccessPackage,
  traceEnabled,
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
}: Params) {
  const runServerBackedSpCoinStep = useCallback(
    async (
      panel: 'spcoin_rread' | 'spcoin_write',
      method: string,
      params: MethodParamEntry[],
      sender?: string,
      executionSignal?: AbortSignal,
    ): Promise<ServerBackedStepResult> => {
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
        results?: {
          success?: boolean;
          payload?: {
            result?: unknown;
            warning?: Record<string, unknown> | undefined;
            error?: { message?: string };
            meta?: MethodExecutionMeta;
          };
        }[];
      };
      if (!response.ok) {
        throw new Error(payload?.message ?? `Unable to run ${method} (${response.status})`);
      }
      const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
      if (!firstResult?.success) {
        const nextError = new Error(firstResult?.payload?.error?.message ?? `Unable to run ${method}.`);
        attachExecutionMeta(nextError, firstResult?.payload?.meta);
        throw nextError;
      }
      return {
        result: firstResult?.payload?.result,
        warning: firstResult?.payload?.warning,
        meta: firstResult?.payload?.meta,
      };
    },
    [mode, requireContractAddress, rpcUrl, useLocalSpCoinAccessPackage],
  );

  const executeMethodDescriptor = useCallback(
    async (
      descriptor: MethodExecutionDescriptor,
      options?: { executionSignal?: AbortSignal },
    ): Promise<MethodExecutionResult> => {
      const executionStartedAtMs = Date.now();
      const executionTimingCollector = traceEnabled ? createMethodTimingCollector(executionStartedAtMs) : null;
      const { panel, method, params, sender = '' } = descriptor;
      const executionSignal = options?.executionSignal;
      const finalizeMeta = () => (executionTimingCollector ? buildExecutionMeta(executionTimingCollector) : undefined);
      const defaultSender =
        mode === 'hardhat' ? (selectedHardhatAddress ?? effectiveConnectedAddress) : effectiveConnectedAddress;
      const findParamValue = (label: string) =>
        String(params.find((entry) => String(entry?.key ?? '') === label)?.value ?? '').trim();

      const executeBody = async (shouldUseServerBackedWrite: boolean): Promise<MethodExecutionResult> => {
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
          const signer = sender ? sender : defaultSender;
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
          if (
            ['getMasterAccountCount', 'getAccountKeyCount', 'getMasterAccountListSize', 'getAccountListSize'].includes(
              normalizedSelectedMethod,
            )
          ) {
            const target = requireContractAddress();
            const runner = await ensureReadRunner();
            const contract = createSpCoinContract(target, runner) as AccountKeyCountContract;
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
            const accountKeys: unknown =
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
                const noopLogger = { logFunctionHeader: () => undefined, logExitFunction: () => undefined };
                result = localGetAccountTransactionList(
                  {
                    spCoinLogger: noopLogger,
                    getTransactionList: (rows: string[]) => localGetTransactionList({ spCoinLogger: noopLogger }, rows),
                  },
                  rateRewardList,
                );
              }
            } else if (shouldUseServerBackedRead) {
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
            toDisplayString((result as Record<string, unknown>).__spcoinWarningType).trim() === 'malformed_rate_reward_list'
          ) {
            result = Array.isArray((result as Record<string, unknown>).items)
              ? (result as Record<string, unknown>).items
              : [];
          }
          if (['getMasterAccountKeys', 'getAccountKeys'].includes(normalizedSelectedMethod)) {
            try {
              const accountKeys = Array.isArray(result) ? result : [];
              const accounts = accountKeys.map((accountKey) => toDisplayString(accountKey));
              return {
                call,
                result: {
                  spCoinMetaData: { __lazySpCoinMetaData: true },
                  accounts,
                },
                ...(warning ? { warning } : {}),
                meta: serverBackedMeta ?? finalizeMeta(),
              };
            } catch {
              return { call, result, ...(warning ? { warning } : {}), meta: serverBackedMeta ?? finalizeMeta() };
            }
          }
          return { call, result, ...(warning ? { warning } : {}), meta: serverBackedMeta ?? finalizeMeta() };
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
            selectedHardhatAddress: defaultSender,
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
            const sponsors = sponsorKeys.map((accountKey) => ({ address: toDisplayString(accountKey) }));
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
        const signer = sender ? sender : defaultSender;
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
          const serverResult = result as ServerBackedStepResult;
          return { call, result: normalizeWriteResultForDisplay(serverResult.result), meta: serverResult.meta ?? finalizeMeta() };
        }
        const writeResult = result as { receipts: WriteReceipt[]; meta: MethodExecutionMeta | undefined };
        return { call, result: normalizeWriteResultForDisplay(writeResult.receipts), meta: writeResult.meta ?? finalizeMeta() };
      };

      try {
        return executionTimingCollector
          ? await runWithMethodTimingCollector(executionTimingCollector, async () => executeBody(true))
          : await executeBody(false);
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
      parseListParam,
      requireContractAddress,
      runServerBackedSpCoinStep,
      selectedHardhatAddress,
      serializationTestMethodDefs,
      setStatus,
      spCoinReadMethodDefs,
      spCoinWriteMethodDefs,
      stringifyResult,
      traceEnabled,
      useLocalSpCoinAccessPackage,
    ],
  );

  return { executeMethodDescriptor };
}
