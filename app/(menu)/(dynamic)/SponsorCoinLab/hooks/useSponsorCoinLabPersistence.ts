import { useEffect, useState } from 'react';
import type { Erc20ReadMethod } from '../methods/erc20/read';
import type { Erc20WriteMethod } from '../methods/erc20/write';
import type { SpCoinReadMethod } from '../methods/spcoin/read';
import type { SpCoinWriteMethod } from '../methods/spcoin/write';
import type { ConnectionMode, LabScript, MethodPanelMode } from '../scriptBuilder/types';

const spCoinLabKey = 'spCoinLabKey';
const spCoinLabScriptsKey = 'spCoinLabScriptsKey';

type Params = {
  scripts: LabScript[];
  setScripts: (value: LabScript[]) => void;
  selectedScriptId: string;
  setSelectedScriptId: (value: string) => void;
  mode: ConnectionMode;
  setMode: (value: ConnectionMode) => void;
  rpcUrl: string;
  setRpcUrl: (value: string) => void;
  contractAddress: string;
  setContractAddress: (value: string) => void;
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
  formattedPanelView: 'script' | 'output';
  setFormattedPanelView: (value: 'script' | 'output') => void;
  treeOutputDisplay: string;
  setTreeOutputDisplay: (value: string) => void;
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
  spReadParams: string[];
  setSpReadParams: (value: string[]) => void;
  spWriteParams: string[];
  setSpWriteParams: (value: string[]) => void;
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
}: Params) {
  const [spCoinLabHydrated, setSpCoinLabHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawScripts = window.localStorage.getItem(spCoinLabScriptsKey);
      if (rawScripts) {
        const savedScripts = JSON.parse(rawScripts) as { scripts?: LabScript[]; selectedScriptId?: string };
        const nextScripts = Array.isArray(savedScripts?.scripts) ? savedScripts.scripts : [];
        setScripts(nextScripts);
        if (typeof savedScripts?.selectedScriptId === 'string') {
          setSelectedScriptId(savedScripts.selectedScriptId);
        } else if (nextScripts[0]?.id) {
          setSelectedScriptId(nextScripts[0].id);
        }
      }

      const raw = window.localStorage.getItem(spCoinLabKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, any>;
        if (saved.mode === 'metamask' || saved.mode === 'hardhat') setMode(saved.mode);
        if (typeof saved.rpcUrl === 'string') setRpcUrl(saved.rpcUrl);
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
          setSelectedSpCoinReadMethod(saved.selectedSpCoinReadMethod as SpCoinReadMethod);
        }
        if (typeof saved.selectedSpCoinWriteMethod === 'string') {
          setSelectedSpCoinWriteMethod(saved.selectedSpCoinWriteMethod as SpCoinWriteMethod);
        }
        if (Array.isArray(saved.spReadParams)) {
          setSpReadParams(saved.spReadParams.map((v) => normalizeAddressValue(String(v ?? ''))));
        }
        if (Array.isArray(saved.spWriteParams)) {
          setSpWriteParams(saved.spWriteParams.map((v) => normalizeAddressValue(String(v ?? ''))));
        }
        if (typeof saved.status === 'string') setStatus(saved.status);
        if (Array.isArray(saved.logs)) setLogs(saved.logs.map((v) => String(v ?? '')));
        if (typeof saved.formattedOutputDisplay === 'string') setFormattedOutputDisplay(saved.formattedOutputDisplay);
        if (saved.formattedPanelView === 'script' || saved.formattedPanelView === 'output') {
          setFormattedPanelView(saved.formattedPanelView);
        }
        if (typeof saved.treeOutputDisplay === 'string') setTreeOutputDisplay(saved.treeOutputDisplay);
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
    } catch {
      // Ignore malformed SponsorCoinLab localStorage payload.
    } finally {
      setSpCoinLabHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !spCoinLabHydrated) return;
    window.localStorage.setItem(
      spCoinLabScriptsKey,
      JSON.stringify({
        scripts,
        selectedScriptId,
      }),
    );
  }, [scripts, selectedScriptId, spCoinLabHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !spCoinLabHydrated) return;
    const payload = {
      mode,
      rpcUrl,
      contractAddress,
      selectedHardhatIndex,
      connectedAddress,
      connectedChainId,
      connectedNetworkName,
      selectedWriteSenderAddress,
      status,
      logs,
      formattedOutputDisplay,
      formattedPanelView,
      treeOutputDisplay,
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
      spReadParams,
      spWriteParams,
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
    rpcUrl,
    contractAddress,
    selectedHardhatIndex,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    selectedWriteSenderAddress,
    status,
    logs,
    formattedOutputDisplay,
    formattedPanelView,
    treeOutputDisplay,
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
    spReadParams,
    spWriteParams,
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
