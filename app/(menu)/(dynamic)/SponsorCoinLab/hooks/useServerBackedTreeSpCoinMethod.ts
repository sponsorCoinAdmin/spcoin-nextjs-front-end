import { useCallback } from 'react';
import type { ConnectionMode } from '../scriptBuilder/types';
import type { MethodExecutionMeta } from './methodExecutionHelpers';

export type ServerBackedTreeSpCoinMethodArgs = {
  panel: 'spcoin_rread' | 'spcoin_write';
  method: string;
  params: { key: string; value: string }[];
  sender?: string;
  cacheMode?: 'default' | 'refresh' | 'bypass' | 'only';
  useCache?: boolean;
};

export type ServerBackedTreeSpCoinMethodResult = {
  result?: unknown;
  warning?: unknown;
  meta?: MethodExecutionMeta;
  onChainCalls?: MethodExecutionMeta['onChainCalls'];
};

interface UseServerBackedTreeSpCoinMethodParams {
  appendWriteTrace?: (line: string) => void;
  mode: ConnectionMode;
  readCacheNamespace?: string;
  requireContractAddress: () => string;
  rpcUrl?: string;
  traceEnabled?: boolean;
  useLocalSpCoinAccessPackage: boolean;
  useReadCache?: boolean;
}

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function useServerBackedTreeSpCoinMethod({
  appendWriteTrace,
  mode,
  readCacheNamespace,
  requireContractAddress,
  rpcUrl,
  traceEnabled,
  useLocalSpCoinAccessPackage,
  useReadCache,
}: UseServerBackedTreeSpCoinMethodParams) {
  return useCallback(
    async ({
      panel,
      method,
      params,
      sender,
      cacheMode,
      useCache,
    }: ServerBackedTreeSpCoinMethodArgs): Promise<ServerBackedTreeSpCoinMethodResult> => {
      const target = requireContractAddress();
      appendWriteTrace?.(
        `[SPCOIN_RPC_TRACE] tree server-backed dispatch panel=${panel} method=${method} mode=${mode} sender=${String(sender || '')}`,
      );
      const response = await fetch('/api/spCoin/run-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: target,
          rpcUrl,
          spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          ...(cacheMode ? { cacheMode } : useCache !== undefined ? { useCache } : useReadCache === undefined ? {} : { useCache: useReadCache }),
          cacheNamespace: readCacheNamespace,
          traceCache: traceEnabled === true,
          script: {
            id: `tree-${method}-${Date.now()}`,
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
            warning?: unknown;
            meta?: MethodExecutionMeta;
            onChainCalls?: MethodExecutionMeta['onChainCalls'];
            error?: { message?: unknown; debug?: { trace?: unknown } };
            debug?: { trace?: unknown };
          };
        }[];
      };
      if (!response.ok) {
        throw new Error(payload?.message ?? `Unable to run ${method} (${response.status})`);
      }
      const firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
      const serverTrace = (
        firstResult?.payload?.debug?.trace ??
        firstResult?.payload?.error?.debug?.trace ??
        []
      ) as unknown;
      if (Array.isArray(serverTrace)) {
        serverTrace.forEach((line) => appendWriteTrace?.(`server ${String(line)}`));
      }
      if (!firstResult?.success) {
        throw new Error(toDisplayString(firstResult?.payload?.error?.message, `Unable to run ${method}.`));
      }
      return {
        result: firstResult.payload?.result,
        warning: firstResult.payload?.warning,
        meta: firstResult.payload?.meta,
        onChainCalls: firstResult.payload?.onChainCalls,
      };
    },
    [appendWriteTrace, mode, readCacheNamespace, requireContractAddress, rpcUrl, traceEnabled, useLocalSpCoinAccessPackage, useReadCache],
  );
}
