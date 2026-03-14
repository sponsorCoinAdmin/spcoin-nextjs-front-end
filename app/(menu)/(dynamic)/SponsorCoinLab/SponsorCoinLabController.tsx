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

const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.45rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
const actionButtonStyle =
  'h-[42px] rounded px-4 py-2 text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60';
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
  const [writeTraceEnabled, setWriteTraceEnabled] = useState(false);
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [validationPopupFields, setValidationPopupFields] = useState<string[]>([]);

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
  const showValidationPopup = useCallback((fieldIds: string[], labels: string[]) => {
    setInvalidFieldIds(fieldIds);
    setValidationPopupFields(labels);
    if (typeof window !== 'undefined' && fieldIds[0]) {
      window.setTimeout(() => {
        const target = document.querySelector(`[data-field-id="${fieldIds[0]}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | null;
        target?.focus();
      }, 0);
    }
  }, []);

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
    expandedScriptStepIds,
    isDeleteStepPopupOpen,
    setIsDeleteStepPopupOpen,
    selectedScriptStep,
    getStepSender,
    getStepParamEntries,
    loadScriptStep,
    toggleScriptStepExpanded,
    goToAdjacentScriptStep,
    moveSelectedScriptStep,
    requestDeleteSelectedScriptStep,
    confirmDeleteSelectedScriptStep,
    toggleScriptStepBreakpoint,
    createNewScript,
    handleDeleteScriptClick,
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
  useEffect(() => {
    const nextSelectedScript = scripts.find((script) => script.id === selectedScriptId);
    if (!nextSelectedScript) return;
    setFormattedOutputDisplay(JSON.stringify(nextSelectedScript, null, 2));
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
  const methodPanelTitle = useMemo(() => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        return 'ECR20 Read';
      case 'erc20_write':
        return 'ERC20 Write';
      case 'spcoin_rread':
        return 'Spcoin Read';
      case 'spcoin_write':
        return 'SpCoin Write';
      default:
        return 'Method Tests';
    }
  }, [methodPanelMode]);
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
  const [sharedMethodsRowHeight, setSharedMethodsRowHeight] = useState<number | null>(null);
  const [isDesktopSharedLayout, setIsDesktopSharedLayout] = useState(false);

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
  const runActiveMethod = useCallback(async () => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        await runSelectedReadMethod();
        return;
      case 'erc20_write':
        await runSelectedWriteMethod();
        return;
      case 'spcoin_rread':
        await runSelectedSpCoinReadMethod();
        return;
      case 'spcoin_write':
        await runSelectedSpCoinWriteMethod();
        return;
      default:
        return;
    }
  }, [
    methodPanelMode,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod,
    runSelectedWriteMethod,
  ]);
  const renderScriptStepRow = useCallback(
    (step: LabScriptStep) => {
      const isExpanded = Boolean(expandedScriptStepIds[String(step.step)]);
      const isSelected = selectedScriptStep?.step === step.step;
      return (
        <ScriptStepRow
          key={`step-${step.step}`}
          step={step}
          isExpanded={isExpanded}
          isSelected={isSelected}
          getStepSender={getStepSender}
          getStepParamEntries={getStepParamEntries}
          loadScriptStep={loadScriptStep}
          toggleScriptStepExpanded={toggleScriptStepExpanded}
          toggleScriptStepBreakpoint={toggleScriptStepBreakpoint}
        />
      );
    },
    [
      expandedScriptStepIds,
      getStepParamEntries,
      getStepSender,
      loadScriptStep,
      selectedScriptStep?.step,
      toggleScriptStepBreakpoint,
      toggleScriptStepExpanded,
    ],
  );
  const highlightedFormattedOutputLines = useMemo(() => {
    if (outputPanelMode !== 'formatted' || selectedScriptStepNumber === null) return null;
    const lines = String(formattedOutputDisplay || '').split('\n');
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
  }, [formattedOutputDisplay, outputPanelMode, selectedScriptStepNumber]);

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
            setMethodPanelMode={setMethodPanelMode}
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
              runActiveMethod,
              goToAdjacentScriptStep,
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
              setSelectedReadMethod: (value) => setSelectedReadMethod(value as Erc20ReadMethod),
              activeReadLabels,
              readAddressA,
              setReadAddressA,
              readAddressB,
              setReadAddressB,
              buttonStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedReadMethod: canRunErc20ReadMethod,
              canAddCurrentMethodToScript: canRunErc20ReadMethod,
              missingFieldIds: erc20ReadMissingEntries.map((entry) => entry.id),
              runSelectedReadMethod,
              addCurrentMethodToScript,
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
              setSelectedWriteMethod: (value) => setSelectedWriteMethod(value as Erc20WriteMethod),
              activeWriteLabels,
              writeAddressA,
              setWriteAddressA,
              writeAddressB,
              setWriteAddressB,
              writeAmountRaw,
              setWriteAmountRaw,
              inputStyle,
              buttonStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedWriteMethod: canRunErc20WriteMethod,
              canAddCurrentMethodToScript: canRunErc20WriteMethod,
              missingFieldIds: erc20WriteMissingEntries.map((entry) => entry.id),
              runSelectedWriteMethod,
              addCurrentMethodToScript,
            }}
            spCoinReadProps={{
              invalidFieldIds,
              clearInvalidField,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedSpCoinReadMethod,
              setSelectedSpCoinReadMethod: (value) => setSelectedSpCoinReadMethod(value as SpCoinReadMethod),
              spCoinReadOptions,
              spCoinReadMethodDefs: spCoinReadMethodDefs as Record<string, { title: string; params: { label: string; placeholder: string; type?: string }[]; executable?: boolean }>,
              activeSpCoinReadDef: activeSpCoinReadDef as { title: string; params: { label: string; placeholder: string; type?: string }[]; executable?: boolean },
              spReadParams,
              setSpReadParams,
              inputStyle,
              buttonStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedSpCoinReadMethod: canRunSpCoinReadMethod,
              canAddCurrentMethodToScript: canRunSpCoinReadMethod,
              missingFieldIds: spCoinReadMissingEntries.map((entry) => entry.id),
              runSelectedSpCoinReadMethod,
              addCurrentMethodToScript,
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
              setSelectedSpCoinWriteMethod: (value) => setSelectedSpCoinWriteMethod(value as SpCoinWriteMethod),
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
              missingFieldIds: spCoinWriteMissingEntries.map((entry) => entry.id),
              runSelectedSpCoinWriteMethod,
              addCurrentMethodToScript,
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
            }}
            content={{
              logs,
              treeOutputDisplay,
              status,
              formattedOutputDisplay,
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
        buttonStyle={buttonStyle}
        onClose={() => setValidationPopupFields([])}
      />
      <DeleteStepPopup
        isOpen={isDeleteStepPopupOpen && !!selectedScriptStep}
        stepName={selectedScriptStep?.name || ''}
        buttonStyle={buttonStyle}
        onCancel={() => setIsDeleteStepPopupOpen(false)}
        onConfirm={confirmDeleteSelectedScriptStep}
      />
    </main>
  );
}
