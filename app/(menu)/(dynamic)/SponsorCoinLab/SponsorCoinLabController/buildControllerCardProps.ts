import type React from 'react';
import type { ConnectionMode } from '../scriptBuilder/types';
import type { FormattedPanelView, OutputPanelMode, SponsorCoinAccountRole } from './types';

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
type SetValue<T> = (value: T) => void;
type SignerMetadataLike = Partial<{ logoURL?: string; name?: string; symbol?: string }>;
type HighlightedLineEntry = { line: string; active: boolean };
type HardhatAccountLike = { address: string; privateKey?: string };
type HardhatAccountMetadataLike = Record<string, { name?: string; symbol?: string; logoURL: string }>;
type SponsorCoinValidation = { tone: 'neutral' | 'invalid' | 'valid'; message: string };
type SponsorCoinVersionEntryLike = { name?: string };
type SponsorCoinVersionChoice = { id: string; version: string };

export type BuildControllerCardPropsArgs = {
  inputStyle: string;
  accountActionLabelClassName: (tone: 'neutral' | 'invalid' | 'valid') => string;
  hardhatAccounts: HardhatAccountLike[];
  hardhatAccountMetadata: HardhatAccountMetadataLike;
  showSignerAccountDetails: boolean;
  setShowSignerAccountDetails: StateSetter<boolean>;
  displayedSpCoinOwnerAddress: string;
  selectedWriteSenderAddress: string;
  setSelectedWriteSenderAddress: SetValue<string>;
  writeSenderDisplayValue: string;
  displayedSpCoinOwnerMetadata?: SignerMetadataLike;
  mode: ConnectionMode;
  selectedVersionSignerKey: string;
  selectedSponsorCoinAccountRole: SponsorCoinAccountRole;
  setSelectedSponsorCoinAccountRole: SetValue<SponsorCoinAccountRole>;
  defaultSponsorKey: string;
  setDefaultSponsorKey: SetValue<string>;
  defaultRecipientKey: string;
  setDefaultRecipientKey: SetValue<string>;
  defaultAgentKey: string;
  setDefaultAgentKey: SetValue<string>;
  managedRoleAccountAddress: string;
  setManagedRoleAccountAddress: SetValue<string>;
  managedRecipientKey: string;
  setManagedRecipientKey: SetValue<string>;
  managedRecipientRateKey: string;
  setManagedRecipientRateKey: SetValue<string>;
  managedRecipientRateKeyOptions: string[];
  managedRecipientRateKeyHelpText: string;
  sponsorCoinAccountManagementValidation: SponsorCoinValidation;
  sponsorCoinAccountManagementStatus: string;
  handleSponsorCoinAccountAction: (action: 'add' | 'delete') => Promise<void>;
  selectedSponsorCoinLogoURL: string;
  selectedSponsorCoinVersionEntry?: SponsorCoinVersionEntryLike;
  selectedSponsorCoinVersion: string;
  setSelectedSponsorCoinVersion: SetValue<string>;
  sponsorCoinVersionChoices: SponsorCoinVersionChoice[];
  canIncrementSponsorCoinVersion: boolean;
  canDecrementSponsorCoinVersion: boolean;
  adjustSponsorCoinVersion: (direction: 1 | -1) => void;
  displayedVersionHardhatAccountIndex: number;
  selectedVersionSymbolWidthCh: number;
  selectedVersionSymbol: string;
  contractAddress: string;
  isRemovingContractFromApp: boolean;
  requestRemoveContractFromApp: () => void;
  setMode: SetValue<ConnectionMode>;
  allowContractNetworkModeSelection: boolean;
  shouldPromptHardhatBaseConnect: boolean;
  connectHardhatBaseFromNetworkLabel: () => Promise<void>;
  activeContractNetworkName: string;
  activeContractChainIdDisplayValue: string;
  activeContractChainIdDisplayWidthCh: number;
  showHardhatConnectionInputs: boolean;
  setShowHardhatConnectionInputs: StateSetter<boolean>;
  cog_png: unknown;
  rpcUrl: string;
  setRpcUrl: StateSetter<string>;
  effectiveConnectedAddress: string;
  outputPanelMode: OutputPanelMode;
  setOutputPanelMode: StateSetter<OutputPanelMode>;
  refreshActiveOutput: () => void;
  buttonStyle: string;
  copyTextToClipboard: (label: string, value: string) => Promise<void>;
  setLogs: StateSetter<string[]>;
  setStatus: StateSetter<string>;
  setTreeOutputDisplay: StateSetter<string>;
  setFormattedOutputDisplay: StateSetter<string>;
  formattedPanelView: FormattedPanelView;
  setFormattedPanelView: StateSetter<FormattedPanelView>;
  formattedJsonViewEnabled: boolean;
  setFormattedJsonViewEnabled: StateSetter<boolean>;
  showTreeAccountDetails: boolean;
  setShowTreeAccountDetails: StateSetter<boolean>;
  showAllTreeRecords: boolean;
  setShowAllTreeRecords: StateSetter<boolean>;
  logs: string[];
  treeOutputDisplay: string;
  status: string;
  formattedOutputDisplay: string;
  selectedScriptDisplay: string;
  selectedScriptStepNumber: number | null;
  selectedScriptStep?: { hasMissingRequiredParams?: boolean; step?: number } | null;
  scriptStepExecutionErrors: Record<number, unknown>;
  highlightedFormattedOutputLines: HighlightedLineEntry[] | null;
  highlightedFormattedResultLines: HighlightedLineEntry[] | null;
  hiddenScrollbarClass: string;
  runHeaderRead: () => Promise<void>;
  runAccountListRead: () => Promise<void>;
  runTreeAccountsRead: () => Promise<void>;
  runTreeDump: (accountOverride?: string) => Promise<void>;
  treeAccountOptions: string[];
  selectedTreeAccount: string;
  setSelectedTreeAccount: SetValue<string>;
  treeAccountRefreshToken: number;
  requestRefreshSelectedTreeAccount: () => void;
  openAccountFromAddress: (account: string, pathHint?: string) => Promise<void>;
};

export function buildControllerCardProps(args: BuildControllerCardPropsArgs) {
  const networkSignerCardProps = {
    inputStyle: args.inputStyle,
    details: {
      showSignerAccountDetails: args.showSignerAccountDetails,
      setShowSignerAccountDetails: args.setShowSignerAccountDetails,
      displayedSignerAccountAddress: args.displayedSpCoinOwnerAddress,
      selectedWriteSenderAddress: args.selectedWriteSenderAddress,
      setSelectedWriteSenderAddress: args.setSelectedWriteSenderAddress,
      writeSenderDisplayValue: args.writeSenderDisplayValue,
      displayedSignerAccountMetadata: args.displayedSpCoinOwnerMetadata,
      mode: args.mode,
      selectedVersionSignerKey: args.selectedVersionSignerKey,
    },
    accountManagement: {
      accountActionLabelClassName: args.accountActionLabelClassName,
      hardhatAccounts: args.hardhatAccounts,
      hardhatAccountMetadata: args.hardhatAccountMetadata,
      selectedSponsorCoinAccountRole: args.selectedSponsorCoinAccountRole,
      setSelectedSponsorCoinAccountRole: args.setSelectedSponsorCoinAccountRole,
      defaultSponsorKey: args.defaultSponsorKey,
      setDefaultSponsorKey: args.setDefaultSponsorKey,
      defaultRecipientKey: args.defaultRecipientKey,
      setDefaultRecipientKey: args.setDefaultRecipientKey,
      defaultAgentKey: args.defaultAgentKey,
      setDefaultAgentKey: args.setDefaultAgentKey,
      managedRoleAccountAddress: args.managedRoleAccountAddress,
      setManagedRoleAccountAddress: args.setManagedRoleAccountAddress,
      managedRecipientKey: args.managedRecipientKey,
      setManagedRecipientKey: args.setManagedRecipientKey,
      managedRecipientRateKey: args.managedRecipientRateKey,
      setManagedRecipientRateKey: args.setManagedRecipientRateKey,
      managedRecipientRateKeyOptions: args.managedRecipientRateKeyOptions,
      managedRecipientRateKeyHelpText: args.managedRecipientRateKeyHelpText,
      sponsorCoinAccountManagementValidation: args.sponsorCoinAccountManagementValidation,
      sponsorCoinAccountManagementStatus: args.sponsorCoinAccountManagementStatus,
      onExecuteAccountAction: args.handleSponsorCoinAccountAction,
    },
  };

  const contractNetworkCardProps = {
    inputStyle: args.inputStyle,
    logo: {
      selectedSponsorCoinLogoURL: args.selectedSponsorCoinLogoURL,
      selectedSponsorCoinVersionEntry: args.selectedSponsorCoinVersionEntry,
    },
    version: {
      selectedSponsorCoinVersion: args.selectedSponsorCoinVersion,
      setSelectedSponsorCoinVersion: args.setSelectedSponsorCoinVersion,
      sponsorCoinVersionChoices: args.sponsorCoinVersionChoices,
      canIncrementSponsorCoinVersion: args.canIncrementSponsorCoinVersion,
      canDecrementSponsorCoinVersion: args.canDecrementSponsorCoinVersion,
      adjustSponsorCoinVersion: args.adjustSponsorCoinVersion,
      selectedVersionSignerKey: args.selectedVersionSignerKey,
      displayedVersionHardhatAccountIndex: args.displayedVersionHardhatAccountIndex,
      selectedVersionSymbolWidthCh: args.selectedVersionSymbolWidthCh,
      selectedVersionSymbol: args.selectedVersionSymbol,
    },
    contract: {
      contractAddress: args.contractAddress,
      selectedSponsorCoinVersionEntry: args.selectedSponsorCoinVersionEntry,
      isRemovingFromApp: args.isRemovingContractFromApp,
      onRemoveFromApp: args.requestRemoveContractFromApp,
    },
    network: {
      mode: args.mode,
      setMode: args.setMode,
      allowModeSelection: args.allowContractNetworkModeSelection,
      shouldPromptHardhatBaseConnect: args.shouldPromptHardhatBaseConnect,
      connectHardhatBaseFromNetworkLabel: args.connectHardhatBaseFromNetworkLabel,
      activeNetworkName: args.activeContractNetworkName,
      chainIdDisplayValue: args.activeContractChainIdDisplayValue,
      chainIdDisplayWidthCh: args.activeContractChainIdDisplayWidthCh,
      showHardhatConnectionInputs: args.showHardhatConnectionInputs,
      setShowHardhatConnectionInputs: args.setShowHardhatConnectionInputs,
      cogSrc: args.cog_png,
      rpcUrl: args.rpcUrl,
      setRpcUrl: args.setRpcUrl,
      effectiveConnectedAddress: args.effectiveConnectedAddress,
    },
  };

  const outputResultsCardProps = {
    inputStyle: args.inputStyle,
    controls: {
      outputPanelMode: args.outputPanelMode,
      setOutputPanelMode: args.setOutputPanelMode,
      refreshActiveOutput: args.refreshActiveOutput,
      buttonStyle: args.buttonStyle,
      copyTextToClipboard: args.copyTextToClipboard,
      setLogs: args.setLogs,
      setStatus: args.setStatus,
      setTreeOutputDisplay: args.setTreeOutputDisplay,
      setFormattedOutputDisplay: args.setFormattedOutputDisplay,
      formattedPanelView: args.formattedPanelView,
      setFormattedPanelView: args.setFormattedPanelView,
      formattedJsonViewEnabled: args.formattedJsonViewEnabled,
      setFormattedJsonViewEnabled: args.setFormattedJsonViewEnabled,
      showTreeAccountDetails: args.showTreeAccountDetails,
      setShowTreeAccountDetails: args.setShowTreeAccountDetails,
      showAllTreeRecords: args.showAllTreeRecords,
      setShowAllTreeRecords: args.setShowAllTreeRecords,
    },
    content: {
      logs: args.logs,
      treeOutputDisplay: args.treeOutputDisplay,
      status: args.status,
      formattedOutputDisplay: args.formattedOutputDisplay,
      scriptDisplay: args.selectedScriptDisplay,
      selectedScriptStepNumber: args.selectedScriptStepNumber,
      selectedScriptStepHasMissingRequiredParams: Boolean(args.selectedScriptStep?.hasMissingRequiredParams),
      selectedScriptStepHasExecutionError: Boolean(
        args.selectedScriptStep?.step != null && args.scriptStepExecutionErrors[args.selectedScriptStep.step],
      ),
      highlightedFormattedOutputLines:
        args.formattedPanelView === 'script'
          ? args.highlightedFormattedOutputLines
          : args.highlightedFormattedResultLines,
      hiddenScrollbarClass: args.hiddenScrollbarClass,
    },
    treeActions: {
      runHeaderRead: args.runHeaderRead,
      runAccountListRead: args.runAccountListRead,
      runTreeAccountsRead: args.runTreeAccountsRead,
      runTreeDump: args.runTreeDump,
      treeAccountOptions: args.treeAccountOptions,
      selectedTreeAccount: args.selectedTreeAccount,
      setSelectedTreeAccount: args.setSelectedTreeAccount,
      treeAccountRefreshToken: args.treeAccountRefreshToken,
      requestRefreshSelectedTreeAccount: args.requestRefreshSelectedTreeAccount,
      openAccountFromAddress: args.openAccountFromAddress,
    },
  };

  return {
    networkSignerCardProps,
    contractNetworkCardProps,
    outputResultsCardProps,
  };
}
