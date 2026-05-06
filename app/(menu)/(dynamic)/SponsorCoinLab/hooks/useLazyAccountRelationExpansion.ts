import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { normalizeStringListResult } from '../jsonMethods/shared/normalizeListResult';
import { normalizeExecutionPayload } from './executionPayload';

export type LazyAccountRelationClick = {
  accountKey: string;
  relation: string;
  count: number;
};

type LazyRelationReadResult = {
  keys: string[];
  call: {
    method: string;
    parameters: Record<string, string>;
  };
  meta?: unknown;
  onChainCalls?: unknown;
};

type ExpandResult = 'expanded' | 'handled' | 'unhandled';

type Params = {
  appendLog: (line: string) => void;
  formatFormattedPanelPayload: (payload: Record<string, unknown>) => string;
  formattedOutputDisplayRef: MutableRefObject<string>;
  treeOutputDisplayRef: MutableRefObject<string>;
  normalizeAddressValue: (value: string) => string;
  requireContractAddress: () => string;
  rpcUrl?: string;
  setFormattedOutputDisplay: (value: string) => void;
  setStatus: (value: string) => void;
  setTrackedTreeOutputDisplay: (value: string) => void;
};

export const accountExpandTrace = (message: string) => `[ACCOUNT_EXPAND_TRACE] ${message}`;

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

export function toNonNegativeCount(value: unknown): number {
  const count = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function buildLazyAccountRelation(accountKey: string, relation: string, countValue: unknown) {
  return {
    __lazyAccountRelation: true,
    accountKey,
    relation,
    count: toNonNegativeCount(countValue),
  };
}

export function applyLazyAccountRelationBuckets(accountRecord: Record<string, unknown>, accountKey: string) {
  accountRecord.sponsorKeys = buildLazyAccountRelation(accountKey, 'sponsorKeys', accountRecord.sponsorCount);
  accountRecord.recipientKeys = buildLazyAccountRelation(accountKey, 'recipientKeys', accountRecord.recipientCount);
  accountRecord.agentKeys = buildLazyAccountRelation(accountKey, 'agentKeys', accountRecord.agentCount);
  accountRecord.parentRecipientKeys = buildLazyAccountRelation(
    accountKey,
    'parentRecipientKeys',
    accountRecord.parentRecipientCount,
  );
  return accountRecord;
}

export function parseLazyAccountRelationClick(
  value: string,
  normalizeAddressValue: (value: string) => string,
): LazyAccountRelationClick | null {
  try {
    const parsed = JSON.parse(String(value || '')) as Record<string, unknown>;
    if (!parsed || parsed.__loadAccountRelation !== true) return null;
    return {
      accountKey: normalizeAddressValue(toDisplayString(parsed.accountKey)),
      relation: toDisplayString(parsed.relation).trim(),
      count: toNonNegativeCount(parsed.count),
    };
  } catch {
    return null;
  }
}

function parsePayload(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readPathValue(source: unknown, segments: string[]): unknown {
  return segments.reduce<unknown>((currentValue, segment) => {
    if (currentValue == null) return undefined;
    if (Array.isArray(currentValue)) {
      const index = Number(segment);
      return Number.isInteger(index) ? currentValue[index] : undefined;
    }
    if (typeof currentValue !== 'object') return undefined;
    return (currentValue as Record<string, unknown>)[segment];
  }, source);
}

function writePathValue(source: unknown, segments: string[], nextValue: unknown): unknown {
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
}

function findLazyRelationTargets(
  source: unknown,
  relationHint: string,
  segments: string[] = [],
): Array<{ node: Record<string, unknown>; path: string[] }> {
  if (!source || typeof source !== 'object') return [];
  if (!Array.isArray(source)) {
    const record = source as Record<string, unknown>;
    const matches: Array<{ node: Record<string, unknown>; path: string[] }> = [];
    if (
      record.__lazyAccountRelation === true &&
      (!relationHint || toDisplayString(record.relation).trim() === relationHint)
    ) {
      matches.push({ node: record, path: segments });
    }
    for (const [key, value] of Object.entries(record)) {
      matches.push(...findLazyRelationTargets(value, relationHint, [...segments, key]));
    }
    return matches;
  }
  const matches: Array<{ node: Record<string, unknown>; path: string[] }> = [];
  for (let index = 0; index < source.length; index += 1) {
    matches.push(...findLazyRelationTargets(source[index], relationHint, [...segments, String(index)]));
  }
  return matches;
}

export function useLazyAccountRelationExpansion({
  appendLog,
  formatFormattedPanelPayload,
  formattedOutputDisplayRef,
  treeOutputDisplayRef,
  normalizeAddressValue,
  requireContractAddress,
  rpcUrl,
  setFormattedOutputDisplay,
  setStatus,
  setTrackedTreeOutputDisplay,
}: Params) {
  return useCallback(
    async (
      pathHint?: string,
      rawDisplayOverride?: string,
      relationOverride?: LazyAccountRelationClick,
    ): Promise<ExpandResult> => {
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint) return 'unhandled';
      appendLog(
        accountExpandTrace(
          `lazy relation open requested path=${normalizedPathHint} relation=${relationOverride?.relation ?? '(path lookup)'} account=${relationOverride?.accountKey ?? '(path lookup)'} count=${relationOverride?.count ?? '(path lookup)'}`,
        ),
      );
      const rootPathMatch = /^(?:step|output|script|tree)-(\d+)$/i.exec(normalizedPathHint.split('.')[0] || '');
      const rootSegment = normalizedPathHint.split('.')[0] || '';
      const inTreePanel = /^tree-/i.test(rootSegment);
      const rawDisplay = String(
        rawDisplayOverride ?? (inTreePanel ? treeOutputDisplayRef.current : formattedOutputDisplayRef.current),
      ).trim();
      if (!rawDisplay || rawDisplay === '(no tree yet)' || rawDisplay === '(no output yet)') {
        appendLog(
          accountExpandTrace(
            `lazy relation unhandled: no display payload path=${normalizedPathHint} inTreePanel=${String(inTreePanel)} hasOverride=${String(rawDisplayOverride !== undefined)}`,
          ),
        );
        return 'unhandled';
      }

      const blocks = rawDisplay
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);
      const blockEntries =
        blocks.length > 1
          ? blocks.map((raw, index) => ({ raw, index, payload: parsePayload(raw) }))
          : [{ raw: rawDisplay, index: 0, payload: parsePayload(rawDisplay) }];
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries =
        Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
          ? [blockEntries[hintedBlockIndex]]
          : blockEntries;
      const payloadPath = normalizedPathHint.split('.').filter(Boolean).slice(1);
      const relationHint = payloadPath[payloadPath.length - 1] || '';
      appendLog(
        accountExpandTrace(
          `lazy relation payload parsed blocks=${blockEntries.length} candidates=${candidateEntries.length} hintedBlock=${Number.isInteger(hintedBlockIndex) ? hintedBlockIndex : 'none'} payloadPath=${payloadPath.join('.')} relationHint=${relationHint}`,
        ),
      );

      const runRelationRead = async (accountKey: string, relation: string) => {
        const relationMethodMap: Record<string, string> = {
          sponsorKeys: 'getSponsorKeys',
          recipientKeys: 'getRecipientKeys',
          agentKeys: 'getAgentKeys',
          parentRecipientKeys: 'getParentRecipientKeys',
        };
        const method = relationMethodMap[relation] || 'getAccountLinks';
        const target = requireContractAddress();
        appendLog(
          accountExpandTrace(
            `lazy relation fetch start method=${method} relation=${relation} account=${accountKey} contract=${target}`,
          ),
        );
        const runReadScript = async (methodName: string) => fetch('/api/spCoin/run-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: target,
            rpcUrl,
            spCoinAccessSource: 'local',
            script: {
              id: `expand-account-${relation}-${Date.now()}`,
              name: `Expand Account ${relation}`,
              network: 'hardhat',
              steps: [
                {
                  step: 1,
                  name: methodName,
                  panel: 'spcoin_rread',
                  method: methodName,
                  mode: 'hardhat',
                  params: [{ key: 'Account Key', value: accountKey }],
                },
              ],
            },
          }),
        });
        let response = await runReadScript(method);
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          results?: {
            success?: boolean;
            payload?: {
              call?: { method?: string; parameters?: Record<string, string> | [] };
              result?: unknown;
              meta?: Record<string, unknown>;
              onChainCalls?: unknown;
              error?: { message?: string };
            };
          }[];
        };
        let firstResult = Array.isArray(payload?.results) ? payload.results[0] : null;
        let resolvedMethod = method;
        appendLog(
          accountExpandTrace(
            `lazy relation fetch response method=${method} ok=${String(response.ok)} status=${response.status} success=${String(Boolean(firstResult?.success))}`,
          ),
        );
        if ((!response.ok || !firstResult?.success) && method !== 'getAccountLinks') {
          appendLog(
            accountExpandTrace(
              `lazy relation fallback start method=getAccountLinks relation=${relation} previousMethod=${method}`,
            ),
          );
          response = await runReadScript('getAccountLinks');
          const fallbackPayload = (await response.json()) as typeof payload;
          firstResult = Array.isArray(fallbackPayload?.results) ? fallbackPayload.results[0] : null;
          resolvedMethod = 'getAccountLinks';
          appendLog(
            accountExpandTrace(
              `lazy relation fallback response method=getAccountLinks ok=${String(response.ok)} status=${response.status} success=${String(Boolean(firstResult?.success))}`,
            ),
          );
          if (!response.ok) {
            throw new Error(fallbackPayload?.message ?? `Unable to load ${relation} (${response.status})`);
          }
        } else if (!response.ok) {
          throw new Error(payload?.message ?? `Unable to load ${relation} (${response.status})`);
        }
        if (!firstResult?.success) {
          throw new Error(firstResult?.payload?.error?.message ?? `Unable to load ${relation}.`);
        }
        const responsePayload = firstResult.payload;
        const rawResult = responsePayload?.result;
        let normalized: string[];
        if (!Array.isArray(rawResult) && rawResult && typeof rawResult === 'object') {
          const record = rawResult as Record<string, unknown>;
          normalized = normalizeStringListResult(record[relation] ?? []);
          appendLog(
            accountExpandTrace(
              `lazy relation normalized object result relation=${relation} count=${normalized.length} keys=${Object.keys(record).join(',')}`,
            ),
          );
        } else {
          normalized = normalizeStringListResult(rawResult ?? []);
          appendLog(
            accountExpandTrace(
              `lazy relation normalized list result relation=${relation} count=${normalized.length}`,
            ),
          );
        }
        const responseMeta =
          responsePayload?.meta && typeof responsePayload.meta === 'object' && !Array.isArray(responsePayload.meta)
            ? { ...(responsePayload.meta as Record<string, unknown>) }
            : undefined;
        const responseOnChainCalls =
          responsePayload?.onChainCalls ??
          (responseMeta && 'onChainCalls' in responseMeta ? responseMeta.onChainCalls : undefined);
        if (responseMeta && 'onChainCalls' in responseMeta) {
          delete responseMeta.onChainCalls;
        }
        const callParameters =
          responsePayload?.call?.parameters &&
          typeof responsePayload.call.parameters === 'object' &&
          !Array.isArray(responsePayload.call.parameters)
            ? (responsePayload.call.parameters as Record<string, string>)
            : { 'Account Key': accountKey };
        return {
          keys: normalized,
          call: {
            method: String(responsePayload?.call?.method || resolvedMethod),
            parameters: callParameters,
          },
          ...(responseMeta ? { meta: responseMeta } : {}),
          ...(responseOnChainCalls ? { onChainCalls: responseOnChainCalls } : {}),
        } satisfies LazyRelationReadResult;
      };

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) {
          appendLog(accountExpandTrace(`lazy relation skipped unparsable block index=${entry.index}`));
          continue;
        }
        const targetNode = readPathValue(payload, payloadPath);
        const exactTarget =
          targetNode &&
          typeof targetNode === 'object' &&
          !Array.isArray(targetNode) &&
          (targetNode as Record<string, unknown>).__lazyAccountRelation === true
            ? { node: targetNode as Record<string, unknown>, path: payloadPath }
            : null;
        const fallbackTargets = findLazyRelationTargets(payload, relationOverride?.relation ?? relationHint);
        appendLog(
          accountExpandTrace(
            `lazy relation target search block=${entry.index} exact=${String(Boolean(exactTarget))} fallbackCandidates=${fallbackTargets.length}`,
          ),
        );
        const targetCandidates = exactTarget
          ? [exactTarget]
          : fallbackTargets.sort((left, right) => {
              const leftCount = toNonNegativeCount(left.node.count);
              const rightCount = toNonNegativeCount(right.node.count);
              if ((leftCount > 0) !== (rightCount > 0)) return leftCount > 0 ? -1 : 1;
              const leftPath = left.path.join('.');
              const rightPath = right.path.join('.');
              const hintedSuffix = payloadPath.join('.');
              const leftMatchesHint = hintedSuffix.endsWith(leftPath) || leftPath.endsWith(hintedSuffix);
              const rightMatchesHint = hintedSuffix.endsWith(rightPath) || rightPath.endsWith(hintedSuffix);
              if (leftMatchesHint !== rightMatchesHint) return leftMatchesHint ? -1 : 1;
              return left.path.length - right.path.length;
            });
        const target =
          targetCandidates.find((candidate) => {
            const accountKey = normalizeAddressValue(toDisplayString(candidate.node.accountKey));
            const relation = toDisplayString(candidate.node.relation).trim();
            const count = toNonNegativeCount(candidate.node.count);
            const relationMatches = !relationOverride?.relation || relation === relationOverride.relation;
            const accountMatches =
              !relationOverride?.accountKey ||
              accountKey === normalizeAddressValue(relationOverride.accountKey);
            return (
              /^0x[0-9a-f]{40}$/.test(accountKey) &&
              Boolean(relation) &&
              count > 0 &&
              relationMatches &&
              accountMatches
            );
          }) ??
          (relationOverride
            ? { node: relationOverride as unknown as Record<string, unknown>, path: payloadPath }
            : undefined);
        if (!target) {
          appendLog(
            accountExpandTrace(
              `lazy relation target not found path=${normalizedPathHint} relation=${relationOverride?.relation ?? relationHint} candidates=${fallbackTargets.length}`,
            ),
          );
          continue;
        }
        const node = target.node;
        const accountKey = normalizeAddressValue(toDisplayString(node.accountKey));
        const relation = toDisplayString(node.relation).trim();
        const count = toNonNegativeCount(node.count);
        if (!/^0x[0-9a-f]{40}$/.test(accountKey) || !relation || count <= 0) {
          appendLog(
            accountExpandTrace(
              `lazy relation target invalid account=${accountKey || '(missing)'} relation=${relation || '(missing)'} count=${count}`,
            ),
          );
          return 'handled';
        }

        try {
          setStatus(`Loading ${relation} for ${accountKey}...`);
          appendLog(accountExpandTrace(`lazy relation calling ${relation === 'recipientKeys' ? 'getRecipientKeys' : relation === 'agentKeys' ? 'getAgentKeys' : relation === 'sponsorKeys' ? 'getSponsorKeys' : 'getParentRecipientKeys'} account=${accountKey}`));
          const relationRead = await runRelationRead(accountKey, relation);
          appendLog(accountExpandTrace(`lazy relation loaded relation=${relation} account=${accountKey} count=${relationRead.keys.length} addresses=${relationRead.keys.join(',')}`));
          const relationPayload = {
            call: relationRead.call,
            ...(relationRead.meta ? { meta: relationRead.meta } : {}),
            result: relationRead.keys.map((address) => ({ address })),
            ...(relationRead.onChainCalls ? { onChainCalls: relationRead.onChainCalls } : {}),
          };
          const nextRootPayload = normalizeExecutionPayload(
            writePathValue(payload, target.path, relationPayload),
          ) as Record<string, unknown>;
          const nextPayload = formatFormattedPanelPayload(nextRootPayload);
          appendLog(
            accountExpandTrace(
              `lazy relation replace path=${target.path.join('.')} nextValueCount=${relationRead.keys.length} inTreePanel=${String(inTreePanel)} blocks=${blocks.length}`,
            ),
          );
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            if (inTreePanel) {
              setTrackedTreeOutputDisplay(nextBlocks.join('\n\n'));
            } else {
              setFormattedOutputDisplay(nextBlocks.join('\n\n'));
            }
          } else if (inTreePanel) {
            setTrackedTreeOutputDisplay(nextPayload);
          } else {
            setFormattedOutputDisplay(nextPayload);
          }
          setStatus(`Loaded ${relation} for ${accountKey}.`);
          appendLog(accountExpandTrace(`lazy relation complete relation=${relation} account=${accountKey}`));
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, `Unable to load ${relation}.`);
          setStatus(`Unable to load ${relation}.`);
          appendLog(accountExpandTrace(`lazy relation failed relation=${relation} account=${accountKey} message=${message}`));
          return 'handled';
        }
      }
      appendLog(accountExpandTrace(`lazy relation unhandled after candidate scan path=${normalizedPathHint}`));
      return 'unhandled';
    },
    [
      appendLog,
      formatFormattedPanelPayload,
      formattedOutputDisplayRef,
      normalizeAddressValue,
      requireContractAddress,
      rpcUrl,
      setFormattedOutputDisplay,
      setStatus,
      setTrackedTreeOutputDisplay,
      treeOutputDisplayRef,
    ],
  );
}
