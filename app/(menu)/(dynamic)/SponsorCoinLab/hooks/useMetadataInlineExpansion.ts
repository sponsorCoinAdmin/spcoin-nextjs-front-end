import { useCallback, type MutableRefObject } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import { runSpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { normalizeStringListResult } from '../jsonMethods/shared/normalizeListResult';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import { buildExecutionMeta } from './methodExecutionHelpers';
import type { AccessMethodCaller } from './useAccessMethodCaller';
import {
  buildTreePayloadBlockEntries,
  selectTreePayloadCandidateEntries,
} from './treePayloadUtils';

const noop = () => undefined;

type InlineExpansionResult = 'expanded' | 'handled' | 'unhandled';

interface UseMetadataInlineExpansionParams {
  appendLog: (line: string) => void;
  callAccessMethod?: AccessMethodCaller;
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  ensureReadRunner: () => Promise<any>;
  formatFormattedPanelPayload: (payload: unknown) => string;
  formattedOutputDisplayRef: MutableRefObject<string>;
  readCacheNamespace?: string;
  requireContractAddress: () => string;
  setFormattedOutputDisplay: (value: string) => void;
  setStatus: (value: string) => void;
  stringifyResult: (result: unknown) => string;
  useLocalSpCoinAccessPackage: boolean;
  useReadCache?: boolean;
}

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

function replaceDisplayBlock(
  blocks: string[],
  blockIndex: number,
  nextPayload: string,
  setFormattedOutputDisplay: (value: string) => void,
) {
  if (blocks.length > 1) {
    const nextBlocks = [...blocks];
    nextBlocks[blockIndex] = nextPayload;
    setFormattedOutputDisplay(nextBlocks.join('\n\n'));
    return;
  }
  setFormattedOutputDisplay(nextPayload);
}

export function useMetadataInlineExpansion({
  appendLog,
  callAccessMethod,
  coerceParamValue,
  ensureReadRunner,
  formatFormattedPanelPayload,
  formattedOutputDisplayRef,
  readCacheNamespace,
  requireContractAddress,
  setFormattedOutputDisplay,
  setStatus,
  stringifyResult,
  useLocalSpCoinAccessPackage,
  useReadCache,
}: UseMetadataInlineExpansionParams) {
  const expandSpCoinMetaDataInline = useCallback(
    async (pathHint?: string): Promise<InlineExpansionResult> => {
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint.includes('.result.spCoinMetaData')) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplayRef.current ?? '').trim();
      if (trimmedDisplay.length === 0 || trimmedDisplay === '(no output yet)') return 'unhandled';

      const { blocks, blockEntries } = buildTreePayloadBlockEntries(trimmedDisplay);
      const rootPathMatch = /^(?:step|output)-(\d+)(?:\.|$)/i.exec(normalizedPathHint);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries = selectTreePayloadCandidateEntries(blockEntries, hintedBlockIndex);

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
                useReadCache,
                readCacheNamespace,
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
          replaceDisplayBlock(blocks, entry.index, nextPayload, setFormattedOutputDisplay);
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
      callAccessMethod,
      coerceParamValue,
      ensureReadRunner,
      formatFormattedPanelPayload,
      formattedOutputDisplayRef,
      readCacheNamespace,
      requireContractAddress,
      setFormattedOutputDisplay,
      setStatus,
      stringifyResult,
      useLocalSpCoinAccessPackage,
      useReadCache,
    ],
  );

  const expandMasterAccountKeysInline = useCallback(
    async (pathHint?: string): Promise<InlineExpansionResult> => {
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint.includes('.result.masterAccountKeys')) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplayRef.current ?? '').trim();
      if (trimmedDisplay.length === 0 || trimmedDisplay === '(no output yet)') return 'unhandled';

      const { blocks, blockEntries } = buildTreePayloadBlockEntries(trimmedDisplay);
      const rootPathMatch = /^(?:step|output)-(\d+)(?:\.|$)/i.exec(normalizedPathHint);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries = selectTreePayloadCandidateEntries(blockEntries, hintedBlockIndex);

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
              useReadCache,
              readCacheNamespace,
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
          replaceDisplayBlock(blocks, entry.index, nextPayload, setFormattedOutputDisplay);
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
      callAccessMethod,
      coerceParamValue,
      ensureReadRunner,
      formatFormattedPanelPayload,
      formattedOutputDisplayRef,
      readCacheNamespace,
      requireContractAddress,
      setFormattedOutputDisplay,
      setStatus,
      stringifyResult,
      useLocalSpCoinAccessPackage,
      useReadCache,
    ],
  );

  return {
    expandMasterAccountKeysInline,
    expandSpCoinMetaDataInline,
  };
}
