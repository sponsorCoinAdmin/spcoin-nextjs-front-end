'use client';

import type React from 'react';
import type { BuildControllerCardPropsArgs } from '../buildControllerCardProps';
import { buildControllerCardProps } from '../buildControllerCardProps';
import type { BuildMethodsPanelCardPropsArgs } from '../buildMethodsPanelCardProps';
import { buildMethodsPanelCardProps } from '../buildMethodsPanelCardProps';
import type { LabCardId, MethodDefMap } from '../types';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

type UseControllerViewPropsArgs = BuildMethodsPanelCardPropsArgs &
  BuildControllerCardPropsArgs & {
    expandedCard: LabCardId | null;
    showCard: (cardId: LabCardId) => boolean;
    getCardClassName: (cardId: LabCardId, defaultClassName?: string) => string;
    toggleExpandedCard: (cardId: LabCardId) => void;
    methodsCardRef: React.RefObject<HTMLElement | null>;
    isDesktopSharedLayout: boolean;
    sharedMethodsRowHeight: number | null;
    validationPopupFields: string[];
    validationPopupTitle: string;
    validationPopupMessage: string;
    validationPopupConfirmLabel: string;
    validationPopupCancelLabel: string;
    clearValidationPopup: () => void;
    hasValidationConfirmAction: boolean;
    handleValidationConfirm: () => void;
    isDeleteStepPopupOpen: boolean;
    selectedScriptStep?: { name?: string; hasMissingRequiredParams?: boolean; step?: number } | null;
    setIsDeleteStepPopupOpen: StateSetter<boolean>;
    handleConfirmDeleteSelectedScriptStep: () => void;
    isDiscardChangesPopupOpen: boolean;
    discardChangesMessage: string;
    clearDiscardChangesPopup: () => void;
    handleDiscardConfirm: () => void;
    runningMethodPopup: {
      isOpen: boolean;
      methodName: string;
      startedAt: number;
      isCancelling: boolean;
      onCancel: () => void;
      onAcknowledge: () => void;
    };
  };

export function useControllerViewProps(args: UseControllerViewPropsArgs) {
  const methodsPanelCardProps = buildMethodsPanelCardProps({
    methodPanelTitle: args.methodPanelTitle,
    isEditingScriptMethod: args.isEditingScriptMethod,
    scriptEditorKind: args.scriptEditorKind,
    setScriptEditorKind: args.setScriptEditorKind,
    methodPanelMode: args.methodPanelMode,
    activeMethodPanelTab: args.activeMethodPanelTab,
    selectMethodPanelTab: args.selectMethodPanelTab,
    selectMappedJsonMethod: args.selectMappedJsonMethod,
    selectMethodByKind: args.selectMethodByKind,
    writeTraceEnabled: args.writeTraceEnabled,
    setWriteTraceEnabled: args.setWriteTraceEnabled,
    showOnChainMethods: args.showOnChainMethods,
    setShowOnChainMethods: args.setShowOnChainMethods,
    showOffChainMethods: args.showOffChainMethods,
    setShowOffChainMethods: args.setShowOffChainMethods,
    initialContractDirectoryOptions: args.initialContractDirectoryOptions,
    hiddenScrollbarClass: args.hiddenScrollbarClass,
    visibleJavaScriptScripts: args.visibleJavaScriptScripts,
    selectedJavaScriptScriptId: args.selectedJavaScriptScriptId,
    setSelectedJavaScriptScriptId: args.setSelectedJavaScriptScriptId,
    selectedJavaScriptScript: args.selectedJavaScriptScript,
    selectedJavaScriptDisplayFilePath: args.selectedJavaScriptDisplayFilePath,
    javaScriptFileContent: args.javaScriptFileContent,
    isJavaScriptFileLoading: args.isJavaScriptFileLoading,
    isTypeScriptEditEnabled: args.isTypeScriptEditEnabled,
    setIsTypeScriptEditEnabled: args.setIsTypeScriptEditEnabled,
    canEditSelectedTypeScriptFile: args.canEditSelectedTypeScriptFile,
    saveSelectedTypeScriptFile: args.saveSelectedTypeScriptFile,
    isSavingSelectedTypeScriptFile: args.isSavingSelectedTypeScriptFile,
    setJavaScriptFileContent: args.setJavaScriptFileContent,
    runSelectedJavaScriptScript: args.runSelectedJavaScriptScript,
    addSelectedJavaScriptScriptToScript: args.addSelectedJavaScriptScriptToScript,
    actionButtonStyle: args.actionButtonStyle,
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
    moveScriptStepToPosition: args.moveScriptStepToPosition,
    requestDeleteSelectedScriptStep: args.requestDeleteSelectedScriptStep,
    renderScriptStepRow: args.renderScriptStepRow,
    invalidFieldIds: args.invalidFieldIds,
    clearInvalidField: args.clearInvalidField,
    markEditorAsUserEdited: args.markEditorAsUserEdited,
    selectedReadMethod: args.selectedReadMethod,
    erc20ReadOptions: args.erc20ReadOptions,
    selectDropdownReadMethod: args.selectDropdownReadMethod,
    activeReadLabels: args.activeReadLabels,
    readAddressA: args.readAddressA,
    setReadAddressA: args.setReadAddressA,
    readAddressB: args.readAddressB,
    setReadAddressB: args.setReadAddressB,
    canRunErc20ReadMethod: args.canRunErc20ReadMethod,
    hasEditorScriptSelected: args.hasEditorScriptSelected,
    isUpdateBlockedByNoChanges: args.isUpdateBlockedByNoChanges,
    addToScriptButtonLabel: args.addToScriptButtonLabel,
    erc20ReadMissingEntries: args.erc20ReadMissingEntries,
    runSelectedReadMethod: args.runSelectedReadMethod,
    handleAddCurrentMethodToScript: args.handleAddCurrentMethodToScript,
    mode: args.mode,
    selectedWriteSenderAccount: args.selectedWriteSenderAccount,
    selectedWriteSenderAddress: args.selectedWriteSenderAddress,
    setSelectedWriteSenderAddress: args.setSelectedWriteSenderAddress,
    writeSenderDisplayValue: args.writeSenderDisplayValue,
    writeSenderPrivateKeyDisplay: args.writeSenderPrivateKeyDisplay,
    showWriteSenderPrivateKey: args.showWriteSenderPrivateKey,
    setShowWriteSenderPrivateKey: args.setShowWriteSenderPrivateKey,
    selectedWriteMethod: args.selectedWriteMethod,
    erc20WriteOptions: args.erc20WriteOptions,
    selectDropdownWriteMethod: args.selectDropdownWriteMethod,
    activeWriteLabels: args.activeWriteLabels,
    writeAddressA: args.writeAddressA,
    setWriteAddressA: args.setWriteAddressA,
    writeAddressB: args.writeAddressB,
    setWriteAddressB: args.setWriteAddressB,
    writeAmountRaw: args.writeAmountRaw,
    setWriteAmountRaw: args.setWriteAmountRaw,
    canRunErc20WriteMethod: args.canRunErc20WriteMethod,
    erc20WriteMissingEntries: args.erc20WriteMissingEntries,
    runSelectedWriteMethod: args.runSelectedWriteMethod,
    normalizedSelectedSpCoinReadMethod: args.normalizedSelectedSpCoinReadMethod,
    selectDropdownSpCoinReadMethod: args.selectDropdownSpCoinReadMethod,
    spCoinWorldReadOptions: args.spCoinWorldReadOptions,
    spCoinSenderReadOptions: args.spCoinSenderReadOptions,
    spCoinAdminReadOptions: args.spCoinAdminReadOptions,
    spCoinCompoundReadOptions: args.spCoinCompoundReadOptions,
    spCoinReadMethodDefs: args.spCoinReadMethodDefs as MethodDefMap,
    activeSpCoinReadDef: args.activeSpCoinReadDef,
    spReadParams: args.spReadParams,
    setSpReadParams: args.setSpReadParams,
    contractAddress: args.contractAddress,
    canRunSpCoinReadMethod: args.canRunSpCoinReadMethod,
    spCoinReadMissingEntries: args.spCoinReadMissingEntries,
    runSelectedSpCoinReadMethod: args.runSelectedSpCoinReadMethod,
    hardhatAccounts: args.hardhatAccounts,
    hardhatAccountMetadata: args.hardhatAccountMetadata,
    recipientRateKeyOptions: args.recipientRateKeyOptions,
    agentRateKeyOptions: args.agentRateKeyOptions,
    recipientRateKeyHelpText: args.recipientRateKeyHelpText,
    agentRateKeyHelpText: args.agentRateKeyHelpText,
    effectiveRecipientRateRange: args.effectiveRecipientRateRange,
    effectiveAgentRateRange: args.effectiveAgentRateRange,
    selectedSpCoinWriteMethod: args.selectedSpCoinWriteMethod,
    selectDropdownSpCoinWriteMethod: args.selectDropdownSpCoinWriteMethod,
    isSpCoinTodoMode: args.isSpCoinTodoMode,
    spCoinWorldWriteOptions: args.spCoinWorldWriteOptions,
    spCoinSenderWriteOptions: args.spCoinSenderWriteOptions,
    spCoinAdminWriteOptions: args.spCoinAdminWriteOptions,
    spCoinTodoWriteOptions: args.spCoinTodoWriteOptions,
    SPCOIN_ONCHAIN_WRITE_METHODS: args.SPCOIN_ONCHAIN_WRITE_METHODS,
    SPCOIN_OFFCHAIN_WRITE_METHODS: args.SPCOIN_OFFCHAIN_WRITE_METHODS,
    spCoinWriteMethodDefs: args.spCoinWriteMethodDefs as MethodDefMap,
    activeSpCoinWriteDef: args.activeSpCoinWriteDef,
    spWriteParams: args.spWriteParams,
    updateSpWriteParamAtIndex: args.updateSpWriteParamAtIndex,
    buttonStyle: args.buttonStyle,
    canRunSpCoinWriteMethod: args.canRunSpCoinWriteMethod,
    spCoinWriteMissingEntries: args.spCoinWriteMissingEntries,
    runSelectedSpCoinWriteMethod: args.runSelectedSpCoinWriteMethod,
    formatDateTimeDisplay: args.formatDateTimeDisplay,
    formatDateInput: args.formatDateInput,
    backdateCalendar: args.backdateCalendar,
    CALENDAR_WEEK_DAYS: args.CALENDAR_WEEK_DAYS,
    selectedSerializationTestMethod: args.selectedSerializationTestMethod,
    selectDropdownSerializationTestMethod: args.selectDropdownSerializationTestMethod,
    effectiveSerializationTestOptions: args.effectiveSerializationTestOptions,
    serializationTestMethodDefs: args.serializationTestMethodDefs as MethodDefMap,
    effectiveSerializationTestDef: args.effectiveSerializationTestDef,
    serializationTestParams: args.serializationTestParams,
    setSerializationTestParams: args.setSerializationTestParams,
    canRunSerializationTestMethod: args.canRunSerializationTestMethod,
    serializationTestMissingEntries: args.serializationTestMissingEntries,
    runSelectedSerializationTestMethod: args.runSelectedSerializationTestMethod,
    inputStyle: args.inputStyle,
  });

  const {
    networkSignerCardProps,
    contractNetworkCardProps,
    outputResultsCardProps,
  } = buildControllerCardProps(args);

  return {
    expandedCard: args.expandedCard,
    showCard: args.showCard,
    getCardClassName: args.getCardClassName,
    toggleExpandedCard: args.toggleExpandedCard,
    methodsCardRef: args.methodsCardRef,
    isDesktopSharedLayout: args.isDesktopSharedLayout,
    sharedMethodsRowHeight: args.sharedMethodsRowHeight,
    networkSignerCardProps,
    contractNetworkCardProps,
    methodsPanelCardProps,
    outputResultsCardProps,
    validationPopupFields: args.validationPopupFields,
    validationPopupTitle: args.validationPopupTitle,
    validationPopupMessage: args.validationPopupMessage,
    buttonStyle: args.buttonStyle,
    validationPopupConfirmLabel: args.validationPopupConfirmLabel,
    validationPopupCancelLabel: args.validationPopupCancelLabel,
    clearValidationPopup: args.clearValidationPopup,
    hasValidationConfirmAction: args.hasValidationConfirmAction,
    handleValidationConfirm: args.handleValidationConfirm,
    isDeleteStepPopupOpen: args.isDeleteStepPopupOpen,
    selectedScriptStep: args.selectedScriptStep,
    setIsDeleteStepPopupOpen: args.setIsDeleteStepPopupOpen,
    handleConfirmDeleteSelectedScriptStep: args.handleConfirmDeleteSelectedScriptStep,
    isDiscardChangesPopupOpen: args.isDiscardChangesPopupOpen,
    discardChangesMessage: args.discardChangesMessage,
    clearDiscardChangesPopup: args.clearDiscardChangesPopup,
    handleDiscardConfirm: args.handleDiscardConfirm,
    runningMethodPopup: args.runningMethodPopup,
  };
}
