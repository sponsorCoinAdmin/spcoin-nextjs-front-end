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
type MethodExecutionPayloadMeta = Partial<MethodExecutionMeta> & Record<string, unknown>;

export interface MethodExecutionDescriptor {
  panel: MethodPanelMode;
  method: string;
  params: MethodParamEntry[];
  sender?: string;
  mode?: ConnectionMode;
}

export interface MethodExecutionResult {
  call: MethodCallEntry;
  result?: unknown;
  warning?: unknown;
  meta?: MethodExecutionPayloadMeta;
  onChainCalls?: MethodExecutionMeta['onChainCalls'];
}

interface ServerBackedStepResult {
  result?: unknown;
  warning?: Record<string, unknown>;
  meta?: MethodExecutionPayloadMeta;
  onChainCalls?: MethodExecutionMeta['onChainCalls'];
}

interface WriteReceipt {
  label: string;
  txHash: string;
  receiptHash: string;
  blockNumber: string;
  status: string;
}

type AccountKeyCountContract = SpCoinContractAccess & {
  getMasterAccountKeyCount?: () => Promise<unknown>;
  getAccountKeyCount?: () => Promise<unknown>;
  getMasterAccountKeys?: () => Promise<unknown>;
  getMasterAccountMetaData?: () => Promise<unknown>;
};

function isMissingContractReadError(error: unknown) {
  const source = (error && typeof error === 'object' ? error : {}) as Record<string, unknown>;
  const nested = ((source.error || source.info || source.cause) && typeof (source.error || source.info || source.cause) === 'object'
    ? (source.error || source.info || source.cause)
    : {}) as Record<string, unknown>;
  const code = String(source.code || nested.code || '');
  const data = String(source.data || nested.data || '');
  const message = String(source.message || nested.message || '');
  return code === 'CALL_EXCEPTION' || data === '0x' || /execution reverted|require\(false\)|no matching fragment/i.test(message);
}

const OWNER_OR_SPONSOR_WRITE_METHODS = new Set<string>([
  'addRecipientTransaction',
  'addAgentTransaction',
  'deleteSponsor',
  'deleteRecipient',
  'deleteRecipientRate',
  'deleteAgent',
  'deleteAgentNode',
  'deleteAgentRate',
  'deleteRecipientSponsorships',
  'deleteRecipientSponsorshipTree',
  'deleteAgentSponsorships',
]);

const OWNER_ONLY_WRITE_METHODS = new Set<string>([
  'addBackDatedRecipientTransaction',
  'addBackDatedAgentTransaction',
  'backDateRecipientTransaction',
  'backDateAgentTransaction',
  'setInflationRate',
  'setLowerRecipientRate',
  'setUpperRecipientRate',
  'setRecipientRateRange',
  'setRecipientRateIncrement',
  'setLowerAgentRate',
  'setUpperAgentRate',
  'setAgentRateRange',
  'setAgentRateIncrement',
]);

const OWNER_OR_ACCOUNT_WRITE_METHODS = new Set<string>([
  'deleteAccountRecord',
]);

function normalizeAddressForCompare(value: unknown) {
  const trimmed = toDisplayString(value).trim();
  return /^0x[0-9a-f]{40}$/i.test(trimmed) ? trimmed.toLowerCase() : '';
}

function isSameAddress(left: unknown, right: unknown) {
  const normalizedLeft = normalizeAddressForCompare(left);
  const normalizedRight = normalizeAddressForCompare(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function findLocalParamValue(def: MethodDef, localParams: string[], label: string) {
  const index = def.params.findIndex(
    (param) => String(param.label || '').trim().toLowerCase() === String(label || '').trim().toLowerCase(),
  );
  return index >= 0 ? toDisplayString(localParams[index]).trim() : '';
}

function addSpCoinWriteResultDetail(
  result: unknown,
  selectedMethod: SpCoinWriteMethod,
  def: MethodDef,
  localParams: string[],
) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result;
  if (selectedMethod !== 'addAgentTransaction' && selectedMethod !== 'addRecipientTransaction') return result;

  const sponsor = findLocalParamValue(def, localParams, 'Sponsor Key');
  if (!sponsor) return result;

  const methodDetail: Record<string, unknown> = {
    sponsor: {
      address: sponsor,
    },
  };

  return {
    ...(result as Record<string, unknown>),
    [selectedMethod]: methodDetail,
  };
}

interface Params {
  rpcUrl?: string;
  mode: ConnectionMode;
  selectedHardhatAddress?: string;
  effectiveConnectedAddress: string;
  ownerAddress?: string;
  hardhatAccounts: { address: string; privateKey?: string }[];
  useLocalSpCoinAccessPackage: boolean;
  traceEnabled: boolean;
  appendLog: (line: string) => void;
  appendWriteTrace: (line: string) => void;
  setStatus: (value: string) => void;
  requireContractAddress: () => string;
  ensureReadRunner: (modeOverride?: ConnectionMode) => Promise<unknown>;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: any, signer: any) => Promise<any>,
    accountKey?: string,
    modeOverride?: ConnectionMode,
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function omitOnChainCalls(meta: MethodExecutionPayloadMeta | undefined): MethodExecutionPayloadMeta | undefined {
  if (!meta) return meta;
  const { onChainCalls: _oc, ...rest } = meta as Record<string, unknown>;
  return rest as MethodExecutionPayloadMeta;
}

function buildExecutionResultPayload(
  call: MethodCallEntry,
  result: unknown,
  warning: unknown,
  meta: MethodExecutionPayloadMeta | undefined,
): MethodExecutionResult {
  if (toDisplayString(call.method).trim() === 'getMasterAccountMetaData') {
    const metadata = isObjectRecord(result) ? result : {};
    return {
      call,
      ...(warning ? { warning } : {}),
      meta: {
        startedAt: meta?.startedAt,
        completedAt: meta?.completedAt,
        offChainRunTimeMs: meta?.offChainRunTimeMs,
        onChainRunTimeMs: meta?.onChainRunTimeMs,
        totalRunTimeMS: meta?.totalRunTimeMs,
        onChainCallCount: meta?.onChainCallCount,
        activeAccountCount: metadata.activeAccountCount,
        inactiveAccountCount: metadata.inactiveAccountCount,
        masterAccountSize: metadata.masterAccountSize ?? metadata.numberOfAccounts,
      },
      result: {
        masterAccountKeys: { __lazyMasterAccountKeys: true },
      },
      onChainCalls: meta?.onChainCalls,
    };
  }

  const { onChainCalls: _oc, ...metaWithoutOnChainCalls } = (meta ?? {}) as Record<string, unknown>;
  return { call, result, ...(warning ? { warning } : {}), meta: metaWithoutOnChainCalls };
}

export function useSponsorCoinLabMethodExecution({
  rpcUrl,
  mode,
  selectedHardhatAddress,
  effectiveConnectedAddress,
  ownerAddress,
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
      modeOverride: ConnectionMode = mode,
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
            network: modeOverride === 'hardhat' ? 'hardhat' : 'metamask',
            steps: [
              {
                step: 1,
                name: method,
                panel,
                method,
                mode: modeOverride,
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
            meta?: MethodExecutionPayloadMeta;
            onChainCalls?: MethodExecutionMeta['onChainCalls'];
          };
        }[];
      };
      if (!response.ok) {
        throw new Error(payload?.message ?? `Unable to run ${method} (${response.status})`);
      }
      const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
      if (!firstResult?.success) {
        const nextError = new Error(firstResult?.payload?.error?.message ?? `Unable to run ${method}.`);
        attachExecutionMeta(nextError, firstResult?.payload?.meta as MethodExecutionMeta | undefined);
        throw nextError;
      }
      return {
        result: firstResult?.payload?.result,
        warning: firstResult?.payload?.warning,
        meta: firstResult?.payload?.meta,
        onChainCalls: firstResult?.payload?.onChainCalls,
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
      const effectiveMode = descriptor.mode ?? mode;
      const executionSignal = options?.executionSignal;
      const finalizeMeta = () => (executionTimingCollector ? buildExecutionMeta(executionTimingCollector) : undefined);
      const defaultSender =
        effectiveMode === 'hardhat' ? (selectedHardhatAddress ?? effectiveConnectedAddress) : effectiveConnectedAddress;
      const findParamValue = (label: string) =>
        String(params.find((entry) => String(entry?.key ?? '') === label)?.value ?? '').trim();
      const resolveOwnerAddress = async () => {
        const fallbackOwnerAddress = normalizeAddressForCompare(ownerAddress);
        try {
          const target = requireContractAddress();
          const runner = await ensureReadRunner(effectiveMode);
          const contract = createSpCoinContract(target, runner) as SpCoinContractAccess & {
            owner?: () => Promise<unknown>;
          };
          if (typeof contract.owner === 'function') {
            return normalizeAddressForCompare(await contract.owner()) || fallbackOwnerAddress;
          }
        } catch {
          // The write call will surface the underlying network/contract issue if owner() cannot be read.
        }
        return fallbackOwnerAddress;
      };
      const assertSpCoinWriteAuthorization = async (
        selectedMethod: SpCoinWriteMethod,
        def: MethodDef,
        localParams: string[],
        signer: string,
      ) => {
        const signerAddress = normalizeAddressForCompare(signer);
        if (!signerAddress) return;

        const ownerOnly = OWNER_ONLY_WRITE_METHODS.has(selectedMethod);
        const guardedAccountLabel = OWNER_OR_SPONSOR_WRITE_METHODS.has(selectedMethod)
          ? 'Sponsor Key'
          : OWNER_OR_ACCOUNT_WRITE_METHODS.has(selectedMethod)
            ? 'Account Key'
            : '';
        if (!ownerOnly && !guardedAccountLabel) return;

        const contractOwner = await resolveOwnerAddress();
        if (contractOwner && signerAddress === contractOwner) return;
        const buildAuthorizationError = (message: string) => {
          const error = new Error(message);
          (error as { spCoinActualSigner?: string }).spCoinActualSigner = signer;
          return error;
        };

        if (ownerOnly) {
          throw buildAuthorizationError(
            `${selectedMethod} requires the contract owner signer. Current signer is ${signer}.` +
              (contractOwner ? ` Contract owner is ${contractOwner}.` : ''),
          );
        }

        const guardedAccount = findLocalParamValue(def, localParams, guardedAccountLabel);
        if (!guardedAccount || isSameAddress(signerAddress, guardedAccount)) return;

        throw buildAuthorizationError(
          `${selectedMethod} requires msg.sender to be ${guardedAccountLabel} or the contract owner. ` +
            `Current signer is ${signer}; ${guardedAccountLabel} is ${guardedAccount}.` +
            (effectiveMode === 'metamask'
              ? ' In MetaMask mode, switch the connected wallet to the sponsor/owner account or run the script in Hardhat mode with that sender.'
              : ' Select the sponsor/owner account as msg.sender.'),
        );
      };

      const executeBody = async (allowServerBackedWrite: boolean): Promise<MethodExecutionResult> => {
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
            ensureReadRunner: () => ensureReadRunner(effectiveMode),
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
          const signer = effectiveMode === 'hardhat' ? (sender || defaultSender) : defaultSender;
          const call = buildMethodCallEntry(selectedMethod, [
            ...(effectiveMode === 'hardhat' || signer ? [{ label: 'msg.sender', value: signer }] : []),
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
            executeWriteConnected: (label, writeCall, accountKey) =>
              executeWriteConnected(label, writeCall, accountKey, effectiveMode),
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
            `mode=${effectiveMode}`,
            `params=${JSON.stringify(def.params.map((param, idx) => ({ key: param.label, value: localParams[idx] || '' })))}`,
          ];
          let serverBackedMeta: MethodExecutionPayloadMeta | undefined;
          let warning: unknown;
          if (
            [
              'getMasterAccountKeyCount',
              'getMasterAccountCount',
              'getAccountKeyCount',
              'getMasterAccountListSize',
              'getAccountListSize',
            ].includes(normalizedSelectedMethod)
          ) {
            const target = requireContractAddress();
            const runner = await ensureReadRunner(effectiveMode);
            const fallbackAccess = createSpCoinLibraryAccess(
              target,
              runner,
              undefined,
              useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
            );
            if (typeof fallbackAccess.read.getMasterAccountKeyCount === 'function') {
              const raw = await fallbackAccess.read.getMasterAccountKeyCount();
              return { call, result: Number(raw), meta: finalizeMeta() };
            }
            const contract = createSpCoinContract(target, runner) as AccountKeyCountContract;
            if (typeof fallbackAccess.read.getMasterAccountMetaData === 'function') {
              const metaData = (await fallbackAccess.read.getMasterAccountMetaData()) as Record<string, unknown>;
              return {
                call,
                result: Number(metaData?.masterAccountSize ?? metaData?.numberOfAccounts ?? (Array.isArray(metaData) ? metaData[0] : 0)),
                meta: finalizeMeta(),
              };
            }
            if (typeof contract.getMasterAccountKeyCount === 'function') {
              try {
                const raw = await contract.getMasterAccountKeyCount();
                return { call, result: Number(raw), meta: finalizeMeta() };
              } catch (error) {
                if (!isMissingContractReadError(error)) throw error;
              }
            }
            if (typeof contract.getAccountKeyCount === 'function') {
              try {
                const raw = await contract.getAccountKeyCount();
                return { call, result: Number(raw), meta: finalizeMeta() };
              } catch (error) {
                if (!isMissingContractReadError(error)) throw error;
              }
            }
            let accountKeys: unknown = [];
            if (typeof fallbackAccess.read.getAccountKeys === 'function') {
              accountKeys = await fallbackAccess.read.getAccountKeys();
            } else if (typeof fallbackAccess.read.getMasterAccountKeys === 'function') {
              accountKeys = await fallbackAccess.read.getMasterAccountKeys();
            } else if (typeof contract.getMasterAccountKeys === 'function') {
              try {
                accountKeys = await contract.getMasterAccountKeys();
              } catch (error) {
                if (!isMissingContractReadError(error)) throw error;
              }
            }
            return { call, result: Array.isArray(accountKeys) ? accountKeys.length : 0, meta: finalizeMeta() };
          }
          const shouldUseServerBackedRead =
            useLocalSpCoinAccessPackage &&
            effectiveMode === 'hardhat' &&
            [
              'getAccountRecord',
              'getMasterAccountKeys',
              'getMasterAccountList',
              'getMasterAccountKeyCount',
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
                effectiveMode,
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
                ensureReadRunner: () => ensureReadRunner(effectiveMode),
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
                meta: omitOnChainCalls(serverBackedMeta ?? finalizeMeta()),
                onChainCalls: serverBackedMeta?.onChainCalls,
              };
            } catch {
              return { call, result, ...(warning ? { warning } : {}), meta: omitOnChainCalls(serverBackedMeta ?? finalizeMeta()), onChainCalls: serverBackedMeta?.onChainCalls };
            }
          }
          return buildExecutionResultPayload(call, result, warning, serverBackedMeta ?? finalizeMeta());
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
            ensureReadRunner: () => ensureReadRunner(effectiveMode),
            mode: effectiveMode,
            hardhatAccounts,
            executeWriteConnected: (label, writeCall, accountKey) =>
              executeWriteConnected(label, writeCall, accountKey, effectiveMode),
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
        const signer = effectiveMode === 'hardhat' ? (sender || defaultSender) : defaultSender;
        const call = buildMethodCallEntry(selectedMethod, [
          ...(effectiveMode === 'hardhat' || signer ? [{ label: 'msg.sender', value: signer }] : []),
          ...def.params.map((param, idx) => ({
            label: param.label,
            value: localParams[idx] || '',
          })),
        ]);
        appendWriteTrace(
          `runMethod start; mode=${effectiveMode}; source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}; method=${selectedMethod}`,
        );
        await assertSpCoinWriteAuthorization(selectedMethod, def, localParams, signer);
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
            ensureReadRunner: () => ensureReadRunner(effectiveMode),
            mode: effectiveMode,
            hardhatAccounts,
            executeWriteConnected: (label, writeCall, accountKey) =>
              executeWriteConnected(label, writeCall, accountKey, effectiveMode),
            spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
            selectedHardhatAddress: signer,
            appendLog,
            setStatus,
          });
          return { call, result: normalizeWriteResultForDisplay(result), meta: finalizeMeta() };
        }

        const shouldUseServerBackedWrite = allowServerBackedWrite && effectiveMode === 'hardhat';
        const result = shouldUseServerBackedWrite
          ? await runServerBackedSpCoinStep(
              'spcoin_write',
              selectedMethod,
              def.params.map((param, idx) => ({
                key: param.label,
                value: localParams[idx] || '',
              })),
              signer,
              effectiveMode,
              executionSignal,
            )
          : await runSpCoinWriteMethod({
              selectedMethod,
              spWriteParams: localParams,
              coerceParamValue,
              executeWriteConnected: (label, writeCall, accountKey) =>
                executeWriteConnected(label, writeCall, accountKey, effectiveMode),
              selectedHardhatAddress: signer,
              appendLog,
              appendWriteTrace,
              spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
              setStatus,
              timingCollector: executionTimingCollector,
            });
        if (shouldUseServerBackedWrite) {
          const serverResult = result as ServerBackedStepResult;
          const displayResult = addSpCoinWriteResultDetail(
            normalizeWriteResultForDisplay(serverResult.result),
            selectedMethod,
            def,
            localParams,
          );
          return { call, result: displayResult, meta: serverResult.meta ?? finalizeMeta() };
        }
        const writeResult = result as { receipts: WriteReceipt[]; meta: MethodExecutionMeta | undefined };
        const displayResult = addSpCoinWriteResultDetail(
          normalizeWriteResultForDisplay(writeResult.receipts),
          selectedMethod,
          def,
          localParams,
        );
        return { call, result: displayResult, meta: writeResult.meta ?? finalizeMeta() };
      };

      const collectChildOnChainCalls = (value: unknown, parentKey = ''): Array<{ method: string; totalOnChainMs: number }> => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
        const record = value as Record<string, unknown>;
        const results: Array<{ method: string; totalOnChainMs: number }> = [];
        for (const [key, child] of Object.entries(record)) {
          if (key === 'onChainCalls' && child && typeof child === 'object' && !Array.isArray(child)) {
            const oc = child as Record<string, unknown>;
            const totalMs = Number(String(oc.totalOnChainMs ?? '0').replace(/,/g, ''));
            if (totalMs > 0) results.push({ method: parentKey || key, totalOnChainMs: totalMs });
          } else {
            results.push(...collectChildOnChainCalls(child, key));
          }
        }
        return results;
      };

      const promoteOnChainCalls = (payload: MethodExecutionResult): MethodExecutionResult => {
        const metaOnChainCalls = (payload.meta as Record<string, unknown> | undefined)?.onChainCalls as MethodExecutionMeta['onChainCalls'] | undefined;
        const topOnChainCalls = payload.onChainCalls ?? metaOnChainCalls;
        if (!topOnChainCalls) return payload;
        const childEntries = collectChildOnChainCalls(payload.result);
        const localMs = Number(String(topOnChainCalls.totalOnChainMs ?? '0').replace(/,/g, ''));
        const childMs = childEntries.reduce((sum, e) => sum + e.totalOnChainMs, 0);
        const mergedOnChainCalls = {
          ...topOnChainCalls,
          ...(childEntries.length > 0 ? { childOnChainCalls: childEntries } : {}),
          totalOnChainMs: localMs + childMs,
        };
        return {
          ...payload,
          meta: omitOnChainCalls(payload.meta),
          onChainCalls: mergedOnChainCalls,
        };
      };

      try {
        const payload = executionTimingCollector
          ? await runWithMethodTimingCollector(executionTimingCollector, async () => executeBody(true))
          : await executeBody(false);
        return promoteOnChainCalls(payload);
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
      ownerAddress,
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
