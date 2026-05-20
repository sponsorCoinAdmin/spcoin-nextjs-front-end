import { useCallback, type MutableRefObject } from 'react';
import type { ParamDef } from '../jsonMethods/shared/types';
import { runSpCoinReadMethod, type SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { runSpCoinWriteMethod, type SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import { createSpCoinContract } from '../jsonMethods/shared';
import {
  createMethodTimingCollector,
  runWithMethodTimingCollector,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';
import type { ConnectionMode } from '../scriptBuilder/types';
import { buildExecutionMeta, type MethodExecutionMeta } from './methodExecutionHelpers';
import type { AccessMethodCaller } from './useAccessMethodCaller';
import { normalizeExecutionPayload } from './executionPayload';
import {
  invalidateSpCoinLabAccountRecord,
  setSpCoinLabAccountRecord,
} from '@/lib/spCoinLab/accountRecordStore';
import {
  asRecord,
  buildAccountRecordMetaPatch,
  buildClaimedBalanceSummary,
  buildLazyPendingRewardsMethod,
  buildZeroPendingRewardsEstimateResult,
  hasLazyPendingRewardsAction,
  hasLazyPendingRewardsMethod,
  hasPendingRewardsRefreshAction,
  mergePendingRewardsBranchForAccountRefresh,
  mergePendingRewardsSummaryNode,
  normalizePendingRewardsEstimateResult,
  PENDING_REWARDS_CLAIM_METHODS,
  PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD,
  PENDING_REWARDS_ESTIMATE_METHODS,
  PENDING_REWARDS_INLINE_REFRESH_MS,
  readAccountRecordBalanceOf,
  readPendingRewardsAmount,
  readRefreshedAccountRecordFromClaim,
  toRewardsBigInt,
  type PendingRewardsActionClick,
} from './pendingRewardsTreeUtils';
import {
  buildTreePayloadBlockEntries,
  readDisplayPathValue,
  readPathValue,
  selectTreePayloadCandidateEntries,
  writePathValue,
} from './treePayloadUtils';

const noop = () => undefined;

type InlineExpansionResult = 'expanded' | 'handled' | 'unhandled';

type ServerBackedTreeMethodRunner = (args: {
  panel: 'spcoin_rread' | 'spcoin_write';
  method: string;
  params: { key: string; value: string }[];
  sender?: string;
}) => Promise<{
  result?: unknown;
  warning?: unknown;
  meta?: MethodExecutionMeta;
  onChainCalls?: MethodExecutionMeta['onChainCalls'];
}>;

interface UsePendingRewardsInlineExpansionParams {
  appendLog: (line: string) => void;
  appendWriteTrace?: (line: string) => void;
  callAccessMethod?: AccessMethodCaller;
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: any, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  ensureReadRunner: () => Promise<any>;
  formatFormattedPanelPayload: (payload: unknown) => string;
  formattedOutputDisplayRef: MutableRefObject<string>;
  loadAccountRecordForAddress: (
    account: string,
    options?: { force?: boolean; signal?: AbortSignal },
  ) => Promise<unknown>;
  mode: ConnectionMode;
  normalizeAddressValue: (value: string) => string;
  readCacheNamespace?: string;
  requireContractAddress: () => string;
  runServerBackedTreeSpCoinMethod: ServerBackedTreeMethodRunner;
  selectedHardhatAddress?: string;
  setFormattedOutputDisplay: (value: string) => void;
  setStatus: (value: string) => void;
  setTrackedTreeOutputDisplay: (value: string) => void;
  stringifyResult: (result: unknown) => string;
  treeAccountRecordCacheRef: MutableRefObject<Map<string, unknown>>;
  treeOutputDisplayRef: MutableRefObject<string>;
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

function readTopLevelGetAccountRecordKey(
  candidate: unknown,
  normalizeAddressValue: (value: string) => string,
) {
  const record = asRecord(candidate);
  const call = asRecord(record?.call);
  if (!call || String(call.method || '').trim() !== 'getAccountRecord') return '';
  const parameters = asRecord(call.parameters);
  if (!parameters) return '';
  return normalizeAddressValue(
    toDisplayString(parameters['Account Key'] ?? parameters.Account ?? parameters.accountKey),
  );
}

function resolveTargetPath(targetNode: unknown, payloadPath: string[]) {
  if (hasPendingRewardsRefreshAction(targetNode) && payloadPath.at(-1) === 'result') {
    return payloadPath.slice(0, -1);
  }
  if (hasPendingRewardsRefreshAction(targetNode) && payloadPath.at(-1) === 'pendingRewards') {
    return [...payloadPath, 'estimateOffChainTotalRewards'];
  }
  if ((payloadPath.at(-1) === 'claim' || payloadPath.at(-1) === 'update') && payloadPath.at(-2) !== 'pendingRewards') {
    return [...payloadPath.slice(0, -1), 'pendingRewards', 'estimateOffChainTotalRewards'];
  }
  return payloadPath;
}

function replaceDisplayBlock(
  blocks: string[],
  blockIndex: number,
  nextPayload: string,
  inTreePanel: boolean,
  setFormattedOutputDisplay: (value: string) => void,
  setTrackedTreeOutputDisplay: (value: string) => void,
) {
  const nextDisplay = blocks.length > 1
    ? blocks.map((block, index) => (index === blockIndex ? nextPayload : block)).join('\n\n')
    : nextPayload;
  if (inTreePanel) {
    setTrackedTreeOutputDisplay(nextDisplay);
  } else {
    setFormattedOutputDisplay(nextDisplay);
  }
}

function readClaimedRewardsAmount(value: unknown) {
  const record = asRecord(value);
  if (!record) return undefined;
  return record.totalRewardsClaimed ?? record.claimedAmount;
}

export function usePendingRewardsInlineExpansion({
  appendLog,
  appendWriteTrace,
  callAccessMethod,
  coerceParamValue,
  executeWriteConnected,
  ensureReadRunner,
  formatFormattedPanelPayload,
  formattedOutputDisplayRef,
  loadAccountRecordForAddress,
  mode,
  normalizeAddressValue,
  readCacheNamespace,
  requireContractAddress,
  runServerBackedTreeSpCoinMethod,
  selectedHardhatAddress,
  setFormattedOutputDisplay,
  setStatus,
  setTrackedTreeOutputDisplay,
  stringifyResult,
  treeAccountRecordCacheRef,
  treeOutputDisplayRef,
  useLocalSpCoinAccessPackage,
  useReadCache,
}: UsePendingRewardsInlineExpansionParams) {
  return useCallback(
    async (
      click: PendingRewardsActionClick,
      pathHint?: string,
      rawDisplayOverride?: string,
    ): Promise<InlineExpansionResult> => {
      const normalizedAccount = normalizeAddressValue(click.accountKey);
      if (!/^0x[0-9a-f]{40}$/.test(normalizedAccount)) return 'unhandled';
      const normalizedPathHint = String(pathHint ?? '').trim();
      if (!normalizedPathHint) return 'unhandled';

      const rootSegment = normalizedPathHint.split('.')[0] || '';
      const rootPathMatch = /^(?:step|output|script|tree)-(\d+)$/i.exec(rootSegment);
      const inTreePanel = /^tree-/i.test(rootSegment);
      const rawDisplay = String(
        rawDisplayOverride ?? (inTreePanel ? treeOutputDisplayRef.current : formattedOutputDisplayRef.current),
      ).trim();
      appendLog(
        `[PENDING_REWARDS_TRACE] expand start account=${normalizedAccount} action=${click.action} method=${String(click.method || '')} path=${normalizedPathHint} tree=${String(inTreePanel)} rawOverride=${String(rawDisplayOverride !== undefined)} rawLength=${String(rawDisplay.length)}`,
      );
      if (!rawDisplay || rawDisplay === '(no tree yet)' || rawDisplay === '(no output yet)') {
        appendLog(`[PENDING_REWARDS_TRACE] expand stop empty-display path=${normalizedPathHint}`);
        return 'unhandled';
      }

      const { blocks, blockEntries } = buildTreePayloadBlockEntries(rawDisplay);
      const hintedBlockIndex = rootPathMatch ? Number(rootPathMatch[1]) : Number.NaN;
      const candidateEntries = selectTreePayloadCandidateEntries(blockEntries, hintedBlockIndex);
      const payloadPath = normalizedPathHint.split('.').filter(Boolean).slice(1);
      appendLog(
        `[PENDING_REWARDS_TRACE] expand blocks=${String(blockEntries.length)} candidates=${String(candidateEntries.length)} payloadPath=${payloadPath.join('.')}`,
      );
      if (payloadPath.length === 0) {
        appendLog(`[PENDING_REWARDS_TRACE] expand stop empty-payload-path path=${normalizedPathHint}`);
        return 'unhandled';
      }

      for (const entry of candidateEntries) {
        const payload = entry.payload;
        if (!payload) {
          appendLog(`[PENDING_REWARDS_TRACE] candidate skip unparsable block=${String(entry.index)}`);
          continue;
        }

        const targetNode = readDisplayPathValue(payload, payloadPath);
        const targetPath = resolveTargetPath(targetNode, payloadPath);
        const actionNode = readPathValue(payload, targetPath) ?? readPathValue(payload, payloadPath);
        const targetLeaf = targetPath.at(-1);
        const isPendingRewardsMethodLeaf =
          typeof targetLeaf === 'string' &&
          (PENDING_REWARDS_ESTIMATE_METHODS.has(targetLeaf) || PENDING_REWARDS_CLAIM_METHODS.has(targetLeaf));
        const targetNodeResult = asRecord(targetNode)?.result ?? null;
        const isRerunnablePendingRewardsMethod =
          Boolean(click.method) &&
          isPendingRewardsMethodLeaf &&
          Boolean(readPendingRewardsAmount(targetNode) ?? readPendingRewardsAmount(targetNodeResult));
        const pendingRewardsRecord = isPendingRewardsMethodLeaf
          ? asRecord(readPathValue(payload, targetPath.slice(0, -1)))
          : null;
        const pairedEstimateMethod =
          click.method && PENDING_REWARDS_CLAIM_METHODS.has(click.method)
            ? PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD[click.method]
            : null;
        const pairedEstimatePath = pairedEstimateMethod && isPendingRewardsMethodLeaf
          ? [...targetPath.slice(0, -1), pairedEstimateMethod]
          : [];
        const pairedEstimateNode = pairedEstimatePath.length > 0 ? readPathValue(payload, pairedEstimatePath) : undefined;
        const shouldRefreshPairedEstimate = Boolean(
          click.action === 'claim' &&
            pairedEstimateMethod &&
            pairedEstimatePath.length > 0 &&
            pairedEstimateNode !== undefined,
        );

        appendLog(
          `[PENDING_REWARDS_TRACE] paired-estimate decision action=${click.action} claimMethod=${String(click.method || '')} target=${targetPath.join('.')} pairedMethod=${String(pairedEstimateMethod || '')} pairedPath=${pairedEstimatePath.join('.')} pairedExists=${String(pairedEstimateNode !== undefined)} shouldRefresh=${String(shouldRefreshPairedEstimate)}`,
        );
        const fallbackActionNode = pendingRewardsRecord
          ? pendingRewardsRecord[click.action] ?? pendingRewardsRecord.estimate ?? pendingRewardsRecord.claim
          : null;
        appendLog(
          `[PENDING_REWARDS_TRACE] candidate target=${targetPath.join('.')} leaf=${String(targetLeaf || '')} method=${String(click.method || '')} action=${click.action} rerun=${String(isRerunnablePendingRewardsMethod)} lazy=${String(hasLazyPendingRewardsAction(actionNode) || hasLazyPendingRewardsMethod(actionNode))}`,
        );
        if (
          !hasLazyPendingRewardsAction(actionNode) &&
          !hasLazyPendingRewardsMethod(actionNode) &&
          !hasLazyPendingRewardsAction(fallbackActionNode) &&
          !hasLazyPendingRewardsMethod(fallbackActionNode) &&
          !hasPendingRewardsRefreshAction(targetNode) &&
          !isRerunnablePendingRewardsMethod
        ) {
          appendLog(`[PENDING_REWARDS_TRACE] candidate skip no-action target=${targetPath.join('.')}`);
          continue;
        }

        try {
          const actionLabel = click.method || (click.action === 'estimate' ? 'pending rewards estimate' : 'pending rewards claim');
          setStatus(`Loading ${actionLabel} for ${normalizedAccount}...`);
          const loadPendingRewardsEstimate = async (methodOverride?: PendingRewardsActionClick['method']) => {
            const pendingTimingCollector = createMethodTimingCollector();
            const selectedEstimateMethod =
              methodOverride && PENDING_REWARDS_ESTIMATE_METHODS.has(methodOverride)
                ? methodOverride
                : click.method && PENDING_REWARDS_ESTIMATE_METHODS.has(click.method)
                  ? click.method
                  : 'estimateOffChainTotalRewards';
            appendLog(
              `[PENDING_REWARDS_TRACE] run estimate method=${selectedEstimateMethod} account=${normalizedAccount} target=${targetPath.join('.')}`,
            );
            if (mode === 'hardhat') {
              const serverResult = await runServerBackedTreeSpCoinMethod({
                panel: 'spcoin_rread',
                method: selectedEstimateMethod,
                params: [{ key: 'Account Key', value: normalizedAccount }],
              });
              return {
                pendingResult: serverResult.result,
                pendingMeta: serverResult.meta ?? buildExecutionMeta(pendingTimingCollector),
              };
            }
            const pendingResult = await runWithMethodTimingCollector(pendingTimingCollector, async () =>
              runSpCoinReadMethod({
                selectedMethod: selectedEstimateMethod as SpCoinReadMethod,
                spReadParams: [normalizedAccount],
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
              pendingResult,
              pendingMeta: buildExecutionMeta(pendingTimingCollector),
            };
          };

          const claimPendingRewards = async () => {
            const claimTimingCollector = createMethodTimingCollector();
            const selectedClaimMethod =
              click.method && PENDING_REWARDS_CLAIM_METHODS.has(click.method)
                ? click.method
                : 'claimOnChainTotalRewards';
            appendLog(
              `[PENDING_REWARDS_TRACE] run claim method=${selectedClaimMethod} account=${normalizedAccount} target=${targetPath.join('.')}`,
            );
            const readBalanceOf = async () =>
              runWithMethodTimingCollector(claimTimingCollector, async () => {
                const target = requireContractAddress();
                const runner = await ensureReadRunner();
                const contract = createSpCoinContract(target, runner) as unknown as {
                  balanceOf?: (accountKey: string) => Promise<unknown>;
                };
                if (typeof contract.balanceOf !== 'function') {
                  throw new Error('balanceOf is not available on the current SpCoin contract.');
                }
                return String(await contract.balanceOf(normalizedAccount));
              });
            const balanceBefore = mode === 'hardhat' ? undefined : await readBalanceOf();
            const updateResult =
              mode === 'hardhat'
                ? await runServerBackedTreeSpCoinMethod({
                    panel: 'spcoin_write',
                    method: selectedClaimMethod,
                    sender: selectedHardhatAddress || normalizedAccount,
                    params: [{ key: 'Account Key', value: normalizedAccount }],
                  })
                : await runSpCoinWriteMethod({
                    selectedMethod: selectedClaimMethod as SpCoinWriteMethod,
                    spWriteParams: [normalizedAccount],
                    coerceParamValue,
                    executeWriteConnected,
                    selectedHardhatAddress: selectedHardhatAddress || normalizedAccount,
                    appendLog,
                    appendWriteTrace,
                    spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
                    setStatus: noop,
                    timingCollector: claimTimingCollector,
                  });
            let refreshedAccountRecord: unknown | null = null;
            if (mode !== 'hardhat') {
              treeAccountRecordCacheRef.current.delete(normalizedAccount);
              invalidateSpCoinLabAccountRecord(normalizedAccount);
              refreshedAccountRecord = await loadAccountRecordForAddress(normalizedAccount, { force: true });
            }
            const balanceAfter =
              mode === 'hardhat'
                ? undefined
                : readAccountRecordBalanceOf(refreshedAccountRecord) ?? await readBalanceOf();
            const balanceClaimSummary = buildClaimedBalanceSummary(
              mode === 'hardhat' ? (updateResult as { result?: unknown }).result : updateResult,
              balanceBefore !== undefined && balanceAfter !== undefined
                ? {
                    balanceBefore,
                    balanceAfter,
                    claimedAmount: (toRewardsBigInt(balanceAfter) - toRewardsBigInt(balanceBefore)).toString(),
                  }
                : undefined,
            );
            const serverClaimResult = mode === 'hardhat' ? (updateResult as { result?: unknown }).result : null;
            const effectiveRefreshedAccountRecord =
              refreshedAccountRecord ?? readRefreshedAccountRecordFromClaim(serverClaimResult);
            return {
              pendingResult: {
                ...balanceClaimSummary,
                ...(effectiveRefreshedAccountRecord ? { refreshedAccountRecord: effectiveRefreshedAccountRecord } : {}),
                receipts: mode === 'hardhat' ? serverClaimResult : (updateResult as { receipts?: unknown }).receipts,
              },
              pendingMeta:
                (updateResult as { meta?: MethodExecutionMeta }).meta ?? buildExecutionMeta(claimTimingCollector),
            };
          };

          const isEstimatePendingRewardsRequest =
            (click.method && PENDING_REWARDS_ESTIMATE_METHODS.has(click.method)) || click.action === 'estimate';
          const loadedPending = isEstimatePendingRewardsRequest
            ? callAccessMethod
              ? await callAccessMethod(click.method || 'estimateOffChainTotalRewards', () => loadPendingRewardsEstimate())
              : await loadPendingRewardsEstimate()
            : callAccessMethod
              ? await callAccessMethod(click.method || 'claimOnChainTotalRewards', () => claimPendingRewards())
              : await claimPendingRewards();
          if (!loadedPending) return 'handled';

          const { pendingResult, pendingMeta } = loadedPending;
          const refreshedAccountRecord =
            click.action === 'claim' ? readRefreshedAccountRecordFromClaim(pendingResult) : null;
          if (refreshedAccountRecord) {
            treeAccountRecordCacheRef.current.set(normalizedAccount, refreshedAccountRecord);
            setSpCoinLabAccountRecord(normalizedAccount, refreshedAccountRecord);
          }
          const methodName = click.method
            ? click.method
            : click.action === 'claim'
              ? 'claimPendingRewards'
              : 'estimateOffChainTotalRewards';
          const expandedCallMethod = click.method ?? methodName;
          const refreshablePendingResult =
            click.action === 'estimate' && pendingResult && typeof pendingResult === 'object' && !Array.isArray(pendingResult)
              ? {
                  ...(normalizePendingRewardsEstimateResult(pendingResult) as Record<string, unknown>),
                  __pendingRewardsRefreshAction: true,
                  __pendingRewardsRefreshAtMs: Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS,
                  __pendingRewardsRefreshActionName: 'estimate',
                }
              : pendingResult;
          const lastUpdatedRewardsClaim =
            !isEstimatePendingRewardsRequest && click.action === 'claim'
              ? readClaimedRewardsAmount(pendingResult)
              : undefined;
          const expandedMeta =
            lastUpdatedRewardsClaim !== undefined
              ? {
                  ...(asRecord(pendingMeta) ?? {}),
                  'Last Claimed Rewards': lastUpdatedRewardsClaim,
                }
              : pendingMeta;
          const expandedNode = {
            call: {
              method: expandedCallMethod,
              parameters: {
                'Account Key': normalizedAccount,
              },
              selectedMethod: methodName,
              ...(click.action === 'claim'
                ? { sequence: ['balanceOf', expandedCallMethod, 'getAccountRecord'] }
                : {}),
            },
            ...(expandedMeta ? { meta: expandedMeta } : {}),
            result: refreshablePendingResult,
            __forceExpanded: true,
            __showEmptyFields: true,
          };

          let pairedEstimateExpandedNode: Record<string, unknown> | null = null;
          let pairedEstimatePendingResult: unknown | null = null;
          if (!isEstimatePendingRewardsRequest && shouldRefreshPairedEstimate && pairedEstimateMethod) {
            appendLog(
              `[PENDING_REWARDS_TRACE] paired-estimate zero after successful claim method=${pairedEstimateMethod} path=${pairedEstimatePath.join('.')} account=${normalizedAccount}`,
            );
            pairedEstimatePendingResult = buildZeroPendingRewardsEstimateResult(normalizedAccount, pairedEstimateMethod);
            const existingPairedEstimateNode = asRecord(pairedEstimateNode);
            pairedEstimateExpandedNode = {
              call: {
                method: pairedEstimateMethod,
                parameters: {
                  'Account Key': normalizedAccount,
                },
                selectedMethod: pairedEstimateMethod,
              },
              result: pairedEstimatePendingResult,
              ...(existingPairedEstimateNode?.__forceExpanded === true ? { __forceExpanded: true } : {}),
              ...(existingPairedEstimateNode?.__showEmptyFields === true ? { __showEmptyFields: true } : {}),
            };
          }

          const summaryPendingResult = pairedEstimatePendingResult ?? pendingResult;
          const pendingRewardsAmount = readPendingRewardsAmount(summaryPendingResult);
          const pendingRewardsRefreshAtMs = Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS;
          const pendingRewardsPath =
            targetLeaf === 'estimate' || targetLeaf === 'claim' || isPendingRewardsMethodLeaf
              ? targetPath.slice(0, -1)
              : targetLeaf === 'pendingRewards'
                ? targetPath
                : [];
          const shouldPreservePendingRewardsShape =
            targetLeaf === 'estimate' ||
            targetLeaf === 'claim' ||
            isPendingRewardsMethodLeaf ||
            targetLeaf === 'pendingRewards';
          const payloadWithExpandedNode =
            isPendingRewardsMethodLeaf
              ? writePathValue(payload, targetPath, expandedNode)
              : targetLeaf === 'estimate' || targetLeaf === 'claim'
                ? writePathValue(
                    payload,
                    targetPath,
                    buildLazyPendingRewardsMethod(
                      normalizedAccount,
                      click.action === 'claim' ? 'claimOnChainTotalRewards' : 'estimateOffChainTotalRewards',
                    ),
                  )
                : shouldPreservePendingRewardsShape
                  ? payload
                  : writePathValue(payload, targetPath, expandedNode);
          const payloadWithRefreshedPairedEstimate =
            pairedEstimateExpandedNode && pairedEstimatePath.length > 0
              ? (() => {
                  appendLog(
                    `[PENDING_REWARDS_TRACE] paired-estimate write path=${pairedEstimatePath.join('.')} method=${String(pairedEstimateMethod || '')}`,
                  );
                  return writePathValue(payloadWithExpandedNode, pairedEstimatePath, pairedEstimateExpandedNode);
                })()
              : (() => {
                  appendLog(
                    `[PENDING_REWARDS_TRACE] paired-estimate write skipped hasNode=${String(Boolean(pairedEstimateExpandedNode))} path=${pairedEstimatePath.join('.')}`,
                  );
                  return payloadWithExpandedNode;
                })();
          const existingPendingRewardsNode = readPathValue(payloadWithRefreshedPairedEstimate, pendingRewardsPath);
          const payloadWithPendingRewardsSummary =
            pendingRewardsAmount !== null &&
            pendingRewardsPath.length > 0 &&
            existingPendingRewardsNode &&
            typeof existingPendingRewardsNode === 'object' &&
            !Array.isArray(existingPendingRewardsNode)
              ? writePathValue(
                  payloadWithRefreshedPairedEstimate,
                  pendingRewardsPath,
                  mergePendingRewardsSummaryNode(
                    existingPendingRewardsNode,
                    summaryPendingResult,
                    normalizedAccount,
                    click.action,
                    pendingRewardsRefreshAtMs,
                    expandedCallMethod,
                    expandedNode,
                  ),
                )
              : payloadWithRefreshedPairedEstimate;
          const owningAccountRecordKey = readTopLevelGetAccountRecordKey(payload, normalizeAddressValue);
          const shouldReplaceOwningAccountRecord =
            click.action === 'claim' &&
            refreshedAccountRecord &&
            owningAccountRecordKey === normalizedAccount &&
            targetPath[0] === 'result';
          if (click.action === 'claim') {
            appendLog(
              `[PENDING_REWARDS_TRACE] account refresh replace=${String(Boolean(shouldReplaceOwningAccountRecord))} owner=${owningAccountRecordKey} account=${normalizedAccount} hasRecord=${String(Boolean(refreshedAccountRecord))}`,
            );
          }
          const payloadAfterAccountRefresh = shouldReplaceOwningAccountRecord
            ? (() => {
                setSpCoinLabAccountRecord(normalizedAccount, refreshedAccountRecord);
                treeAccountRecordCacheRef.current.set(normalizedAccount, refreshedAccountRecord);
                const refreshedPayloadBase = {
                  ...(payload as Record<string, unknown>),
                  meta: {
                    ...(asRecord(asRecord(payload)?.meta) ?? {}),
                    ...buildAccountRecordMetaPatch(refreshedAccountRecord),
                  },
                  result: refreshedAccountRecord,
                };
                const existingPendingRewardsForDisplay = readPathValue(
                  payloadWithPendingRewardsSummary,
                  pendingRewardsPath,
                );
                const refreshedPendingRewardsForDisplay = readPathValue(refreshedPayloadBase, pendingRewardsPath);
                const refreshedPayload =
                  pendingRewardsPath.length > 0 &&
                  (existingPendingRewardsForDisplay || refreshedPendingRewardsForDisplay)
                    ? writePathValue(
                        refreshedPayloadBase,
                        pendingRewardsPath,
                        mergePendingRewardsBranchForAccountRefresh(
                          existingPendingRewardsForDisplay,
                          refreshedPendingRewardsForDisplay,
                          normalizedAccount,
                          expandedCallMethod,
                          expandedNode,
                          click.action,
                          pendingRewardsRefreshAtMs,
                        ),
                      )
                    : refreshedPayloadBase;
                return isPendingRewardsMethodLeaf
                  ? writePathValue(refreshedPayload, targetPath, expandedNode)
                  : refreshedPayload;
              })()
            : payloadWithPendingRewardsSummary;
          const nextRootPayload = normalizeExecutionPayload(payloadAfterAccountRefresh) as Record<string, unknown>;
          const nextPayload = formatFormattedPanelPayload(nextRootPayload);
          replaceDisplayBlock(
            blocks,
            entry.index,
            nextPayload,
            inTreePanel,
            setFormattedOutputDisplay,
            setTrackedTreeOutputDisplay,
          );
          setStatus(`Loaded ${actionLabel} for ${normalizedAccount}.`);
          appendLog(`Inline ${actionLabel} loaded for ${normalizedAccount}`);
          appendLog(
            `[PENDING_REWARDS_TRACE] expand success method=${String(expandedCallMethod)} account=${normalizedAccount} target=${targetPath.join('.')} pendingPath=${pendingRewardsPath.join('.')}`,
          );
          return 'expanded';
        } catch (error) {
          const message = getErrorMessage(error, 'Unable to load pending rewards.');
          setStatus(`Unable to load pending rewards for ${normalizedAccount}.`);
          appendLog(`Inline pending rewards ${click.action} failed for ${normalizedAccount}: ${message}`);
          appendLog(
            `[PENDING_REWARDS_TRACE] expand error action=${click.action} method=${String(click.method || '')} account=${normalizedAccount} target=${targetPath.join('.')} message=${message}`,
          );
          return 'handled';
        }
      }
      appendLog(`[PENDING_REWARDS_TRACE] expand stop unhandled path=${normalizedPathHint}`);
      return 'unhandled';
    },
    [
      appendLog,
      appendWriteTrace,
      callAccessMethod,
      coerceParamValue,
      executeWriteConnected,
      ensureReadRunner,
      formatFormattedPanelPayload,
      formattedOutputDisplayRef,
      loadAccountRecordForAddress,
      mode,
      normalizeAddressValue,
      readCacheNamespace,
      requireContractAddress,
      runServerBackedTreeSpCoinMethod,
      selectedHardhatAddress,
      setFormattedOutputDisplay,
      setStatus,
      setTrackedTreeOutputDisplay,
      stringifyResult,
      treeAccountRecordCacheRef,
      treeOutputDisplayRef,
      useLocalSpCoinAccessPackage,
      useReadCache,
    ],
  );
}
