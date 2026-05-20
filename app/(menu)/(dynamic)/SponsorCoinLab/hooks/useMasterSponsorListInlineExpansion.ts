import { useCallback, type MutableRefObject } from 'react';
import { normalizeExecutionPayload } from './executionPayload';
import { applyLazyAccountRelationBuckets } from './useLazyAccountRelationExpansion';
import type { AccessMethodCaller } from './useAccessMethodCaller';
import {
  buildTreePayloadBlockEntries,
  readPathValue,
  selectTreePayloadCandidateEntries,
  writePathValue,
} from './treePayloadUtils';

type InlineExpansionResult = 'expanded' | 'handled' | 'unhandled';

interface UseMasterSponsorListInlineExpansionParams {
  appendLog: (line: string) => void;
  callAccessMethod?: AccessMethodCaller;
  formatFormattedPanelPayload: (payload: unknown) => string;
  formattedOutputDisplayRef: MutableRefObject<string>;
  loadAccountRecordForAddress: (
    account: string,
    options?: { force?: boolean; signal?: AbortSignal },
  ) => Promise<unknown>;
  normalizeAddressValue: (value: string) => string;
  setFormattedOutputDisplay: (value: string) => void;
  setStatus: (value: string) => void;
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
}

interface InlineAccountTarget {
  targetEntry: unknown;
  path: string[];
  sourcePath?: string[];
  matchKind?: string;
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

function isAccountAddressPathKey(key: string): boolean {
  const normalized = String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    /^\d+$/.test(normalized) ||
    [
      'account',
      'accountkey',
      'address',
      'agent',
      'agentkey',
      'msgsender',
      'owner',
      'owneraddress',
      'recipient',
      'recipientkey',
      'sender',
      'sponsor',
      'sponsorkey',
    ].includes(normalized)
  );
}

function hasLoadedAccountRecordEntry(entry: unknown) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  const record = entry as Record<string, unknown>;
  return Boolean(record.TYPE ?? record.totalSpCoins ?? record.accountRecord);
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

export function useMasterSponsorListInlineExpansion({
  appendLog,
  callAccessMethod,
  formatFormattedPanelPayload,
  formattedOutputDisplayRef,
  loadAccountRecordForAddress,
  normalizeAddressValue,
  setFormattedOutputDisplay,
  setStatus,
  showValidationPopup,
}: UseMasterSponsorListInlineExpansionParams) {
  return useCallback(
    async (account: string, pathHint?: string): Promise<InlineExpansionResult> => {
      const normalizedAccount = normalizeAddressValue(account);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return 'unhandled';
      const trimmedDisplay = String(formattedOutputDisplayRef.current ?? '').trim();
      if (!trimmedDisplay) return 'unhandled';
      const normalizedPathHint = String(pathHint ?? '').trim();
      const pathSegments = normalizedPathHint.split('.').filter(Boolean);
      if (pathSegments.length < 2) return 'unhandled';
      const rootSegment = pathSegments[0] || '';
      const pathRootMatch = /^(?:step|output|script|tree)-(\d+)$/i.exec(rootSegment);
      const hintedBlockIndex = pathRootMatch ? Number(pathRootMatch[1]) : Number.NaN;
      const payloadPathCandidates = [
        pathRootMatch ? pathSegments.slice(1) : pathSegments,
        pathSegments.slice(1),
      ].filter((segments, index, allSegments) => {
        if (segments.length === 0) return false;
        const targetKey = segments[segments.length - 1] || '';
        if (!isAccountAddressPathKey(targetKey)) return false;
        return allSegments.findIndex((candidate) => candidate.join('.') === segments.join('.')) === index;
      });
      if (payloadPathCandidates.length === 0) return 'unhandled';

      const getAccountAddressFromEntry = (entry: unknown) => {
        if (typeof entry === 'string') return normalizeAddressValue(entry);
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return '';
        return normalizeAddressValue(
          toDisplayString((entry as Record<string, unknown>).address ?? (entry as Record<string, unknown>).accountKey),
        );
      };
      const buildExpandedAccountEntry = (accountRecord: unknown) => {
        const recordObject =
          accountRecord && typeof accountRecord === 'object' && !Array.isArray(accountRecord)
            ? { ...(accountRecord as Record<string, unknown>) }
            : null;
        const accountKeyForBuckets =
          recordObject
            ? normalizeAddressValue(toDisplayString(recordObject.accountKey || normalizedAccount))
            : normalizedAccount;
        if (recordObject) {
          applyLazyAccountRelationBuckets(recordObject, accountKeyForBuckets);
        }
        let callMeta = recordObject && 'meta' in recordObject ? (recordObject.meta as unknown) : undefined;
        const topLevelOnChainCalls = recordObject && 'onChainCalls' in recordObject ? recordObject.onChainCalls : undefined;
        const nestedMetaOnChainCalls =
          recordObject &&
          typeof recordObject.meta === 'object' &&
          recordObject.meta !== null &&
          !Array.isArray(recordObject.meta) &&
          'onChainCalls' in recordObject.meta
            ? (recordObject.meta as Record<string, unknown>).onChainCalls
            : undefined;
        const callOnChainCalls = topLevelOnChainCalls ?? nestedMetaOnChainCalls;
        if (nestedMetaOnChainCalls && recordObject && typeof recordObject.meta === 'object' && !Array.isArray(recordObject.meta)) {
          const sanitizedMeta = { ...(recordObject.meta as Record<string, unknown>) };
          delete sanitizedMeta.onChainCalls;
          callMeta = Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : undefined;
        }

        const expandedResult = recordObject
          ? Object.fromEntries(Object.entries(recordObject).filter(([key]) => key !== 'meta' && key !== 'onChainCalls'))
          : { value: accountRecord };
        return {
          call: {
            method: 'getAccountRecord',
            parameters: {
              'Account Key': normalizedAccount,
            },
          },
          ...(callMeta ? { meta: callMeta } : {}),
          ...(callOnChainCalls ? { onChainCalls: callOnChainCalls } : {}),
          result: expandedResult,
          __forceExpanded: true,
          __showEmptyFields: true,
        };
      };
      const findInlineAccountTarget = (
        source: unknown,
        segments: string[] = [],
      ): InlineAccountTarget | null => {
        if (!source || typeof source !== 'object') return null;
        if (!Array.isArray(source)) {
          const record = source as Record<string, unknown>;
          if (getAccountAddressFromEntry(record) === normalizedAccount && !hasLoadedAccountRecordEntry(record)) {
            return { targetEntry: record, path: segments, matchKind: 'object-address' };
          }
          for (const [key, value] of Object.entries(record)) {
            if (
              isAccountAddressPathKey(key) &&
              typeof value === 'string' &&
              normalizeAddressValue(value) === normalizedAccount
            ) {
              return { targetEntry: value, path: [...segments, key], matchKind: 'leaf-address' };
            }
            const nested = findInlineAccountTarget(value, [...segments, key]);
            if (nested) return nested;
          }
          return null;
        }
        for (let index = 0; index < source.length; index += 1) {
          const nested = findInlineAccountTarget(source[index], [...segments, String(index)]);
          if (nested) return nested;
        }
        return null;
      };
      const normalizeExactTargetPath = (payload: Record<string, unknown>, payloadPath: string[]): InlineAccountTarget | null => {
        const targetEntry = readPathValue(payload, payloadPath);
        if (getAccountAddressFromEntry(targetEntry) !== normalizedAccount) return null;
        const lastSegment = payloadPath[payloadPath.length - 1] ?? '';
        if (isAccountAddressPathKey(lastSegment) && payloadPath.length > 0) {
          const parentPath = payloadPath.slice(0, -1);
          const parentEntry = readPathValue(payload, parentPath);
          if (
            parentEntry &&
            typeof parentEntry === 'object' &&
            !Array.isArray(parentEntry) &&
            getAccountAddressFromEntry(parentEntry) === normalizedAccount &&
            !hasLoadedAccountRecordEntry(parentEntry)
          ) {
            return {
              targetEntry: parentEntry,
              path: parentPath,
              sourcePath: payloadPath,
              matchKind: 'parent-from-address-leaf',
            };
          }
        }
        return {
          targetEntry,
          path: payloadPath,
          sourcePath: payloadPath,
          matchKind: 'exact-leaf',
        };
      };

      const { blocks, blockEntries } = buildTreePayloadBlockEntries(trimmedDisplay);
      const candidateEntries = selectTreePayloadCandidateEntries(blockEntries, hintedBlockIndex);

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) continue;
        const exactTargets = payloadPathCandidates
          .map((payloadPath) => normalizeExactTargetPath(payload, payloadPath))
          .filter((target): target is InlineAccountTarget => Boolean(target));
        const fallbackTarget = exactTargets.length > 0 ? null : findInlineAccountTarget(payload);
        const targets = fallbackTarget ? [...exactTargets, fallbackTarget] : exactTargets;
        for (const target of targets) {
          try {
            setStatus(`Loading account record for ${normalizedAccount}...`);
            const loadInlineAccountRecord = (signal?: AbortSignal) =>
              loadAccountRecordForAddress(normalizedAccount, { force: true, signal });
            const accountRecord = callAccessMethod
              ? await callAccessMethod('getAccountRecord', ({ executionSignal }) => loadInlineAccountRecord(executionSignal))
              : await loadInlineAccountRecord();
            if (accountRecord === undefined) return 'handled';
            const nextAccountEntry = buildExpandedAccountEntry(accountRecord);
            const nextRootPayload = normalizeExecutionPayload(
              writePathValue(payload, target.path, nextAccountEntry),
            ) as Record<string, unknown>;
            const nextPayload = formatFormattedPanelPayload(nextRootPayload);
            replaceDisplayBlock(blocks, entry.index, nextPayload, setFormattedOutputDisplay);
            setStatus(`Loaded account record for ${normalizedAccount}.`);
            appendLog(`Inline account record loaded for ${normalizedAccount}`);
            return 'expanded';
          } catch (error) {
            const message = getErrorMessage(error, 'Unable to load account record.');
            setStatus(`Unable to load account record for ${normalizedAccount}.`);
            appendLog(`Inline account record load failed for ${normalizedAccount}: ${message}`);
            if (/server runner only supports hardhat/i.test(message)) {
              showValidationPopup(
                [],
                [],
                `Account expansion requires Hardhat mode. Current mode is metamask. Switch to Hardhat in the Network settings and try again.`,
                { title: 'Mode Mismatch', confirmLabel: 'OK' },
              );
            }
            return 'handled';
          }
        }
      }
      return 'unhandled';
    },
    [
      appendLog,
      callAccessMethod,
      formatFormattedPanelPayload,
      formattedOutputDisplayRef,
      loadAccountRecordForAddress,
      normalizeAddressValue,
      setFormattedOutputDisplay,
      setStatus,
      showValidationPopup,
    ],
  );
}
