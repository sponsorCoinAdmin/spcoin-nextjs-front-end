import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
import AccountSelection from './AccountSelection';
import LabCardHeader from './LabCardHeader';
import { NativeSelectChevron, SelectChevron } from './SelectChevron';
import JsonInspector from '@/components/shared/JsonInspector';
import { BaseModal } from '@/components/modals';
import { ERC20_READ_OPTIONS } from '../jsonMethods/erc20/read';
import { ERC20_WRITE_OPTIONS } from '../jsonMethods/erc20/write';
import { SERIALIZATION_TEST_METHOD_DEFS } from '../jsonMethods/serializationTests';
import { SPCOIN_READ_METHOD_DEFS } from '../jsonMethods/spCoin/read';
import { SPCOIN_WRITE_METHOD_DEFS } from '../jsonMethods/spCoin/write';
import {
  defaultMissingImage,
  getAccountLogoURL,
  normalizeAddressForAssets,
} from '@/lib/context/helpers/assetHelpers';
import { useJsonInspector } from '@/lib/hooks/useJsonInspector';
import {
  ACCOUNT_POPUP_TRACE_FILE,
  recordSponsorCoinLabAccountTrace,
} from '@/lib/spCoinLab/accountPopupTrace';
import type { LabScriptStep } from '../scriptBuilder/types';

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status' | 'debug';
type FormattedPanelView = 'script' | 'output';
type DragPlacement = 'before' | 'after';
const DEBUG_TRACE_PATTERN =
  /\[TRACE\]|\[EXPAND\]|\[ACCOUNT_EXPAND_TRACE\]|\[ACCOUNT_POPUP_TRACE\]|\[JSON_INSPECTOR_TRACE\]|\[PENDING_REWARDS_TRACE\]|\[SPCOIN_RPC_TRACE\]|Lazy-loaded|Inline account record|Inline pending rewards/i;

type InspectorDisplayBlock = {
  data: unknown;
  label: string;
  path: string;
  rootLabel: string;
};

type DisplayedOutputCall = {
  method: string;
  parameters: Array<{ label: string; value: string }>;
};

type HardhatAccountLike = { address: string; privateKey?: string };
type HardhatAccountMetadataLike = Record<string, { name?: string; symbol?: string; logoURL: string }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isScriptDisplayRecord(value: unknown): value is Record<string, unknown> & { steps: unknown[] } {
  return isRecord(value) && Array.isArray(value.steps) && ('id' in value || 'Date Created' in value || 'network' in value);
}

function isScriptHeaderDisplayRecord(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    !Array.isArray(value.steps) &&
    ('id' in value || 'Date Created' in value || 'network' in value) &&
    !('call' in value) &&
    !('result' in value) &&
    !('parameters' in value) &&
    !('onChainCalls' in value)
  );
}

function getOnChainMs(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLocalOnChainCallsTotalMs(calls: unknown): number {
  if (!Array.isArray(calls)) return 0;
  return calls.reduce((sum, entry) => {
    const ms = isRecord(entry) ? getOnChainMs(entry.onChainRunTimeMs) : 0;
    return sum + ms;
  }, 0);
}

function buildOnChainCallBreakdown(calls: unknown): Record<string, unknown> {
  if (!Array.isArray(calls)) return {};
  return calls.reduce<Record<string, unknown>>((entries, entry, index) => {
    if (!isRecord(entry)) return entries;
    const method = String(entry.method || 'onChainCall').trim();
    const totalMs = getOnChainMs(entry.onChainRunTimeMs);
    const { method: _method, onChainRunTimeMs, ...rest } = entry;
    entries[`${index + 1} ${method}: ${totalMs}ms`] = {
      __forceExpanded: true,
      ...rest,
      totalOnChainMs: totalMs,
    };
    void _method;
    void onChainRunTimeMs;
    return entries;
  }, {});
}

function getStepMethod(block: unknown): string {
  if (!isRecord(block)) return '';
  const call = block.call;
  return isRecord(call) ? String(call.method || '').trim() : '';
}

function getStepNumber(block: unknown, fallback: number): number {
  const stepNumber = Number(isRecord(block) ? block.step : undefined);
  return Number.isInteger(stepNumber) && stepNumber > 0 ? stepNumber : fallback;
}

function getBigIntTotal(value: unknown): bigint {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  return /^\d+$/.test(normalized) ? BigInt(normalized) : 0n;
}

function getNumberTotal(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWeiAsEth(wei: bigint): string {
  const base = 1_000_000_000_000_000_000n;
  const whole = wei / base;
  const fraction = wei % base;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}

function buildStepOnChainEntry(onChainCalls: Record<string, unknown>): Record<string, unknown> {
  const { calls, totalOnChainMs, ...rest } = onChainCalls;
  const callBreakdown = buildOnChainCallBreakdown(calls);
  const totalOnChainMsValue = totalOnChainMs ?? getLocalOnChainCallsTotalMs(calls);
  return {
    __forceExpanded: true,
    ...rest,
    totalOnChainMs:
      Object.keys(callBreakdown).length > 0
        ? {
            __forceExpanded: true,
            totalOnChainMs: totalOnChainMsValue,
            ...callBreakdown,
          }
        : totalOnChainMsValue,
  };
}

function buildHeaderMethodOnChainEntry(onChainCalls: Record<string, unknown>): Record<string, unknown> {
  const { calls: _calls, onChainCalls: _onChainCalls, ...totals } = onChainCalls;
  return {
    __forceExpanded: true,
    ...totals,
  };
}

function buildHeaderOnChainCalls(blocks: unknown[]): Record<string, unknown> | null {
  const entries: Record<string, unknown> = {};
  let totalFeePaidEth = 0;
  let totalFeePaidWei = 0n;
  let totalGasPriceWei = 0n;
  let totalGasUsed = 0n;
  let totalOnChainMs = 0;
  let hasOnChainCalls = false;
  let displayIndex = 0;
  const hasSeparateStepBlocks = blocks.length > 1 && blocks.some((block) => isScriptDisplayRecord(block));

  const addMethodOnChainEntry = (step: Record<string, unknown>, fallbackIndex: number) => {
    if (!isRecord(step.onChainCalls)) return;
    const method = getStepMethod(step);
    const totalMs = getOnChainMs(step.onChainCalls.totalOnChainMs) || getLocalOnChainCallsTotalMs(step.onChainCalls.calls);
    totalFeePaidEth += getNumberTotal(step.onChainCalls.totalFeePaidEth);
    totalFeePaidWei += getBigIntTotal(step.onChainCalls.totalFeePaidWei);
    totalGasPriceWei += getBigIntTotal(step.onChainCalls.totalGasPriceWei);
    totalGasUsed += getBigIntTotal(step.onChainCalls.totalGasUsed);
    totalOnChainMs += totalMs;
    hasOnChainCalls = true;
    entries[`${getStepNumber(step, fallbackIndex)} ${method || 'onChainCalls'}: ${totalMs}ms`] = buildHeaderMethodOnChainEntry(step.onChainCalls);
  };

  for (const block of blocks) {
    if (isScriptDisplayRecord(block)) {
      if (hasSeparateStepBlocks) continue;
      for (const step of block.steps) {
        displayIndex += 1;
        if (isRecord(step)) addMethodOnChainEntry(step, displayIndex);
      }
      continue;
    }

    if (isScriptHeaderDisplayRecord(block)) continue;

    displayIndex += 1;
    if (isRecord(block)) addMethodOnChainEntry(block, displayIndex);
  }

  return hasOnChainCalls
    ? {
        __forceExpanded: true,
        methodOnChainCalls: `${totalOnChainMs}ms`,
        totalMethodsFeePaidEth: totalFeePaidWei > 0n ? formatWeiAsEth(totalFeePaidWei) : String(totalFeePaidEth),
        totalMethodsFeePaidWei: totalFeePaidWei.toLocaleString('en-US'),
        totalMethodsGasPriceWei: totalGasPriceWei.toLocaleString('en-US'),
        totalMethodsGasUsed: totalGasUsed.toLocaleString('en-US'),
        totalMethodsOnChainMs: {
          __forceExpanded: true,
          totalMethodsOnChainMs: `${totalOnChainMs}ms`,
          ...entries,
        },
      }
    : null;
}

function flattenStepOnChainCalls(step: unknown): unknown {
  if (!isRecord(step) || !isRecord(step.onChainCalls)) return step;
  const { onChainCalls, ...rest } = step;
  return {
    ...rest,
    ...buildStepOnChainEntry(onChainCalls),
  };
}

function buildScriptHeaderBlock(
  headerRecord: Record<string, unknown>,
  path = 'script-header',
  methodOnChainCalls?: Record<string, unknown> | null,
): InspectorDisplayBlock {
  return {
    data: {
      meta: {
        __forceExpanded: true,
        ...headerRecord,
      },
      ...(methodOnChainCalls ? { methodOnChainCalls } : {}),
    },
    label: 'Header:',
    path,
    rootLabel: 'Header:',
  };
}

function getScriptHeaderFields(scriptRecord: Record<string, unknown>): Record<string, unknown> {
  const { steps: _steps, ...headerFields } = scriptRecord;
  return Object.entries(headerFields).reduce<Record<string, unknown>>((next, [key, value]) => {
    if (value !== undefined) next[key] = value;
    return next;
  }, {});
}

function buildScriptDisplayBlocks(blocks: unknown[]): InspectorDisplayBlock[] | null {
  if (blocks.some((block) => isScriptHeaderDisplayRecord(block) || isScriptDisplayRecord(block))) {
    let stepIndex = 0;
    const headerOnChainCalls = buildHeaderOnChainCalls(blocks);
    return blocks.flatMap((block, index) => {
      if (isScriptHeaderDisplayRecord(block)) return [buildScriptHeaderBlock(block, `script-header-${index}`, headerOnChainCalls)];
      if (isScriptDisplayRecord(block)) {
        const headerBlock = buildScriptHeaderBlock(getScriptHeaderFields(block), `script-header-${index}`, headerOnChainCalls);
        if (blocks.length > 1) return [headerBlock];
        return [
          headerBlock,
          ...block.steps.map((step, stepIndex) => {
            const stepNumber = Number(isRecord(step) ? step.step : undefined);
            const displayNumber = Number.isInteger(stepNumber) && stepNumber > 0 ? stepNumber : stepIndex + 1;
            return {
              data: flattenStepOnChainCalls(step),
              label: `Step ${displayNumber}`,
              path: `script-step-${stepIndex}`,
              rootLabel: `Step ${displayNumber}`,
            };
          }),
        ];
      }
      stepIndex += 1;
      return {
        data: flattenStepOnChainCalls(block),
        label: `Step ${stepIndex}`,
        path: `step-${stepIndex - 1}`,
        rootLabel: `Step ${stepIndex}`,
      };
    });
  }

  return null;
}

function parseDisplayedOutputParameters(value: unknown): Array<{ label: string; value: string }> {
  if (Array.isArray(value)) {
    return value.map((entry) => ({
      label: String(entry?.label || '').trim(),
      value: String(entry?.value || '').trim(),
    }));
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).map(([label, entryValue]) => ({
    label: String(label || '').trim(),
    value: String(entryValue ?? '').trim(),
  }));
}

function removeFormattedOutputBlock(rawDisplay: string, stepNumber: number): string | null {
  const trimmedDisplay = String(rawDisplay || '').trim();
  if (!trimmedDisplay || trimmedDisplay.startsWith('(no output')) return null;
  const blocks = trimmedDisplay
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const index = stepNumber - 1;
  if (index < 0 || index >= blocks.length) return null;
  const nextBlocks = blocks.filter((_, blockIndex) => blockIndex !== index);
  return nextBlocks.length ? nextBlocks.join('\n\n') : '(no output yet)';
}

function duplicateFormattedOutputBlock(rawDisplay: string, stepNumber: number): string | null {
  const trimmedDisplay = String(rawDisplay || '').trim();
  if (!trimmedDisplay || trimmedDisplay.startsWith('(no output')) return null;
  const blocks = trimmedDisplay
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const index = stepNumber - 1;
  if (index < 0 || index >= blocks.length) return null;
  const targetBlock = blocks[index];
  if (!targetBlock) return null;
  const nextBlocks = [...blocks];
  nextBlocks.splice(index + 1, 0, targetBlock);
  return nextBlocks.join('\n\n');
}

function parseDisplayedOutputCalls(rawDisplay: string): DisplayedOutputCall[] {
  return String(rawDisplay || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      try {
        const parsed = JSON.parse(block) as {
          call?: { method?: unknown; parameters?: unknown };
        };
        const method = String(parsed?.call?.method || '').trim();
        if (!method) return null;
        const parameters = parseDisplayedOutputParameters(parsed?.call?.parameters);
        return { method, parameters };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is DisplayedOutputCall => entry !== null);
}

function buildScriptStepsFromOutputCalls(calls: DisplayedOutputCall[]): LabScriptStep[] {
  return calls.reduce<LabScriptStep[]>((steps, call, index) => {
    const panel: LabScriptStep['panel'] | null = ERC20_READ_OPTIONS.includes(call.method as never)
      ? 'ecr20_read'
      : ERC20_WRITE_OPTIONS.includes(call.method as never)
        ? 'erc20_write'
        : Object.prototype.hasOwnProperty.call(SPCOIN_READ_METHOD_DEFS, call.method)
          ? 'spcoin_rread'
          : Object.prototype.hasOwnProperty.call(SERIALIZATION_TEST_METHOD_DEFS, call.method)
            ? 'serialization_tests'
            : Object.prototype.hasOwnProperty.call(SPCOIN_WRITE_METHOD_DEFS, call.method)
              ? 'spcoin_write'
              : null;
    if (!panel) return steps;

    const senderEntry = call.parameters.find((entry) => entry.label === 'msg.sender');
    steps.push({
      step: index + 1,
      name: call.method,
      panel,
      method: call.method,
      params: call.parameters
        .filter((entry) => entry.label && entry.label !== 'msg.sender')
        .map((entry) => ({
          key: entry.label,
          value: entry.value,
        })),
      ...(senderEntry?.value ? { 'msg.sender': senderEntry.value } : {}),
    });
    return steps;
  }, []);
}

type Props = {
  className: string;
  style?: React.CSSProperties;
  isExpanded: boolean;
  onToggleExpand: () => void;
  inputStyle: string;
  controls: {
    outputPanelMode: OutputPanelMode;
    setOutputPanelMode: (value: OutputPanelMode) => void;
    refreshActiveOutput: () => void;
    buttonStyle: string;
    copyTextToClipboard: (label: string, value: string) => Promise<void>;
    setLogs: React.Dispatch<React.SetStateAction<string[]>>;
    setStatus: (value: string) => void;
    setTreeOutputDisplay: (value: string) => void;
    setFormattedOutputDisplay: (value: string) => void;
    formattedPanelView: FormattedPanelView;
    setFormattedPanelView: (value: FormattedPanelView) => void;
    formattedJsonViewEnabled: boolean;
    setFormattedJsonViewEnabled: (value: boolean) => void;
    writeTraceEnabled: boolean;
    toggleWriteTrace: () => void;
    showTreeAccountDetails: boolean;
    setShowTreeAccountDetails: (value: boolean) => void;
    showAllTreeRecords: boolean;
    setShowAllTreeRecords: (value: boolean) => void;
  };
  content: {
    logs: string[];
    treeOutputDisplay: string;
    status: string;
    formattedOutputDisplay: string;
    scriptDisplay: string;
    selectedScriptStepNumber: number | null;
    selectedScriptStepHasMissingRequiredParams: boolean;
    selectedScriptStepHasExecutionError: boolean;
    highlightedFormattedOutputLines:
      | Array<{
          line: string;
          active: boolean;
        }>
      | null;
    hiddenScrollbarClass: string;
    hardhatAccounts: HardhatAccountLike[];
    hardhatAccountMetadata: HardhatAccountMetadataLike;
  };
  treeActions: {
    runHeaderRead: () => Promise<void>;
    runAccountListRead: () => Promise<void>;
    runTreeAccountsRead: () => Promise<void>;
    runTreeDump: (accountOverride?: string) => Promise<void>;
    treeAccountOptions: string[];
    selectedTreeAccount: string;
    setSelectedTreeAccount: (value: string) => void;
    treeAccountRefreshToken: number;
    requestRefreshSelectedTreeAccount: () => void;
    openAccountFromAddress: (account: string, pathHint?: string, rawDisplayOverride?: string) => Promise<void>;
  };
  scriptActions: {
    moveScriptStepToPosition: (
      sourceStepNumber: number,
      targetStepNumber: number,
      placement: DragPlacement,
      options?: { origin?: 'script' | 'output' },
    ) => void;
    deleteScriptStepByNumber: (stepNumber: number) => void;
    duplicateScriptStepByNumber: (stepNumber: number) => void;
    createScriptFromSteps: (nextNameRaw: string, steps: LabScriptStep[]) => boolean;
    existingScriptNames: string[];
  };
};

export default function OutputResultsCard({
  className,
  style,
  isExpanded,
  onToggleExpand,
  inputStyle,
  controls,
  content,
  treeActions,
  scriptActions,
}: Props) {
  const hiddenRuleOptions = [
    ['zeroValues', '0 values'],
    ['emptyValues', 'empty / null'],
    ['falseValues', 'false values'],
    ['todoValues', 'todo markers'],
    ['emptyCollections', 'empty arrays / objects'],
    ['creationDates', 'creationTime / creationDate'],
    ['structureType', 'Structure Type'],
    ['formattedAmounts', 'Formatted Amounts'],
  ] as const;
  const payloadFieldOptions = [
    ['meta', 'meta'],
    ['parameters', 'parameters'],
    ['result', 'result'],
    ['onChainCalls', 'onChainCalls'],
  ] as const;
  const bulkSelectableHiddenRuleKeys = [
    'zeroValues',
    'emptyValues',
    'falseValues',
    'todoValues',
    'emptyCollections',
    'creationDates',
    'structureType',
  ] as const;
  type PayloadFieldOptionKey = typeof payloadFieldOptions[number][0];
  const [hiddenInspectorRules, setHiddenInspectorRules] = useState({
    zeroValues: true,
    emptyValues: true,
    falseValues: true,
    todoValues: true,
    emptyCollections: true,
    creationDates: true,
    formattedAmounts: false,
  });
  const [showStructureType, setShowStructureType] = useState(false);
  const [showPayloadFields, setShowPayloadFields] = useState<Record<PayloadFieldOptionKey, boolean>>({
    meta: true,
    parameters: true,
    result: true,
    onChainCalls: true,
  });
  const [isShowAllMenuOpen, setIsShowAllMenuOpen] = useState(false);
  const showAllMenuRef = useRef<HTMLDivElement | null>(null);
  const actionButtonClassName =
    'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500';
  const refreshIconButtonClassName =
    'inline-flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border-0 bg-[#243056] text-[#5981F3] outline-none ring-0 transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0';
  const [selectedTreeAccountMetadata, setSelectedTreeAccountMetadata] = useState<{
    name?: string;
    symbol?: string;
    logoURL: string;
  }>({
    logoURL: defaultMissingImage,
  });
  const [isSaveScriptModalOpen, setIsSaveScriptModalOpen] = useState(false);
  const [saveScriptNameInput, setSaveScriptNameInput] = useState('');
  const [isSaveButtonHovered, setIsSaveButtonHovered] = useState(false);
  const [isSaveConfirmHovered, setIsSaveConfirmHovered] = useState(false);
  const [inspectorAccountPopup, setInspectorAccountPopup] = useState<{
    address: string;
    label: string;
    path: string;
  } | null>(null);
  const [stepActionModalState, setStepActionModalState] = useState<{
    stepNumber: number;
    methodName: string;
    confirmingDelete: boolean;
  } | null>(null);
  const [draggedScriptStepNumber, setDraggedScriptStepNumber] = useState<number | null>(null);
  const [scriptStepDropTarget, setScriptStepDropTarget] = useState<{ stepNumber: number; placement: DragPlacement } | null>(null);
  const activeDraggedScriptStepNumberRef = useRef<number | null>(null);
  const activeScriptStepDropTargetRef = useRef<{ stepNumber: number; placement: DragPlacement } | null>(null);
  const scriptStepDragCleanupRef = useRef<(() => void) | null>(null);
  const treeAccountMetadataCacheRef = useRef<
    Map<
      string,
      {
        name?: string;
        symbol?: string;
        logoURL: string;
      }
    >
  >(new Map());
  const lastMetadataRefreshTokenRef = useRef(treeActions.treeAccountRefreshToken);
  const currentFormattedDisplay =
    controls.formattedPanelView === 'script' ? content.scriptDisplay : content.formattedOutputDisplay;
  const executionDisplay = useMemo(() => {
    const header = 'Execution log: SponsorCoinLab session';
    return content.logs.length ? `${header}\n${content.logs.join('\n')}` : `${header}\n(no execution logs yet)`;
  }, [content.logs]);
  const debugDisplay = useMemo(() => {
    const expansionLogs = content.logs.filter((line) => DEBUG_TRACE_PATTERN.test(line));
    const header = `Trace file: ${ACCOUNT_POPUP_TRACE_FILE}`;
    return expansionLogs.length ? `${header}\n${expansionLogs.join('\n')}` : `${header}\n(no trace yet)`;
  }, [content.logs]);
  const appendOutputTrace = React.useCallback(
    (line: string) => {
      if (!controls.writeTraceEnabled) return;
      const stamp = new Date().toLocaleTimeString();
      controls.setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
      recordSponsorCoinLabAccountTrace(line, 'OutputResultsCard');
    },
    [controls.setLogs, controls.writeTraceEnabled],
  );
  const displayedOutputCalls = useMemo(
    () => parseDisplayedOutputCalls(content.formattedOutputDisplay),
    [content.formattedOutputDisplay],
  );
  const saveableOutputSteps = useMemo(
    () => buildScriptStepsFromOutputCalls(displayedOutputCalls),
    [displayedOutputCalls],
  );
  const normalizedSaveScriptName = String(saveScriptNameInput || '').trim().toLowerCase();
  const saveScriptNameExists = useMemo(
    () => scriptActions.existingScriptNames.some((name) => String(name || '').trim().toLowerCase() === normalizedSaveScriptName),
    [normalizedSaveScriptName, scriptActions.existingScriptNames],
  );
  const saveScriptValidation = useMemo(() => {
    if (saveableOutputSteps.length === 0) {
      return { tone: 'invalid' as const, title: 'No Methods Available', actionLabel: 'Save' as const };
    }
    if (!String(saveScriptNameInput || '').trim()) {
      return { tone: 'invalid' as const, title: 'Script Name Required', actionLabel: 'Save' as const };
    }
    if (saveScriptNameExists) {
      return { tone: 'update' as const, title: 'Update Script', actionLabel: 'Update' as const };
    }
    return { tone: 'valid' as const, title: 'Save Script', actionLabel: 'Save' as const };
  }, [saveScriptNameExists, saveScriptNameInput, saveableOutputSteps.length]);
  const inspectorNamespace =
    controls.outputPanelMode === 'tree'
      ? 'sponsorCoinLab.tree'
      : `sponsorCoinLab.formatted.${controls.formattedPanelView}`;
  const { collapsedKeys, updateCollapsedKeys } = useJsonInspector(inspectorNamespace);
  const parseCollapsibleBlocks = useMemo(
    () => (rawValue: string) => {
      const trimmed = String(rawValue || '').trim();
      if (
        !trimmed ||
        trimmed === '(no output yet)' ||
        trimmed === '(no script yet)' ||
        trimmed === '(no tree yet)'
      ) {
        return null;
      }
      try {
        return [JSON.parse(trimmed) as unknown];
      } catch {
        const blocks = trimmed
          .split(/\n\s*\n/)
          .map((block) => block.trim())
          .filter(Boolean);
        if (blocks.length <= 1) return null;
        try {
          return blocks.map((block) => JSON.parse(block) as unknown);
        } catch {
          return null;
        }
      }
    },
    [],
  );
  const collapsibleFormattedBlocks = useMemo(() => {
    if (controls.formattedJsonViewEnabled) return null;
    return parseCollapsibleBlocks(currentFormattedDisplay);
  }, [controls.formattedJsonViewEnabled, currentFormattedDisplay, parseCollapsibleBlocks]);
  const collapsibleTreeBlocks = useMemo(() => {
    if (controls.formattedJsonViewEnabled || controls.outputPanelMode !== 'tree') return null;
    return parseCollapsibleBlocks(content.treeOutputDisplay);
  }, [content.treeOutputDisplay, controls.formattedJsonViewEnabled, controls.outputPanelMode, parseCollapsibleBlocks]);
  const hiddenPayloadFieldKeys = useMemo(
    () =>
      Object.entries(showPayloadFields).flatMap(([key, visible]) => {
        if (visible) return [];
        return key === 'onChainCalls' ? ['onChainCalls', 'methodOnChainCalls'] : [key];
      }),
    [showPayloadFields],
  );
  const visiblePayloadFieldKeys = useMemo(
    () => Object.entries(showPayloadFields).filter(([, visible]) => visible).map(([key]) => key),
    [showPayloadFields],
  );
  const activeInspectorRootLabel = controls.outputPanelMode === 'tree' ? 'Tree' : controls.formattedPanelView === 'script' ? 'Script' : 'Step';
  const seededDefaultCollapseSignatureRef = React.useRef('');
  React.useEffect(() => {
    if (controls.formattedJsonViewEnabled) return;
    const blocks = controls.outputPanelMode === 'tree' ? collapsibleTreeBlocks : collapsibleFormattedBlocks;
    if (!blocks?.length) return;
    const signature = `${controls.outputPanelMode}:${controls.outputPanelMode === 'tree' ? content.treeOutputDisplay : currentFormattedDisplay}`;
    if (seededDefaultCollapseSignatureRef.current === signature) return;
    const rootLabel = controls.outputPanelMode === 'tree' ? 'tree' : activeInspectorRootLabel.toLowerCase();
    const collectDefaultCollapsedPaths = (value: unknown, basePath: string): string[] => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      const record = value as Record<string, unknown>;
      return Object.entries(record).flatMap(([key, childValue]) => {
        const childPath = `${basePath}.${key}`;
        return [
          ...(key === 'meta' ? [childPath] : []),
          ...collectDefaultCollapsedPaths(childValue, childPath),
        ];
      });
    };
    const collapsePaths = blocks.flatMap((block, index) => {
      const basePath = `${rootLabel}-${index}`;
      const childPaths = collectDefaultCollapsedPaths(block, basePath);
      const isHeaderBlock = isScriptHeaderDisplayRecord(block);
      const headerPath = isHeaderBlock ? `script-header-${index}` : null;
      return headerPath ? [headerPath, ...childPaths] : childPaths;
    });
    if (collapsePaths.length === 0) return;
    seededDefaultCollapseSignatureRef.current = signature;
    if (collapsePaths.every((path) => collapsedKeys.includes(path))) return;
    updateCollapsedKeys([...new Set([...collapsedKeys, ...collapsePaths])]);
  }, [
    activeInspectorRootLabel,
    collapsedKeys,
    collapsibleFormattedBlocks,
    collapsibleTreeBlocks,
    content.treeOutputDisplay,
    controls.formattedJsonViewEnabled,
    controls.outputPanelMode,
    currentFormattedDisplay,
    updateCollapsedKeys,
  ]);
  const handleOpenAccountFromInspector = React.useCallback(
    async (value: string, path: string, key?: string) => {
      const address = String(value || '').trim();
      const parsedInspectorPayload = (() => {
        try {
          const parsed = JSON.parse(address);
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
        } catch {
          return null;
        }
      })();
      const isLazyRelationLoadValue = (() => {
        if (address === '__load_account_relation__') return true;
        return parsedInspectorPayload?.__loadAccountRelation === true;
      })();
      const isPendingRewardsLoadValue =
        parsedInspectorPayload?.__loadPendingRewardsAction === true ||
        parsedInspectorPayload?.__loadPendingRewardsMethod === true ||
        parsedInspectorPayload?.__togglePendingRewardsMode === true;
      const isScriptLazyRelationClick =
        controls.outputPanelMode === 'formatted' &&
        controls.formattedPanelView === 'script' &&
        isLazyRelationLoadValue;
      const shouldUseCurrentFormattedDisplay =
        controls.outputPanelMode === 'formatted' &&
        !controls.formattedJsonViewEnabled &&
        (isScriptLazyRelationClick || isPendingRewardsLoadValue);
      appendOutputTrace(
        `[ACCOUNT_EXPAND_TRACE] inspector dispatch mode=${controls.outputPanelMode} view=${controls.formattedPanelView} json=${String(controls.formattedJsonViewEnabled)} key=${String(key || '')} pendingRewards=${String(isPendingRewardsLoadValue)} relation=${String(isLazyRelationLoadValue)} rawOverride=${String(shouldUseCurrentFormattedDisplay)} value=${address ? address : String(value ?? '')} path=${String(path || '')}`,
      );
      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        await treeActions.openAccountFromAddress(
          value,
          path,
          shouldUseCurrentFormattedDisplay ? currentFormattedDisplay : undefined,
        );
        if (isScriptLazyRelationClick) {
          controls.setFormattedPanelView('output');
        }
        return;
      }

      const normalizedAddress = address.toLowerCase();
      const label =
        String(key || '').trim() ||
        String(path || '')
          .split('.')
          .filter(Boolean)
          .at(-1) ||
        'Account';
      appendOutputTrace(
        `[ACCOUNT_POPUP_TRACE] inspector account popup open label=${label} address=${normalizedAddress} path=${String(path || '')}`,
      );
      setInspectorAccountPopup({ address: normalizedAddress, label, path });
    },
    [
      appendOutputTrace,
      controls.formattedJsonViewEnabled,
      controls.formattedPanelView,
      controls.outputPanelMode,
      controls.setFormattedPanelView,
      currentFormattedDisplay,
      treeActions,
    ],
  );
  const handleExpandAccountFromInspector = React.useCallback(
    async (value: string, path: string, key?: string) => {
      const address = String(value || '').trim();
      if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
        appendOutputTrace(
          `[ACCOUNT_EXPAND_TRACE] inspector account record open key=${String(key || '')} address=${address.toLowerCase()} path=${String(path || '')}`,
        );
        await treeActions.openAccountFromAddress(address, path);
        return;
      }
      await handleOpenAccountFromInspector(value, path, key);
    },
    [appendOutputTrace, handleOpenAccountFromInspector, treeActions],
  );
  const highlightedInspectorPathPrefixes = useMemo(() => {
    if (controls.outputPanelMode !== 'formatted' || controls.formattedPanelView !== 'script') return [];
    if (content.selectedScriptStepNumber === null || content.selectedScriptStepNumber <= 0) return [];
    return [`script-step-${content.selectedScriptStepNumber - 1}`];
  }, [content.selectedScriptStepNumber, controls.formattedPanelView, controls.outputPanelMode]);
  const inspectorHighlightColorClass =
    content.selectedScriptStepHasMissingRequiredParams || content.selectedScriptStepHasExecutionError
      ? 'text-red-400'
      : 'text-green-400';
  const inspectorPopupAccount = inspectorAccountPopup
    ? content.hardhatAccounts.find(
        (account) => String(account.address || '').trim().toLowerCase() === inspectorAccountPopup.address,
      )
    : undefined;
  const inspectorPopupMetadata = inspectorAccountPopup
    ? content.hardhatAccountMetadata[inspectorAccountPopup.address]
    : undefined;
  const activeTokenDecimals = useMemo(() => {
    const extractDecimals = (value: unknown): number | null => {
      if (!value || typeof value !== 'object') return null;
      if (Array.isArray(value)) {
        for (const entry of value) {
          const nested = extractDecimals(entry);
          if (nested !== null) return nested;
        }
        return null;
      }

      const record = value as Record<string, unknown>;
      const rawDecimals = record.decimals;
      const nextDecimals = Number(rawDecimals);
      if (Number.isInteger(nextDecimals) && nextDecimals >= 0) return nextDecimals;

      for (const nestedValue of Object.values(record)) {
        const nested = extractDecimals(nestedValue);
        if (nested !== null) return nested;
      }
      return null;
    };

    if (controls.outputPanelMode === 'tree') {
      for (const block of collapsibleTreeBlocks || []) {
        const decimals = extractDecimals(block);
        if (decimals !== null) return decimals;
      }
      return 18;
    }

    for (const block of collapsibleFormattedBlocks || []) {
      const decimals = extractDecimals(block);
      if (decimals !== null) return decimals;
    }
    return 18;
  }, [collapsibleFormattedBlocks, collapsibleTreeBlocks, controls.outputPanelMode]);

  const displayFormattedBlocks = useMemo(() => {
    const hoistMasterAnnualInflationRate = (block: unknown) => {
      if (!block || typeof block !== 'object' || Array.isArray(block)) return block;

      const record = block as Record<string, unknown>;
      const call = record.call;
      const method =
        call && typeof call === 'object' && !Array.isArray(call) ? String((call as Record<string, unknown>).method || '').trim() : '';

      if (!['getMasterSponsorList'].includes(method)) return block;

      const result = record.result;
      if (!Array.isArray(result)) return block;

      const sponsorEntries = result;
      const topLevelAnnualInflationRate = sponsorEntries.reduce<string | null>((foundRate, entry) => {
        if (foundRate) return foundRate;
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return foundRate;
        const totalSpCoins =
          (entry as Record<string, unknown>).totalSpCoins &&
          typeof (entry as Record<string, unknown>).totalSpCoins === 'object' &&
          !Array.isArray((entry as Record<string, unknown>).totalSpCoins)
            ? ((entry as Record<string, unknown>).totalSpCoins as Record<string, unknown>)
            : null;
        const rewardRate = totalSpCoins ? String(totalSpCoins.annualInflationRate || '').trim() : '';
        return rewardRate || foundRate;
      }, null);

      const normalizedResult = sponsorEntries.reduce<Record<string, unknown>>((nextResult, entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          nextResult[String(index)] = entry;
          return nextResult;
        }

        const entryRecord = entry as Record<string, unknown>;
        const totalSpCoins =
          entryRecord.totalSpCoins && typeof entryRecord.totalSpCoins === 'object' && !Array.isArray(entryRecord.totalSpCoins)
            ? ({ ...(entryRecord.totalSpCoins as Record<string, unknown>) } as Record<string, unknown>)
            : null;

        if (totalSpCoins && 'annualInflationRate' in totalSpCoins) {
          delete totalSpCoins.annualInflationRate;
        }

        nextResult[String(index)] = totalSpCoins ? { ...entryRecord, totalSpCoins } : entry;
        return nextResult;
      }, {});

      return {
        ...record,
        result: topLevelAnnualInflationRate ? { annualInflationRate: topLevelAnnualInflationRate, ...normalizedResult } : normalizedResult,
      };
    };

    return (collapsibleFormattedBlocks || []).map((block) => hoistMasterAnnualInflationRate(block));
  }, [collapsibleFormattedBlocks]);

  const formattedInspectorLooksStepBased = useMemo(() => {
    if (!displayFormattedBlocks.length) return false;
    return displayFormattedBlocks.every((block) => {
      if (!block || typeof block !== 'object' || Array.isArray(block)) return false;
      const record = block as Record<string, unknown>;
      return 'call' in record || 'result' in record || 'parameters' in record || 'step' in record;
    });
  }, [displayFormattedBlocks]);

  const inspectorFormattedBlocks = useMemo<InspectorDisplayBlock[]>(() => {
    const hydratedDisplayBlocks =
      controls.outputPanelMode === 'formatted' &&
      controls.formattedPanelView === 'output' &&
      displayFormattedBlocks.length > 0 &&
      !displayFormattedBlocks.some((block) => isScriptHeaderDisplayRecord(block) || isScriptDisplayRecord(block))
        ? (() => {
            try {
              const selectedScriptBlock = JSON.parse(String(content.scriptDisplay || '').trim()) as unknown;
              if (isScriptDisplayRecord(selectedScriptBlock)) return [selectedScriptBlock, ...displayFormattedBlocks];
            } catch {
              // Use the persisted output as-is when no selected script header is available.
            }
            return displayFormattedBlocks;
          })()
        : displayFormattedBlocks;

    const scriptBlocks =
      controls.outputPanelMode === 'formatted' ? buildScriptDisplayBlocks(hydratedDisplayBlocks) : null;

    if (scriptBlocks) return scriptBlocks;

    return hydratedDisplayBlocks.map((block, index) => {
      const label =
        hydratedDisplayBlocks.length === 1
          ? activeInspectorRootLabel
          : `${activeInspectorRootLabel} ${index + 1}`;
      return {
        data: block,
        label,
        path: `${activeInspectorRootLabel.toLowerCase()}-${index}`,
        rootLabel: label,
      };
    });
  }, [activeInspectorRootLabel, content.scriptDisplay, controls.formattedPanelView, controls.outputPanelMode, displayFormattedBlocks]);

  const isScriptInspectorReorderEnabled =
    controls.outputPanelMode === 'formatted' &&
    controls.formattedPanelView === 'output' &&
    !controls.formattedJsonViewEnabled &&
    formattedInspectorLooksStepBased;

  const moveInspectorScriptStep = React.useCallback(
    (sourceStepNumber: number, targetStepNumber: number, placement: DragPlacement) => {
      if (sourceStepNumber === targetStepNumber) return;
      console.debug('[OutputResultsCard] moveInspectorScriptStep', {
        sourceStepNumber,
        targetStepNumber,
        placement,
      });
      scriptActions.moveScriptStepToPosition(sourceStepNumber, targetStepNumber, placement, { origin: 'output' });
    },
    [scriptActions],
  );

  const stopInspectorScriptDrag = React.useCallback(() => {
    console.debug('[OutputResultsCard] stopInspectorScriptDrag', {
      draggedStepNumber: activeDraggedScriptStepNumberRef.current,
      dropTarget: activeScriptStepDropTargetRef.current,
    });
    scriptStepDragCleanupRef.current?.();
    scriptStepDragCleanupRef.current = null;
    activeDraggedScriptStepNumberRef.current = null;
    activeScriptStepDropTargetRef.current = null;
    setDraggedScriptStepNumber(null);
    setScriptStepDropTarget(null);
  }, []);

  const beginInspectorScriptDrag = React.useCallback(
    (sourceStepNumber: number) => {
      if (!isScriptInspectorReorderEnabled) {
        console.debug('[OutputResultsCard] beginInspectorScriptDrag blocked', {
          sourceStepNumber,
          outputPanelMode: controls.outputPanelMode,
          formattedPanelView: controls.formattedPanelView,
          formattedJsonViewEnabled: controls.formattedJsonViewEnabled,
          formattedInspectorLooksStepBased,
        });
        return;
      }
      stopInspectorScriptDrag();

      console.debug('[OutputResultsCard] beginInspectorScriptDrag', { sourceStepNumber });
      activeDraggedScriptStepNumberRef.current = sourceStepNumber;
      activeScriptStepDropTargetRef.current = null;
      setDraggedScriptStepNumber(sourceStepNumber);
      setScriptStepDropTarget(null);

      const previousUserSelect = document.body.style.userSelect;
      const previousCursor = document.body.style.cursor;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      const handleMouseMove = (event: MouseEvent) => {
        const activeSourceStepNumber = activeDraggedScriptStepNumberRef.current;
        if (activeSourceStepNumber === null) return;

        const target = document.elementFromPoint(event.clientX, event.clientY);
        const row = target instanceof Element ? target.closest('[data-script-step-number]') : null;
        const targetStepNumberRaw = row?.getAttribute('data-script-step-number') || '';
        const targetStepNumber = Number(targetStepNumberRaw);
        if (!Number.isInteger(targetStepNumber) || targetStepNumber === activeSourceStepNumber) {
          return;
        }

        if (!(row instanceof Element)) {
          return;
        }

        const bounds = row.getBoundingClientRect();
        const placement: DragPlacement = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
        const nextDropTarget = { stepNumber: targetStepNumber, placement };
        console.debug('[OutputResultsCard] drag target', {
          sourceStepNumber: activeSourceStepNumber,
          targetStepNumber,
          placement,
        });
        activeScriptStepDropTargetRef.current = nextDropTarget;
        setScriptStepDropTarget((previous) =>
          previous?.stepNumber === nextDropTarget.stepNumber && previous.placement === nextDropTarget.placement
            ? previous
            : nextDropTarget,
        );
      };

      const handleMouseUp = () => {
        const activeSourceStepNumber = activeDraggedScriptStepNumberRef.current;
        const activeDropTarget = activeScriptStepDropTargetRef.current;
        console.debug('[OutputResultsCard] mouseup', {
          activeSourceStepNumber,
          activeDropTarget,
        });
        stopInspectorScriptDrag();
        if (
          activeSourceStepNumber === null ||
          !activeDropTarget ||
          activeDropTarget.stepNumber === activeSourceStepNumber
        ) {
          return;
        }
        moveInspectorScriptStep(activeSourceStepNumber, activeDropTarget.stepNumber, activeDropTarget.placement);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
      scriptStepDragCleanupRef.current = () => {
        document.body.style.userSelect = previousUserSelect;
        document.body.style.cursor = previousCursor;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    },
    [
      controls.formattedJsonViewEnabled,
      controls.formattedPanelView,
      controls.outputPanelMode,
      formattedInspectorLooksStepBased,
      isScriptInspectorReorderEnabled,
      moveInspectorScriptStep,
      stopInspectorScriptDrag,
    ],
  );

  useEffect(() => {
    const account = String(treeActions.selectedTreeAccount || '').trim();
    const folder = normalizeAddressForAssets(account);
    if (!folder) {
      setSelectedTreeAccountMetadata({ logoURL: defaultMissingImage });
      return;
    }

    let cancelled = false;
    const logoURL = getAccountLogoURL(account);
    const shouldBypassCache = lastMetadataRefreshTokenRef.current !== treeActions.treeAccountRefreshToken;
    lastMetadataRefreshTokenRef.current = treeActions.treeAccountRefreshToken;
    if (!shouldBypassCache) {
      const cached = treeAccountMetadataCacheRef.current.get(folder);
      if (cached) {
        setSelectedTreeAccountMetadata(cached);
        return;
      }
    }

    const loadAccountMetadata = async () => {
      try {
        const response = await fetch(`/assets/accounts/${folder}/account.json`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (!cancelled) setSelectedTreeAccountMetadata({ logoURL: defaultMissingImage });
          return;
        }
        const payload = (await response.json()) as {
          name?: string;
          symbol?: string;
          logoURL?: string;
        };
        if (cancelled) return;
        const nextMetadata = {
          name: String(payload?.name || '').trim() || undefined,
          symbol: String(payload?.symbol || '').trim() || undefined,
          logoURL,
        };
        treeAccountMetadataCacheRef.current.set(folder, nextMetadata);
        setSelectedTreeAccountMetadata(nextMetadata);
      } catch {
        if (!cancelled) setSelectedTreeAccountMetadata({ logoURL: defaultMissingImage });
      }
    };

    void loadAccountMetadata();
    return () => {
      cancelled = true;
    };
  }, [treeActions.selectedTreeAccount, treeActions.treeAccountRefreshToken]);

  useEffect(() => {
    if (!isShowAllMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (showAllMenuRef.current?.contains(event.target as Node)) return;
      setIsShowAllMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isShowAllMenuOpen]);

  useEffect(() => {
    if (controls.formattedJsonViewEnabled || (controls.outputPanelMode !== 'formatted' && controls.outputPanelMode !== 'tree')) {
      setIsShowAllMenuOpen(false);
    }
  }, [controls.formattedJsonViewEnabled, controls.outputPanelMode]);

  useEffect(() => () => stopInspectorScriptDrag(), [stopInspectorScriptDrag]);

  const handleStepDoubleClick = React.useCallback((stepNumber: number, methodName: string) => {
    setStepActionModalState({
      stepNumber,
      methodName: String(methodName || '').trim(),
      confirmingDelete: false,
    });
  }, []);

  const handleDeleteStepFromModal = React.useCallback(() => {
    if (!stepActionModalState) return;
    if (!stepActionModalState.confirmingDelete) {
      setStepActionModalState((current) => (current ? { ...current, confirmingDelete: true } : current));
      return;
    }
    if (controls.formattedPanelView === 'output') {
      const nextDisplay = removeFormattedOutputBlock(content.formattedOutputDisplay, stepActionModalState.stepNumber);
      if (nextDisplay !== null) {
        controls.setFormattedOutputDisplay(nextDisplay);
      }
    } else {
      scriptActions.deleteScriptStepByNumber(stepActionModalState.stepNumber);
    }
    setStepActionModalState(null);
  }, [content.formattedOutputDisplay, controls, scriptActions, stepActionModalState]);

  const handleCopyStepFromModal = React.useCallback(() => {
    if (!stepActionModalState) return;
    scriptActions.duplicateScriptStepByNumber(stepActionModalState.stepNumber);
    if (controls.formattedPanelView === 'output') {
      const nextDisplay = duplicateFormattedOutputBlock(content.formattedOutputDisplay, stepActionModalState.stepNumber);
      if (nextDisplay !== null) {
        controls.setFormattedOutputDisplay(nextDisplay);
      }
    }
    setStepActionModalState(null);
  }, [content.formattedOutputDisplay, controls, scriptActions, stepActionModalState]);

  const handleOpenSaveScriptModal = React.useCallback(() => {
    if (saveableOutputSteps.length === 0) return;
    setSaveScriptNameInput('');
    setIsSaveConfirmHovered(false);
    setIsSaveScriptModalOpen(true);
  }, [saveableOutputSteps.length]);

  const handleConfirmSaveScript = React.useCallback(() => {
    if (saveScriptValidation.tone === 'invalid') return;
    if (scriptActions.createScriptFromSteps(String(saveScriptNameInput || '').trim(), saveableOutputSteps)) {
      setIsSaveScriptModalOpen(false);
      setSaveScriptNameInput('');
      setIsSaveConfirmHovered(false);
    }
  }, [saveScriptNameInput, saveScriptValidation.tone, saveableOutputSteps, scriptActions]);

  const shownBulkRuleCount = bulkSelectableHiddenRuleKeys.filter((key) =>
    key === 'structureType' ? showStructureType : !hiddenInspectorRules[key],
  ).length;
  const noShownRulesSelected = shownBulkRuleCount === 0;
  const aggregateShownRuleLabel = noShownRulesSelected ? 'All' : 'None';

  return (
    <article className={className} style={style}>
      <LabCardHeader
        title="Console Display"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        secondaryRowClassName="mt-0"
        secondaryRow={
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              {[
                ['execution', 'Execution'],
                ['formatted', 'Formatted'],
                ['raw_status', 'Raw'],
                ['debug', 'Trace'],
              ].map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name="output-panel-mode"
                    value={value}
                    checked={controls.outputPanelMode === value}
                    onChange={(e) => controls.setOutputPanelMode(e.target.value as OutputPanelMode)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="ml-auto flex items-center justify-end gap-3">
              {controls.outputPanelMode === 'formatted' && controls.formattedPanelView === 'output' ? (
                <button
                  type="button"
                  className={refreshIconButtonClassName}
                  onClick={() => controls.refreshActiveOutput()}
                  title="Refresh active command"
                  aria-label="Refresh active command"
                >
                  <RotateCcw className="h-5 w-5" strokeWidth={2.2} />
                </button>
              ) : null}
              <button
                type="button"
                className={actionButtonClassName}
                title="Copy To Clipboard"
                onClick={() =>
                  void controls.copyTextToClipboard(
                    controls.outputPanelMode === 'execution'
                      ? 'Execution Log'
                      : controls.outputPanelMode === 'debug'
                        ? 'Trace'
                      : controls.outputPanelMode === 'tree'
                        ? 'Tree'
                        : controls.outputPanelMode === 'raw_status'
                          ? 'Raw'
                          : controls.formattedPanelView === 'script'
                            ? 'Current Script'
                            : 'Formatted Output Display',
                    controls.outputPanelMode === 'execution'
                      ? executionDisplay
                      : controls.outputPanelMode === 'debug'
                        ? debugDisplay
                      : controls.outputPanelMode === 'tree'
                        ? content.treeOutputDisplay
                        : controls.outputPanelMode === 'raw_status'
                          ? content.status
                          : controls.formattedPanelView === 'script'
                            ? content.scriptDisplay
                            : content.formattedOutputDisplay,
                  )
                }
              >
                Copy
              </button>
              <button
                type="button"
                className={actionButtonClassName}
                onClick={() => {
                  if (controls.outputPanelMode === 'execution') {
                    controls.setLogs([]);
                    return;
                  }
                  if (controls.outputPanelMode === 'tree') {
                    controls.setTreeOutputDisplay('(no tree yet)');
                    return;
                  }
                  if (controls.outputPanelMode === 'debug') {
                    controls.setLogs(content.logs.filter((line) => !DEBUG_TRACE_PATTERN.test(line)));
                    return;
                  }
                  if (controls.outputPanelMode === 'raw_status') {
                    controls.setStatus('(no status yet)');
                    return;
                  }
                  if (controls.outputPanelMode === 'formatted') {
                    if (controls.formattedPanelView === 'script') {
                      controls.setFormattedOutputDisplay('(no script yet)');
                      return;
                    }
                    controls.setFormattedOutputDisplay('(no output yet)');
                  }
                }}
              >
                Clear
              </button>
              {controls.outputPanelMode === 'formatted' && controls.formattedPanelView === 'output' ? (
                <button
                  type="button"
                  className={`${actionButtonClassName} ${
                    (isSaveButtonHovered ? saveScriptValidation.tone : 'valid') === 'invalid'
                      ? 'hover:bg-red-600 hover:text-white'
                      : ''
                  }`}
                  title={saveableOutputSteps.length === 0 ? 'No Methods Available' : 'Save Script'}
                  onMouseEnter={() => setIsSaveButtonHovered(true)}
                  onMouseLeave={() => setIsSaveButtonHovered(false)}
                  onClick={handleOpenSaveScriptModal}
                >
                  Save
                </button>
              ) : null}
            </div>
          </div>
        }
      />
      <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
        {controls.outputPanelMode === 'tree' ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runHeaderRead()}>
                spCoin Meta Data
              </button>
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runAccountListRead()}>
                spCoin Account List
              </button>
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runTreeAccountsRead()}>
                Show Tree Accounts
              </button>
            </div>
            <div
              className={`mt-4 grid grid-cols-1 gap-3${
                controls.showTreeAccountDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
              }`}
            >
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => controls.setShowTreeAccountDetails(!controls.showTreeAccountDetails)}
                  className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                  title="Toggle active account details"
                >
                  Active Account
                </button>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <div className="relative min-w-0">
                    <select
                      className={`${inputStyle} peer appearance-none pr-10`}
                      aria-label="Active account"
                      value={treeActions.selectedTreeAccount}
                      onChange={(e) => {
                        const nextAccount = e.target.value;
                        treeActions.setSelectedTreeAccount(nextAccount);
                        void treeActions.runTreeDump(nextAccount);
                      }}
                    >
                      {treeActions.treeAccountOptions.length === 0 ? (
                        <option value="">No accounts available</option>
                      ) : null}
                      {treeActions.treeAccountOptions.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                    <NativeSelectChevron />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#334155] bg-[#1E2340] text-[#8FA8FF] transition-colors hover:bg-[#2B335A] hover:text-white"
                    onClick={() => treeActions.requestRefreshSelectedTreeAccount()}
                    title="Refresh active account data"
                    aria-label="Refresh active account data"
                  >
                    <RotateCcw className="h-5 w-5" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
              {controls.showTreeAccountDetails ? (
                <>
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                    <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                        {selectedTreeAccountMetadata.logoURL ? (
                          <Image
                            src={selectedTreeAccountMetadata.logoURL}
                            alt={selectedTreeAccountMetadata.name || 'Selected account'}
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">No logo</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">
                          {selectedTreeAccountMetadata.name || 'Unnamed account'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {selectedTreeAccountMetadata.symbol || 'No symbol'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-[#334155] bg-[#0B1220]">
          {controls.outputPanelMode === 'formatted' || controls.outputPanelMode === 'tree' ? (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-3 rounded-md bg-[#0B1220]/90 px-2 py-1 text-xs text-slate-200">
              {!controls.formattedJsonViewEnabled ? (
                <div ref={showAllMenuRef} className="relative flex items-center gap-1">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors ${
                      controls.showAllTreeRecords ? 'text-white' : 'text-slate-300 hover:text-white'
                    }`}
                    onClick={() => controls.setShowAllTreeRecords(!controls.showAllTreeRecords)}
                    aria-pressed={controls.showAllTreeRecords}
                  >
                    <span>Show</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] text-slate-400 transition-colors hover:text-white"
                    onClick={() => setIsShowAllMenuOpen((prev) => !prev)}
                    aria-label="Toggle Show All filters"
                    aria-expanded={isShowAllMenuOpen}
                  >
                    <SelectChevron open={isShowAllMenuOpen} />
                  </button>
                  {isShowAllMenuOpen ? (
                    <div className="absolute left-0 top-6 z-20 w-56 rounded-md border border-[#334155] bg-[#0B1220] p-2 text-[10px] leading-4 text-slate-300 shadow-lg">
                      <div className="mb-1 font-semibold text-[#8FA8FF]">Show Field</div>
                      <label className="flex items-center gap-2 py-0.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                          checked={false}
                          onChange={() =>
                            (() => {
                              setHiddenInspectorRules((prev) => ({
                                ...prev,
                                zeroValues: !noShownRulesSelected,
                                emptyValues: !noShownRulesSelected,
                                falseValues: !noShownRulesSelected,
                                todoValues: !noShownRulesSelected,
                                emptyCollections: !noShownRulesSelected,
                                creationDates: !noShownRulesSelected,
                              }));
                              setShowStructureType(noShownRulesSelected);
                            })()
                          }
                        />
                        <span>{aggregateShownRuleLabel}</span>
                      </label>
                      {hiddenRuleOptions.map(([key, label]) => {
                        const isFormattedAmountsRule = key === 'formattedAmounts';
                        const isStructureTypeRule = key === 'structureType';
                        const isChecked = isFormattedAmountsRule
                          ? hiddenInspectorRules.formattedAmounts
                          : isStructureTypeRule
                            ? showStructureType
                            : !hiddenInspectorRules[key as keyof typeof hiddenInspectorRules];

                        return (
                          <React.Fragment key={key}>
                            {isFormattedAmountsRule ? (
                              <div className="my-1 rounded-sm bg-[#E5B94F] px-2 py-0.5 text-center font-semibold text-[#111827]">
                                --------- UTILS ---------
                              </div>
                            ) : null}
                            <label className="flex items-center gap-2 py-0.5">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                                checked={isChecked}
                                onChange={(event) =>
                                  isStructureTypeRule
                                    ? setShowStructureType(event.target.checked)
                                    : setHiddenInspectorRules((prev) => ({
                                        ...prev,
                                        [key]: isFormattedAmountsRule ? event.target.checked : !event.target.checked,
                                      }))
                                }
                              />
                              <span>{label}</span>
                            </label>
                          </React.Fragment>
                        );
                      })}
                      <div className="my-2 rounded-sm bg-[#E5B94F] px-2 py-0.5 text-center font-semibold text-[#111827]">
                        --------- FIELDS ---------
                      </div>
                      {payloadFieldOptions.map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 py-0.5">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                            checked={showPayloadFields[key]}
                            onChange={(event) =>
                              setShowPayloadFields((prev) => ({
                                ...prev,
                                [key]: event.target.checked,
                              }))
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                  checked={controls.formattedJsonViewEnabled}
                  onChange={(e) => controls.setFormattedJsonViewEnabled(e.target.checked)}
                />
                <span>Json</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-[#E5B94F]"
                  checked={controls.writeTraceEnabled}
                  onChange={controls.toggleWriteTrace}
                />
                <span>Trace</span>
              </label>
              {controls.outputPanelMode === 'formatted'
                ? ([
                    ['script', 'Script'],
                    ['output', 'Output'],
                  ] as const).map(([value, label]) => (
                    <label key={value} className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name="formatted-panel-view"
                        value={value}
                        checked={controls.formattedPanelView === value}
                        onChange={(e) => controls.setFormattedPanelView(e.target.value as FormattedPanelView)}
                      />
                      <span>{label}</span>
                    </label>
                  ))
                : null}
            </div>
          ) : null}
          {controls.outputPanelMode === 'formatted' &&
          !controls.formattedJsonViewEnabled &&
          collapsibleFormattedBlocks ? (
            <div className={`h-full min-h-0 overflow-auto p-3 pr-36 text-xs text-slate-200 ${content.hiddenScrollbarClass}`}>
              <div className="space-y-0">
                {inspectorFormattedBlocks.map((block) => (
                  <JsonInspector
                    key={block.path}
                    data={
                      block.data && typeof block.data === 'object'
                        ? block.data
                        : {
                            value: block.data,
                          }
                    }
                    collapsedKeys={collapsedKeys}
                    updateCollapsedKeys={updateCollapsedKeys}
                    path={block.path}
                    highlightPathPrefixes={highlightedInspectorPathPrefixes}
                    highlightColorClass={inspectorHighlightColorClass}
                    showAll={controls.showAllTreeRecords}
                    hiddenRules={hiddenInspectorRules}
                    hideEntryKeys={hiddenPayloadFieldKeys}
                    forceShowEntryKeys={visiblePayloadFieldKeys}
                    formatTokenAmounts={hiddenInspectorRules.formattedAmounts}
                    tokenDecimals={activeTokenDecimals}
                    showStructureType={showStructureType}
                    label={block.label}
                    rootLabel={block.rootLabel}
                    onLeafValueClick={(value, path, key) => void handleExpandAccountFromInspector(value, path, key)}
                    onAddressNodeClick={(value, path, key) => void handleOpenAccountFromInspector(value, path, key)}
                    onTrace={appendOutputTrace}
                    scriptStepDragState={{
                      enabled: isScriptInspectorReorderEnabled,
                      draggedStepNumber: draggedScriptStepNumber,
                      dropTarget: scriptStepDropTarget,
                      setDraggedStepNumber: setDraggedScriptStepNumber,
                      setDropTarget: setScriptStepDropTarget,
                      beginDrag: beginInspectorScriptDrag,
                      onStepDoubleClick: handleStepDoubleClick,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : controls.outputPanelMode === 'tree' &&
            !controls.formattedJsonViewEnabled &&
            collapsibleTreeBlocks ? (
            <div className={`h-full min-h-0 overflow-auto p-3 pr-36 text-xs text-slate-200 ${content.hiddenScrollbarClass}`}>
              <div className="space-y-3">
                {collapsibleTreeBlocks.map((block, index) => (
                  <JsonInspector
                    key={`tree-${index}`}
                    data={
                      block && typeof block === 'object'
                        ? block
                        : {
                            value: block,
                          }
                    }
                    collapsedKeys={collapsedKeys}
                    updateCollapsedKeys={updateCollapsedKeys}
                    path={`tree-${index}`}
                    highlightPathPrefixes={[]}
                    label={collapsibleTreeBlocks.length === 1 ? 'Tree' : `Tree ${index + 1}`}
                    rootLabel={collapsibleTreeBlocks.length === 1 ? 'Tree' : `Tree ${index + 1}`}
                    showAll={controls.showAllTreeRecords}
                    hiddenRules={hiddenInspectorRules}
                    hideEntryKeys={hiddenPayloadFieldKeys}
                    forceShowEntryKeys={visiblePayloadFieldKeys}
                    formatTokenAmounts={hiddenInspectorRules.formattedAmounts}
                    tokenDecimals={activeTokenDecimals}
                    showStructureType={showStructureType}
                    onLeafValueClick={(value, path, key) => void handleExpandAccountFromInspector(value, path, key)}
                    onAddressNodeClick={(value, path, key) => void handleOpenAccountFromInspector(value, path, key)}
                    onTrace={appendOutputTrace}
                    scriptStepDragState={{
                      enabled: false,
                      draggedStepNumber: null,
                      dropTarget: null,
                      setDraggedStepNumber: () => undefined,
                      setDropTarget: () => undefined,
                      beginDrag: () => undefined,
                      onStepDoubleClick: () => undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <pre
              className={`h-full min-h-0 overflow-auto p-3 text-xs text-slate-200 ${controls.outputPanelMode === 'formatted' || controls.outputPanelMode === 'tree' ? 'pr-36' : ''} ${content.hiddenScrollbarClass}`}
            >
              {controls.outputPanelMode === 'formatted' &&
              content.highlightedFormattedOutputLines
                ? content.highlightedFormattedOutputLines.map(({ line, active }, idx) => (
                    <span
                      key={`formatted-line-${idx}`}
                      className={
                        active
                          ? content.selectedScriptStepHasMissingRequiredParams || content.selectedScriptStepHasExecutionError
                            ? 'text-red-400'
                            : 'text-green-400'
                          : undefined
                      }
                    >
                      {line}
                      {'\n'}
                    </span>
                  ))
                : controls.outputPanelMode === 'execution'
                  ? executionDisplay
                  : controls.outputPanelMode === 'debug'
                    ? debugDisplay
                  : controls.outputPanelMode === 'tree'
                    ? content.treeOutputDisplay
                    : controls.outputPanelMode === 'raw_status'
                      ? content.status
                      : currentFormattedDisplay}
            </pre>
          )}
        </div>
      </div>
      <BaseModal
        isOpen={isSaveScriptModalOpen}
        title="Save Script"
        maxWidthClassName="max-w-md"
        panelClassName="rounded-2xl border border-[#31416F] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        titleClassName="text-xl font-semibold text-[#8FA8FF]"
        footer={
          <>
            <button
              type="button"
              className={actionButtonClassName}
              onClick={() => {
                setIsSaveScriptModalOpen(false);
                setIsSaveConfirmHovered(false);
              }}
            >
              Return
            </button>
            <button
              type="button"
              className={`${actionButtonClassName} ${
                (isSaveConfirmHovered ? saveScriptValidation.tone : 'valid') === 'invalid'
                  ? 'hover:bg-red-600 hover:text-white'
                  : saveScriptValidation.tone === 'update'
                    ? 'hover:bg-green-600 hover:text-white'
                  : ''
              }`}
              title={saveScriptValidation.title}
              onMouseEnter={() => setIsSaveConfirmHovered(true)}
              onMouseLeave={() => setIsSaveConfirmHovered(false)}
              onClick={handleConfirmSaveScript}
            >
              {saveScriptValidation.actionLabel}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-slate-200">Enter a script name to save the current output methods.</div>
          <input
            className={inputStyle}
            value={saveScriptNameInput}
            onChange={(event) => setSaveScriptNameInput(event.target.value)}
            placeholder="Script name"
            title="Script name"
          />
        </div>
      </BaseModal>
      <BaseModal
        isOpen={Boolean(inspectorAccountPopup)}
        title={inspectorAccountPopup?.label || 'Account'}
        maxWidthClassName="max-w-4xl"
        panelClassName="rounded-2xl border border-[#31416F] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        titleClassName="text-xl font-semibold text-[#8FA8FF]"
        footer={
          <button type="button" className={actionButtonClassName} onClick={() => setInspectorAccountPopup(null)}>
            Close
          </button>
        }
      >
        {inspectorAccountPopup ? (
          <AccountSelection
            label={inspectorAccountPopup.label}
            title={`Toggle ${inspectorAccountPopup.label} details`}
            isOpen
            onToggle={() => setInspectorAccountPopup(null)}
            traceLabel="inspector.account"
            onTrace={appendOutputTrace}
            control={
              <div className="relative">
                <input readOnly value={inspectorAccountPopup.address} className={`${inputStyle} pr-10`} />
                <SelectChevron className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA8FF]" />
              </div>
            }
            metadata={inspectorPopupMetadata}
            extraDetails={
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                <input readOnly value={inspectorPopupAccount?.privateKey || ''} className={inputStyle} />
              </div>
            }
          />
        ) : null}
      </BaseModal>
      <BaseModal
        isOpen={Boolean(stepActionModalState)}
        title={
          stepActionModalState?.confirmingDelete
            ? 'Confirm Delete Action'
            : `Step ${stepActionModalState?.stepNumber ?? ''} Action`
        }
        maxWidthClassName="max-w-md"
        panelClassName="rounded-2xl border border-[#31416F] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        titleClassName="text-xl font-semibold text-[#8FA8FF]"
        footer={
          <>
            <button
              type="button"
              className={actionButtonClassName}
              onClick={() =>
                setStepActionModalState((current) =>
                  current?.confirmingDelete ? { ...current, confirmingDelete: false } : null,
                )
              }
            >
              Return
            </button>
            {!stepActionModalState?.confirmingDelete ? (
              <button type="button" className={actionButtonClassName} onClick={handleCopyStepFromModal}>
                Copy
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-red-500 bg-red-950 px-3 py-[0.45rem] text-sm text-red-200 transition-colors hover:bg-red-600 hover:text-white"
              onClick={handleDeleteStepFromModal}
            >
              Delete
            </button>
          </>
        }
      >
        <div className="text-sm text-slate-200">
          {stepActionModalState?.confirmingDelete
            ? `Confirm Delete ${stepActionModalState?.methodName || 'Method'} Action`
            : `Copy / Delete ${stepActionModalState?.methodName || 'Method'}`}
        </div>
      </BaseModal>
    </article>
  );
}
