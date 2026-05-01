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

      const commitResult = (payload: unknown, success: boolean) => {
        const nextFormattedOutput = mergeFormattedOutput(formatFormattedPanelPayload(payload), formattedOutputBase);
        setFormattedOutputDisplay(nextFormattedOutput);
        return {
          success,
          formattedOutput: nextFormattedOutput,
        };
      };

      try {
        const { call, result, warning, meta, onChainCalls } = await executeMethodDescriptor({
          panel: step.panel,
          method: step.method,
          params: paramEntries.map((entry) => ({ key: String(entry.key || ''), value: String(entry.value || '') })),
          sender: stepSender,
          mode: stepMode,
        }, { executionSignal: options?.executionSignal });
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
      buildMethodCallEntry,
      executeMethodDescriptor,
      formatFormattedPanelPayload,
      setFormattedOutputDisplay,
      setStatus,
      useLocalSpCoinAccessPackage,
      getRecentWriteTrace,
    ],
  );

  return { runScriptStep };
}
