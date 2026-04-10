import type React from 'react';
import type { MethodDef } from '../jsonMethods/shared/types';
import type {
  MethodDefMap,
  MissingFieldEntry,
} from './types';
import type { Erc20ReadMethod } from '../jsonMethods/erc20/read';
import type { Erc20WriteMethod } from '../jsonMethods/erc20/write';
import type { SerializationTestMethod } from '../jsonMethods/serializationTests';
import type { SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import type { SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import type { ConnectionMode, LabScript, LabScriptStep, MethodPanelMode, ScriptEditorKind } from '../scriptBuilder/types';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
type SetValue<T> = (value: T) => void;
type ScriptLike = { id?: string; name?: string } | null | undefined;
type AddressAccountLike = { address?: string } | null | undefined;
type ValidationTone = 'neutral' | 'invalid' | 'valid';
type ActiveAddressLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressA: boolean;
  requiresAddressB: boolean;
};
type ActiveWriteLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressB: boolean;
};
type BackdateCalendarArgs = {
  openBackdatePickerAt: (index: number) => void;
  backdateHours: string;
  setBackdateHours: StateSetter<string>;
  backdateMinutes: string;
  setBackdateMinutes: StateSetter<string>;
  backdateSeconds: string;
  setBackdateSeconds: StateSetter<string>;
  setBackdateYears: StateSetter<string>;
  setBackdateMonths: StateSetter<string>;
  setBackdateDays: StateSetter<string>;
  backdatePopupParamIdx: number | null;
  setBackdatePopupParamIdx: StateSetter<number | null>;
  shiftCalendarMonth: (direction: number) => void;
  calendarMonthOptions: Array<{ label: string; monthIndex: number }>;
  calendarViewMonth: number;
  setCalendarViewMonth: StateSetter<number>;
  calendarYearOptions: number[];
  calendarViewYear: number;
  setCalendarViewYear: StateSetter<number>;
  isViewingCurrentMonth: boolean;
  setHoverCalendarWarning: StateSetter<string>;
  calendarDayCells: Array<{ day: number | null; key: string }>;
  isViewingFutureMonth: boolean;
  today: Date;
  selectedBackdateDate: Date | null;
  hoverCalendarWarning: string;
  maxBackdateYears: number;
  backdateYears: string;
  backdateMonths: string;
  backdateDays: string;
  applyBackdateBy: (yearsRaw: string, monthsRaw: string, daysRaw: string, targetIdx?: number | null) => void;
};

export type BuildMethodsPanelCardPropsArgs = {
  methodPanelTitle: string;
  scriptEditorKind: ScriptEditorKind;
  setScriptEditorKind: StateSetter<ScriptEditorKind>;
  methodPanelMode: MethodPanelMode;
  activeMethodPanelTab: MethodPanelMode | 'erc20' | 'admin_utils' | 'todos';
  selectMethodPanelTab: (tab: MethodPanelMode | 'erc20' | 'admin_utils' | 'todos') => void;
  selectMappedJsonMethod: (value: string) => void;
  writeTraceEnabled: boolean;
  setWriteTraceEnabled: StateSetter<boolean>;
  showOnChainMethods: boolean;
  setShowOnChainMethods: StateSetter<boolean>;
  showOffChainMethods: boolean;
  setShowOffChainMethods: StateSetter<boolean>;
  hiddenScrollbarClass: string;
  visibleJavaScriptScripts: Array<{ id: string; name: string }>;
  selectedJavaScriptScriptId: string;
  setSelectedJavaScriptScriptId: StateSetter<string>;
  selectedJavaScriptScript: ScriptLike;
  selectedJavaScriptDisplayFilePath: string;
  javaScriptFileContent: string;
  isJavaScriptFileLoading: boolean;
  isTypeScriptEditEnabled: boolean;
  setIsTypeScriptEditEnabled: StateSetter<boolean>;
  canEditSelectedTypeScriptFile: boolean;
  saveSelectedTypeScriptFile: () => void | Promise<void>;
  isSavingSelectedTypeScriptFile: boolean;
  setJavaScriptFileContent: StateSetter<string>;
  runSelectedJavaScriptScript: () => void | Promise<void>;
  addSelectedJavaScriptScriptToScript: () => void | Promise<void>;
  actionButtonStyle: string;
  scripts: LabScript[];
  visibleScripts: LabScript[];
  showSystemTestsOnly: boolean;
  setShowSystemTestsOnly: StateSetter<boolean>;
  selectedScript: LabScript | null;
  selectedScriptStepNumber: number | null;
  scriptNameInput: string;
  setScriptNameInput: StateSetter<string>;
  selectedScriptId: string;
  setSelectedScriptId: StateSetter<string>;
  isScriptOptionsOpen: boolean;
  setIsScriptOptionsOpen: StateSetter<boolean>;
  isNewScriptHovered: boolean;
  setIsNewScriptHovered: StateSetter<boolean>;
  isDeleteScriptHovered: boolean;
  setIsDeleteScriptHovered: StateSetter<boolean>;
  newScriptHoverTone: ValidationTone;
  setNewScriptHoverTone: StateSetter<ValidationTone>;
  deleteScriptHoverTone: 'invalid' | 'valid';
  setDeleteScriptHoverTone: StateSetter<'invalid' | 'valid'>;
  scriptNameValidation: { tone: ValidationTone; message: string };
  deleteScriptValidation: { tone: 'invalid' | 'valid'; message: string };
  createNewScript: () => void | Promise<void>;
  duplicateSelectedScript: (nextNameRaw: string) => boolean;
  clearSelectedScript: () => void | Promise<void>;
  handleDeleteScriptClick: () => void | Promise<void>;
  restartScriptAtStart: () => Promise<void>;
  runSelectedScriptStep: () => Promise<void>;
  runRemainingScriptSteps: () => Promise<void>;
  isScriptDebugRunning: boolean;
  moveSelectedScriptStep: (direction: -1 | 1) => void | Promise<void>;
  requestDeleteSelectedScriptStep: () => void;
  renderScriptStepRow: (step: LabScriptStep) => React.ReactNode;
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  markEditorAsUserEdited: () => void;
  selectedReadMethod: Erc20ReadMethod;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  erc20ReadOptions: string[];
  selectDropdownReadMethod: (value: Erc20ReadMethod) => void;
  activeReadLabels: ActiveAddressLabels;
  readAddressA: string;
  setReadAddressA: StateSetter<string>;
  readAddressB: string;
  setReadAddressB: StateSetter<string>;
  canRunErc20ReadMethod: boolean;
  hasEditorScriptSelected: boolean;
  isUpdateBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  erc20ReadMissingEntries: MissingFieldEntry[];
  runSelectedReadMethod: () => void | Promise<void>;
  handleAddCurrentMethodToScript: () => void | Promise<void>;
  mode: ConnectionMode;
  selectedWriteSenderAccount: AddressAccountLike;
  selectedWriteSenderAddress: string;
  setSelectedWriteSenderAddress: SetValue<string>;
  writeSenderDisplayValue: string;
  writeSenderPrivateKeyDisplay: string;
  showWriteSenderPrivateKey: boolean;
  setShowWriteSenderPrivateKey: StateSetter<boolean>;
  selectedWriteMethod: Erc20WriteMethod;
  erc20WriteOptions: string[];
  selectDropdownWriteMethod: (value: Erc20WriteMethod) => void;
  activeWriteLabels: ActiveWriteLabels;
  writeAddressA: string;
  setWriteAddressA: StateSetter<string>;
  writeAddressB: string;
  setWriteAddressB: StateSetter<string>;
  writeAmountRaw: string;
  setWriteAmountRaw: StateSetter<string>;
  inputStyle: string;
  canRunErc20WriteMethod: boolean;
  erc20WriteMissingEntries: MissingFieldEntry[];
  runSelectedWriteMethod: () => void | Promise<void>;
  normalizedSelectedSpCoinReadMethod: SpCoinReadMethod;
  selectDropdownSpCoinReadMethod: (value: SpCoinReadMethod) => void;
  spCoinWorldReadOptions: string[];
  spCoinSenderReadOptions: string[];
  spCoinAdminReadOptions: string[];
  spCoinCompoundReadOptions: string[];
  spCoinReadMethodDefs: MethodDefMap;
  activeSpCoinReadDef: MethodDef;
  spReadParams: string[];
  setSpReadParams: StateSetter<string[]>;
  contractAddress: string;
  canRunSpCoinReadMethod: boolean;
  spCoinReadMissingEntries: MissingFieldEntry[];
  runSelectedSpCoinReadMethod: () => void | Promise<void>;
  recipientRateKeyOptions: string[];
  agentRateKeyOptions: string[];
  recipientRateKeyHelpText: string;
  agentRateKeyHelpText: string;
  effectiveRecipientRateRange: [number, number];
  effectiveAgentRateRange: [number, number];
  selectedSpCoinWriteMethod: SpCoinWriteMethod;
  selectDropdownSpCoinWriteMethod: (value: SpCoinWriteMethod) => void;
  isSpCoinTodoMode: boolean;
  spCoinWorldWriteOptions: string[];
  spCoinSenderWriteOptions: string[];
  spCoinAdminWriteOptions: string[];
  spCoinTodoWriteOptions: string[];
  SPCOIN_ONCHAIN_WRITE_METHODS: string[];
  SPCOIN_OFFCHAIN_WRITE_METHODS: string[];
  spCoinWriteMethodDefs: MethodDefMap;
  activeSpCoinWriteDef: MethodDef;
  spWriteParams: string[];
  updateSpWriteParamAtIndex: (index: number, value: string) => void;
  buttonStyle: string;
  canRunSpCoinWriteMethod: boolean;
  spCoinWriteMissingEntries: MissingFieldEntry[];
  runSelectedSpCoinWriteMethod: () => void | Promise<void>;
  formatDateTimeDisplay: (datePart: string, hours: string, minutes: string, seconds: string) => string;
  formatDateInput: (date: Date) => string;
  backdateCalendar: BackdateCalendarArgs;
  CALENDAR_WEEK_DAYS: string[];
  selectedSerializationTestMethod: SerializationTestMethod;
  selectDropdownSerializationTestMethod: (value: SerializationTestMethod) => void;
  effectiveSerializationTestOptions: string[];
  serializationTestMethodDefs: MethodDefMap;
  effectiveSerializationTestDef: MethodDef;
  serializationTestParams: string[];
  setSerializationTestParams: StateSetter<string[]>;
  canRunSerializationTestMethod: boolean;
  serializationTestMissingEntries: MissingFieldEntry[];
  runSelectedSerializationTestMethod: () => void | Promise<void>;
};

export function buildMethodsPanelCardProps(args: BuildMethodsPanelCardPropsArgs) {
  return {
    methodPanelTitle: args.methodPanelTitle,
    scriptEditorKind: args.scriptEditorKind,
    setScriptEditorKind: args.setScriptEditorKind,
    methodPanelMode: args.methodPanelMode,
    activeMethodPanelTab: args.activeMethodPanelTab,
    selectMethodPanelTab: args.selectMethodPanelTab,
    selectMappedJsonMethod: args.selectMappedJsonMethod,
    writeTraceEnabled: args.writeTraceEnabled,
    toggleWriteTrace: () => args.setWriteTraceEnabled((prev: boolean) => !prev),
    showOnChainMethods: args.showOnChainMethods,
    setShowOnChainMethods: args.setShowOnChainMethods,
    showOffChainMethods: args.showOffChainMethods,
    setShowOffChainMethods: args.setShowOffChainMethods,
    javaScriptEditorProps: {
      hiddenScrollbarClass: args.hiddenScrollbarClass,
      visibleJavaScriptScripts: args.visibleJavaScriptScripts,
      selectedJavaScriptScriptId: args.selectedJavaScriptScriptId,
      setSelectedJavaScriptScriptId: args.setSelectedJavaScriptScriptId,
      selectedScriptName: String(args.selectedJavaScriptScript?.name || ''),
      selectedFilePath: args.selectedJavaScriptDisplayFilePath,
      javaScriptFileContent: args.javaScriptFileContent,
      isJavaScriptFileLoading: args.isJavaScriptFileLoading,
      isTypeScriptEditEnabled: args.isTypeScriptEditEnabled,
      setIsTypeScriptEditEnabled: args.setIsTypeScriptEditEnabled,
      canEditSelectedTypeScriptFile: args.canEditSelectedTypeScriptFile,
      saveSelectedTypeScriptFile: args.saveSelectedTypeScriptFile,
      isSavingSelectedTypeScriptFile: args.isSavingSelectedTypeScriptFile,
      setJavaScriptFileContent: args.setJavaScriptFileContent,
      canRunSelectedJavaScriptScript: Boolean(String(args.selectedJavaScriptScript?.id || '').trim()),
      runSelectedJavaScriptScript: args.runSelectedJavaScriptScript,
      canAddSelectedJavaScriptScriptToScript: Boolean(String(args.selectedJavaScriptScript?.id || '').trim()),
      addSelectedJavaScriptScriptToScript: args.addSelectedJavaScriptScriptToScript,
    },
    scriptBuilderProps: {
      actionButtonStyle: args.actionButtonStyle,
      hiddenScrollbarClass: args.hiddenScrollbarClass,
      scripts: args.scripts,
      visibleScripts: args.visibleScripts,
      showSystemTestsOnly: args.showSystemTestsOnly,
      setShowSystemTestsOnly: args.setShowSystemTestsOnly,
      selectedScript: args.selectedScript,
      selectedScriptStepNumber: args.selectedScriptStepNumber,
      scriptNameInput: args.scriptNameInput,
      setScriptNameInput: args.setScriptNameInput,
      selectedScriptId: args.selectedScriptId,
      setSelectedScriptId: args.setSelectedScriptId,
      isScriptOptionsOpen: args.isScriptOptionsOpen,
      setIsScriptOptionsOpen: args.setIsScriptOptionsOpen,
      isNewScriptHovered: args.isNewScriptHovered,
      setIsNewScriptHovered: args.setIsNewScriptHovered,
      isDeleteScriptHovered: args.isDeleteScriptHovered,
      setIsDeleteScriptHovered: args.setIsDeleteScriptHovered,
      newScriptHoverTone: args.newScriptHoverTone,
      setNewScriptHoverTone: args.setNewScriptHoverTone,
      deleteScriptHoverTone: args.deleteScriptHoverTone,
      setDeleteScriptHoverTone: args.setDeleteScriptHoverTone,
      scriptNameValidation: args.scriptNameValidation,
      deleteScriptValidation: args.deleteScriptValidation,
      createNewScript: args.createNewScript,
      duplicateSelectedScript: args.duplicateSelectedScript,
      clearSelectedScript: args.clearSelectedScript,
      handleDeleteScriptClick: args.handleDeleteScriptClick,
      restartScriptAtStart: args.restartScriptAtStart,
      runSelectedScriptStep: args.runSelectedScriptStep,
      runRemainingScriptSteps: args.runRemainingScriptSteps,
      isScriptDebugRunning: args.isScriptDebugRunning,
      moveSelectedScriptStep: args.moveSelectedScriptStep,
      requestDeleteSelectedScriptStep: args.requestDeleteSelectedScriptStep,
      renderScriptStepRow: args.renderScriptStepRow,
    },
    erc20ReadProps: {
      invalidFieldIds: args.invalidFieldIds,
      clearInvalidField: args.clearInvalidField,
      markEditorAsUserEdited: args.markEditorAsUserEdited,
      showOnChainMethods: args.showOnChainMethods,
      showOffChainMethods: args.showOffChainMethods,
      selectedReadMethod: args.selectedReadMethod,
      hardhatAccounts: args.hardhatAccounts,
      hardhatAccountMetadata: args.hardhatAccountMetadata,
      erc20ReadOptions: args.erc20ReadOptions,
      setSelectedReadMethod: (value: string) => args.selectDropdownReadMethod(value as Erc20ReadMethod),
      activeReadLabels: args.activeReadLabels,
      readAddressA: args.readAddressA,
      setReadAddressA: args.setReadAddressA,
      readAddressB: args.readAddressB,
      setReadAddressB: args.setReadAddressB,
      writeTraceEnabled: args.writeTraceEnabled,
      toggleWriteTrace: () => args.setWriteTraceEnabled((prev: boolean) => !prev),
      canRunSelectedReadMethod: args.canRunErc20ReadMethod,
      canAddCurrentMethodToScript: args.hasEditorScriptSelected && args.canRunErc20ReadMethod,
      hasEditorScriptSelected: args.hasEditorScriptSelected,
      isAddToScriptBlockedByNoChanges: args.isUpdateBlockedByNoChanges,
      addToScriptButtonLabel: args.addToScriptButtonLabel,
      missingFieldIds: args.erc20ReadMissingEntries.map((entry: MissingFieldEntry) => entry.id),
      runSelectedReadMethod: args.runSelectedReadMethod,
      addCurrentMethodToScript: args.handleAddCurrentMethodToScript,
    },
    erc20WriteProps: {
      invalidFieldIds: args.invalidFieldIds,
      clearInvalidField: args.clearInvalidField,
      markEditorAsUserEdited: args.markEditorAsUserEdited,
      showOnChainMethods: args.showOnChainMethods,
      showOffChainMethods: args.showOffChainMethods,
      mode: args.mode,
      hardhatAccounts: args.hardhatAccounts,
      hardhatAccountMetadata: args.hardhatAccountMetadata,
      selectedWriteSenderAddress: args.selectedWriteSenderAccount?.address || args.selectedWriteSenderAddress,
      setSelectedWriteSenderAddress: args.setSelectedWriteSenderAddress,
      writeSenderDisplayValue: args.writeSenderDisplayValue,
      writeSenderPrivateKeyDisplay: args.writeSenderPrivateKeyDisplay,
      showWriteSenderPrivateKey: args.showWriteSenderPrivateKey,
      toggleShowWriteSenderPrivateKey: () => args.setShowWriteSenderPrivateKey((prev: boolean) => !prev),
      selectedWriteMethod: args.selectedWriteMethod,
      erc20WriteOptions: args.erc20WriteOptions,
      setSelectedWriteMethod: (value: string) => args.selectDropdownWriteMethod(value as Erc20WriteMethod),
      activeWriteLabels: args.activeWriteLabels,
      writeAddressA: args.writeAddressA,
      setWriteAddressA: args.setWriteAddressA,
      writeAddressB: args.writeAddressB,
      setWriteAddressB: args.setWriteAddressB,
      writeAmountRaw: args.writeAmountRaw,
      setWriteAmountRaw: args.setWriteAmountRaw,
      inputStyle: args.inputStyle,
      writeTraceEnabled: args.writeTraceEnabled,
      toggleWriteTrace: () => args.setWriteTraceEnabled((prev: boolean) => !prev),
      canRunSelectedWriteMethod: args.canRunErc20WriteMethod,
      canAddCurrentMethodToScript: args.hasEditorScriptSelected && args.canRunErc20WriteMethod,
      hasEditorScriptSelected: args.hasEditorScriptSelected,
      isAddToScriptBlockedByNoChanges: args.isUpdateBlockedByNoChanges,
      addToScriptButtonLabel: args.addToScriptButtonLabel,
      missingFieldIds: args.erc20WriteMissingEntries.map((entry: MissingFieldEntry) => entry.id),
      runSelectedWriteMethod: args.runSelectedWriteMethod,
      addCurrentMethodToScript: args.handleAddCurrentMethodToScript,
    },
    spCoinReadProps: {
      invalidFieldIds: args.invalidFieldIds,
      clearInvalidField: args.clearInvalidField,
      markEditorAsUserEdited: args.markEditorAsUserEdited,
      showOnChainMethods: args.showOnChainMethods,
      showOffChainMethods: args.showOffChainMethods,
      hardhatAccounts: args.hardhatAccounts,
      hardhatAccountMetadata: args.hardhatAccountMetadata,
      selectedSpCoinReadMethod: args.normalizedSelectedSpCoinReadMethod,
      setSelectedSpCoinReadMethod: (value: string) => args.selectDropdownSpCoinReadMethod(value as SpCoinReadMethod),
      spCoinWorldReadOptions: args.spCoinWorldReadOptions,
      spCoinSenderReadOptions: args.spCoinSenderReadOptions,
      spCoinAdminReadOptions: args.spCoinAdminReadOptions,
      spCoinCompoundReadOptions: args.spCoinCompoundReadOptions,
      spCoinReadMethodDefs: args.spCoinReadMethodDefs,
      activeSpCoinReadDef: args.activeSpCoinReadDef,
      spReadParams: args.spReadParams,
      setSpReadParams: args.setSpReadParams,
      activeContractAddress: args.contractAddress,
      inputStyle: args.inputStyle,
      writeTraceEnabled: args.writeTraceEnabled,
      toggleWriteTrace: () => args.setWriteTraceEnabled((prev: boolean) => !prev),
      canRunSelectedSpCoinReadMethod: args.canRunSpCoinReadMethod,
      canAddCurrentMethodToScript: args.hasEditorScriptSelected && args.canRunSpCoinReadMethod,
      hasEditorScriptSelected: args.hasEditorScriptSelected,
      isAddToScriptBlockedByNoChanges: args.isUpdateBlockedByNoChanges,
      addToScriptButtonLabel: args.addToScriptButtonLabel,
      missingFieldIds: args.spCoinReadMissingEntries.map((entry: MissingFieldEntry) => entry.id),
      runSelectedSpCoinReadMethod: args.runSelectedSpCoinReadMethod,
      addCurrentMethodToScript: args.handleAddCurrentMethodToScript,
    },
    spCoinWriteProps: {
      invalidFieldIds: args.invalidFieldIds,
      clearInvalidField: args.clearInvalidField,
      markEditorAsUserEdited: args.markEditorAsUserEdited,
      mode: args.mode,
      hardhatAccounts: args.hardhatAccounts,
      hardhatAccountMetadata: args.hardhatAccountMetadata,
      selectedWriteSenderAddress: args.selectedWriteSenderAccount?.address || args.selectedWriteSenderAddress,
      setSelectedWriteSenderAddress: args.setSelectedWriteSenderAddress,
      writeSenderDisplayValue: args.writeSenderDisplayValue,
      writeSenderPrivateKeyDisplay: args.writeSenderPrivateKeyDisplay,
      showWriteSenderPrivateKey: args.showWriteSenderPrivateKey,
      toggleShowWriteSenderPrivateKey: () => args.setShowWriteSenderPrivateKey((prev: boolean) => !prev),
      recipientRateKeyOptions: args.recipientRateKeyOptions,
      agentRateKeyOptions: args.agentRateKeyOptions,
      recipientRateKeyHelpText: args.recipientRateKeyHelpText,
      agentRateKeyHelpText: args.agentRateKeyHelpText,
      recipientRateRange: args.effectiveRecipientRateRange,
      agentRateRange: args.effectiveAgentRateRange,
      selectedSpCoinWriteMethod: args.selectedSpCoinWriteMethod,
      setSelectedSpCoinWriteMethod: (value: string) => args.selectDropdownSpCoinWriteMethod(value as SpCoinWriteMethod),
      spCoinWorldWriteOptions: args.isSpCoinTodoMode ? [] : args.spCoinWorldWriteOptions,
      spCoinSenderWriteOptions: args.isSpCoinTodoMode ? [] : args.spCoinSenderWriteOptions,
      spCoinAdminWriteOptions: args.isSpCoinTodoMode ? [] : args.spCoinAdminWriteOptions,
      spCoinTodoWriteOptions: args.isSpCoinTodoMode ? args.spCoinTodoWriteOptions : [],
      showOnChainMethods: args.showOnChainMethods,
      showOffChainMethods: args.showOffChainMethods,
      spCoinOnChainWriteMethods: args.SPCOIN_ONCHAIN_WRITE_METHODS,
      spCoinOffChainWriteMethods: args.SPCOIN_OFFCHAIN_WRITE_METHODS,
      spCoinWriteMethodDefs: args.spCoinWriteMethodDefs,
      activeSpCoinWriteDef: args.activeSpCoinWriteDef,
      spWriteParams: args.spWriteParams,
      updateSpWriteParamAtIndex: args.updateSpWriteParamAtIndex,
      onOpenBackdatePicker: args.backdateCalendar.openBackdatePickerAt,
      inputStyle: args.inputStyle,
      buttonStyle: args.buttonStyle,
      writeTraceEnabled: args.writeTraceEnabled,
      toggleWriteTrace: () => args.setWriteTraceEnabled((prev: boolean) => !prev),
      canRunSelectedSpCoinWriteMethod: args.canRunSpCoinWriteMethod,
      canAddCurrentMethodToScript: args.hasEditorScriptSelected && args.canRunSpCoinWriteMethod,
      hasEditorScriptSelected: args.hasEditorScriptSelected,
      isAddToScriptBlockedByNoChanges: args.isUpdateBlockedByNoChanges,
      addToScriptButtonLabel: args.addToScriptButtonLabel,
      missingFieldIds: args.spCoinWriteMissingEntries.map((entry: MissingFieldEntry) => entry.id),
      runSelectedSpCoinWriteMethod: args.runSelectedSpCoinWriteMethod,
      addCurrentMethodToScript: args.handleAddCurrentMethodToScript,
      formatDateTimeDisplay: args.formatDateTimeDisplay,
      formatDateInput: args.formatDateInput,
      backdateHours: args.backdateCalendar.backdateHours,
      setBackdateHours: args.backdateCalendar.setBackdateHours,
      backdateMinutes: args.backdateCalendar.backdateMinutes,
      setBackdateMinutes: args.backdateCalendar.setBackdateMinutes,
      backdateSeconds: args.backdateCalendar.backdateSeconds,
      setBackdateSeconds: args.backdateCalendar.setBackdateSeconds,
      setBackdateYears: args.backdateCalendar.setBackdateYears,
      setBackdateMonths: args.backdateCalendar.setBackdateMonths,
      setBackdateDays: args.backdateCalendar.setBackdateDays,
      backdatePopupParamIdx: args.backdateCalendar.backdatePopupParamIdx,
      setBackdatePopupParamIdx: args.backdateCalendar.setBackdatePopupParamIdx,
      shiftCalendarMonth: args.backdateCalendar.shiftCalendarMonth,
      calendarMonthOptions: args.backdateCalendar.calendarMonthOptions,
      calendarViewMonth: args.backdateCalendar.calendarViewMonth,
      setCalendarViewMonth: args.backdateCalendar.setCalendarViewMonth,
      calendarYearOptions: args.backdateCalendar.calendarYearOptions,
      calendarViewYear: args.backdateCalendar.calendarViewYear,
      setCalendarViewYear: args.backdateCalendar.setCalendarViewYear,
      isViewingCurrentMonth: args.backdateCalendar.isViewingCurrentMonth,
      setHoverCalendarWarning: args.backdateCalendar.setHoverCalendarWarning,
      CALENDAR_WEEK_DAYS: args.CALENDAR_WEEK_DAYS,
      calendarDayCells: args.backdateCalendar.calendarDayCells,
      isViewingFutureMonth: args.backdateCalendar.isViewingFutureMonth,
      today: args.backdateCalendar.today,
      selectedBackdateDate: args.backdateCalendar.selectedBackdateDate,
      hoverCalendarWarning: args.backdateCalendar.hoverCalendarWarning,
      maxBackdateYears: args.backdateCalendar.maxBackdateYears,
      backdateYears: args.backdateCalendar.backdateYears,
      backdateMonths: args.backdateCalendar.backdateMonths,
      backdateDays: args.backdateCalendar.backdateDays,
      applyBackdateBy: args.backdateCalendar.applyBackdateBy,
    },
    serializationTestProps: {
      invalidFieldIds: args.invalidFieldIds,
      clearInvalidField: args.clearInvalidField,
      markEditorAsUserEdited: args.markEditorAsUserEdited,
      showOnChainMethods: args.showOnChainMethods,
      showOffChainMethods: args.showOffChainMethods,
      hardhatAccounts: args.hardhatAccounts,
      hardhatAccountMetadata: args.hardhatAccountMetadata,
      selectedSerializationTestMethod: args.selectedSerializationTestMethod,
      setSelectedSerializationTestMethod: (value: string) =>
        args.selectDropdownSerializationTestMethod(value as SerializationTestMethod),
      serializationTestOptions: args.effectiveSerializationTestOptions,
      serializationTestMethodDefs: args.serializationTestMethodDefs,
      activeSerializationTestDef: args.effectiveSerializationTestDef,
      serializationTestParams: args.serializationTestParams,
      setSerializationTestParams: args.setSerializationTestParams,
      inputStyle: args.inputStyle,
      canRunSelectedSerializationTestMethod: args.canRunSerializationTestMethod,
      canAddCurrentMethodToScript: args.hasEditorScriptSelected && args.canRunSerializationTestMethod,
      hasEditorScriptSelected: args.hasEditorScriptSelected,
      isAddToScriptBlockedByNoChanges: args.isUpdateBlockedByNoChanges,
      addToScriptButtonLabel: args.addToScriptButtonLabel,
      missingFieldIds: args.serializationTestMissingEntries.map((entry: MissingFieldEntry) => entry.id),
      runSelectedSerializationTestMethod: args.runSelectedSerializationTestMethod,
      addCurrentMethodToScript: args.handleAddCurrentMethodToScript,
    },
  };
}
