import { useEffect, useRef, useState } from 'react';
import { CHAIN_ID } from '@/lib/structure';
import { getDefaultNetworkSettings } from '@/lib/utils/network/defaultSettings';
import type { Erc20ReadMethod } from '../jsonMethods/erc20/read';
import type { Erc20WriteMethod } from '../jsonMethods/erc20/write';
import { normalizeSpCoinReadMethod, type SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import type { SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import type { SerializationTestMethod } from '../jsonMethods/serializationTests';
import type { ConnectionMode, LabJavaScriptScript, LabScript, MethodPanelMode, ScriptEditorKind } from '../scriptBuilder/types';

function normalizeJavaScriptScriptFilePath(filePath: string | undefined, isSystemScript: boolean) {
  if (!filePath) return undefined;
  if (isSystemScript) return filePath;
  return filePath.replace('/JavaScripts/Utils/', '/JavaScripts/Main/').replace('/JavaScripts/Tests/', '/JavaScripts/Main/');
}

const spCoinLabKey = 'spCoinLabKey';
const spCoinLabScriptsKey = 'spCoinLabScriptsKey';
const hardhatDefaultSettings = getDefaultNetworkSettings(CHAIN_ID.HARDHAT_BASE) as {
  networkHeader?: { rpcUrl?: string };
};
const LEGACY_REMOTE_HARDHAT_RPC_URL = 'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a';
const DEFAULT_HARDHAT_RPC_URL =
  String(hardhatDefaultSettings?.networkHeader?.rpcUrl || '').trim() ||
  LEGACY_REMOTE_HARDHAT_RPC_URL;

function normalizePersistedRpcUrl(savedMode: unknown, savedRpcUrl: unknown) {
  if (typeof savedRpcUrl !== 'string') return undefined;
  const trimmed = savedRpcUrl.trim();
  if (!trimmed) return undefined;
  if (
    savedMode === 'hardhat' &&
    (/^http:\/\/localhost:8545\/?$/i.test(trimmed) ||
      /^http:\/\/127\.0\.0\.1:8545\/?$/i.test(trimmed))
  ) {
    return DEFAULT_HARDHAT_RPC_URL;
  }
  return trimmed;
}

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
type SponsorCoinAccountRole = 'sponsor' | 'recipient' | 'agent';
type LabCardId = 'network' | 'contract' | 'methods' | 'log' | 'output';

function normalizeSerializationTestMethodKey(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('compare_')) return `external_${trimmed.slice('compare_'.length)}`;
  if (trimmed.startsWith('legacy_')) return `external_${trimmed.slice('legacy_'.length)}`;
  return trimmed;
}

type ScriptApiPayload = {
  scripts?: LabScript[];
  selectedScriptId?: string;
};

type Params = {
  scripts: LabScript[];
  setScripts: (value: LabScript[]) => void;
  javaScriptScripts: LabJavaScriptScript[];
  setJavaScriptScripts: (value: LabJavaScriptScript[]) => void;
  selectedScriptId: string;
  setSelectedScriptId: (value: string) => void;
  scriptEditorKind: ScriptEditorKind;
  setScriptEditorKind: (value: ScriptEditorKind) => void;
  showSystemTestsOnly: boolean;
  setShowSystemTestsOnly: (value: boolean) => void;
  showJavaScriptUtilScriptsOnly: boolean;
  setShowJavaScriptUtilScriptsOnly: (value: boolean) => void;
  selectedJavaScriptScriptId: string;
  setSelectedJavaScriptScriptId: (value: string) => void;
  mode: ConnectionMode;
  setMode: (value: ConnectionMode) => void;
  rpcUrl: string;
  setRpcUrl: (value: string) => void;
  contractAddress: string;
  setContractAddress: (value: string) => void;
  selectedSponsorCoinVersion: string;
  setSelectedSponsorCoinVersion: (value: string) => void;
  selectedHardhatIndex: number;
  setSelectedHardhatIndex: (value: number) => void;
  connectedAddress: string;
  connectedChainId: string;
  connectedNetworkName: string;
  selectedWriteSenderAddress: string;
  setSelectedWriteSenderAddress: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  logs: string[];
  setLogs: (value: string[]) => void;
  formattedOutputDisplay: string;
  setFormattedOutputDisplay: (value: string) => void;
  outputPanelMode: OutputPanelMode;
  setOutputPanelMode: (value: OutputPanelMode) => void;
  formattedPanelView: 'script' | 'output';
  setFormattedPanelView: (value: 'script' | 'output') => void;
  formattedJsonViewEnabled: boolean;
  setFormattedJsonViewEnabled: (value: boolean) => void;
  writeTraceEnabled: boolean;
  setWriteTraceEnabled: (value: boolean) => void;
  treeOutputDisplay: string;
  setTreeOutputDisplay: (value: string) => void;
  showTreeAccountDetails: boolean;
  setShowTreeAccountDetails: (value: boolean) => void;
  showAllTreeRecords: boolean;
  setShowAllTreeRecords: (value: boolean) => void;
  expandedCard: LabCardId | null;
  setExpandedCard: (value: LabCardId | null) => void;
  showOnChainMethods: boolean;
  setShowOnChainMethods: (value: boolean) => void;
  showOffChainMethods: boolean;
  setShowOffChainMethods: (value: boolean) => void;
  auxMethodPanelTab: 'admin_utils' | null;
  setAuxMethodPanelTab: (value: 'admin_utils' | null) => void;
  isSpCoinTodoMode: boolean;
  setIsSpCoinTodoMode: (value: boolean) => void;
  selectedTreeAccount: string;
  setSelectedTreeAccount: (value: string) => void;
  selectedWriteMethod: Erc20WriteMethod;
  setSelectedWriteMethod: (value: Erc20WriteMethod) => void;
  writeAddressA: string;
  setWriteAddressA: (value: string) => void;
  writeAddressB: string;
  setWriteAddressB: (value: string) => void;
  writeAmountRaw: string;
  setWriteAmountRaw: (value: string) => void;
  methodPanelMode: MethodPanelMode;
  setMethodPanelMode: (value: MethodPanelMode) => void;
  selectedReadMethod: Erc20ReadMethod;
  setSelectedReadMethod: (value: Erc20ReadMethod) => void;
  readAddressA: string;
  setReadAddressA: (value: string) => void;
  readAddressB: string;
  setReadAddressB: (value: string) => void;
  selectedSpCoinReadMethod: SpCoinReadMethod;
  setSelectedSpCoinReadMethod: (value: SpCoinReadMethod) => void;
  selectedSpCoinWriteMethod: SpCoinWriteMethod;
  setSelectedSpCoinWriteMethod: (value: SpCoinWriteMethod) => void;
  selectedSerializationTestMethod: SerializationTestMethod;
  setSelectedSerializationTestMethod: (value: SerializationTestMethod) => void;
  selectedSponsorCoinAccountRole: SponsorCoinAccountRole;
  setSelectedSponsorCoinAccountRole: (value: SponsorCoinAccountRole) => void;
  managedRoleAccountAddress: string;
  setManagedRoleAccountAddress: (value: string) => void;
  managedRecipientKey: string;
  setManagedRecipientKey: (value: string) => void;
  managedRecipientRateKey: string;
  setManagedRecipientRateKey: (value: string) => void;
  sponsorCoinAccountManagementStatus: string;
  setSponsorCoinAccountManagementStatus: (value: string) => void;
  spReadParams: string[];
  setSpReadParams: (value: string[]) => void;
  spWriteParams: string[];
  setSpWriteParams: (value: string[]) => void;
  serializationTestParams: string[];
  setSerializationTestParams: (value: string[]) => void;
  normalizeAddressValue: (value: string) => string;
  backdateCalendar: {
    backdatePopupParamIdx: number | null;
    setBackdatePopupParamIdx: (value: number | null) => void;
    backdateYears: string;
    setBackdateYears: (value: string) => void;
    backdateMonths: string;
    setBackdateMonths: (value: string) => void;
    backdateDays: string;
    setBackdateDays: (value: string) => void;
    backdateHours: string;
    setBackdateHours: (value: string) => void;
    backdateMinutes: string;
    setBackdateMinutes: (value: string) => void;
    backdateSeconds: string;
    setBackdateSeconds: (value: string) => void;
    hoverCalendarWarning: string;
    setHoverCalendarWarning: (value: string) => void;
    calendarViewYear: number;
    setCalendarViewYear: (value: number) => void;
    calendarViewMonth: number;
    setCalendarViewMonth: (value: number) => void;
  };
};

export function useSponsorCoinLabPersistence({
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
}: Params) {
  const [spCoinLabHydrated, setSpCoinLabHydrated] = useState(false);
  const hasPersistedScriptsRef = useRef(false);

  async function fetchFileBackedScripts(): Promise<ScriptApiPayload | null> {
    try {
      const response = await fetch('/api/spCoin/scripts', { cache: 'no-store' });
      if (!response.ok) return null;
      return (await response.json()) as ScriptApiPayload;
    } catch {
      return null;
    }
  }

  async function persistFileBackedScripts(payload: ScriptApiPayload) {
    const response = await fetch('/api/spCoin/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Unable to save scripts (${response.status})`);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const hydrate = async () => {
      try {
        const savedFromFiles = await fetchFileBackedScripts();
        const nextFileScripts = Array.isArray(savedFromFiles?.scripts) ? savedFromFiles.scripts : [];

        if (!cancelled && nextFileScripts.length > 0) {
          setScripts(nextFileScripts);
          if (typeof savedFromFiles?.selectedScriptId === 'string' && savedFromFiles.selectedScriptId.trim()) {
            setSelectedScriptId(savedFromFiles.selectedScriptId);
          } else if (nextFileScripts[0]?.id) {
            setSelectedScriptId(nextFileScripts[0].id);
          }
        } else {
          const rawScripts = window.localStorage.getItem(spCoinLabScriptsKey);
          if (rawScripts) {
            const savedScripts = JSON.parse(rawScripts) as { scripts?: LabScript[]; selectedScriptId?: string };
            const nextScripts = Array.isArray(savedScripts?.scripts) ? savedScripts.scripts : [];
            if (!cancelled) {
              setScripts(nextScripts);
              if (typeof savedScripts?.selectedScriptId === 'string') {
                setSelectedScriptId(savedScripts.selectedScriptId);
              } else if (nextScripts[0]?.id) {
                setSelectedScriptId(nextScripts[0].id);
              }
            }
            if (nextScripts.length > 0) {
              await persistFileBackedScripts({
                scripts: nextScripts,
                selectedScriptId:
                  typeof savedScripts?.selectedScriptId === 'string' && savedScripts.selectedScriptId.trim()
                    ? savedScripts.selectedScriptId
                    : nextScripts[0]?.id || '',
              });
              window.localStorage.removeItem(spCoinLabScriptsKey);
            }
          }
        }

        const raw = window.localStorage.getItem(spCoinLabKey);
        if (raw) {
          const saved = JSON.parse(raw) as Record<string, any>;
          if (saved.scriptEditorKind === 'json' || saved.scriptEditorKind === 'javascript') {
            setScriptEditorKind(saved.scriptEditorKind);
          }
          if (typeof saved.showSystemTestsOnly === 'boolean') {
            setShowSystemTestsOnly(saved.showSystemTestsOnly);
          }
          if (typeof saved.showJavaScriptUtilScriptsOnly === 'boolean') {
            setShowJavaScriptUtilScriptsOnly(saved.showJavaScriptUtilScriptsOnly);
          }
          if (Array.isArray(saved.javaScriptScripts)) {
            setJavaScriptScripts(
              saved.javaScriptScripts.map((script) => ({
                id: String(script?.id || ''),
                name: String(script?.name || ''),
                scriptType: (script?.scriptType === 'util' ? 'util' : 'test') as 'util' | 'test',
                filePath: normalizeJavaScriptScriptFilePath(
                  typeof script?.filePath === 'string' ? script.filePath : undefined,
                  Boolean(script?.isSystemScript),
                ),
                isSystemScript: Boolean(script?.isSystemScript),
              })).filter((script) => script.id && script.name),
            );
          }
          if (typeof saved.selectedJavaScriptScriptId === 'string') {
            setSelectedJavaScriptScriptId(saved.selectedJavaScriptScriptId);
          }
          if (saved.mode === 'metamask' || saved.mode === 'hardhat') setMode(saved.mode);
          const normalizedRpcUrl = normalizePersistedRpcUrl(saved.mode, saved.rpcUrl);
          if (typeof normalizedRpcUrl === 'string') setRpcUrl(normalizedRpcUrl);
          if (typeof saved.selectedSponsorCoinVersion === 'string') {
            setSelectedSponsorCoinVersion(saved.selectedSponsorCoinVersion);
          }
          if (typeof saved.contractAddress === 'string') setContractAddress(saved.contractAddress);
          if (typeof saved.selectedHardhatIndex === 'number') setSelectedHardhatIndex(saved.selectedHardhatIndex);
          if (typeof saved.selectedWriteSenderAddress === 'string') {
            setSelectedWriteSenderAddress(normalizeAddressValue(saved.selectedWriteSenderAddress));
          }
          if (typeof saved.selectedWriteMethod === 'string') setSelectedWriteMethod(saved.selectedWriteMethod as Erc20WriteMethod);
          if (typeof saved.writeAddressA === 'string') setWriteAddressA(normalizeAddressValue(saved.writeAddressA));
          if (typeof saved.writeAddressB === 'string') setWriteAddressB(normalizeAddressValue(saved.writeAddressB));
          if (typeof saved.writeAmountRaw === 'string') setWriteAmountRaw(saved.writeAmountRaw);
          if (typeof saved.methodPanelMode === 'string') setMethodPanelMode(saved.methodPanelMode as MethodPanelMode);
          if (typeof saved.selectedReadMethod === 'string') setSelectedReadMethod(saved.selectedReadMethod as Erc20ReadMethod);
          if (typeof saved.readAddressA === 'string') setReadAddressA(normalizeAddressValue(saved.readAddressA));
          if (typeof saved.readAddressB === 'string') setReadAddressB(normalizeAddressValue(saved.readAddressB));
          if (typeof saved.selectedSpCoinReadMethod === 'string') {
            setSelectedSpCoinReadMethod(normalizeSpCoinReadMethod(saved.selectedSpCoinReadMethod));
          }
          if (typeof saved.selectedSpCoinWriteMethod === 'string') {
            setSelectedSpCoinWriteMethod(saved.selectedSpCoinWriteMethod as SpCoinWriteMethod);
          }
          if (typeof saved.selectedSerializationTestMethod === 'string') {
            setSelectedSerializationTestMethod(
              normalizeSerializationTestMethodKey(saved.selectedSerializationTestMethod) as SerializationTestMethod,
            );
          }
          if (Array.isArray(saved.spReadParams)) {
            setSpReadParams(saved.spReadParams.map((v) => normalizeAddressValue(String(v ?? ''))));
          }
          if (Array.isArray(saved.spWriteParams)) {
            setSpWriteParams(saved.spWriteParams.map((v) => normalizeAddressValue(String(v ?? ''))));
          }
          if (Array.isArray(saved.serializationTestParams)) {
            setSerializationTestParams(saved.serializationTestParams.map((v) => normalizeAddressValue(String(v ?? ''))));
          }
          if (typeof saved.status === 'string') setStatus(saved.status);
          if (Array.isArray(saved.logs)) setLogs(saved.logs.map((v) => String(v ?? '')));
          if (typeof saved.formattedOutputDisplay === 'string') setFormattedOutputDisplay(saved.formattedOutputDisplay);
          if (
            saved.outputPanelMode === 'execution' ||
            saved.outputPanelMode === 'formatted' ||
            saved.outputPanelMode === 'tree' ||
            saved.outputPanelMode === 'raw_status'
          ) {
            setOutputPanelMode(saved.outputPanelMode);
          }
          if (saved.formattedPanelView === 'script' || saved.formattedPanelView === 'output') {
            setFormattedPanelView(saved.formattedPanelView);
          }
          if (typeof saved.formattedJsonViewEnabled === 'boolean') {
            setFormattedJsonViewEnabled(saved.formattedJsonViewEnabled);
          }
          if (typeof saved.writeTraceEnabled === 'boolean') {
            setWriteTraceEnabled(saved.writeTraceEnabled);
          }
          if (typeof saved.treeOutputDisplay === 'string') setTreeOutputDisplay(saved.treeOutputDisplay);
          if (typeof saved.showTreeAccountDetails === 'boolean') setShowTreeAccountDetails(saved.showTreeAccountDetails);
          if (typeof saved.showAllTreeRecords === 'boolean') setShowAllTreeRecords(saved.showAllTreeRecords);
          if (
            saved.expandedCard === 'network' ||
            saved.expandedCard === 'contract' ||
            saved.expandedCard === 'methods' ||
            saved.expandedCard === 'log' ||
            saved.expandedCard === 'output' ||
            saved.expandedCard === null
          ) {
            setExpandedCard(saved.expandedCard ?? null);
          }
          if (typeof saved.showOnChainMethods === 'boolean') setShowOnChainMethods(saved.showOnChainMethods);
          if (typeof saved.showOffChainMethods === 'boolean') setShowOffChainMethods(saved.showOffChainMethods);
          if (
            saved.auxMethodPanelTab === 'admin_utils' ||
            saved.auxMethodPanelTab === 'utils' ||
            saved.auxMethodPanelTab === null
          ) {
            setAuxMethodPanelTab(
              saved.auxMethodPanelTab === 'utils' ? 'admin_utils' : (saved.auxMethodPanelTab ?? null),
            );
          }
          if (typeof saved.isSpCoinTodoMode === 'boolean') setIsSpCoinTodoMode(saved.isSpCoinTodoMode);
          if (typeof saved.selectedTreeAccount === 'string') {
            setSelectedTreeAccount(normalizeAddressValue(saved.selectedTreeAccount));
          }
          if (
            saved.selectedSponsorCoinAccountRole === 'sponsor' ||
            saved.selectedSponsorCoinAccountRole === 'recipient' ||
            saved.selectedSponsorCoinAccountRole === 'agent'
          ) {
            setSelectedSponsorCoinAccountRole(saved.selectedSponsorCoinAccountRole);
          }
          if (typeof saved.managedRoleAccountAddress === 'string') {
            setManagedRoleAccountAddress(normalizeAddressValue(saved.managedRoleAccountAddress));
          }
          if (typeof saved.managedRecipientKey === 'string') {
            setManagedRecipientKey(normalizeAddressValue(saved.managedRecipientKey));
          }
          if (typeof saved.managedRecipientRateKey === 'string') {
            setManagedRecipientRateKey(saved.managedRecipientRateKey);
          }
          if (typeof saved.sponsorCoinAccountManagementStatus === 'string') {
            setSponsorCoinAccountManagementStatus(saved.sponsorCoinAccountManagementStatus);
          }
          if (typeof saved.backdatePopupParamIdx === 'number' || saved.backdatePopupParamIdx === null) {
            backdateCalendar.setBackdatePopupParamIdx(saved.backdatePopupParamIdx);
          }
          if (typeof saved.backdateYears === 'string') backdateCalendar.setBackdateYears(saved.backdateYears);
          if (typeof saved.backdateMonths === 'string') backdateCalendar.setBackdateMonths(saved.backdateMonths);
          if (typeof saved.backdateDays === 'string') backdateCalendar.setBackdateDays(saved.backdateDays);
          if (typeof saved.backdateHours === 'string') backdateCalendar.setBackdateHours(saved.backdateHours);
          if (typeof saved.backdateMinutes === 'string') backdateCalendar.setBackdateMinutes(saved.backdateMinutes);
          if (typeof saved.backdateSeconds === 'string') backdateCalendar.setBackdateSeconds(saved.backdateSeconds);
          if (typeof saved.hoverCalendarWarning === 'string') {
            backdateCalendar.setHoverCalendarWarning(saved.hoverCalendarWarning);
          }
          if (typeof saved.calendarViewYear === 'number') backdateCalendar.setCalendarViewYear(saved.calendarViewYear);
          if (typeof saved.calendarViewMonth === 'number') backdateCalendar.setCalendarViewMonth(saved.calendarViewMonth);
        }
        hasPersistedScriptsRef.current = true;
      } catch {
        // Ignore malformed SponsorCoinLab localStorage payload.
      } finally {
        if (!cancelled) {
          setSpCoinLabHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !spCoinLabHydrated || !hasPersistedScriptsRef.current) return;

    void persistFileBackedScripts({
      scripts,
      selectedScriptId,
    }).catch(() => {
      // Ignore transient file persistence failures in the UI layer.
    });
  }, [scripts, selectedScriptId, spCoinLabHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !spCoinLabHydrated) return;
    if (window.localStorage.getItem(spCoinLabScriptsKey)) {
      window.localStorage.removeItem(spCoinLabScriptsKey);
    }
  }, [scripts, selectedScriptId, spCoinLabHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !spCoinLabHydrated) return;
    const payload = {
      mode,
      scriptEditorKind,
      showSystemTestsOnly,
      showJavaScriptUtilScriptsOnly,
      javaScriptScripts,
      selectedJavaScriptScriptId,
      rpcUrl,
      selectedSponsorCoinVersion,
      contractAddress,
      selectedHardhatIndex,
      connectedAddress,
      connectedChainId,
      connectedNetworkName,
      selectedWriteSenderAddress,
      status,
      logs,
      formattedOutputDisplay,
      outputPanelMode,
      formattedPanelView,
      formattedJsonViewEnabled,
      writeTraceEnabled,
      treeOutputDisplay,
      showTreeAccountDetails,
      showAllTreeRecords,
      expandedCard,
      showOnChainMethods,
      showOffChainMethods,
      auxMethodPanelTab,
      isSpCoinTodoMode,
      selectedTreeAccount,
      selectedWriteMethod,
      writeAddressA,
      writeAddressB,
      writeAmountRaw,
      methodPanelMode,
      selectedReadMethod,
      readAddressA,
      readAddressB,
      selectedSpCoinReadMethod,
      selectedSpCoinWriteMethod,
      selectedSerializationTestMethod,
      selectedSponsorCoinAccountRole,
      managedRoleAccountAddress,
      managedRecipientKey,
      managedRecipientRateKey,
      sponsorCoinAccountManagementStatus,
      spReadParams,
      spWriteParams,
      serializationTestParams,
      backdatePopupParamIdx: backdateCalendar.backdatePopupParamIdx,
      backdateYears: backdateCalendar.backdateYears,
      backdateMonths: backdateCalendar.backdateMonths,
      backdateDays: backdateCalendar.backdateDays,
      backdateHours: backdateCalendar.backdateHours,
      backdateMinutes: backdateCalendar.backdateMinutes,
      backdateSeconds: backdateCalendar.backdateSeconds,
      hoverCalendarWarning: backdateCalendar.hoverCalendarWarning,
      calendarViewYear: backdateCalendar.calendarViewYear,
      calendarViewMonth: backdateCalendar.calendarViewMonth,
    };
    window.localStorage.setItem(spCoinLabKey, JSON.stringify(payload));
  }, [
    spCoinLabHydrated,
    mode,
    scriptEditorKind,
    showSystemTestsOnly,
    showJavaScriptUtilScriptsOnly,
    javaScriptScripts,
    selectedJavaScriptScriptId,
    rpcUrl,
    selectedSponsorCoinVersion,
    contractAddress,
    selectedHardhatIndex,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    selectedWriteSenderAddress,
    status,
    logs,
    formattedOutputDisplay,
    outputPanelMode,
    formattedPanelView,
    formattedJsonViewEnabled,
    writeTraceEnabled,
    treeOutputDisplay,
    showTreeAccountDetails,
    showAllTreeRecords,
    expandedCard,
    showOnChainMethods,
    showOffChainMethods,
    auxMethodPanelTab,
    isSpCoinTodoMode,
    selectedTreeAccount,
    selectedWriteMethod,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    methodPanelMode,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedSerializationTestMethod,
    selectedSponsorCoinAccountRole,
    managedRoleAccountAddress,
    managedRecipientKey,
    managedRecipientRateKey,
    sponsorCoinAccountManagementStatus,
    spReadParams,
    spWriteParams,
    serializationTestParams,
    backdateCalendar.backdatePopupParamIdx,
    backdateCalendar.backdateYears,
    backdateCalendar.backdateMonths,
    backdateCalendar.backdateDays,
    backdateCalendar.backdateHours,
    backdateCalendar.backdateMinutes,
    backdateCalendar.backdateSeconds,
    backdateCalendar.hoverCalendarWarning,
    backdateCalendar.calendarViewYear,
    backdateCalendar.calendarViewMonth,
  ]);

  return {
    spCoinLabHydrated,
  };
}
