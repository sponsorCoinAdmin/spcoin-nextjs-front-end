// File: app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { useSettings } from '@/lib/context/hooks/ExchangeContext/nested/useSettings';
import {
  DEFAULT_AGENT_RATE_RANGE,
  DEFAULT_RECIPIENT_RATE_RANGE,
} from '@/lib/context/helpers/spCoinRateDefaults';
import { CHAIN_ID } from '@/lib/structure';
import { getDefaultNetworkSettings } from '@/lib/utils/network/defaultSettings';
import {
  ERC20_READ_OPTIONS,
  getErc20ReadLabels,
  type Erc20ReadMethod,
} from '../jsonMethods/erc20/read';
import {
  ERC20_WRITE_OPTIONS,
  getErc20WriteLabels,
  type Erc20WriteMethod,
} from '../jsonMethods/erc20/write';
import {
  SPCOIN_READ_METHOD_DEFS,
  getSpCoinAdminReadOptions,
  getSpCoinOffChainReadOptions,
  getSpCoinSenderReadOptions,
  getSpCoinWorldReadOptions,
  normalizeSpCoinReadMethod,
  type SpCoinReadMethod,
} from '../jsonMethods/spCoin/read';
import {
  SPCOIN_WRITE_METHOD_DEFS,
  SPCOIN_OFFCHAIN_WRITE_METHODS,
  SPCOIN_ONCHAIN_WRITE_METHODS,
  getSpCoinAdminWriteOptions,
  getSpCoinSenderWriteOptions,
  getSpCoinTodoWriteOptions,
  getSpCoinWorldWriteOptions,
  getSpCoinWriteOptions,
  normalizeSpCoinWriteMethod,
  type SpCoinWriteMethod,
} from '../jsonMethods/spCoin/write';
import {
  SERIALIZATION_TEST_METHOD_DEFS,
  getSerializationTestOptions,
  getUtilityMethodOptions,
  type SerializationTestMethod,
} from '../jsonMethods/serializationTests';
import {
  SPCOIN_ABI_UPDATED_EVENT,
  SPCOIN_ABI_VERSION_STORAGE_KEY,
  setSpCoinLabAbi,
} from '../jsonMethods/shared/spCoinAbi';
import {
  CALENDAR_WEEK_DAYS,
  formatDateInput,
  formatDateTimeDisplay,
  parseDateInput,
  useBackdateCalendar,
} from '../hooks/useBackdateCalendar';
import { useSponsorCoinLabMethods } from '../hooks/useSponsorCoinLabMethods';
import { useSponsorCoinLabNetwork } from '../hooks/useSponsorCoinLabNetwork';
import { useSponsorCoinLabPersistence } from '../hooks/useSponsorCoinLabPersistence';
import { useSponsorCoinLabScripts } from '../hooks/useSponsorCoinLabScripts';
import {
  type ConnectionMode,
  type LabScriptStep,
  type MethodPanelMode,
} from '../scriptBuilder/types';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import type {
  FormattedPanelView,
  MethodSelectionSource,
  OutputPanelMode,
  SponsorCoinAccountRole,
} from './types';
import {
  actionButtonStyle,
  buildDefaultAccountParams,
  buildMethodCallEntry,
  buttonStyle,
  cardStyle,
  formatOutputDisplayValue,
  hasNonZeroRateRangeTuple,
  hiddenScrollbarClass,
  inputStyle,
  normalizeAddressValue,
  parseListParam,
  refreshSponsorCoinLabAbi,
} from './utils';
import { useControllerPopups } from './hooks/useControllerPopups';
import { useControllerLayout } from './hooks/useControllerLayout';
import { useControllerContractMetadata } from './hooks/useControllerContractMetadata';
import { useControllerAccounts } from './hooks/useControllerAccounts';
import { useControllerEditorSync } from './hooks/useControllerEditorSync';
import { useControllerMethodAccountSync } from './hooks/useControllerMethodAccountSync';
import { useControllerScriptExecution } from './hooks/useControllerScriptExecution';
import SponsorCoinLabView from './SponsorCoinLabView';
import { useControllerTypeScriptEditor } from './hooks/useControllerTypeScriptEditor';
import { useControllerEditorHydration } from './hooks/useControllerEditorHydration';
import { useControllerMethodSelection } from './hooks/useControllerMethodSelection';
import { useControllerScriptPresentation } from './hooks/useControllerScriptPresentation';
import { useControllerViewProps } from './hooks/useControllerViewProps';

export default function SponsorCoinLabPage() {
  const nextMethodRunIdRef = useRef(1);
  const activeMethodRunAbortControllerRef = useRef<AbortController | null>(null);
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const [, setSettings] = useSettings();
  const useLocalSpCoinAccessPackage =
    exchangeContext?.settings?.spCoinAccessManager?.source !== 'node';
const hardhatDefaultSettings = getDefaultNetworkSettings(CHAIN_ID.HARDHAT_BASE) as {
  networkHeader?: { rpcUrl?: string };
};
const defaultHardhatRpcUrl =
  String(hardhatDefaultSettings?.networkHeader?.rpcUrl || '').trim() ||
  'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a';
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(defaultHardhatRpcUrl);
  const [contractAddress, setContractAddress] = useState('');
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState<string[]>(['[SponsorCoin SandBox] Ready']);
  const [formattedOutputDisplay, setFormattedOutputDisplay] = useState('(no output yet)');
  const [treeOutputDisplay, setTreeOutputDisplay] = useState('(no tree yet)');
  const [outputPanelMode, setOutputPanelMode] = useState<OutputPanelMode>('formatted');
  const [formattedPanelView, setFormattedPanelView] = useState<FormattedPanelView>('script');
  const [formattedJsonViewEnabled, setFormattedJsonViewEnabled] = useState(true);
  const [showTreeAccountDetails, setShowTreeAccountDetails] = useState(false);
  const [showAllTreeRecords, setShowAllTreeRecords] = useState(false);
  const [isScriptDebugRunning, setIsScriptDebugRunning] = useState(false);
  const [writeTraceEnabled, setWriteTraceEnabled] = useState(false);
  const recentWriteTraceRef = useRef<string[]>([]);
  const {
    invalidFieldIds,
    setInvalidFieldIds,
    clearInvalidField,
    validationPopupFields,
    validationPopupMessage,
    validationPopupTitle,
    validationPopupConfirmLabel,
    validationPopupCancelLabel,
    showValidationPopup,
    clearValidationPopup,
    handleValidationConfirm,
    hasValidationConfirmAction,
    isDiscardChangesPopupOpen,
    openDiscardChangesPopup,
    clearDiscardChangesPopup,
    handleDiscardConfirm,
  } = useControllerPopups();
  const previousContractAddressRef = useRef('');
  const [removedContractAddresses, setRemovedContractAddresses] = useState<string[]>([]);

  const [selectedWriteMethod, setSelectedWriteMethod] = useState<Erc20WriteMethod>('transfer');
  const [writeAddressA, setWriteAddressA] = useState('');
  const [writeAddressB, setWriteAddressB] = useState('');
  const [writeAmountRaw, setWriteAmountRaw] = useState('');
  const [methodPanelMode, setMethodPanelMode] = useState<MethodPanelMode>('ecr20_read');
  const [isSpCoinTodoMode, setIsSpCoinTodoMode] = useState(false);
  const [selectedReadMethod, setSelectedReadMethod] = useState<Erc20ReadMethod>('name');
  const [readAddressA, setReadAddressA] = useState('');
  const [readAddressB, setReadAddressB] = useState('');
  const [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod] =
    useState<SpCoinReadMethod>('getSpCoinMetaData');
  const [selectedSpCoinWriteMethod, setSelectedSpCoinWriteMethod] =
    useState<SpCoinWriteMethod>('addRecipient');
  const [showOnChainMethods, setShowOnChainMethods] = useState(true);
  const [showOffChainMethods, setShowOffChainMethods] = useState(true);
  const [auxMethodPanelTab, setAuxMethodPanelTab] = useState<'admin_utils' | null>(null);
  const [selectedSerializationTestMethod, setSelectedSerializationTestMethod] =
    useState<SerializationTestMethod>('external_getSerializedSPCoinHeader');
  const [selectedSponsorCoinAccountRole, setSelectedSponsorCoinAccountRole] =
    useState<SponsorCoinAccountRole>('sponsor');
  const [defaultSponsorKey, setDefaultSponsorKeyState] = useState('');
  const [defaultRecipientKey, setDefaultRecipientKeyState] = useState('');
  const [defaultAgentKey, setDefaultAgentKeyState] = useState('');
  const [defaultRecipientRateKey, setDefaultRecipientRateKey] = useState('');
  const [defaultAgentRateKey, setDefaultAgentRateKey] = useState('');
  const [managedRoleAccountAddress, setManagedRoleAccountAddress] = useState('');
  const [managedRecipientKey, setManagedRecipientKey] = useState('');
  const [managedRecipientRateKey, setManagedRecipientRateKey] = useState('');
  const [spReadParams, setSpReadParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spWriteParams, setSpWriteParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [serializationTestParams, setSerializationTestParams] = useState<string[]>(
    Array.from({ length: 7 }, () => ''),
  );
  const [methodSelectionSource, setMethodSelectionSource] = useState<MethodSelectionSource>('dropdown');
  const [editingScriptStepNumber, setEditingScriptStepNumber] = useState<number | null>(null);
  const [runningMethodPopupState, setRunningMethodPopupState] = useState<{
    runId: number;
    methodName: string;
    startedAt: number;
    isOpen: boolean;
    isCancelling: boolean;
  } | null>(null);

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
  }, []);
  const dismissRunningMethodPopup = useCallback(() => {
    setRunningMethodPopupState((current) => (current ? { ...current, isOpen: false } : current));
  }, []);
  const reopenRunningMethodPopup = useCallback(() => {
    setRunningMethodPopupState((current) => (current ? { ...current, isOpen: true } : current));
  }, []);
  const cancelRunningMethodPopup = useCallback(() => {
    activeMethodRunAbortControllerRef.current?.abort();
    setRunningMethodPopupState((current) => (current ? { ...current, isCancelling: true } : current));
  }, []);
  useEffect(() => {
    const applyLatestAbi = async () => {
      try {
        await refreshSponsorCoinLabAbi();
      } catch {
        // Keep the currently loaded ABI if refresh fails.
      }
    };

    const handleAbiUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ abi?: unknown[]; version?: string }>).detail;
      if (Array.isArray(detail?.abi)) {
        setSpCoinLabAbi(detail.abi);
      } else {
        void applyLatestAbi();
      }
      if (detail?.version && typeof window !== 'undefined') {
        window.localStorage.setItem(SPCOIN_ABI_VERSION_STORAGE_KEY, String(detail.version));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SPCOIN_ABI_VERSION_STORAGE_KEY) return;
      void applyLatestAbi();
    };

    void applyLatestAbi();

    if (typeof window !== 'undefined') {
      window.addEventListener(SPCOIN_ABI_UPDATED_EVENT, handleAbiUpdated as EventListener);
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SPCOIN_ABI_UPDATED_EVENT, handleAbiUpdated as EventListener);
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);
  const sellTokenAmountRaw =
    typeof exchangeContext?.tradeData?.sellTokenContract?.amount === 'bigint'
      ? exchangeContext.tradeData.sellTokenContract.amount.toString()
      : '';
  const buyTokenAmountRaw =
    typeof exchangeContext?.tradeData?.buyTokenContract?.amount === 'bigint'
      ? exchangeContext.tradeData.buyTokenContract.amount.toString()
      : '';
  const previewTokenAmountRaw =
    typeof exchangeContext?.tradeData?.previewTokenContract?.amount === 'bigint'
      ? exchangeContext.tradeData.previewTokenContract.amount.toString()
      : '';
  useEffect(() => {
    const previous = normalizeAddressValue(previousContractAddressRef.current);
    const current = normalizeAddressValue(contractAddress);
    previousContractAddressRef.current = contractAddress;
    if (!previous || !current || previous === current) return;
    setFormattedOutputDisplay('(no output yet)');
    setTreeOutputDisplay('(no tree yet)');
    setOutputPanelMode('formatted');
    setStatus('Ready');
    appendLog('Active SponsorCoin contract changed; cleared prior test output results.');
  }, [appendLog, contractAddress]);
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
      const nextLine = String(line || '');
      recentWriteTraceRef.current = [...recentWriteTraceRef.current.slice(-49), nextLine];
      if (!writeTraceEnabled) return;
      appendLog(`[TRACE] ${nextLine}`);
    },
    [appendLog, writeTraceEnabled],
  );
  const getRecentWriteTrace = useCallback(() => recentWriteTraceRef.current.slice(), []);

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
    accountActionLabelClassName,
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
    excludedDeploymentAddresses: removedContractAddresses,
    setContractAddress,
    contractAddress,
    appendLog,
    appendWriteTrace,
    setStatus,
    setInvalidFieldIds,
    clearValidationPopup,
    methodPanelMode,
    selectedWriteMethod,
    selectedSpCoinWriteMethod,
    selectedReadMethod,
    selectedSpCoinReadMethod,
  });
  const {
    sponsorAccountAddress,
    recipientAccountAddress,
    agentAccountAddress,
    activeAccountAddress,
    spCoinOwnerAccountAddress,
    setDefaultSponsorKey,
    setDefaultRecipientKey,
    setDefaultAgentKey,
    syncRoleAccountToExchangeContext,
    syncEditorAddressFieldToExchangeContext,
    managedRecipientRateKeyOptions,
    managedRecipientRateKeyHelpText,
    sponsorCoinAccountManagementValidation,
    sponsorCoinAccountManagementStatus,
    setSponsorCoinAccountManagementStatus,
    handleSponsorCoinAccountAction,
  } = useControllerAccounts({
    exchangeContext,
    setExchangeContext,
    defaultSponsorKey,
    setDefaultSponsorKeyState,
    defaultRecipientKey,
    setDefaultRecipientKeyState,
    defaultAgentKey,
    setDefaultAgentKeyState,
    selectedSponsorCoinAccountRole,
    managedRoleAccountAddress,
    setManagedRoleAccountAddress,
    managedRecipientKey,
    setManagedRecipientKey,
    managedRecipientRateKey,
    setManagedRecipientRateKey,
    selectedWriteSenderAccount,
    selectedWriteSenderAddress,
    effectiveConnectedAddress,
    ensureReadRunner,
    requireContractAddress,
    executeWriteConnected,
    useLocalSpCoinAccessPackage,
    appendLog,
  });
  const {
    allowContractNetworkModeSelection,
    activeContractChainIdDisplayValue,
    activeContractChainIdDisplayWidthCh,
    activeContractNetworkName,
    displayedSpCoinOwnerAddress,
    displayedSpCoinOwnerMetadata,
    resolveScriptEditorContractMetadata,
    isRemovingContractFromApp,
    requestRemoveContractFromApp,
    effectiveRecipientRateRange,
    effectiveAgentRateRange,
  } = useControllerContractMetadata({
    exchangeContext,
    setExchangeContext,
    setSettings,
    setMode,
    connectedChainId,
    activeNetworkName,
    chainIdDisplayValue,
    contractAddress,
    setContractAddress,
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    selectedSponsorCoinVersionEntry,
    sponsorCoinVersionChoices,
    displayedSignerAccountAddress,
    displayedSignerAccountMetadata,
    selectedVersionSymbol,
    spCoinOwnerAccountAddress,
    ensureReadRunner,
    requireContractAddress,
    appendLog,
    setStatus,
    showValidationPopup,
    removedContractAddresses,
    setRemovedContractAddresses,
  });
  const {
    populateMethodParamsFromActiveAccounts,
    populateActiveAccountsFromMethodParams,
  } = useControllerMethodAccountSync({
    selectedWriteSenderAddress,
    sponsorAccountAddress,
    recipientAccountAddress,
    agentAccountAddress,
    defaultRecipientRateKey,
    defaultAgentRateKey,
    effectiveRecipientRateRange,
    effectiveAgentRateRange,
    setSelectedWriteSenderAddress,
    setDefaultSponsorKey,
    setDefaultRecipientKey,
    setDefaultAgentKey,
    setDefaultRecipientRateKey,
    setDefaultAgentRateKey,
  });
  useEffect(() => {
    setDefaultRecipientRateKey((prev) => {
      const next = String(effectiveRecipientRateRange[0] ?? '');
      return String(prev || '').trim() ? prev : next;
    });
  }, [effectiveRecipientRateRange]);
  useEffect(() => {
    setDefaultAgentRateKey((prev) => {
      const next = String(effectiveAgentRateRange[0] ?? '');
      return String(prev || '').trim() ? prev : next;
    });
  }, [effectiveAgentRateRange]);
  const activeWriteLabels = useMemo(() => getErc20WriteLabels(selectedWriteMethod), [selectedWriteMethod]);
  const activeReadLabels = useMemo(() => getErc20ReadLabels(selectedReadMethod), [selectedReadMethod]);
  const spCoinReadMethodDefs = SPCOIN_READ_METHOD_DEFS;
  const spCoinWriteMethodDefs = SPCOIN_WRITE_METHOD_DEFS;
  const serializationTestMethodDefs = SERIALIZATION_TEST_METHOD_DEFS;
  const normalizedSelectedSpCoinReadMethod = normalizeSpCoinReadMethod(selectedSpCoinReadMethod);
  const fallbackSpCoinReadMethod = Object.keys(spCoinReadMethodDefs)[0] as SpCoinReadMethod;
  const activeSpCoinReadDef =
    spCoinReadMethodDefs[normalizedSelectedSpCoinReadMethod] ?? spCoinReadMethodDefs[fallbackSpCoinReadMethod];
  const normalizedSelectedSpCoinWriteMethod = normalizeSpCoinWriteMethod(selectedSpCoinWriteMethod);
  const activeSpCoinWriteDef =
    spCoinWriteMethodDefs[normalizedSelectedSpCoinWriteMethod] ?? spCoinWriteMethodDefs[getSpCoinWriteOptions(false)[0]];
  const serializationTestOptions = getSerializationTestOptions();
  const utilityMethodOptions = getUtilityMethodOptions();
  const adminUtilityReadOptions = utilityMethodOptions.filter((name) =>
    ['compareSpCoinContractSize', 'getMasterSponsorList', 'getSponsorAccounts'].includes(name),
  );
  const adminUtilityWriteOptions = utilityMethodOptions.filter((name) =>
    [
      'hhFundAccounts',
      'deleteMasterSponsorships',
      'deleteAccountTree',
      'deleteRecipient',
      'deleteRecipientRate',
      'deleteAgent',
      'deleteAgentRate',
    ].includes(name),
  );
  const activeSerializationTestDef =
    serializationTestMethodDefs[selectedSerializationTestMethod] ??
    serializationTestMethodDefs[serializationTestOptions[0]];
  const {
    buildScriptEditorParamValues,
    buildErc20ReadEditorDefaults,
    buildErc20WriteEditorDefaults,
  } = useControllerEditorSync({
    exchangeContext,
    contractAddress,
    sponsorAccountAddress,
    recipientAccountAddress,
    agentAccountAddress,
    activeAccountAddress,
    sellTokenAmountRaw,
    buyTokenAmountRaw,
    previewTokenAmountRaw,
    methodPanelMode,
    activeReadLabels,
    activeWriteLabels,
    readAddressA,
    readAddressB,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    selectedWriteSenderAddress,
    setExchangeContext,
    syncRoleAccountToExchangeContext,
    syncEditorAddressFieldToExchangeContext,
  });
  const activeMethodPanelTab =
    auxMethodPanelTab === 'admin_utils'
      ? 'admin_utils'
      : methodPanelMode === 'spcoin_write' && isSpCoinTodoMode
      ? 'todos'
      : methodPanelMode === 'ecr20_read' || methodPanelMode === 'erc20_write'
      ? 'erc20'
      : methodPanelMode;
  const updateSpWriteParamAtIndex = useCallback((idx: number, value: string) => {
    setSpWriteParams((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);
  const backdateCalendar = useBackdateCalendar({
    activeWriteParams: activeSpCoinWriteDef?.params || [],
    spWriteParams,
    updateSpWriteParamAtIndex,
  });
  const {
    erc20WriteMissingEntries,
    erc20ReadMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    serializationTestMissingEntries,
    canRunErc20WriteMethod,
    canRunErc20ReadMethod,
    canRunSpCoinReadMethod,
    canRunSpCoinWriteMethod,
    canRunSerializationTestMethod,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    treeAccountOptions,
    selectedTreeAccount,
    setSelectedTreeAccount,
    treeAccountRefreshToken,
    requestRefreshSelectedTreeAccount,
    openAccountFromAddress,
    runHeaderRead,
    runAccountListRead,
    runTreeAccountsRead,
    runTreeDump,
    runSelectedWriteMethod,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod: runSelectedSpCoinWriteMethodBase,
    runSelectedSerializationTestMethod,
    runScriptStep,
  } = useSponsorCoinLabMethods({
    activeContractAddress: contractAddress,
    rpcUrl,
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
    selectedSpCoinReadMethod: normalizedSelectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    spReadParams,
    spWriteParams,
    setSpWriteParams,
    serializationTestParams,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    serializationTestMethodDefs,
    activeSpCoinReadDef,
    activeSpCoinWriteDef,
    activeSerializationTestDef,
    hardhatAccounts,
    selectedHardhatAddress:
      mode === 'hardhat'
        ? selectedWriteSenderAccount?.address || selectedWriteSenderAddress || selectedHardhatAccount?.address
        : undefined,
    effectiveConnectedAddress,
    ownerAddress: displayedSpCoinOwnerAddress,
    useLocalSpCoinAccessPackage,
    appendLog,
    appendWriteTrace,
    getRecentWriteTrace,
    traceEnabled: writeTraceEnabled,
    setStatus,
    formattedOutputDisplay,
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
    recipientRateRange:
      hasNonZeroRateRangeTuple(exchangeContext?.settings?.spCoinContract?.recipientRateRange)
        ? exchangeContext.settings.spCoinContract.recipientRateRange
        : DEFAULT_RECIPIENT_RATE_RANGE,
    agentRateRange:
      hasNonZeroRateRangeTuple(exchangeContext?.settings?.spCoinContract?.agentRateRange)
        ? exchangeContext.settings.spCoinContract.agentRateRange
        : DEFAULT_AGENT_RATE_RANGE,
  });

  const {
    allScripts,
    scripts,
    visibleScripts,
    setScripts,
    javaScriptScripts,
    setJavaScriptScripts,
    selectedScriptId,
    setSelectedScriptId,
    showSystemTestsOnly,
    setShowSystemTestsOnly,
    scriptEditorKind,
    setScriptEditorKind,
    showJavaScriptUtilScriptsOnly,
    setShowJavaScriptUtilScriptsOnly,
    visibleJavaScriptScripts,
    selectedJavaScriptScript,
    selectedJavaScriptScriptId,
    setSelectedJavaScriptScriptId,
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
    moveScriptStepToPosition,
    deleteScriptStepByNumber,
    duplicateScriptStepByNumber,
    requestDeleteSelectedScriptStep,
    confirmDeleteSelectedScriptStep,
    toggleScriptStepBreakpoint,
    createNewScript,
    createScriptFromSteps,
    duplicateSelectedScript,
    clearSelectedScript,
    handleDeleteScriptClick,
    hasEditingScriptChanges,
    addCurrentMethodToScript,
  } = useSponsorCoinLabScripts({
    activeNetworkName,
    mode,
    methodPanelMode,
    outputPanelMode,
    formattedPanelView,
    formattedJsonViewEnabled,
    formattedOutputDisplay,
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
    selectedSerializationTestMethod,
    serializationTestParams,
    activeSerializationTestDef,
    serializationTestMethodDefs,
    editingScriptStepNumber,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    serializationTestMissingEntries,
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
    setSelectedSerializationTestMethod,
    setSerializationTestParams,
    showOnChainMethods,
    showOffChainMethods,
  });
  const editorSnapshot = JSON.stringify({
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
    selectedSerializationTestMethod,
    serializationTestParams,
  });
  const editorBaselineRef = useRef<string | null>(null);
  const shouldResetEditorBaselineRef = useRef(true);
  const hasUserEditedMethodInputsRef = useRef(false);
  const markEditorAsUserEdited = useCallback(() => {
    hasUserEditedMethodInputsRef.current = true;
  }, []);
  const queueEditorBaselineReset = useCallback(() => {
    hasUserEditedMethodInputsRef.current = false;
    shouldResetEditorBaselineRef.current = true;
  }, []);
  useEffect(() => {
    if (!shouldResetEditorBaselineRef.current && editorBaselineRef.current !== null) return;
    editorBaselineRef.current = editorSnapshot;
    shouldResetEditorBaselineRef.current = false;
  }, [editorSnapshot]);
  const hasUnsavedEditorChanges = useCallback(() => {
    if (editorBaselineRef.current === null) return false;
    return editorBaselineRef.current !== editorSnapshot;
  }, [editorSnapshot]);
  const runWithDiscardPrompt = useCallback(
    (action: () => void | Promise<void>) => {
      if (!hasUserEditedMethodInputsRef.current) {
        queueEditorBaselineReset();
        void action();
        return;
      }
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
      openDiscardChangesPopup(() => {
        queueEditorBaselineReset();
        void action();
      });
    },
    [
      editingScriptStepNumber,
      hasEditingScriptChanges,
      hasUnsavedEditorChanges,
      methodSelectionSource,
      openDiscardChangesPopup,
      queueEditorBaselineReset,
    ],
  );
  const selectedScriptDisplay = selectedScript ? formatOutputDisplayValue(selectedScript) : '(no script selected)';
  const previousScriptDisplayRef = useRef<string | null>(null);
  const previousFormattedOutputDisplayRef = useRef<string | null>(null);
  useEffect(() => {
    if (previousScriptDisplayRef.current === null) {
      previousScriptDisplayRef.current = selectedScriptDisplay;
      return;
    }
    if (previousScriptDisplayRef.current === selectedScriptDisplay) return;
    previousScriptDisplayRef.current = selectedScriptDisplay;
    setOutputPanelMode('formatted');
    setFormattedPanelView((previous) => (previous === 'output' ? previous : 'script'));
  }, [selectedScriptDisplay]);
  useEffect(() => {
    if (previousFormattedOutputDisplayRef.current === null) {
      previousFormattedOutputDisplayRef.current = formattedOutputDisplay;
      return;
    }
    if (previousFormattedOutputDisplayRef.current === formattedOutputDisplay) return;
    previousFormattedOutputDisplayRef.current = formattedOutputDisplay;
    setOutputPanelMode('formatted');
    setFormattedPanelView('output');
  }, [formattedOutputDisplay]);
  const erc20ReadOptions = ERC20_READ_OPTIONS;
  const erc20WriteOptions = ERC20_WRITE_OPTIONS;
  const spCoinWorldReadOptions = getSpCoinWorldReadOptions(true);
  const spCoinSenderReadOptions = getSpCoinSenderReadOptions(true);
  const spCoinAdminReadOptions = getSpCoinAdminReadOptions(true);
  const spCoinCompoundReadOptions = getSpCoinOffChainReadOptions(true);
  const spCoinAllReadOptions = [
    ...spCoinWorldReadOptions,
    ...spCoinSenderReadOptions,
    ...spCoinAdminReadOptions,
    ...spCoinCompoundReadOptions,
  ];
  const spCoinWorldWriteOptions = getSpCoinWorldWriteOptions(false);
  const spCoinSenderWriteOptions = getSpCoinSenderWriteOptions(false);
  const spCoinAdminWriteOptions = getSpCoinAdminWriteOptions(false);
  const spCoinTodoWriteOptions = getSpCoinTodoWriteOptions(false);
  const spCoinWriteOptions = [
    ...spCoinWorldWriteOptions,
    ...spCoinSenderWriteOptions,
    ...spCoinTodoWriteOptions,
  ];
  const effectiveSerializationTestOptions =
    activeMethodPanelTab === 'admin_utils' ? utilityMethodOptions : serializationTestOptions;
  const effectiveSerializationTestDef =
    serializationTestMethodDefs[selectedSerializationTestMethod] ??
    serializationTestMethodDefs[effectiveSerializationTestOptions[0]];
  useEffect(() => {
    if (methodPanelMode !== 'spcoin_write' || !isSpCoinTodoMode) return;
    if (spCoinTodoWriteOptions.includes(selectedSpCoinWriteMethod)) return;
    if (spCoinTodoWriteOptions[0]) {
      setSelectedSpCoinWriteMethod(spCoinTodoWriteOptions[0]);
    }
  }, [isSpCoinTodoMode, methodPanelMode, selectedSpCoinWriteMethod, spCoinTodoWriteOptions]);
  useEffect(() => {
    if (methodPanelMode !== 'spcoin_write' || isSpCoinTodoMode) return;
    if (!spCoinTodoWriteOptions.includes(selectedSpCoinWriteMethod)) return;
    const nextStandardMethod =
      spCoinSenderWriteOptions[0] || spCoinWorldWriteOptions[0] || spCoinAdminWriteOptions[0] || '';
    if (nextStandardMethod) {
      setSelectedSpCoinWriteMethod(nextStandardMethod);
    }
  }, [
    isSpCoinTodoMode,
    methodPanelMode,
    selectedSpCoinWriteMethod,
    spCoinAdminWriteOptions,
    spCoinSenderWriteOptions,
    spCoinTodoWriteOptions,
    spCoinWorldWriteOptions,
  ]);
  useEffect(() => {
    const activeReadDef = spCoinReadMethodDefs[normalizedSelectedSpCoinReadMethod];
    if (activeReadDef?.executable === false && spCoinAllReadOptions.length > 0) {
      setSelectedSpCoinReadMethod(spCoinAllReadOptions[0]);
    }
  }, [normalizedSelectedSpCoinReadMethod, spCoinReadMethodDefs, spCoinAllReadOptions]);
  useEffect(() => {
    if (selectedSpCoinReadMethod !== normalizedSelectedSpCoinReadMethod) {
      setSelectedSpCoinReadMethod(normalizedSelectedSpCoinReadMethod);
    }
  }, [normalizedSelectedSpCoinReadMethod, selectedSpCoinReadMethod]);
  useEffect(() => {
    if (!spCoinWriteMethodDefs[normalizedSelectedSpCoinWriteMethod] && spCoinWriteOptions.length > 0) {
      setSelectedSpCoinWriteMethod(spCoinWriteOptions[0]);
      return;
    }
    if (spCoinWriteMethodDefs[normalizedSelectedSpCoinWriteMethod].executable === false && spCoinWriteOptions.length > 0) {
      setSelectedSpCoinWriteMethod(spCoinWriteOptions[0]);
    }
  }, [normalizedSelectedSpCoinWriteMethod, selectedSpCoinWriteMethod, spCoinWriteMethodDefs, spCoinWriteOptions]);
  useEffect(() => {
    if (activeMethodPanelTab === 'admin_utils' && methodPanelMode === 'serialization_tests') return;
    if (!serializationTestMethodDefs[selectedSerializationTestMethod] && serializationTestOptions.length > 0) {
      setSelectedSerializationTestMethod(serializationTestOptions[0]);
      return;
    }
    if (
      serializationTestMethodDefs[selectedSerializationTestMethod]?.executable === false &&
      serializationTestOptions.length > 0
    ) {
      setSelectedSerializationTestMethod(serializationTestOptions[0]);
    }
  }, [
    activeMethodPanelTab,
    selectedSerializationTestMethod,
    serializationTestMethodDefs,
    serializationTestOptions,
    setSelectedSerializationTestMethod,
  ]);
  useEffect(() => {
    if (selectedSerializationTestMethod !== 'compareSpCoinContractSize') return;
    const previousValue = String(serializationTestParams[0] || '').trim();
    const latestValue = String(serializationTestParams[1] || '').trim();
    if (previousValue && latestValue) return;
    const nextDef = serializationTestMethodDefs[selectedSerializationTestMethod];
    if (!nextDef) return;
    setSerializationTestParams(
      buildDefaultAccountParams(nextDef.params, {
        sender: selectedWriteSenderAddress,
        sponsor: defaultSponsorKey,
        recipient: defaultRecipientKey,
        agent: defaultAgentKey,
        recipientRate: String(effectiveRecipientRateRange[0]),
        agentRate: String(effectiveAgentRateRange[0]),
        previousReleaseDir: 'spCoinAccess/contracts/spCoinOrig.BAK',
        latestReleaseDir: 'spCoinAccess/contracts/spCoin',
      }),
    );
  }, [
    defaultAgentKey,
    defaultRecipientKey,
    defaultSponsorKey,
    effectiveAgentRateRange,
    effectiveRecipientRateRange,
    selectedSerializationTestMethod,
    serializationTestMethodDefs,
    serializationTestParams,
  ]);
  const methodPanelTitle =
    scriptEditorKind === 'json' && methodSelectionSource === 'script' && editingScriptStepNumber !== null
      ? `Edit JSON Test Method ${editingScriptStepNumber}`
      : scriptEditorKind === 'javascript'
      ? 'Standalone Offchain TypeScript File'
      : 'New JSON Test Method';
  const {
    javaScriptFileContent,
    setJavaScriptFileContent,
    isJavaScriptFileLoading,
    isTypeScriptEditEnabled,
    setIsTypeScriptEditEnabled,
    isSavingSelectedTypeScriptFile,
    selectedJavaScriptDisplayFilePath,
    canEditSelectedTypeScriptFile,
    saveSelectedTypeScriptFile,
    runSelectedJavaScriptScript,
    addSelectedJavaScriptScriptToScript,
  } = useControllerTypeScriptEditor({
    selectedJavaScriptScript,
    selectedJavaScriptScriptId,
    scriptEditorKind,
    setOutputPanelMode,
    setStatus,
  });
  const currentMethodDisplayName = (() => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        return activeReadLabels.title;
      case 'erc20_write':
        return activeWriteLabels.title;
      case 'spcoin_rread':
        return activeSpCoinReadDef.title;
      case 'spcoin_write':
        return activeSpCoinWriteDef.title;
      case 'serialization_tests':
        return activeSerializationTestDef.title;
      default:
        return 'method';
    }
  })();
  const isEditingScriptMethod =
    scriptEditorKind === 'json' && methodSelectionSource === 'script' && editingScriptStepNumber !== null;
  const discardChangesMessage = (() => {
    const activeStepNumber = editingScriptStepNumber ?? selectedScriptStepNumber;
    return activeStepNumber !== null
      ? `Discard unsaved changes to Step ${activeStepNumber} (${currentMethodDisplayName}) or return?`
      : `Discard unsaved changes to ${currentMethodDisplayName} or return?`;
  })();
  const isUpdateBlockedByNoChanges = isEditingScriptMethod && !hasEditingScriptChanges;
  const hasEditorScriptSelected = scriptEditorKind === 'json' && Boolean(String(selectedScriptId || '').trim());
  const addToScriptButtonLabel = isEditingScriptMethod ? `Update Script Step ${editingScriptStepNumber}` : 'Add To Script';
  const [scriptStepExecutionErrors, setScriptStepExecutionErrors] = useState<Record<number, boolean>>({});
  const scriptDebugStopRef = useRef(false);
  const {
    expandedCard,
    setExpandedCard,
    toggleExpandedCard,
    showCard,
    getCardClassName,
    methodsCardRef,
    sharedMethodsRowHeight,
    isDesktopSharedLayout,
  } = useControllerLayout(cardStyle);

  useSponsorCoinLabPersistence({
    scripts,
    setScripts,
    javaScriptScripts,
    setJavaScriptScripts,
    selectedScriptId,
    setSelectedScriptId,
    scriptEditorKind,
    setScriptEditorKind,
    showSystemTestsOnly,
    setShowSystemTestsOnly,
    showJavaScriptUtilScriptsOnly,
    setShowJavaScriptUtilScriptsOnly,
    selectedJavaScriptScriptId,
    setSelectedJavaScriptScriptId,
    mode,
    setMode,
    rpcUrl,
    setRpcUrl,
    contractAddress,
    setContractAddress,
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
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
    outputPanelMode,
    setOutputPanelMode,
    formattedPanelView,
    setFormattedPanelView,
    formattedJsonViewEnabled,
    setFormattedJsonViewEnabled,
    writeTraceEnabled,
    setWriteTraceEnabled,
    treeOutputDisplay,
    setTreeOutputDisplay,
    showTreeAccountDetails,
    setShowTreeAccountDetails,
    showAllTreeRecords,
    setShowAllTreeRecords,
    expandedCard,
    setExpandedCard,
    showOnChainMethods,
    setShowOnChainMethods,
    showOffChainMethods,
    setShowOffChainMethods,
    auxMethodPanelTab,
    setAuxMethodPanelTab,
    isSpCoinTodoMode,
    setIsSpCoinTodoMode,
    selectedTreeAccount,
    setSelectedTreeAccount,
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
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    selectedSponsorCoinAccountRole,
    setSelectedSponsorCoinAccountRole,
    managedRoleAccountAddress,
    setManagedRoleAccountAddress,
    managedRecipientKey,
    setManagedRecipientKey,
    managedRecipientRateKey,
    setManagedRecipientRateKey,
    sponsorCoinAccountManagementStatus,
    setSponsorCoinAccountManagementStatus,
    spReadParams,
    setSpReadParams,
    spWriteParams,
    setSpWriteParams,
    serializationTestParams,
    setSerializationTestParams,
    normalizeAddressValue,
    backdateCalendar,
  });

  const focusScriptStep = useCallback((step: LabScriptStep) => {
    setSelectedScriptStepNumber(step.step);
  }, [setSelectedScriptStepNumber]);
  const {
    editScriptStepFromBuilder,
    selectMethodPanelTab,
    selectMethodByKind,
    selectDropdownReadMethod,
    selectDropdownWriteMethod,
    selectDropdownSpCoinReadMethod,
    selectDropdownSpCoinWriteMethod,
    selectDropdownSerializationTestMethod,
    selectMappedJsonMethod,
  } = useControllerMethodSelection({
    methodPanelMode,
    setMethodPanelMode,
    activeMethodPanelTab,
    auxMethodPanelTab,
    setAuxMethodPanelTab,
    setIsSpCoinTodoMode,
    methodSelectionSource,
    setMethodSelectionSource,
    editingScriptStepNumber,
    setEditingScriptStepNumber,
    setSelectedScriptStepNumber,
    selectedReadMethod,
    setSelectedReadMethod,
    selectedWriteMethod,
    setSelectedWriteMethod,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    selectedWriteSenderAddress,
    defaultSponsorKey,
    defaultRecipientKey,
    defaultAgentKey,
    defaultRecipientRateKey,
    defaultAgentRateKey,
    effectiveRecipientRateRange,
    effectiveAgentRateRange,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    serializationTestMethodDefs,
    populateMethodParamsFromActiveAccounts,
    setSpReadParams,
    setSpWriteParams,
    setSerializationTestParams,
    spCoinAdminReadOptions,
    spCoinAdminWriteOptions,
    spCoinTodoWriteOptions,
    utilityMethodOptions,
    adminUtilityReadOptions,
    adminUtilityWriteOptions,
    runWithDiscardPrompt,
    queueEditorBaselineReset,
    loadScriptStep,
    setScriptEditorKind,
  });
  const handleAddCurrentMethodToScript = useCallback(() => {
    if (
      methodPanelMode === 'spcoin_write' &&
      ['addRecipient', 'addRecipientTransaction', 'addAgent', 'addAgentTransaction'].includes(
        String(selectedSpCoinWriteMethod || '').trim(),
      )
    ) {
      populateActiveAccountsFromMethodParams(activeSpCoinWriteDef.params, spWriteParams);
    }

    const savedStepNumber = addCurrentMethodToScript();
    if (!savedStepNumber) return;
    setMethodSelectionSource('script');
    setEditingScriptStepNumber(savedStepNumber);
    setSelectedScriptStepNumber(savedStepNumber);
    queueEditorBaselineReset();
  }, [
    activeSpCoinWriteDef.params,
    addCurrentMethodToScript,
    methodPanelMode,
    populateActiveAccountsFromMethodParams,
    queueEditorBaselineReset,
    selectedSpCoinWriteMethod,
    setSelectedScriptStepNumber,
    spWriteParams,
  ]);
  const runSelectedSpCoinWriteMethod = useCallback(
    async (options?: { executionSignal?: AbortSignal; executionLabel?: string; skipValidation?: boolean }) => {
    if (
      methodPanelMode === 'spcoin_write' &&
      ['addRecipient', 'addRecipientTransaction', 'addAgent', 'addAgentTransaction'].includes(
        String(selectedSpCoinWriteMethod || '').trim(),
      )
    ) {
      populateActiveAccountsFromMethodParams(activeSpCoinWriteDef.params, spWriteParams);
    }

      await runSelectedSpCoinWriteMethodBase(options);
    },
    [
      activeSpCoinWriteDef.params,
      methodPanelMode,
      populateActiveAccountsFromMethodParams,
      runSelectedSpCoinWriteMethodBase,
      selectedSpCoinWriteMethod,
      spWriteParams,
    ],
  );
  const trackMethodExecution = useCallback(
    async (
      methodName: string,
      runner: (options: { executionSignal: AbortSignal; executionLabel: string }) => Promise<unknown> | unknown,
    ) => {
      if (activeMethodRunAbortControllerRef.current) {
        reopenRunningMethodPopup();
        return;
      }
      const controller = new AbortController();
      const runId = nextMethodRunIdRef.current++;
      activeMethodRunAbortControllerRef.current = controller;
      setRunningMethodPopupState({
        runId,
        methodName,
        startedAt: Date.now(),
        isOpen: true,
        isCancelling: false,
      });
      try {
        await runner({ executionSignal: controller.signal, executionLabel: methodName });
      } finally {
        if (activeMethodRunAbortControllerRef.current === controller) {
          activeMethodRunAbortControllerRef.current = null;
        }
        setRunningMethodPopupState(null);
      }
    },
    [reopenRunningMethodPopup],
  );
  const runSelectedReadMethodWithPopup = useCallback(
    async () =>
      trackMethodExecution(activeReadLabels.title, ({ executionSignal, executionLabel }) =>
        runSelectedReadMethod({ executionSignal, executionLabel }),
      ),
    [activeReadLabels.title, runSelectedReadMethod, trackMethodExecution],
  );
  const runSelectedWriteMethodWithPopup = useCallback(
    async () =>
      trackMethodExecution(activeWriteLabels.title, ({ executionSignal, executionLabel }) =>
        runSelectedWriteMethod({ executionSignal, executionLabel }),
      ),
    [activeWriteLabels.title, runSelectedWriteMethod, trackMethodExecution],
  );
  const runSelectedSpCoinReadMethodWithPopup = useCallback(
    async () =>
      trackMethodExecution(activeSpCoinReadDef.title, ({ executionSignal, executionLabel }) =>
        runSelectedSpCoinReadMethod({ executionSignal, executionLabel }),
      ),
    [activeSpCoinReadDef.title, runSelectedSpCoinReadMethod, trackMethodExecution],
  );
  const runSelectedSpCoinWriteMethodWithPopup = useCallback(
    async () =>
      trackMethodExecution(activeSpCoinWriteDef.title, ({ executionSignal, executionLabel }) =>
        runSelectedSpCoinWriteMethod({ executionSignal, executionLabel }),
      ),
    [activeSpCoinWriteDef.title, runSelectedSpCoinWriteMethod, trackMethodExecution],
  );
  const runSelectedSerializationTestMethodWithPopup = useCallback(
    async () =>
      trackMethodExecution(activeSerializationTestDef.title, ({ executionSignal, executionLabel }) =>
        runSelectedSerializationTestMethod({ executionSignal, executionLabel }),
      ),
    [activeSerializationTestDef.title, runSelectedSerializationTestMethod, trackMethodExecution],
  );
  useControllerEditorHydration({
    methodSelectionSource,
    editingScriptStepNumber,
    methodPanelMode,
    selectedReadMethod,
    selectedWriteMethod,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedSerializationTestMethod,
    queueEditorBaselineReset,
    defaultSponsorKey,
    sponsorAccountAddress,
    activeAccountAddress,
    activeReadLabels,
    activeWriteLabels,
    activeSpCoinReadDef,
    activeSpCoinWriteDef,
    activeSerializationTestDef,
    buildErc20ReadEditorDefaults,
    buildErc20WriteEditorDefaults,
    buildScriptEditorParamValues,
    resolveScriptEditorContractMetadata,
    setReadAddressA,
    setReadAddressB,
    setSelectedWriteSenderAddress,
    setWriteAddressA,
    setWriteAddressB,
    setWriteAmountRaw,
    setSpReadParams,
    setSpWriteParams,
    setSerializationTestParams,
  });
  useEffect(() => {
    setScriptStepExecutionErrors({});
  }, [selectedScript?.id]);
  const {
    refreshActiveOutput,
    restartScriptAtStart,
    runSelectedScriptStep,
    runRemainingScriptSteps,
  } = useControllerScriptExecution({
    formattedOutputDisplay,
    outputPanelMode,
    formattedPanelView,
    activeMethodPanelTab,
    methodPanelMode,
    activeSpCoinReadDef,
    activeSerializationTestDef,
    selectedReadMethod,
    showValidationPopup,
    setStatus,
    requestRefreshSelectedTreeAccount,
    runSelectedSpCoinReadMethod,
    runSelectedSerializationTestMethod,
    runSelectedReadMethod,
    setFormattedOutputDisplay,
    setIsScriptDebugRunning,
    setScriptStepExecutionErrors,
    scriptDebugStopRef,
    selectedScript,
    selectedScriptStepNumber,
    runScriptStep,
    focusScriptStep,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    serializationTestMethodDefs,
    setSelectedScriptStepNumber,
  });
  const {
    handleConfirmDeleteSelectedScriptStep,
    renderScriptStepRow,
    highlightedFormattedOutputLines,
    highlightedFormattedResultLines,
  } = useControllerScriptPresentation({
    setSelectedScriptStepNumber,
    selectedScript,
    methodSelectionSource,
    selectedScriptStepNumber,
    editingScriptStepNumber,
    loadScriptStep,
    confirmDeleteSelectedScriptStep,
    setEditingScriptStepNumber,
    setMethodSelectionSource,
    expandedScriptStepIds,
    isEditingScriptMethod,
    scriptStepExecutionErrors,
    getStepSender,
    getStepParamEntries,
    editScriptStepFromBuilder,
    toggleScriptStepExpanded,
    toggleScriptStepBreakpoint,
    outputPanelMode,
    formattedPanelView,
    selectedScriptDisplay,
    formattedOutputDisplay,
  });
  const viewProps = useControllerViewProps({
    expandedCard,
    showCard,
    getCardClassName,
    toggleExpandedCard,
    methodsCardRef,
    isDesktopSharedLayout,
    sharedMethodsRowHeight,
    validationPopupFields,
    validationPopupTitle,
    validationPopupMessage,
    validationPopupConfirmLabel,
    validationPopupCancelLabel,
    clearValidationPopup,
    hasValidationConfirmAction,
    handleValidationConfirm,
    isDeleteStepPopupOpen,
    selectedScriptStep,
    setIsDeleteStepPopupOpen,
    handleConfirmDeleteSelectedScriptStep,
    isDiscardChangesPopupOpen,
    discardChangesMessage,
    clearDiscardChangesPopup,
    handleDiscardConfirm,
    runningMethodPopup: {
      isOpen: Boolean(runningMethodPopupState?.isOpen),
      methodName: runningMethodPopupState?.methodName || '',
      startedAt: runningMethodPopupState?.startedAt || Date.now(),
      isCancelling: Boolean(runningMethodPopupState?.isCancelling),
      onCancel: cancelRunningMethodPopup,
      onAcknowledge: dismissRunningMethodPopup,
    },
    methodPanelTitle,
    scriptEditorKind,
    setScriptEditorKind,
    methodPanelMode,
    activeMethodPanelTab,
    selectMethodPanelTab,
    selectMappedJsonMethod,
    selectMethodByKind,
    writeTraceEnabled,
    setWriteTraceEnabled,
    showOnChainMethods,
    setShowOnChainMethods,
    showOffChainMethods,
    setShowOffChainMethods,
    hiddenScrollbarClass,
    visibleJavaScriptScripts,
    selectedJavaScriptScriptId,
    setSelectedJavaScriptScriptId,
    selectedJavaScriptScript,
    selectedJavaScriptDisplayFilePath,
    javaScriptFileContent,
    isJavaScriptFileLoading,
    isTypeScriptEditEnabled,
    setIsTypeScriptEditEnabled,
    canEditSelectedTypeScriptFile,
    saveSelectedTypeScriptFile,
    isSavingSelectedTypeScriptFile,
    setJavaScriptFileContent,
    runSelectedJavaScriptScript,
    addSelectedJavaScriptScriptToScript,
    actionButtonStyle,
    scripts,
    visibleScripts,
    showSystemTestsOnly,
    setShowSystemTestsOnly,
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
    duplicateSelectedScript,
    clearSelectedScript,
    handleDeleteScriptClick,
    restartScriptAtStart,
    runSelectedScriptStep,
    runRemainingScriptSteps,
    isScriptDebugRunning,
    moveSelectedScriptStep,
    moveScriptStepToPosition,
    requestDeleteSelectedScriptStep,
    renderScriptStepRow,
    invalidFieldIds,
    clearInvalidField,
    markEditorAsUserEdited,
    selectedReadMethod,
    erc20ReadOptions,
    selectDropdownReadMethod,
    activeReadLabels,
    readAddressA,
    setReadAddressA,
    readAddressB,
    setReadAddressB,
    canRunErc20ReadMethod,
    hasEditorScriptSelected,
    isUpdateBlockedByNoChanges,
    addToScriptButtonLabel,
    erc20ReadMissingEntries,
    runSelectedReadMethod: runSelectedReadMethodWithPopup,
    handleAddCurrentMethodToScript,
    selectedWriteSenderAccount,
    writeSenderPrivateKeyDisplay,
    showWriteSenderPrivateKey,
    setShowWriteSenderPrivateKey,
    selectedWriteMethod,
    erc20WriteOptions,
    selectDropdownWriteMethod,
    activeWriteLabels,
    writeAddressA,
    setWriteAddressA,
    writeAddressB,
    setWriteAddressB,
    writeAmountRaw,
    setWriteAmountRaw,
    canRunErc20WriteMethod,
    erc20WriteMissingEntries,
    runSelectedWriteMethod: runSelectedWriteMethodWithPopup,
    normalizedSelectedSpCoinReadMethod,
    selectDropdownSpCoinReadMethod,
    spCoinWorldReadOptions,
    spCoinSenderReadOptions,
    spCoinAdminReadOptions,
    spCoinCompoundReadOptions,
    spCoinReadMethodDefs,
    activeSpCoinReadDef,
    spReadParams,
    setSpReadParams,
    canRunSpCoinReadMethod,
    spCoinReadMissingEntries,
    runSelectedSpCoinReadMethod: runSelectedSpCoinReadMethodWithPopup,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    effectiveRecipientRateRange,
    effectiveAgentRateRange,
    selectedSpCoinWriteMethod,
    selectDropdownSpCoinWriteMethod,
    isSpCoinTodoMode,
    spCoinWorldWriteOptions,
    spCoinSenderWriteOptions,
    spCoinAdminWriteOptions,
    spCoinTodoWriteOptions,
    SPCOIN_ONCHAIN_WRITE_METHODS,
    SPCOIN_OFFCHAIN_WRITE_METHODS,
    spCoinWriteMethodDefs,
    activeSpCoinWriteDef,
    spWriteParams,
    updateSpWriteParamAtIndex,
    canRunSpCoinWriteMethod,
    spCoinWriteMissingEntries,
    runSelectedSpCoinWriteMethod: runSelectedSpCoinWriteMethodWithPopup,
    formatDateTimeDisplay,
    formatDateInput,
    backdateCalendar,
    CALENDAR_WEEK_DAYS,
    selectedSerializationTestMethod,
    selectDropdownSerializationTestMethod,
    effectiveSerializationTestOptions,
    serializationTestMethodDefs,
    effectiveSerializationTestDef,
    serializationTestParams,
    setSerializationTestParams,
    canRunSerializationTestMethod,
    serializationTestMissingEntries,
    runSelectedSerializationTestMethod: runSelectedSerializationTestMethodWithPopup,
    inputStyle,
    showSignerAccountDetails,
    setShowSignerAccountDetails,
    displayedSpCoinOwnerAddress,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    writeSenderDisplayValue,
    displayedSpCoinOwnerMetadata,
    mode,
    selectedVersionSignerKey,
    accountActionLabelClassName,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedSponsorCoinAccountRole,
    setSelectedSponsorCoinAccountRole,
    defaultSponsorKey,
    setDefaultSponsorKey,
    defaultRecipientKey,
    setDefaultRecipientKey,
    defaultAgentKey,
    setDefaultAgentKey,
    defaultRecipientRateKey,
    setDefaultRecipientRateKey,
    defaultAgentRateKey,
    setDefaultAgentRateKey,
    managedRoleAccountAddress,
    setManagedRoleAccountAddress,
    managedRecipientKey,
    setManagedRecipientKey,
    managedRecipientRateKey,
    setManagedRecipientRateKey,
    managedRecipientRateKeyOptions,
    managedRecipientRateKeyHelpText,
    sponsorCoinAccountManagementValidation,
    sponsorCoinAccountManagementStatus,
    handleSponsorCoinAccountAction,
    selectedSponsorCoinLogoURL,
    selectedSponsorCoinVersionEntry,
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    sponsorCoinVersionChoices,
    canIncrementSponsorCoinVersion,
    canDecrementSponsorCoinVersion,
    adjustSponsorCoinVersion,
    displayedVersionHardhatAccountIndex,
    selectedVersionSymbolWidthCh,
    selectedVersionSymbol,
    contractAddress,
    isRemovingContractFromApp,
    requestRemoveContractFromApp,
    setMode,
    allowContractNetworkModeSelection,
    shouldPromptHardhatBaseConnect,
    connectHardhatBaseFromNetworkLabel,
    activeContractNetworkName,
    activeContractChainIdDisplayValue,
    activeContractChainIdDisplayWidthCh,
    showHardhatConnectionInputs,
    setShowHardhatConnectionInputs,
    cog_png,
    rpcUrl,
    setRpcUrl,
    effectiveConnectedAddress,
    outputPanelMode,
    setOutputPanelMode,
    refreshActiveOutput,
    buttonStyle,
    copyTextToClipboard,
    setLogs,
    setStatus,
    setTreeOutputDisplay,
    setFormattedOutputDisplay,
    formattedPanelView,
    setFormattedPanelView,
    formattedJsonViewEnabled,
    setFormattedJsonViewEnabled,
    showTreeAccountDetails,
    setShowTreeAccountDetails,
    showAllTreeRecords,
    setShowAllTreeRecords,
    logs,
    treeOutputDisplay,
    status,
    formattedOutputDisplay,
    selectedScriptDisplay,
    scriptStepExecutionErrors,
    highlightedFormattedOutputLines,
    highlightedFormattedResultLines,
    runHeaderRead,
    runAccountListRead,
    runTreeAccountsRead,
    runTreeDump,
    treeAccountOptions,
    selectedTreeAccount,
    setSelectedTreeAccount,
    treeAccountRefreshToken,
    requestRefreshSelectedTreeAccount,
    openAccountFromAddress,
    deleteScriptStepByNumber,
    duplicateScriptStepByNumber,
    createScriptFromSteps,
    existingScriptNames: allScripts.filter((script) => !script.isSystemScript).map((script) => script.name),
  });
  return <SponsorCoinLabView {...viewProps} />;
}
