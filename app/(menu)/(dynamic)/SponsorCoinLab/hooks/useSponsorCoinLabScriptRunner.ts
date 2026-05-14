import { useCallback } from 'react';
import type { ConnectionMode, LabScriptStep, MethodPanelMode } from '../scriptBuilder/types';
import {
  getErrorDebugTrace,
  getExecutionMetaFromError,
  type MethodExecutionMeta,
} from './methodExecutionHelpers';
import { mergeFormattedOutput } from './methodOutputFormatting';

interface MethodParamEntry {
  key: string;
  value: string;
}

interface MethodExecutionDescriptor {
  panel: MethodPanelMode;
  method: string;
  params: MethodParamEntry[];
  sender?: string;
  mode?: ConnectionMode;
}

interface MethodExecutionResult {
  call: { method: string; parameters: { label: string; value: unknown }[] };
  result?: unknown;
  warning?: unknown;
  meta?: Partial<MethodExecutionMeta> & Record<string, unknown>;
  onChainCalls?: MethodExecutionMeta['onChainCalls'];
}

interface ScriptRunResult {
  success: boolean;
  formattedOutput: string;
}

interface ScriptRunOptions {
  formattedOutputBase?: string;
  executionSignal?: AbortSignal;
  executionLabel?: string;
  scriptNetwork?: string;
}

interface Params {
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
  setFormattedOutputDisplay: (value: string) => void;
  useLocalSpCoinAccessPackage: boolean;
  appendWriteTrace: (line: string) => void;
  resetWriteTrace: () => void;
  getRecentWriteTrace: () => string[];
  executeMethodDescriptor: (
    descriptor: MethodExecutionDescriptor,
    options?: { executionSignal?: AbortSignal },
  ) => Promise<MethodExecutionResult>;
  buildMethodCallEntry: (
    method: string,
    params?: { label: string; value: unknown }[],
  ) => { method: string; parameters: { label: string; value: unknown }[] };
  formatFormattedPanelPayload: (payload: unknown) => string;
}

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

function normalizeAddress(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function toBigIntAmount(value: unknown) {
  const text = String(value ?? '0').replace(/,/g, '').trim();
  if (!text) return 0n;
  try {
    return BigInt(text);
  } catch {
    return 0n;
  }
}

const PENDING_REWARDS_YEAR_SECONDS = 31556925n;

function calculatePendingStakingRewards(
  stakedAmount: unknown,
  lastUpdateTimeStamp: unknown,
  currentTimeStamp: bigint,
  rate: unknown,
) {
  const lastUpdate = toBigIntAmount(lastUpdateTimeStamp);
  if (lastUpdate <= 0n || currentTimeStamp <= lastUpdate) return 0n;
  return ((currentTimeStamp - lastUpdate) * toBigIntAmount(stakedAmount) * toBigIntAmount(rate)) / 100n / PENDING_REWARDS_YEAR_SECONDS;
}

function formatLocalTimestamp(secondsValue: unknown) {
  const seconds = Number(toBigIntAmount(secondsValue));
  if (!Number.isFinite(seconds) || seconds <= 0) return 'N/A';
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hour24 < 12 ? 'a.m.' : 'p.m.';
  const timeZone =
    date
      .toLocaleTimeString('en-US', { timeZoneName: 'short' })
      .split(' ')
      .pop() || '';
  return `${month}-${day}-${year}, ${hour12}:${minute} ${meridiem}${timeZone ? ` ${timeZone}` : ''}`;
}

function findAccountRecordInPayload(value: unknown, accountKey: string, visited = new Set<unknown>()): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  if (visited.has(value)) return null;
  visited.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findAccountRecordInPayload(entry, accountKey, visited);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    normalizeAddress(record.accountKey) === normalizeAddress(accountKey) &&
    record.totalSpCoins &&
    typeof record.totalSpCoins === 'object' &&
    !Array.isArray(record.totalSpCoins)
  ) {
    return record;
  }

  for (const childValue of Object.values(record)) {
    const found = findAccountRecordInPayload(childValue, accountKey, visited);
    if (found) return found;
  }
  return null;
}

function normalizePendingRewardsSnapshot(value: Record<string, unknown>) {
  return {
    ...value,
    pendingRewards: toBigIntAmount(value.pendingRewards).toString(),
    pendingSponsorRewards: toBigIntAmount(value.pendingSponsorRewards).toString(),
    pendingRecipientRewards: toBigIntAmount(value.pendingRecipientRewards).toString(),
    pendingAgentRewards: toBigIntAmount(value.pendingAgentRewards).toString(),
    __showEmptyFields: true,
  };
}

function calculateAgentRewardsFromSnapshot(accountRecord: Record<string, unknown>, currentTimeStamp: bigint, fallbackLastAgentUpdate: unknown) {
  const agentRates =
    accountRecord.agentRates && typeof accountRecord.agentRates === 'object' && !Array.isArray(accountRecord.agentRates)
      ? (accountRecord.agentRates as Record<string, unknown>)
      : null;
  if (!agentRates) return 0n;

  const recordLastAgentUpdate = toBigIntAmount(accountRecord.lastAgentUpdateTimeStamp ?? accountRecord.lastAgentUpdate ?? fallbackLastAgentUpdate);
  let total = 0n;
  for (const value of Object.values(agentRates)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const rateRecord = value as Record<string, unknown>;
    const explicitLastUpdate = toBigIntAmount(rateRecord.lastUpdateTime);
    const lastUpdate = explicitLastUpdate > 0n ? explicitLastUpdate : recordLastAgentUpdate;
    total += calculatePendingStakingRewards(
      rateRecord.stakedAmount,
      lastUpdate,
      currentTimeStamp,
      rateRecord.agentRate ?? rateRecord.agentRateKey,
    );
  }
  return total;
}

function buildPendingRewardsFromAccountRecordSnapshot(accountRecord: Record<string, unknown>, accountKey: string): Record<string, unknown> | null {
  const totalSpCoins =
    accountRecord.totalSpCoins && typeof accountRecord.totalSpCoins === 'object' && !Array.isArray(accountRecord.totalSpCoins)
      ? (accountRecord.totalSpCoins as Record<string, unknown>)
      : null;
  const pendingRewards =
    totalSpCoins?.pendingRewards && typeof totalSpCoins.pendingRewards === 'object' && !Array.isArray(totalSpCoins.pendingRewards)
      ? (totalSpCoins.pendingRewards as Record<string, unknown>)
      : null;
  if (!pendingRewards) return null;

  const currentTimeStamp = BigInt(Math.floor(Date.now() / 1000));
  const lastSponsorUpdate = pendingRewards.lastSponsorUpdate ?? accountRecord.lastSponsorUpdateTimeStamp ?? '0';
  const lastRecipientUpdate = pendingRewards.lastRecipientUpdate ?? accountRecord.lastRecipientUpdateTimeStamp ?? '0';
  const lastAgentUpdate = pendingRewards.lastAgentUpdate ?? accountRecord.lastAgentUpdateTimeStamp ?? '0';
  const pendingSponsorRewards = toBigIntAmount(pendingRewards.pendingSponsorRewards);
  const pendingRecipientRewards = toBigIntAmount(pendingRewards.pendingRecipientRewards);
  const storedAgentRewards = toBigIntAmount(pendingRewards.pendingAgentRewards);
  const derivedAgentRewards = calculateAgentRewardsFromSnapshot(accountRecord, currentTimeStamp, lastAgentUpdate);
  const pendingAgentRewards = storedAgentRewards > 0n ? storedAgentRewards : derivedAgentRewards;
  const pendingRewardsTotal = pendingSponsorRewards + pendingRecipientRewards + pendingAgentRewards;

  return normalizePendingRewardsSnapshot({
    TYPE: '--ACCOUNT_PENDING_REWARDS--',
    accountKey: normalizeAddress(accountRecord.accountKey || accountKey),
    calculatedTimeStamp: currentTimeStamp.toString(),
    calculatedFormatted: formatLocalTimestamp(currentTimeStamp),
    lastSponsorUpdate: String(lastSponsorUpdate),
    lastRecipientUpdate: String(lastRecipientUpdate),
    lastAgentUpdate: String(lastAgentUpdate),
    pendingRewards: pendingRewardsTotal.toString(),
    pendingSponsorRewards: pendingSponsorRewards.toString(),
    pendingRecipientRewards: pendingRecipientRewards.toString(),
    pendingAgentRewards: pendingAgentRewards.toString(),
  });
}

function parseFormattedOutputBlocks(formattedOutputBase?: string) {
  return String(formattedOutputBase || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !block.startsWith('(no output'))
    .map((block) => {
      try {
        return JSON.parse(block) as unknown;
      } catch {
        return null;
      }
    })
    .filter((block): block is unknown => block !== null);
}

function findPendingRewardsSnapshotInOutput(formattedOutputBase: string | undefined, accountKey: string): Record<string, unknown> | null {
  const blocks = parseFormattedOutputBlocks(formattedOutputBase);
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const accountRecord = findAccountRecordInPayload(blocks[index], accountKey);
    if (!accountRecord) continue;
    const pendingRewards = buildPendingRewardsFromAccountRecordSnapshot(accountRecord, accountKey);
    if (pendingRewards) return pendingRewards;
  }
  return null;
}

function resolveScriptExecutionMode(step: LabScriptStep, scriptNetwork?: string): ConnectionMode | undefined {
  if (step.mode === 'hardhat' || step.mode === 'metamask') return step.mode;

  const network = String(step.network || scriptNetwork || '').trim().toLowerCase();
  if (!network) return undefined;
  if (
    network === 'hardhat' ||
    network === 'hardhat ec2' ||
    network === 'hardhat ec2-base' ||
    network === 'hh_base' ||
    network === 'sponsorcoin hh base'
  ) {
    return 'hardhat';
  }
  if (network === 'metamask') return 'metamask';
  return undefined;
}

export function useSponsorCoinLabScriptRunner({
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
}: Params) {
  const runScriptStep = useCallback(
    async (step: LabScriptStep, options?: ScriptRunOptions): Promise<ScriptRunResult> => {
      const formattedOutputBase = options?.formattedOutputBase;
      const paramEntries = Array.isArray(step.params) ? step.params : [];
      const stepSender = String(step['msg.sender'] ?? '').trim();
      const stepMode = resolveScriptExecutionMode(step, options?.scriptNetwork);
      const descriptor: MethodExecutionDescriptor = {
        panel: step.panel,
        method: step.method,
        params: paramEntries.map((entry) => ({ key: String(entry.key || ''), value: String(entry.value || '') })),
        sender: stepSender,
        mode: stepMode,
      };

      const commitResult = (payload: unknown, success: boolean) => {
        const nextFormattedOutput = mergeFormattedOutput(formatFormattedPanelPayload(payload), formattedOutputBase);
        setFormattedOutputDisplay(nextFormattedOutput);
        return {
          success,
          formattedOutput: nextFormattedOutput,
        };
      };

      try {
        resetWriteTrace();
        appendWriteTrace(
          `script step start; panel=${descriptor.panel}; mode=${descriptor.mode ?? 'current'}; source=${
            useLocalSpCoinAccessPackage ? 'local' : 'node_modules'
          }; method=${descriptor.method}`,
        );
        if (descriptor.sender) {
          appendWriteTrace(`sender=${descriptor.sender}`);
        }
        appendWriteTrace(`params=${JSON.stringify(descriptor.params)}`);
        if (descriptor.panel === 'spcoin_rread' && descriptor.method === 'estimateOffChainTotalRewards') {
          const accountKey = descriptor.params.find((entry) => entry.key === 'Account Key')?.value || '';
          const snapshotResult = findPendingRewardsSnapshotInOutput(formattedOutputBase, accountKey);
          if (snapshotResult) {
            appendWriteTrace(`estimateOffChainTotalRewards using previous getAccountRecord snapshot; accountKey=${accountKey}`);
            const now = new Date().toISOString();
            return commitResult(
              {
                call: buildMethodCallEntry(descriptor.method, descriptor.params.map((entry) => ({ label: entry.key, value: entry.value }))),
                meta: {
                  startedAt: now,
                  completedAt: now,
                  totalRunTimeMs: '0',
                  offChainRunTimeMs: '0',
                  onChainRunTimeMs: '0',
                  onChainCallCount: '0',
                },
                result: snapshotResult,
              },
              true,
            );
          }
          appendWriteTrace(`estimateOffChainTotalRewards no previous snapshot; running method; accountKey=${accountKey}`);
        }
        const { call, result, warning, meta, onChainCalls } = await executeMethodDescriptor(descriptor, { executionSignal: options?.executionSignal });
        return commitResult({ call, meta, ...(onChainCalls ? { onChainCalls } : {}), result, ...(warning ? { warning } : {}) }, true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Unknown ${step.panel === 'erc20_write' || step.panel === 'spcoin_write' ? 'write' : 'read'} method error.`;
        const actualSigner = toDisplayString((error as { spCoinActualSigner?: unknown } | null)?.spCoinActualSigner).trim();
        const call = buildMethodCallEntry(
          step.method,
          [
            ...(actualSigner || stepSender ? [{ label: 'msg.sender', value: actualSigner || stepSender }] : []),
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
                  ? toDisplayString((error as Error & { cause?: unknown }).cause)
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
      appendWriteTrace,
      buildMethodCallEntry,
      executeMethodDescriptor,
      formatFormattedPanelPayload,
      resetWriteTrace,
      setFormattedOutputDisplay,
      setStatus,
      useLocalSpCoinAccessPackage,
      getRecentWriteTrace,
    ],
  );

  return { runScriptStep };
}
