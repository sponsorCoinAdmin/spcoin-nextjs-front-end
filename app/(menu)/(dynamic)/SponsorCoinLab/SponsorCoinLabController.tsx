// File: app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  ERC20_READ_OPTIONS,
  getErc20ReadLabels,
  type Erc20ReadMethod,
} from './methods/erc20/read';
import {
  ERC20_WRITE_OPTIONS,
  getErc20WriteLabels,
  type Erc20WriteMethod,
} from './methods/erc20/write';
import {
  SPCOIN_READ_METHOD_DEFS,
  getSpCoinReadOptions,
  type SpCoinReadMethod,
} from './methods/spcoin/read';
import {
  SPCOIN_WRITE_METHOD_DEFS,
  getSpCoinWriteOptions,
  type SpCoinWriteMethod,
} from './methods/spcoin/write';
import {
  CALENDAR_WEEK_DAYS,
  formatDateInput,
  formatDateTimeDisplay,
  parseDateInput,
  useBackdateCalendar,
} from './hooks/useBackdateCalendar';
import { useSponsorCoinLabMethods } from './hooks/useSponsorCoinLabMethods';
import { useSponsorCoinLabNetwork } from './hooks/useSponsorCoinLabNetwork';
import { useSponsorCoinLabPersistence } from './hooks/useSponsorCoinLabPersistence';
import { useSponsorCoinLabScripts } from './hooks/useSponsorCoinLabScripts';
import ContractNetworkCard from './components/ContractNetworkCard';
import DeleteStepPopup from './components/DeleteStepPopup';
import DiscardChangesPopup from './components/DiscardChangesPopup';
import MethodsPanelCard from './components/MethodsPanelCard';
import NetworkSignerCard from './components/NetworkSignerCard';
import OutputResultsCard from './components/OutputResultsCard';
import ScriptStepRow from './components/ScriptStepRow';
import ValidationPopup from './components/ValidationPopup';
import {
  type ConnectionMode,
  type LabScriptStep,
  type MethodPanelMode,
} from './scriptBuilder/types';
import cog_png from '@/public/assets/miscellaneous/cog.png';

type LabCardId = 'network' | 'contract' | 'methods' | 'log' | 'output';
type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
type FormattedPanelView = 'script' | 'output';
type MethodSelectionSource = 'dropdown' | 'script';

const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.28rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
const actionButtonStyle =
  'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60';
const inputStyle =
  'w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400';
const hiddenScrollbarClass =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

function normalizeAddressValue(value: string) {
  const trimmed = String(value || '').trim();
  return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
}

function parseListParam(raw: string): string[] {
  return String(raw || '')
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isIntegerString(value: string) {
  return /^-?\d+$/.test(String(value || '').trim());
}

function isAddressLike(value: string) {
  return /^0[xX][0-9a-fA-F]{40}$/.test(String(value || '').trim());
}

function isHashLike(value: string) {
  return /^0[xX][0-9a-fA-F]{64,}$/.test(String(value || '').trim());
}

function formatDecimalString(value: string) {
  const trimmed = String(value || '').trim();
  if (!isIntegerString(trimmed)) return trimmed;
  const negative = trimmed.startsWith('-');
  const digits = negative ? trimmed.slice(1) : trimmed;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${grouped}` : grouped;
}

function formatOutputValue(value: unknown): unknown {
  if (typeof value === 'bigint') return formatDecimalString(value.toString());
  if (Array.isArray(value)) return value.map((entry) => formatOutputValue(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, formatOutputValue(entry)]),
    );
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || isAddressLike(trimmed) || isHashLike(trimmed)) return value;
    if (isIntegerString(trimmed)) return formatDecimalString(trimmed);
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return formatDecimalString(String(Math.trunc(value)));
  return value;
}

function formatOutputDisplayValue(value: unknown) {
  const normalized = formatOutputValue(value);
  if (typeof normalized === 'string') return normalized;
  return JSON.stringify(normalized, null, 2);
}

function buildMethodCallEntry(
  method: string,
  params?: Array<{ label: string; value: unknown }>,
) {
  return {
    method,
    parameters: (params || []).map((entry) => ({
      label: entry.label,
      value: entry.value,
    })),
  };
}

export default function SponsorCoinLabPage() {
  const { exchangeContext } = useExchangeContext();
  const useLocalSpCoinAccessPackage =
    exchangeContext?.settings?.spCoinAccessManager?.useLocalPackage !== false;
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(
    'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a',
  );
  const [contractAddress, setContractAddress] = useState('');
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState<string[]>(['[SponsorCoin SandBox] Ready']);
  const [formattedOutputDisplay, setFormattedOutputDisplay] = useState('(no output yet)');
  const [treeOutputDisplay, setTreeOutputDisplay] = useState('(no tree yet)');
  const [outputPanelMode, setOutputPanelMode] = useState<OutputPanelMode>('formatted');
  const [formattedPanelView, setFormattedPanelView] = useState<FormattedPanelView>('script');
  const [isScriptDebugRunning, setIsScriptDebugRunning] = useState(false);
  const [writeTraceEnabled, setWriteTraceEnabled] = useState(false);
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [validationPopupFields, setValidationPopupFields] = useState<string[]>([]);
  const [validationPopupMessage, setValidationPopupMessage] = useState(
    'Fill in the following fields before executing the method:',
  );
  const [validationPopupConfirmLabel, setValidationPopupConfirmLabel] = useState('');
  const validationPopupConfirmRef = useRef<(() => void | Promise<void>) | null>(null);
  const [isDiscardChangesPopupOpen, setIsDiscardChangesPopupOpen] = useState(false);
  const discardChangesConfirmRef = useRef<(() => void | Promise<void>) | null>(null);

  const [selectedWriteMethod, setSelectedWriteMethod] = useState<Erc20WriteMethod>('transfer');
  const [writeAddressA, setWriteAddressA] = useState('');
  const [writeAddressB, setWriteAddressB] = useState('');
  const [writeAmountRaw, setWriteAmountRaw] = useState('');
  const [methodPanelMode, setMethodPanelMode] = useState<MethodPanelMode>('ecr20_read');
  const [selectedReadMethod, setSelectedReadMethod] = useState<Erc20ReadMethod>('name');
  const [readAddressA, setReadAddressA] = useState('');
  const [readAddressB, setReadAddressB] = useState('');
  const [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod] =
    useState<SpCoinReadMethod>('getSerializedSPCoinHeader');
  const [selectedSpCoinWriteMethod, setSelectedSpCoinWriteMethod] =
    useState<SpCoinWriteMethod>('addRecipient');
  const [spReadParams, setSpReadParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spWriteParams, setSpWriteParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [methodSelectionSource, setMethodSelectionSource] = useState<MethodSelectionSource>('dropdown');
  const [editingScriptStepNumber, setEditingScriptStepNumber] = useState<number | null>(null);

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
  }, []);
  const copyTextToClipboard = useCallback(
    async (label: string, value: string) => {
      try {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
          throw new Error('Clipboard API unavailable.');
        }
        await navigator.clipboard.writeText(value);
        setStatus(`${label} copied to clipboard.`);
        appendLog(`${label} copied to clipboard.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown clipboard error.';
        setStatus(`${label} copy failed: ${message}`);
        appendLog(`${label} copy failed: ${message}`);
      }
    },
    [appendLog],
  );
  const appendWriteTrace = useCallback(
    (line: string) => {
      if (!writeTraceEnabled) return;
      appendLog(`[TRACE] ${line}`);
    },
    [appendLog, writeTraceEnabled],
  );
  const clearInvalidField = useCallback((fieldId: string) => {
    if (!fieldId) return;
    setInvalidFieldIds((prev) => prev.filter((entry) => entry !== fieldId));
  }, []);
  const clearValidationPopup = useCallback(() => {
    setValidationPopupFields([]);
    setValidationPopupMessage('Fill in the following fields before executing the method:');
    setValidationPopupConfirmLabel('');
    validationPopupConfirmRef.current = null;
  }, []);
  const showValidationPopup = useCallback(
    (
      fieldIds: string[],
      labels: string[],
      message?: string,
      options?: {
        confirmLabel?: string;
        onConfirm?: () => void | Promise<void>;
      },
    ) => {
      setInvalidFieldIds(fieldIds);
      setValidationPopupFields(labels);
      setValidationPopupMessage(message || 'Fill in the following fields before executing the method:');
      setValidationPopupConfirmLabel(options?.confirmLabel || '');
      validationPopupConfirmRef.current = options?.onConfirm || null;
      if (typeof window !== 'undefined' && fieldIds[0]) {
        window.setTimeout(() => {
          const target = document.querySelector(`[data-field-id="${fieldIds[0]}"]`) as
            | HTMLInputElement
            | HTMLSelectElement
            | null;
          target?.focus();
        }, 0);
      }
    },
    [],
  );

  const {
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    hardhatAccounts,
    selectedHardhatIndex,
    setSelectedHardhatIndex,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    showWriteSenderPrivateKey,
    setShowWriteSenderPrivateKey,
    showSignerAccountDetails,
    setShowSignerAccountDetails,
    hardhatAccountMetadata,
    addAccountInput,
    setAddAccountInput,
    deleteAccountInput,
    setDeleteAccountInput,
    signerAccountStatus,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    showHardhatConnectionInputs,
    setShowHardhatConnectionInputs,
    selectedHardhatAccount,
    effectiveConnectedAddress,
    activeNetworkName,
    shouldPromptHardhatBaseConnect,
    chainIdDisplayValue,
    chainIdDisplayWidthCh,
    sponsorCoinVersionChoices,
    selectedSponsorCoinVersionEntry,
    displayedVersionHardhatAccountIndex,
    selectedVersionSignerKey,
    displayedSignerAccountAddress,
    displayedSignerAccountMetadata,
    selectedVersionSymbol,
    selectedSponsorCoinLogoURL,
    selectedVersionSymbolWidthCh,
    selectedWriteSenderAccount,
    writeSenderDisplayValue,
    writeSenderPrivateKeyDisplay,
    addAccountValidation,
    deleteAccountValidation,
    accountActionLabelClassName,
    addSignerAccount,
    deleteSignerAccount,
    adjustSponsorCoinVersion,
    canIncrementSponsorCoinVersion,
    canDecrementSponsorCoinVersion,
    connectHardhatBaseFromNetworkLabel,
    requireContractAddress,
    ensureReadRunner,
    executeWriteConnected,
  } = useSponsorCoinLabNetwork({
    exchangeContext,
    useLocalSpCoinAccessPackage,
    mode,
    rpcUrl,
    setContractAddress,
    contractAddress,
    appendLog,
    appendWriteTrace,
    setStatus,
    setInvalidFieldIds,
    setValidationPopupFields,
    methodPanelMode,
    selectedWriteMethod,
    selectedSpCoinWriteMethod,
    selectedReadMethod,
    selectedSpCoinReadMethod,
  });
  const activeWriteLabels = useMemo(() => getErc20WriteLabels(selectedWriteMethod), [selectedWriteMethod]);
  const activeReadLabels = useMemo(() => getErc20ReadLabels(selectedReadMethod), [selectedReadMethod]);
  const spCoinReadMethodDefs = SPCOIN_READ_METHOD_DEFS;
  const spCoinWriteMethodDefs = SPCOIN_WRITE_METHOD_DEFS;
  const activeSpCoinReadDef = spCoinReadMethodDefs[selectedSpCoinReadMethod];
  const activeSpCoinWriteDef = spCoinWriteMethodDefs[selectedSpCoinWriteMethod];
  const updateSpWriteParamAtIndex = useCallback((idx: number, value: string) => {
    setSpWriteParams((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);
  const backdateCalendar = useBackdateCalendar({
    activeWriteParams: activeSpCoinWriteDef.params,
    spWriteParams,
    updateSpWriteParamAtIndex,
  });
  const {
    erc20WriteMissingEntries,
    erc20ReadMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    canRunErc20WriteMethod,
    canRunErc20ReadMethod,
    canRunSpCoinReadMethod,
    canRunSpCoinWriteMethod,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    runHeaderRead,
    runAccountListRead,
    runTreeDump,
    runSelectedWriteMethod,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod,
    runScriptStep,
  } = useSponsorCoinLabMethods({
    mode,
    methodPanelMode,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    activeReadLabels,
    activeWriteLabels,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    spReadParams,
    spWriteParams,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    activeSpCoinReadDef,
    activeSpCoinWriteDef,
    selectedHardhatAddress:
      mode === 'hardhat'
        ? selectedWriteSenderAccount?.address || selectedWriteSenderAddress || selectedHardhatAccount?.address
        : undefined,
    effectiveConnectedAddress,
    useLocalSpCoinAccessPackage,
    appendLog,
    appendWriteTrace,
    setStatus,
    setFormattedOutputDisplay,
    setTreeOutputDisplay,
    setOutputPanelMode,
    showValidationPopup,
    requireContractAddress,
    ensureReadRunner,
    executeWriteConnected,
    normalizeAddressValue,
    parseListParam,
    parseDateInput,
    backdateHours: backdateCalendar.backdateHours,
    backdateMinutes: backdateCalendar.backdateMinutes,
    backdateSeconds: backdateCalendar.backdateSeconds,
    buildMethodCallEntry,
    formatOutputDisplayValue,
  });
  const {
    scripts,
    setScripts,
    selectedScriptId,
    setSelectedScriptId,
    selectedScript,
    scriptNameInput,
    setScriptNameInput,
    isScriptOptionsOpen,
    setIsScriptOptionsOpen,
    isNewScriptHovered,
    setIsNewScriptHovered,
    isDeleteScriptHovered,
    setIsDeleteScriptHovered,
    newScriptHoverTone,
    setNewScriptHoverTone,
    deleteScriptHoverTone,
    setDeleteScriptHoverTone,
    scriptNameValidation,
    deleteScriptValidation,
    selectedScriptStepNumber,
    setSelectedScriptStepNumber,
    expandedScriptStepIds,
    isDeleteStepPopupOpen,
    setIsDeleteStepPopupOpen,
    selectedScriptStep,
    getStepSender,
    getStepParamEntries,
    loadScriptStep,
    toggleScriptStepExpanded,
    moveSelectedScriptStep,
    requestDeleteSelectedScriptStep,
    confirmDeleteSelectedScriptStep,
    toggleScriptStepBreakpoint,
    createNewScript,
    handleDeleteScriptClick,
    hasEditingScriptChanges,
    addCurrentMethodToScript,
  } = useSponsorCoinLabScripts({
    activeNetworkName,
    mode,
    methodPanelMode,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    activeReadLabels,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    activeWriteLabels,
    selectedSpCoinReadMethod,
    spReadParams,
    activeSpCoinReadDef,
    spCoinReadMethodDefs,
    selectedSpCoinWriteMethod,
    spWriteParams,
    activeSpCoinWriteDef,
    spCoinWriteMethodDefs,
    editingScriptStepNumber,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    showValidationPopup,
    setStatus,
    setOutputPanelMode,
    setFormattedOutputDisplay,
    setMode,
    setMethodPanelMode,
    setSelectedReadMethod,
    setReadAddressA,
    setReadAddressB,
    setSelectedWriteMethod,
    setSelectedWriteSenderAddress,
    setWriteAddressA,
    setWriteAddressB,
    setWriteAmountRaw,
    setSelectedSpCoinReadMethod,
    setSpReadParams,
    setSelectedSpCoinWriteMethod,
    setSpWriteParams,
  });
  const buildEditorSnapshot = useCallback(
    () =>
      JSON.stringify({
        methodPanelMode,
        methodSelectionSource,
        editingScriptStepNumber,
        selectedReadMethod,
        readAddressA,
        readAddressB,
        selectedWriteMethod,
        selectedWriteSenderAddress,
        writeAddressA,
        writeAddressB,
        writeAmountRaw,
        selectedSpCoinReadMethod,
        spReadParams,
        selectedSpCoinWriteMethod,
        spWriteParams,
      }),
    [
      editingScriptStepNumber,
      methodPanelMode,
      methodSelectionSource,
      readAddressA,
      readAddressB,
      selectedReadMethod,
      selectedSpCoinReadMethod,
      selectedSpCoinWriteMethod,
      selectedWriteMethod,
      selectedWriteSenderAddress,
      spReadParams,
      spWriteParams,
      writeAddressA,
      writeAddressB,
      writeAmountRaw,
    ],
  );
  const editorBaselineRef = useRef<string | null>(null);
  const shouldResetEditorBaselineRef = useRef(true);
  const queueEditorBaselineReset = useCallback(() => {
    shouldResetEditorBaselineRef.current = true;
  }, []);
  useEffect(() => {
    if (!shouldResetEditorBaselineRef.current && editorBaselineRef.current !== null) return;
    editorBaselineRef.current = buildEditorSnapshot();
    shouldResetEditorBaselineRef.current = false;
  }, [buildEditorSnapshot]);
  const hasUnsavedEditorChanges = useCallback(() => {
    if (editorBaselineRef.current === null) return false;
    return editorBaselineRef.current !== buildEditorSnapshot();
  }, [buildEditorSnapshot]);
  const clearDiscardChangesPopup = useCallback(() => {
    setIsDiscardChangesPopupOpen(false);
    discardChangesConfirmRef.current = null;
  }, []);
  const runWithDiscardPrompt = useCallback(
    (action: () => void | Promise<void>) => {
      if (methodSelectionSource === 'script' && editingScriptStepNumber !== null && !hasEditingScriptChanges) {
        queueEditorBaselineReset();
        void action();
        return;
      }
      if (!hasUnsavedEditorChanges()) {
        queueEditorBaselineReset();
        void action();
        return;
      }
      discardChangesConfirmRef.current = () => {
        queueEditorBaselineReset();
        void action();
      };
      setIsDiscardChangesPopupOpen(true);
    },
    [editingScriptStepNumber, hasEditingScriptChanges, hasUnsavedEditorChanges, methodSelectionSource, queueEditorBaselineReset],
  );
  useSponsorCoinLabPersistence({
    scripts,
    setScripts,
    selectedScriptId,
    setSelectedScriptId,
    mode,
    setMode,
    rpcUrl,
    setRpcUrl,
    contractAddress,
    setContractAddress,
    selectedHardhatIndex,
    setSelectedHardhatIndex,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    status,
    setStatus,
    logs,
    setLogs,
    formattedOutputDisplay,
    setFormattedOutputDisplay,
    formattedPanelView,
    setFormattedPanelView,
    treeOutputDisplay,
    setTreeOutputDisplay,
    selectedWriteMethod,
    setSelectedWriteMethod,
    writeAddressA,
    setWriteAddressA,
    writeAddressB,
    setWriteAddressB,
    writeAmountRaw,
    setWriteAmountRaw,
    methodPanelMode,
    setMethodPanelMode,
    selectedReadMethod,
    setSelectedReadMethod,
    readAddressA,
    setReadAddressA,
    readAddressB,
    setReadAddressB,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    spReadParams,
    setSpReadParams,
    spWriteParams,
    setSpWriteParams,
    normalizeAddressValue,
    backdateCalendar,
  });
  const selectedScriptDisplay = useMemo(() => {
    const nextSelectedScript = scripts.find((script) => script.id === selectedScriptId);
    return nextSelectedScript ? JSON.stringify(nextSelectedScript, null, 2) : '(no script selected)';
  }, [scripts, selectedScriptId]);
  const erc20ReadOptions = ERC20_READ_OPTIONS;
  const erc20WriteOptions = ERC20_WRITE_OPTIONS;
  const spCoinReadOptions = useMemo(() => {
    return getSpCoinReadOptions(false);
  }, []);
  const spCoinWriteOptions = useMemo(() => {
    return getSpCoinWriteOptions(false);
  }, []);
  useEffect(() => {
    if (spCoinReadMethodDefs[selectedSpCoinReadMethod].executable === false && spCoinReadOptions.length > 0) {
      setSelectedSpCoinReadMethod(spCoinReadOptions[0]);
    }
  }, [selectedSpCoinReadMethod, spCoinReadMethodDefs, spCoinReadOptions]);
  useEffect(() => {
    if (spCoinWriteMethodDefs[selectedSpCoinWriteMethod].executable === false && spCoinWriteOptions.length > 0) {
      setSelectedSpCoinWriteMethod(spCoinWriteOptions[0]);
    }
  }, [selectedSpCoinWriteMethod, spCoinWriteMethodDefs, spCoinWriteOptions]);
  const methodPanelTitle = useMemo(
    () =>
      methodSelectionSource === 'script' && editingScriptStepNumber !== null
        ? `Edit Test Method ${editingScriptStepNumber}`
        : 'New Test Method',
    [editingScriptStepNumber, methodSelectionSource],
  );
  const currentMethodDisplayName = useMemo(() => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        return activeReadLabels.title;
      case 'erc20_write':
        return activeWriteLabels.title;
      case 'spcoin_rread':
        return activeSpCoinReadDef.title;
      case 'spcoin_write':
        return activeSpCoinWriteDef.title;
      default:
        return 'method';
    }
  }, [activeReadLabels.title, activeSpCoinReadDef.title, activeSpCoinWriteDef.title, activeWriteLabels.title, methodPanelMode]);
  const isEditingScriptMethod = methodSelectionSource === 'script' && editingScriptStepNumber !== null;
  const discardChangesMessage = useMemo(
    () => {
      const activeStepNumber = editingScriptStepNumber ?? selectedScriptStepNumber;
      return activeStepNumber !== null
        ? `Discard unsaved changes to Step ${activeStepNumber} (${currentMethodDisplayName}) or return?`
        : `Discard unsaved changes to ${currentMethodDisplayName} or return?`;
    },
    [currentMethodDisplayName, editingScriptStepNumber, selectedScriptStepNumber],
  );
  const isUpdateBlockedByNoChanges = isEditingScriptMethod && !hasEditingScriptChanges;
  const addToScriptButtonLabel = useMemo(
    () =>
      isEditingScriptMethod
        ? `Update Script Step ${editingScriptStepNumber}`
        : 'Add To Script',
    [editingScriptStepNumber, isEditingScriptMethod],
  );
  const [expandedCard, setExpandedCard] = useState<LabCardId | null>(null);
  const toggleExpandedCard = useCallback((cardId: LabCardId) => {
    setExpandedCard((current) => (current === cardId ? null : cardId));
  }, []);
  const showCard = useCallback(
    (cardId: LabCardId) => expandedCard === null || expandedCard === cardId,
    [expandedCard],
  );
  const getCardClassName = useCallback(
    (cardId: LabCardId, placement = '') =>
      `${cardStyle} flex flex-col ${expandedCard === cardId ? 'min-h-[calc(100dvh-10rem)]' : ''} ${placement}`.trim(),
    [expandedCard],
  );
  const methodsCardRef = useRef<HTMLElement | null>(null);
  const scriptDebugStopRef = useRef(false);
  const [sharedMethodsRowHeight, setSharedMethodsRowHeight] = useState<number | null>(null);
  const [isDesktopSharedLayout, setIsDesktopSharedLayout] = useState(false);

  const editScriptStepFromBuilder = useCallback(
    (step: LabScriptStep) => {
      queueEditorBaselineReset();
      setMethodSelectionSource('script');
      setEditingScriptStepNumber(step.step);
      loadScriptStep(step);
    },
    [loadScriptStep, queueEditorBaselineReset],
  );
  const focusScriptStep = useCallback(
    (step: LabScriptStep) => {
      setSelectedScriptStepNumber(step.step);
    },
    [setSelectedScriptStepNumber],
  );
  const selectDropdownMethodPanelMode = useCallback(
    (value: MethodPanelMode) => {
      if (methodPanelMode === value) return;
      runWithDiscardPrompt(() => {
        setMethodSelectionSource('dropdown');
        setEditingScriptStepNumber(null);
        setSelectedScriptStepNumber(null);
        setMethodPanelMode(value);
      });
    },
    [methodPanelMode, runWithDiscardPrompt, setMethodPanelMode, setSelectedScriptStepNumber],
  );
  const selectDropdownReadMethod = useCallback(
    (value: Erc20ReadMethod) => {
      if (selectedReadMethod === value) return;
      runWithDiscardPrompt(() => {
        setMethodSelectionSource('dropdown');
        setEditingScriptStepNumber(null);
        setSelectedScriptStepNumber(null);
        setSelectedReadMethod(value);
      });
    },
    [runWithDiscardPrompt, selectedReadMethod, setSelectedReadMethod, setSelectedScriptStepNumber],
  );
  const selectDropdownWriteMethod = useCallback(
    (value: Erc20WriteMethod) => {
      if (selectedWriteMethod === value) return;
      runWithDiscardPrompt(() => {
        setMethodSelectionSource('dropdown');
        setEditingScriptStepNumber(null);
        setSelectedScriptStepNumber(null);
        setSelectedWriteMethod(value);
      });
    },
    [runWithDiscardPrompt, selectedWriteMethod, setSelectedScriptStepNumber, setSelectedWriteMethod],
  );
  const selectDropdownSpCoinReadMethod = useCallback(
    (value: SpCoinReadMethod) => {
      if (selectedSpCoinReadMethod === value) return;
      runWithDiscardPrompt(() => {
        setMethodSelectionSource('dropdown');
        setEditingScriptStepNumber(null);
        setSelectedScriptStepNumber(null);
        setSelectedSpCoinReadMethod(value);
      });
    },
    [runWithDiscardPrompt, selectedSpCoinReadMethod, setSelectedScriptStepNumber, setSelectedSpCoinReadMethod],
  );
  const selectDropdownSpCoinWriteMethod = useCallback(
    (value: SpCoinWriteMethod) => {
      if (selectedSpCoinWriteMethod === value) return;
      runWithDiscardPrompt(() => {
        setMethodSelectionSource('dropdown');
        setEditingScriptStepNumber(null);
        setSelectedScriptStepNumber(null);
        setSelectedSpCoinWriteMethod(value);
      });
    },
    [runWithDiscardPrompt, selectedSpCoinWriteMethod, setSelectedScriptStepNumber, setSelectedSpCoinWriteMethod],
  );
  const handleAddCurrentMethodToScript = useCallback(() => {
    const savedStepNumber = addCurrentMethodToScript();
    if (!savedStepNumber) return;
    setMethodSelectionSource('script');
    setEditingScriptStepNumber(savedStepNumber);
    setSelectedScriptStepNumber(savedStepNumber);
    queueEditorBaselineReset();
  }, [addCurrentMethodToScript, queueEditorBaselineReset, setSelectedScriptStepNumber]);
  useEffect(() => {
    const updateViewportMode = () => setIsDesktopSharedLayout(window.innerWidth >= 1280);

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  useEffect(() => {
    if (!isDesktopSharedLayout || expandedCard !== null) {
      setSharedMethodsRowHeight(null);
      return;
    }

    const node = methodsCardRef.current;
    if (!node) return;

    const updateHeight = () => setSharedMethodsRowHeight(Math.ceil(node.getBoundingClientRect().height));

    updateHeight();

    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [expandedCard, isDesktopSharedLayout]);
  const restartScriptAtStart = useCallback(async () => {
    scriptDebugStopRef.current = true;
    setIsScriptDebugRunning(false);
    setFormattedOutputDisplay('(no output yet)');
    if (!selectedScript || selectedScript.steps.length === 0 || selectedScriptStepNumber === null) {
      setStatus('Selected script has no steps to restart.');
      return;
    }
    scriptDebugStopRef.current = false;
    setIsScriptDebugRunning(true);
    let accumulatedOutput = '(no output yet)';
    try {
      for (let idx = 0; idx < selectedScript.steps.length; idx += 1) {
        const step = selectedScript.steps[idx];
        if (idx === 0 && step.breakpoint) {
          focusScriptStep(step);
          setStatus(`Paused at breakpoint before step ${step.step}.`);
          return;
        }
        focusScriptStep(step);
        const result = await runScriptStep(step, { formattedOutputBase: accumulatedOutput });
        accumulatedOutput = result.formattedOutput;
        if (!result.success) return;
        if (scriptDebugStopRef.current) {
          setStatus(`Stopped ${selectedScript.name} at step ${step.step}.`);
          return;
        }

        const nextStep = selectedScript.steps[idx + 1];
        if (!nextStep) {
          setSelectedScriptStepNumber(null);
          setStatus(`Completed ${selectedScript.name}.`);
          return;
        }

        if (nextStep.breakpoint) {
          focusScriptStep(nextStep);
          setStatus(`Paused at breakpoint before step ${nextStep.step}.`);
          return;
        }
      }
    } finally {
      setIsScriptDebugRunning(false);
    }
  }, [focusScriptStep, runScriptStep, selectedScript, selectedScriptStepNumber]);
  const runSelectedScriptStep = useCallback(async () => {
    if (!selectedScript || selectedScript.steps.length === 0 || selectedScriptStepNumber === null) {
      setStatus('Selected script has no steps to run.');
      return;
    }

    scriptDebugStopRef.current = false;
    const selectedIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const activeStep = selectedScript.steps[currentIndex];
    if (!activeStep) {
      setStatus('Unable to resolve the selected script step.');
      return;
    }

    focusScriptStep(activeStep);
    setIsScriptDebugRunning(true);
    try {
      const result = await runScriptStep(activeStep, { formattedOutputBase: formattedOutputDisplay });
      if (!result.success) return;
      const nextStep = selectedScript.steps[currentIndex + 1];
      if (nextStep) {
        focusScriptStep(nextStep);
        setStatus(`Completed step ${activeStep.step}. Ready for step ${nextStep.step}.`);
      } else {
        setSelectedScriptStepNumber(null);
        setStatus(`Completed ${selectedScript.name}.`);
      }
    } finally {
      setIsScriptDebugRunning(false);
    }
  }, [focusScriptStep, formattedOutputDisplay, runScriptStep, selectedScript, selectedScriptStepNumber]);
  const runRemainingScriptSteps = useCallback(async () => {
    if (!selectedScript || selectedScript.steps.length === 0) {
      setStatus('Selected script has no steps to run.');
      return;
    }

    const selectedIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
    const startIndex = selectedIndex >= 0 ? selectedIndex : 0;
    scriptDebugStopRef.current = false;
    setIsScriptDebugRunning(true);

    let accumulatedOutput = formattedOutputDisplay;
    try {
      for (let idx = startIndex; idx < selectedScript.steps.length; idx += 1) {
        const step = selectedScript.steps[idx];
        focusScriptStep(step);
        const result = await runScriptStep(step, { formattedOutputBase: accumulatedOutput });
        accumulatedOutput = result.formattedOutput;
        if (!result.success) return;
        if (scriptDebugStopRef.current) {
          setStatus(`Stopped ${selectedScript.name} at step ${step.step}.`);
          return;
        }

        const nextStep = selectedScript.steps[idx + 1];
        if (!nextStep) {
          setSelectedScriptStepNumber(null);
          setStatus(`Completed ${selectedScript.name}.`);
          return;
        }

        if (nextStep.breakpoint) {
          focusScriptStep(nextStep);
          setStatus(`Paused at breakpoint before step ${nextStep.step}.`);
          return;
        }
      }
    } finally {
      setIsScriptDebugRunning(false);
    }
  }, [focusScriptStep, formattedOutputDisplay, runScriptStep, selectedScript, selectedScriptStepNumber]);
  const selectScriptStep = useCallback(
    (step: LabScriptStep) => {
      if (selectedScriptStep?.step === step.step) {
        setSelectedScriptStepNumber(null);
        return;
      }
      if (selectedScriptStepNumber === null) {
        setFormattedOutputDisplay('(no output yet)');
      }
      focusScriptStep(step);
    },
    [
      focusScriptStep,
      selectedScriptStep?.step,
      selectedScriptStepNumber,
      setSelectedScriptStepNumber,
    ],
  );
  const editScriptStep = useCallback(
    (step: LabScriptStep) => {
      editScriptStepFromBuilder(step);
    },
    [editScriptStepFromBuilder],
  );
  const renderScriptStepRow = useCallback(
    (step: LabScriptStep) => {
      const isExpanded = Boolean(expandedScriptStepIds[String(step.step)]);
      const isSelected = selectedScriptStep?.step === step.step;
      const isEditingStep = isEditingScriptMethod && editingScriptStepNumber === step.step;
      return (
        <ScriptStepRow
          key={`step-${step.step}`}
          step={step}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isEditingStep={isEditingStep}
          getStepSender={getStepSender}
          getStepParamEntries={getStepParamEntries}
          selectScriptStep={selectScriptStep}
          editScriptStep={editScriptStep}
          toggleScriptStepExpanded={toggleScriptStepExpanded}
          toggleScriptStepBreakpoint={toggleScriptStepBreakpoint}
        />
      );
    },
    [
      editingScriptStepNumber,
      expandedScriptStepIds,
      editScriptStep,
      getStepParamEntries,
      getStepSender,
      isEditingScriptMethod,
      selectedScriptStep?.step,
      selectScriptStep,
      toggleScriptStepBreakpoint,
      toggleScriptStepExpanded,
    ],
  );
  useEffect(() => {
    if (editingScriptStepNumber === null) return;
    const editedStepStillExists = Boolean(selectedScript?.steps.some((step) => step.step === editingScriptStepNumber));
    if (editedStepStillExists) return;
    setEditingScriptStepNumber(null);
    setMethodSelectionSource('dropdown');
  }, [editingScriptStepNumber, selectedScript?.steps]);
  const highlightedFormattedOutputLines = useMemo(() => {
    if (
      outputPanelMode !== 'formatted' ||
      formattedPanelView !== 'script' ||
      selectedScriptStepNumber === null
    ) {
      return null;
    }
    const lines = String(selectedScriptDisplay || '').split('\n');
    const targetLineIndex = lines.findIndex((line) => line.includes(`"step": ${selectedScriptStepNumber}`));
    if (targetLineIndex < 0) return null;

    let startIndex = targetLineIndex;
    if (targetLineIndex > 0 && lines[targetLineIndex - 1].trim().startsWith('{')) {
      startIndex = targetLineIndex - 1;
    }

    let depth = 0;
    let endIndex = targetLineIndex;
    for (let idx = startIndex; idx < lines.length; idx += 1) {
      const line = lines[idx];
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      endIndex = idx;
      if (idx > startIndex && depth <= 0) break;
    }

    return lines.map((line, idx) => ({
      line,
      active: idx >= startIndex && idx <= endIndex,
    }));
  }, [formattedPanelView, outputPanelMode, selectedScriptDisplay, selectedScriptStepNumber]);

  return (
    <main className="min-h-screen bg-[#090C16] p-6 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SponsorCoin SandBox</h2>

        <section className={`grid grid-cols-1 gap-6 ${expandedCard ? '' : 'xl:grid-cols-2'}`}>
          {showCard('network') && (
          <NetworkSignerCard
            className={getCardClassName('network', expandedCard ? '' : 'xl:col-start-2 xl:row-start-1')}
            isExpanded={expandedCard === 'network'}
            onToggleExpand={() => toggleExpandedCard('network')}
            inputStyle={inputStyle}
            details={{
              showSignerAccountDetails,
              setShowSignerAccountDetails,
              displayedSignerAccountAddress,
              displayedSignerAccountMetadata,
              mode,
              selectedVersionSignerKey,
            }}
            accountManagement={{
              addSignerAccount,
              deleteSignerAccount,
              accountActionLabelClassName,
              addAccountValidation,
              addAccountInput,
              setAddAccountInput,
              deleteAccountValidation,
              deleteAccountInput,
              setDeleteAccountInput,
              signerAccountStatus,
            }}
          />
          )}

          {showCard('contract') && (
          <ContractNetworkCard
            className={getCardClassName('contract', expandedCard ? '' : 'xl:col-start-1 xl:row-start-1')}
            isExpanded={expandedCard === 'contract'}
            onToggleExpand={() => toggleExpandedCard('contract')}
            inputStyle={inputStyle}
            logo={{
              selectedSponsorCoinLogoURL,
              selectedSponsorCoinVersionEntry,
            }}
            version={{
              selectedSponsorCoinVersion,
              setSelectedSponsorCoinVersion,
              sponsorCoinVersionChoices,
              canIncrementSponsorCoinVersion,
              canDecrementSponsorCoinVersion,
              adjustSponsorCoinVersion,
              selectedVersionSignerKey,
              displayedVersionHardhatAccountIndex,
              selectedVersionSymbolWidthCh,
              selectedVersionSymbol,
            }}
            contract={{
              contractAddress,
              selectedSponsorCoinVersionEntry,
            }}
            network={{
              mode,
              setMode,
              shouldPromptHardhatBaseConnect,
              connectHardhatBaseFromNetworkLabel,
              activeNetworkName,
              chainIdDisplayValue,
              chainIdDisplayWidthCh,
              showHardhatConnectionInputs,
              setShowHardhatConnectionInputs,
              cogSrc: cog_png,
              rpcUrl,
              setRpcUrl,
              effectiveConnectedAddress,
            }}
          />
          )}
          {showCard('methods') && (
          <MethodsPanelCard
            articleClassName={`${getCardClassName('methods', expandedCard ? '' : 'xl:col-start-1 xl:row-start-2')} self-start`}
            methodsCardRef={methodsCardRef}
            isExpanded={expandedCard === 'methods'}
            onToggleExpand={() => toggleExpandedCard('methods')}
            methodPanelTitle={methodPanelTitle}
            methodPanelMode={methodPanelMode}
            setMethodPanelMode={selectDropdownMethodPanelMode}
            scriptBuilderProps={{
              actionButtonStyle,
              hiddenScrollbarClass,
              scripts,
              selectedScript,
              selectedScriptStepNumber,
              scriptNameInput,
              setScriptNameInput,
              selectedScriptId,
              setSelectedScriptId,
              isScriptOptionsOpen,
              setIsScriptOptionsOpen,
              isNewScriptHovered,
              setIsNewScriptHovered,
              isDeleteScriptHovered,
              setIsDeleteScriptHovered,
              newScriptHoverTone,
              setNewScriptHoverTone,
              deleteScriptHoverTone,
              setDeleteScriptHoverTone,
              scriptNameValidation,
              deleteScriptValidation,
              createNewScript,
              handleDeleteScriptClick,
              restartScriptAtStart,
              runSelectedScriptStep,
              runRemainingScriptSteps,
              isScriptDebugRunning,
              moveSelectedScriptStep,
              requestDeleteSelectedScriptStep,
              renderScriptStepRow,
            }}
            erc20ReadProps={{
              invalidFieldIds,
              clearInvalidField,
              selectedReadMethod,
              hardhatAccounts,
              hardhatAccountMetadata,
              erc20ReadOptions,
              setSelectedReadMethod: (value) => selectDropdownReadMethod(value as Erc20ReadMethod),
              activeReadLabels,
              readAddressA,
              setReadAddressA,
              readAddressB,
              setReadAddressB,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedReadMethod: canRunErc20ReadMethod,
              canAddCurrentMethodToScript: canRunErc20ReadMethod,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: erc20ReadMissingEntries.map((entry) => entry.id),
              runSelectedReadMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
            erc20WriteProps={{
              invalidFieldIds,
              clearInvalidField,
              mode,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedWriteSenderAddress: selectedWriteSenderAccount?.address || selectedWriteSenderAddress,
              setSelectedWriteSenderAddress,
              writeSenderDisplayValue,
              writeSenderPrivateKeyDisplay,
              showWriteSenderPrivateKey,
              toggleShowWriteSenderPrivateKey: () => setShowWriteSenderPrivateKey((prev) => !prev),
              selectedWriteMethod,
              erc20WriteOptions,
              setSelectedWriteMethod: (value) => selectDropdownWriteMethod(value as Erc20WriteMethod),
              activeWriteLabels,
              writeAddressA,
              setWriteAddressA,
              writeAddressB,
              setWriteAddressB,
              writeAmountRaw,
              setWriteAmountRaw,
              inputStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedWriteMethod: canRunErc20WriteMethod,
              canAddCurrentMethodToScript: canRunErc20WriteMethod,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: erc20WriteMissingEntries.map((entry) => entry.id),
              runSelectedWriteMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
            spCoinReadProps={{
              invalidFieldIds,
              clearInvalidField,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedSpCoinReadMethod,
              setSelectedSpCoinReadMethod: (value) => selectDropdownSpCoinReadMethod(value as SpCoinReadMethod),
              spCoinReadOptions,
              spCoinReadMethodDefs: spCoinReadMethodDefs as Record<string, { title: string; params: { label: string; placeholder: string; type?: string }[]; executable?: boolean }>,
              activeSpCoinReadDef: activeSpCoinReadDef as { title: string; params: { label: string; placeholder: string; type?: string }[]; executable?: boolean },
              spReadParams,
              setSpReadParams,
              inputStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedSpCoinReadMethod: canRunSpCoinReadMethod,
              canAddCurrentMethodToScript: canRunSpCoinReadMethod,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: spCoinReadMissingEntries.map((entry) => entry.id),
              runSelectedSpCoinReadMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
            spCoinWriteProps={{
              invalidFieldIds,
              clearInvalidField,
              mode,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedWriteSenderAddress: selectedWriteSenderAccount?.address || selectedWriteSenderAddress,
              setSelectedWriteSenderAddress,
              writeSenderDisplayValue,
              writeSenderPrivateKeyDisplay,
              showWriteSenderPrivateKey,
              toggleShowWriteSenderPrivateKey: () => setShowWriteSenderPrivateKey((prev) => !prev),
              recipientRateKeyOptions,
              agentRateKeyOptions,
              recipientRateKeyHelpText,
              agentRateKeyHelpText,
              selectedSpCoinWriteMethod,
              setSelectedSpCoinWriteMethod: (value) => selectDropdownSpCoinWriteMethod(value as SpCoinWriteMethod),
              spCoinWriteOptions,
              spCoinWriteMethodDefs: spCoinWriteMethodDefs as Record<string, { title: string; params: { label: string; placeholder: string; type: string }[]; executable?: boolean }>,
              activeSpCoinWriteDef: activeSpCoinWriteDef as { title: string; params: { label: string; placeholder: string; type: string }[]; executable?: boolean },
              spWriteParams,
              updateSpWriteParamAtIndex,
              onOpenBackdatePicker: backdateCalendar.openBackdatePickerAt,
              inputStyle,
              buttonStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedSpCoinWriteMethod: canRunSpCoinWriteMethod,
              canAddCurrentMethodToScript: canRunSpCoinWriteMethod,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: spCoinWriteMissingEntries.map((entry) => entry.id),
              runSelectedSpCoinWriteMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
              formatDateTimeDisplay,
              formatDateInput,
              backdateHours: backdateCalendar.backdateHours,
              setBackdateHours: backdateCalendar.setBackdateHours,
              backdateMinutes: backdateCalendar.backdateMinutes,
              setBackdateMinutes: backdateCalendar.setBackdateMinutes,
              backdateSeconds: backdateCalendar.backdateSeconds,
              setBackdateSeconds: backdateCalendar.setBackdateSeconds,
              setBackdateYears: backdateCalendar.setBackdateYears,
              setBackdateMonths: backdateCalendar.setBackdateMonths,
              setBackdateDays: backdateCalendar.setBackdateDays,
              backdatePopupParamIdx: backdateCalendar.backdatePopupParamIdx,
              setBackdatePopupParamIdx: backdateCalendar.setBackdatePopupParamIdx,
              shiftCalendarMonth: backdateCalendar.shiftCalendarMonth,
              calendarMonthOptions: backdateCalendar.calendarMonthOptions,
              calendarViewMonth: backdateCalendar.calendarViewMonth,
              setCalendarViewMonth: backdateCalendar.setCalendarViewMonth,
              calendarYearOptions: backdateCalendar.calendarYearOptions,
              calendarViewYear: backdateCalendar.calendarViewYear,
              setCalendarViewYear: backdateCalendar.setCalendarViewYear,
              isViewingCurrentMonth: backdateCalendar.isViewingCurrentMonth,
              setHoverCalendarWarning: backdateCalendar.setHoverCalendarWarning,
              CALENDAR_WEEK_DAYS,
              calendarDayCells: backdateCalendar.calendarDayCells,
              isViewingFutureMonth: backdateCalendar.isViewingFutureMonth,
              today: backdateCalendar.today,
              selectedBackdateDate: backdateCalendar.selectedBackdateDate,
              hoverCalendarWarning: backdateCalendar.hoverCalendarWarning,
              maxBackdateYears: backdateCalendar.maxBackdateYears,
              backdateYears: backdateCalendar.backdateYears,
              backdateMonths: backdateCalendar.backdateMonths,
              backdateDays: backdateCalendar.backdateDays,
              applyBackdateBy: backdateCalendar.applyBackdateBy,
            }}
          />
          )}
          {showCard('output') && (
          <OutputResultsCard
            className={`${getCardClassName('output', expandedCard ? '' : 'xl:col-start-2 xl:row-start-2')} min-h-0 self-start overflow-hidden`}
            style={!expandedCard && isDesktopSharedLayout && sharedMethodsRowHeight ? { height: `${sharedMethodsRowHeight}px` } : undefined}
            isExpanded={expandedCard === 'output'}
            onToggleExpand={() => toggleExpandedCard('output')}
            controls={{
              outputPanelMode,
              setOutputPanelMode,
              buttonStyle,
              copyTextToClipboard,
              setLogs,
              setTreeOutputDisplay,
              setFormattedOutputDisplay,
              formattedPanelView,
              setFormattedPanelView,
            }}
            content={{
              logs,
              treeOutputDisplay,
              status,
              formattedOutputDisplay,
              scriptDisplay: selectedScriptDisplay,
              highlightedFormattedOutputLines,
              hiddenScrollbarClass,
            }}
            treeActions={{
              runHeaderRead,
              runAccountListRead,
              runTreeDump,
            }}
          />
          )}
        </section>
      </section>
      <ValidationPopup
        fields={validationPopupFields}
        message={validationPopupMessage}
        buttonStyle={buttonStyle}
        confirmLabel={validationPopupConfirmLabel}
        onClose={clearValidationPopup}
        onConfirm={() => {
          const confirmAction = validationPopupConfirmRef.current;
          clearValidationPopup();
          void confirmAction?.();
        }}
      />
      <DeleteStepPopup
        isOpen={isDeleteStepPopupOpen && !!selectedScriptStep}
        stepName={selectedScriptStep?.name || ''}
        buttonStyle={buttonStyle}
        onCancel={() => setIsDeleteStepPopupOpen(false)}
        onConfirm={confirmDeleteSelectedScriptStep}
      />
      <DiscardChangesPopup
        isOpen={isDiscardChangesPopupOpen}
        message={discardChangesMessage}
        onCancel={clearDiscardChangesPopup}
        onConfirm={() => {
          const confirmAction = discardChangesConfirmRef.current;
          clearDiscardChangesPopup();
          void confirmAction?.();
        }}
      />
    </main>
  );
}
