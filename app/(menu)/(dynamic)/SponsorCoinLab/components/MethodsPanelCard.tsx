import React, { type ComponentProps, type MutableRefObject } from 'react';
import type { MethodPanelMode, ScriptEditorKind } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';
import ScriptBuilderCard from './ScriptBuilderCard';
import Erc20ReadController from './Erc20ReadController';
import Erc20WriteController from './Erc20WriteController';
import SpCoinReadController from './SpCoinReadController';
import SpCoinWriteController from './SpCoinWriteController';
import SerializationTestController from './SerializationTestController';
import ValidationPopup from './ValidationPopup';

type MethodPanelTab = MethodPanelMode | 'todos' | 'erc20' | 'admin_utils';

const ERC20_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  allowance: 'erc20.ts',
  balanceOf: 'erc20.ts',
  creationTime: 'creationTime.ts',
  decimals: 'erc20.ts',
  name: 'erc20.ts',
  symbol: 'erc20.ts',
  totalSupply: 'erc20.ts',
  approve: 'erc20.ts',
  transfer: 'transfer.ts',
  transferFrom: 'erc20.ts',
};

const SPCOIN_READ_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  creationTime: 'creationTime.ts',
  getVersion: 'getVersion.ts',
};

const SPCOIN_WRITE_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  addRecipient: 'add.ts',
  addAgent: 'add.ts',
  addRecipientTransaction: 'add.ts',
  addAgentTransaction: 'add.ts',
  addBackDatedRecipientTransaction: 'add.ts',
  addBackDatedAgentTransaction: 'add.ts',
  backDateRecipientTransactionDate: 'add.ts',
  backDateAgentTransactionDate: 'add.ts',
  addRecipients: 'addRecipients.ts',
  addAgents: 'addAgents.ts',
  deleteAccountTree: 'delete.ts',
  deleteRecipient: 'delete.ts',
  deleteRecipientRate: 'delete.ts',
  deleteAgent: 'delete.ts',
  deleteAgentNode: 'delete.ts',
  deleteAgentRate: 'delete.ts',
  deleteRecipientSponsorships: 'delete.ts',
  deleteRecipientSponsorshipTree: 'delete.ts',
  deleteAgentSponsorships: 'delete.ts',
  deleteRecipientSponsorRate: 'delete.ts',
  deleteRecipientTransaction: 'delete.ts',
  deleteAccountRecord: 'delete.ts',
  deleteAccountRecords: 'delete.ts',
  unSponsorAgent: 'delete.ts',
  updateAccountStakingRewards: 'rewards.ts',
  updateMasterStakingRewards: 'rewards.ts',
  setInflationRate: 'add.ts',
  setVersion: 'add.ts',
  setRecipientRateRange: 'add.ts',
  setAgentRateRange: 'add.ts',
  setLowerRecipientRate: 'setLowerRecipientRate.ts',
  setUpperRecipientRate: 'setUpperRecipientRate.ts',
  setLowerAgentRate: 'setLowerAgentRate.ts',
  setUpperAgentRate: 'setUpperAgentRate.ts',
};

const TODO_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  addRecipients: 'addRecipients.ts',
  addAgents: 'addAgents.ts',
  deleteAccountTree: 'delete.ts',
};

const UTILS_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  compareSpCoinContractSize: 'compareSpCoinContractSize.ts',
  hhFundAccounts: 'hhFundAccounts.ts',
  deleteMasterSponsorships: 'delete.ts',
  deleteAccountTree: 'delete.ts',
  deleteRecipient: 'delete.ts',
  deleteRecipientRate: 'delete.ts',
  deleteAgent: 'delete.ts',
  deleteAgentRate: 'delete.ts',
  deleteRecipientSponsorships: 'delete.ts',
  deleteAgentSponsorships: 'delete.ts',
};

function normalizeMethodScriptLookup(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.ts$/i, '');
}

function resolveTypeScriptTargetFile(tab: MethodPanelTab, methodName: string) {
  if (!methodName) return '';
  if (tab === 'erc20') return ERC20_TYPESCRIPT_TARGET_BY_METHOD[methodName] || `${methodName}.ts`;
  if (tab === 'spcoin_rread') return SPCOIN_READ_TYPESCRIPT_TARGET_BY_METHOD[methodName] || `${methodName}.ts`;
  if (tab === 'spcoin_write') return SPCOIN_WRITE_TYPESCRIPT_TARGET_BY_METHOD[methodName] || `${methodName}.ts`;
  if (tab === 'todos') return TODO_TYPESCRIPT_TARGET_BY_METHOD[methodName] || SPCOIN_WRITE_TYPESCRIPT_TARGET_BY_METHOD[methodName] || `${methodName}.ts`;
  if (tab === 'admin_utils') return UTILS_TYPESCRIPT_TARGET_BY_METHOD[methodName] || `${methodName}.ts`;
  return `${methodName}.ts`;
}

function sortMethodNames(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function dedupeMethodNamesByLabel(values: string[], getLabel: (name: string) => string) {
  const seenLabels = new Set<string>();
  return values.filter((name) => {
    const label = getLabel(name);
    if (seenLabels.has(label)) return false;
    seenLabels.add(label);
    return true;
  });
}

type Props = {
  articleClassName: string;
  methodsCardRef: MutableRefObject<HTMLElement | null>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  methodPanelTitle: string;
  scriptEditorKind: ScriptEditorKind;
  setScriptEditorKind: React.Dispatch<React.SetStateAction<ScriptEditorKind>>;
  methodPanelMode: MethodPanelMode;
  activeMethodPanelTab: MethodPanelTab;
  selectMethodPanelTab: (value: MethodPanelTab) => void;
  selectMappedJsonMethod: (value: string) => void;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  showOnChainMethods: boolean;
  setShowOnChainMethods: (value: boolean) => void;
  showOffChainMethods: boolean;
  setShowOffChainMethods: (value: boolean) => void;
  javaScriptEditorProps: {
    hiddenScrollbarClass: string;
    visibleJavaScriptScripts: Array<{ id: string; name: string }>;
    selectedJavaScriptScriptId: string;
    setSelectedJavaScriptScriptId: (value: string) => void;
    selectedScriptName: string;
    selectedFilePath: string;
    javaScriptFileContent: string;
    isJavaScriptFileLoading: boolean;
    isTypeScriptEditEnabled: boolean;
    setIsTypeScriptEditEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    canEditSelectedTypeScriptFile: boolean;
    saveSelectedTypeScriptFile: () => void;
    isSavingSelectedTypeScriptFile: boolean;
    setJavaScriptFileContent: (value: string) => void;
    canRunSelectedJavaScriptScript: boolean;
    runSelectedJavaScriptScript: () => void;
    canAddSelectedJavaScriptScriptToScript: boolean;
    addSelectedJavaScriptScriptToScript: () => void;
  };
  scriptBuilderProps: ComponentProps<typeof ScriptBuilderCard>;
  erc20ReadProps: ComponentProps<typeof Erc20ReadController>;
  erc20WriteProps: ComponentProps<typeof Erc20WriteController>;
  spCoinReadProps: ComponentProps<typeof SpCoinReadController>;
  spCoinWriteProps: ComponentProps<typeof SpCoinWriteController>;
  serializationTestProps: ComponentProps<typeof SerializationTestController>;
};

export default function MethodsPanelCard({
  articleClassName,
  methodsCardRef,
  isExpanded,
  onToggleExpand,
  methodPanelTitle,
  scriptEditorKind,
  setScriptEditorKind,
  methodPanelMode,
  activeMethodPanelTab,
  selectMethodPanelTab,
  selectMappedJsonMethod,
  writeTraceEnabled,
  toggleWriteTrace,
  showOnChainMethods,
  setShowOnChainMethods,
  showOffChainMethods,
  setShowOffChainMethods,
  javaScriptEditorProps,
  scriptBuilderProps,
  erc20ReadProps,
  erc20WriteProps,
  spCoinReadProps,
  spCoinWriteProps,
  serializationTestProps,
}: Props) {
  const showAllCardSectionsForVisualTest = false;
  const showAllMethodPanelsForVisualTest = false;
  const methodPanelGroupName = React.useId();
  const [isHoveringTypeScriptSaveBlocked, setIsHoveringTypeScriptSaveBlocked] = React.useState(false);
  const [isTypeScriptSavePopupOpen, setIsTypeScriptSavePopupOpen] = React.useState(false);
  const [isMethodPanelLoading, setIsMethodPanelLoading] = React.useState(false);
  const isJavaScriptScriptMode = scriptEditorKind === 'javascript';
  const isJsonScriptMode = scriptEditorKind === 'json';
  const isErc20Mode = methodPanelMode === 'ecr20_read' || methodPanelMode === 'erc20_write';
  const methodPanelOptions: Array<[MethodPanelTab, string]> = [
    ['erc20', 'ERC20'],
    ['spcoin_rread', 'SpCoin Read'],
    ['spcoin_write', 'SpCoin Write'],
    ['admin_utils', 'Admin Utils'],
    ['todos', 'ToDos'],
  ];
  const visibleErc20ReadOptions = React.useMemo(
    () => sortMethodNames(erc20ReadProps.showOnChainMethods ? erc20ReadProps.erc20ReadOptions : []),
    [erc20ReadProps.erc20ReadOptions, erc20ReadProps.showOnChainMethods],
  );
  const visibleErc20WriteOptions = React.useMemo(
    () => sortMethodNames(erc20WriteProps.showOnChainMethods ? erc20WriteProps.erc20WriteOptions : []),
    [erc20WriteProps.erc20WriteOptions, erc20WriteProps.showOnChainMethods],
  );
  const hasVisibleErc20Methods = visibleErc20ReadOptions.length > 0 || visibleErc20WriteOptions.length > 0;
  const combinedErc20MethodValue =
    methodPanelMode === 'erc20_write' ? erc20WriteProps.selectedWriteMethod : erc20ReadProps.selectedReadMethod;
  const visibleSpCoinReadOptions = React.useMemo(
    () =>
      dedupeMethodNamesByLabel(
        sortMethodNames(
          [
            ...(spCoinReadProps.showOnChainMethods ? spCoinReadProps.spCoinWorldReadOptions : []),
            ...(spCoinReadProps.showOnChainMethods ? spCoinReadProps.spCoinSenderReadOptions : []),
            ...(spCoinReadProps.showOnChainMethods ? spCoinReadProps.spCoinAdminReadOptions : []),
            ...(spCoinReadProps.showOffChainMethods ? spCoinReadProps.spCoinCompoundReadOptions : []),
          ].filter((name) => name !== 'calcDataTimeDiff' && name !== 'calculateStakingRewards'),
        ),
        (name) => String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name),
      ),
    [
      spCoinReadProps.showOffChainMethods,
      spCoinReadProps.showOnChainMethods,
      spCoinReadProps.spCoinReadMethodDefs,
      spCoinReadProps.spCoinAdminReadOptions,
      spCoinReadProps.spCoinCompoundReadOptions,
      spCoinReadProps.spCoinSenderReadOptions,
      spCoinReadProps.spCoinWorldReadOptions,
    ],
  );
  const visibleSpCoinWriteOptions = React.useMemo(
    () =>
      sortMethodNames(
        Array.from(
          new Set([
            ...(spCoinWriteProps.showOnChainMethods ? spCoinWriteProps.spCoinWorldWriteOptions : []),
            ...(spCoinWriteProps.showOnChainMethods ? spCoinWriteProps.spCoinSenderWriteOptions : []),
            ...(spCoinWriteProps.showOffChainMethods
              ? [
                  'deleteAccountTree',
                  'deleteRecipient',
                  'deleteRecipientRate',
                  'deleteAgent',
                  'deleteAgentRate',
                ]
              : []),
            ...(spCoinWriteProps.showOffChainMethods ? spCoinWriteProps.spCoinTodoWriteOptions : []),
          ]),
        ),
      ),
    [
      spCoinWriteProps.showOffChainMethods,
      spCoinWriteProps.showOnChainMethods,
      spCoinWriteProps.spCoinSenderWriteOptions,
      spCoinWriteProps.spCoinTodoWriteOptions,
      spCoinWriteProps.spCoinWorldWriteOptions,
    ],
  );
  const visibleSpCoinAddWriteOptions = React.useMemo(
    () => visibleSpCoinWriteOptions.filter((name) => name.startsWith('add')),
    [visibleSpCoinWriteOptions],
  );
  const visibleSpCoinDeleteWriteOptions = React.useMemo(
    () => visibleSpCoinWriteOptions.filter((name) => name.startsWith('delete')),
    [visibleSpCoinWriteOptions],
  );
  const visibleSpCoinUtilityWriteOptions = React.useMemo(
    () =>
      visibleSpCoinWriteOptions.filter(
        (name) => !name.startsWith('add') && !name.startsWith('delete'),
      ),
    [visibleSpCoinWriteOptions],
  );
  const visibleSerializationOptions = React.useMemo(
    () =>
      sortMethodNames(
        serializationTestProps.showOffChainMethods ? serializationTestProps.serializationTestOptions : [],
      ),
    [serializationTestProps.serializationTestOptions, serializationTestProps.showOffChainMethods],
  );
  const adminUtilityMethodNames = React.useMemo(
    () => Object.keys(serializationTestProps.serializationTestMethodDefs),
    [serializationTestProps.serializationTestMethodDefs],
  );
  const adminUtilityReadOptions = React.useMemo(
    () =>
      sortMethodNames(
        adminUtilityMethodNames.filter((name) =>
          ['compareSpCoinContractSize', 'getMasterSponsorList', 'getMasterSponsorList_BAK', 'getSponsorAccounts'].includes(name),
        ),
      ),
    [adminUtilityMethodNames],
  );
  const adminUtilityOwnerOptions = React.useMemo(
    () =>
      sortMethodNames(
        adminUtilityMethodNames.filter((name) =>
          [
            'hhFundAccounts',
            'deleteMasterSponsorships',
            'deleteAccountTree',
            'deleteRecipient',
            'deleteRecipientRate',
            'deleteAgent',
            'deleteAgentRate',
          ].includes(name),
        ),
      ),
    [adminUtilityMethodNames],
  );
  const visibleAdminUtilsReadOptions = React.useMemo(
    () => sortMethodNames([...adminUtilityReadOptions, ...spCoinReadProps.spCoinAdminReadOptions]),
    [adminUtilityReadOptions, spCoinReadProps.spCoinAdminReadOptions],
  );
  const visibleAdminUtilsOwnerOptions = React.useMemo(
    () => sortMethodNames([...adminUtilityOwnerOptions, ...spCoinWriteProps.spCoinAdminWriteOptions]),
    [adminUtilityOwnerOptions, spCoinWriteProps.spCoinAdminWriteOptions],
  );
  const hasVisibleAdminUtilsMethods =
    visibleAdminUtilsReadOptions.length > 0 || visibleAdminUtilsOwnerOptions.length > 0;
  const activeRunControl = React.useMemo(() => {
    if (activeMethodPanelTab === 'admin_utils' && methodPanelMode === 'serialization_tests') {
      return {
        label: `Run ${serializationTestProps.activeSerializationTestDef.title}`,
        onClick: () => void serializationTestProps.runSelectedSerializationTestMethod(),
        enabled: serializationTestProps.canRunSelectedSerializationTestMethod,
      };
    }
    if (methodPanelMode === 'ecr20_read') {
      return {
        label: `Run ${erc20ReadProps.activeReadLabels.title}`,
        onClick: () => void erc20ReadProps.runSelectedReadMethod(),
        enabled: erc20ReadProps.canRunSelectedReadMethod,
      };
    }
    if (methodPanelMode === 'erc20_write') {
      return {
        label: `Run ${erc20WriteProps.activeWriteLabels.title}`,
        onClick: () => void erc20WriteProps.runSelectedWriteMethod(),
        enabled: erc20WriteProps.canRunSelectedWriteMethod,
      };
    }
    if (methodPanelMode === 'spcoin_rread') {
      return {
        label: `Run ${spCoinReadProps.activeSpCoinReadDef.title}`,
        onClick: () => void spCoinReadProps.runSelectedSpCoinReadMethod(),
        enabled: spCoinReadProps.canRunSelectedSpCoinReadMethod,
      };
    }
    if (methodPanelMode === 'spcoin_write') {
      return {
        label: `Run ${spCoinWriteProps.activeSpCoinWriteDef.title}`,
        onClick: () => void spCoinWriteProps.runSelectedSpCoinWriteMethod(),
        enabled: spCoinWriteProps.canRunSelectedSpCoinWriteMethod,
      };
    }
    return {
      label: `Run ${serializationTestProps.activeSerializationTestDef.title}`,
      onClick: () => void serializationTestProps.runSelectedSerializationTestMethod(),
      enabled: serializationTestProps.canRunSelectedSerializationTestMethod,
    };
  }, [
    activeMethodPanelTab,
    erc20ReadProps.activeReadLabels.title,
    erc20ReadProps.canRunSelectedReadMethod,
    erc20ReadProps.runSelectedReadMethod,
    erc20WriteProps.activeWriteLabels.title,
    erc20WriteProps.canRunSelectedWriteMethod,
    erc20WriteProps.runSelectedWriteMethod,
    methodPanelMode,
    serializationTestProps.activeSerializationTestDef.title,
    serializationTestProps.canRunSelectedSerializationTestMethod,
    serializationTestProps.runSelectedSerializationTestMethod,
    spCoinReadProps.activeSpCoinReadDef.title,
    spCoinReadProps.canRunSelectedSpCoinReadMethod,
    spCoinReadProps.runSelectedSpCoinReadMethod,
    spCoinWriteProps.activeSpCoinWriteDef.title,
    spCoinWriteProps.canRunSelectedSpCoinWriteMethod,
    spCoinWriteProps.runSelectedSpCoinWriteMethod,
  ]);
  const activeAddControl = React.useMemo(() => {
    if (activeMethodPanelTab === 'admin_utils' && methodPanelMode === 'serialization_tests') {
      return {
        label: serializationTestProps.addToScriptButtonLabel,
        onClick: () => void serializationTestProps.addCurrentMethodToScript(),
        enabled: serializationTestProps.canAddCurrentMethodToScript,
      };
    }
    if (methodPanelMode === 'ecr20_read') {
      return {
        label: erc20ReadProps.addToScriptButtonLabel,
        onClick: () => void erc20ReadProps.addCurrentMethodToScript(),
        enabled: erc20ReadProps.canAddCurrentMethodToScript,
      };
    }
    if (methodPanelMode === 'erc20_write') {
      return {
        label: erc20WriteProps.addToScriptButtonLabel,
        onClick: () => void erc20WriteProps.addCurrentMethodToScript(),
        enabled: erc20WriteProps.canAddCurrentMethodToScript,
      };
    }
    if (methodPanelMode === 'spcoin_rread') {
      return {
        label: spCoinReadProps.addToScriptButtonLabel,
        onClick: () => void spCoinReadProps.addCurrentMethodToScript(),
        enabled: spCoinReadProps.canAddCurrentMethodToScript,
      };
    }
    if (methodPanelMode === 'spcoin_write') {
      return {
        label: spCoinWriteProps.addToScriptButtonLabel,
        onClick: () => void spCoinWriteProps.addCurrentMethodToScript(),
        enabled: spCoinWriteProps.canAddCurrentMethodToScript,
      };
    }
    return {
      label: serializationTestProps.addToScriptButtonLabel,
      onClick: () => void serializationTestProps.addCurrentMethodToScript(),
      enabled: serializationTestProps.canAddCurrentMethodToScript,
    };
  }, [
    activeMethodPanelTab,
    erc20ReadProps.addCurrentMethodToScript,
    erc20ReadProps.addToScriptButtonLabel,
    erc20ReadProps.canAddCurrentMethodToScript,
    erc20WriteProps.addCurrentMethodToScript,
    erc20WriteProps.addToScriptButtonLabel,
    erc20WriteProps.canAddCurrentMethodToScript,
    methodPanelMode,
    serializationTestProps.addCurrentMethodToScript,
    serializationTestProps.addToScriptButtonLabel,
    serializationTestProps.canAddCurrentMethodToScript,
    spCoinReadProps.addCurrentMethodToScript,
    spCoinReadProps.addToScriptButtonLabel,
    spCoinReadProps.canAddCurrentMethodToScript,
    spCoinWriteProps.addCurrentMethodToScript,
    spCoinWriteProps.addToScriptButtonLabel,
    spCoinWriteProps.canAddCurrentMethodToScript,
  ]);
  const typeScriptFileName =
    javaScriptEditorProps.selectedScriptName ||
    javaScriptEditorProps.selectedFilePath.split(/[\\/]/).pop() ||
    javaScriptEditorProps.selectedJavaScriptScriptId ||
    'UnknownFile';
  const currentJsonMethodName = React.useMemo(() => {
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') return spCoinReadProps.selectedSpCoinReadMethod;
      if (methodPanelMode === 'spcoin_write') return spCoinWriteProps.selectedSpCoinWriteMethod;
      return serializationTestProps.selectedSerializationTestMethod;
    }
    if (methodPanelMode === 'ecr20_read') return erc20ReadProps.selectedReadMethod;
    if (methodPanelMode === 'erc20_write') return erc20WriteProps.selectedWriteMethod;
    if (methodPanelMode === 'spcoin_rread') return spCoinReadProps.selectedSpCoinReadMethod;
    if (methodPanelMode === 'spcoin_write') return spCoinWriteProps.selectedSpCoinWriteMethod;
    return serializationTestProps.selectedSerializationTestMethod;
  }, [
    activeMethodPanelTab,
    erc20ReadProps.selectedReadMethod,
    erc20WriteProps.selectedWriteMethod,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinWriteProps.selectedSpCoinWriteMethod,
  ]);
  const adminUtilsSelectedMethod = React.useMemo(() => {
    const combinedAdminUtilsWriteOptions = sortMethodNames([...visibleAdminUtilsOwnerOptions]);
    if (methodPanelMode === 'spcoin_write') {
      if (combinedAdminUtilsWriteOptions.includes(spCoinWriteProps.selectedSpCoinWriteMethod)) {
        return spCoinWriteProps.selectedSpCoinWriteMethod;
      }
      if (combinedAdminUtilsWriteOptions.length > 0) return combinedAdminUtilsWriteOptions[0];
    }
    if (methodPanelMode === 'spcoin_rread') {
      if (visibleAdminUtilsReadOptions.includes(spCoinReadProps.selectedSpCoinReadMethod)) {
        return spCoinReadProps.selectedSpCoinReadMethod;
      }
      if (combinedAdminUtilsWriteOptions.includes(spCoinReadProps.selectedSpCoinReadMethod)) {
        return spCoinReadProps.selectedSpCoinReadMethod;
      }
      if (visibleAdminUtilsReadOptions.length > 0) return visibleAdminUtilsReadOptions[0];
    }
    if (visibleSerializationOptions.includes(serializationTestProps.selectedSerializationTestMethod)) {
      return serializationTestProps.selectedSerializationTestMethod;
    }
    if (visibleAdminUtilsReadOptions.length > 0) return visibleAdminUtilsReadOptions[0];
    if (combinedAdminUtilsWriteOptions.length > 0) return combinedAdminUtilsWriteOptions[0];
    return '__no_methods__';
  }, [
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinWriteProps.selectedSpCoinWriteMethod,
    visibleAdminUtilsReadOptions,
    visibleAdminUtilsOwnerOptions,
    visibleSerializationOptions,
  ]);
  const typeScriptMethodOptions = React.useMemo(() => {
    if (activeMethodPanelTab === 'erc20') return sortMethodNames([...visibleErc20ReadOptions, ...visibleErc20WriteOptions]);
    if (activeMethodPanelTab === 'spcoin_rread') return visibleSpCoinReadOptions;
    if (activeMethodPanelTab === 'spcoin_write') return visibleSpCoinWriteOptions;
    if (activeMethodPanelTab === 'admin_utils') {
      return sortMethodNames([
        ...visibleAdminUtilsReadOptions,
        ...visibleAdminUtilsOwnerOptions,
      ]);
    }
    return sortMethodNames(
      spCoinWriteProps.spCoinTodoWriteOptions.filter((method) => showOffChainMethods || showOnChainMethods || Boolean(method)),
    );
  }, [
    activeMethodPanelTab,
    showOffChainMethods,
    showOnChainMethods,
    spCoinWriteProps.spCoinTodoWriteOptions,
    visibleErc20ReadOptions,
    visibleErc20WriteOptions,
    visibleSpCoinReadOptions,
    visibleSpCoinWriteOptions,
  ]);
  const mappedTypeScriptScriptId = React.useMemo(() => {
    const targetFile = resolveTypeScriptTargetFile(activeMethodPanelTab, currentJsonMethodName);
    const candidateNames = [targetFile, currentJsonMethodName].filter(Boolean) as string[];
    const normalizedCandidates = new Set(candidateNames.map(normalizeMethodScriptLookup));
    const match = javaScriptEditorProps.visibleJavaScriptScripts.find((script) =>
      normalizedCandidates.has(normalizeMethodScriptLookup(script.name)),
    );
    return match?.id || '';
  }, [
    activeMethodPanelTab,
    currentJsonMethodName,
    javaScriptEditorProps.visibleJavaScriptScripts,
  ]);
  React.useEffect(() => {
    if (!mappedTypeScriptScriptId) return;
    if (javaScriptEditorProps.selectedJavaScriptScriptId === mappedTypeScriptScriptId) return;
    javaScriptEditorProps.setSelectedJavaScriptScriptId(mappedTypeScriptScriptId);
  }, [
    javaScriptEditorProps,
    mappedTypeScriptScriptId,
  ]);
  const activePanelKey = React.useMemo(() => {
    if (isJavaScriptScriptMode) {
      return `ts:${javaScriptEditorProps.selectedJavaScriptScriptId || javaScriptEditorProps.selectedFilePath || 'none'}`;
    }
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') {
        return `json:admin_utils:read:${spCoinReadProps.selectedSpCoinReadMethod}`;
      }
      if (methodPanelMode === 'spcoin_write') {
        return `json:admin_utils:write:${spCoinWriteProps.selectedSpCoinWriteMethod}`;
      }
      return `json:admin_utils:utility:${serializationTestProps.selectedSerializationTestMethod}`;
    }
    if (methodPanelMode === 'ecr20_read') {
      return `json:${methodPanelMode}:${erc20ReadProps.selectedReadMethod}`;
    }
    if (methodPanelMode === 'erc20_write') {
      return `json:${methodPanelMode}:${erc20WriteProps.selectedWriteMethod}`;
    }
    if (methodPanelMode === 'spcoin_rread') {
      return `json:${methodPanelMode}:${spCoinReadProps.selectedSpCoinReadMethod}`;
    }
    if (methodPanelMode === 'spcoin_write') {
      return `json:${methodPanelMode}:${spCoinWriteProps.selectedSpCoinWriteMethod}`;
    }
    return `json:${methodPanelMode}:${serializationTestProps.selectedSerializationTestMethod}`;
  }, [
    activeMethodPanelTab,
    erc20ReadProps.selectedReadMethod,
    erc20WriteProps.selectedWriteMethod,
    isJavaScriptScriptMode,
    javaScriptEditorProps.selectedFilePath,
    javaScriptEditorProps.selectedJavaScriptScriptId,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinWriteProps.selectedSpCoinWriteMethod,
  ]);
  React.useEffect(() => {
    setIsMethodPanelLoading(true);
    const timer = window.setTimeout(() => setIsMethodPanelLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, [activePanelKey]);
  const showLoadingPanel = isMethodPanelLoading || (isJavaScriptScriptMode && javaScriptEditorProps.isJavaScriptFileLoading);
  const loadingPanel = (
    <div className="rounded-lg border border-[#31416F] bg-[#0E111B] px-4 py-6 text-sm text-slate-400">
      {isJavaScriptScriptMode ? 'Loading TypeScript file...' : 'Loading method panel...'}
    </div>
  );
  const sharedMethodSelect = React.useMemo(() => {
    if (isJavaScriptScriptMode && !showAllCardSectionsForVisualTest) return null;
    const baseClassName = 'grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]';
    if (activeMethodPanelTab === 'admin_utils') {
      return (
        <div className={baseClassName}>
          <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
          <div className="relative w-full min-w-0">
            <select
              aria-label="Admin utilities JSON method"
              title="Admin utilities JSON method"
              className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
              value={hasVisibleAdminUtilsMethods ? adminUtilsSelectedMethod : '__no_methods__'}
              onChange={(e) => selectMappedJsonMethod(e.target.value)}
              disabled={!hasVisibleAdminUtilsMethods}
            >
            {!hasVisibleAdminUtilsMethods ? <option value="__no_methods__">No methods available</option> : null}
            {visibleAdminUtilsReadOptions.length > 0 ? (
              <>
                <option value="__admin-utils-read-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- Read Admin ----
                </option>
                {visibleAdminUtilsReadOptions.map((name) => (
                  <option key={`admin-utils-read-${name}`} value={name}>
                    {spCoinReadProps.spCoinReadMethodDefs[name]?.title || serializationTestProps.serializationTestMethodDefs[name]?.title || name}
                  </option>
                ))}
              </>
            ) : null}
            {visibleAdminUtilsOwnerOptions.length > 0 ? (
              <>
                <option value="__admin-utils-write-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- Owner Admin ----
                </option>
                {visibleAdminUtilsOwnerOptions.map((name) => (
                  <option key={`admin-utils-write-${name}`} value={name}>
                    {spCoinWriteProps.spCoinWriteMethodDefs[name]?.title || serializationTestProps.serializationTestMethodDefs[name]?.title || name}
                  </option>
                ))}
              </>
            ) : null}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
              v
            </span>
          </div>
        </div>
      );
    }
    if (isErc20Mode) {
      return (
        <div className={baseClassName}>
          <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
          <div className="relative w-full min-w-0">
            <select
              aria-label="ERC20 JSON method"
              title="ERC20 JSON method"
              className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
              value={hasVisibleErc20Methods ? combinedErc20MethodValue : '__no_methods__'}
              onChange={(e) => selectMappedJsonMethod(e.target.value)}
              disabled={!hasVisibleErc20Methods}
            >
            {!hasVisibleErc20Methods ? <option value="__no_methods__">No methods available</option> : null}
            {visibleErc20ReadOptions.length > 0 ? (
              <>
                <option value="__erc20-read-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- ERC Read ----
                </option>
                {visibleErc20ReadOptions.map((name) => (
                  <option key={`erc20-read-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </>
            ) : null}
            {visibleErc20WriteOptions.length > 0 ? (
              <>
                <option value="__erc20-write-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- ERC Write ----
                </option>
                {visibleErc20WriteOptions.map((name) => (
                  <option key={`erc20-write-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </>
            ) : null}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
              v
            </span>
          </div>
        </div>
      );
    }
    if (methodPanelMode === 'spcoin_rread') {
      return (
        <div className={baseClassName}>
          <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
          <div className="relative w-full min-w-0">
            <select
              aria-label="SpCoin read JSON method"
              title="SpCoin read JSON method"
              className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
              value={visibleSpCoinReadOptions.includes(spCoinReadProps.selectedSpCoinReadMethod) ? spCoinReadProps.selectedSpCoinReadMethod : '__no_methods__'}
              onChange={(e) => selectMappedJsonMethod(e.target.value)}
              disabled={visibleSpCoinReadOptions.length === 0}
            >
            {visibleSpCoinReadOptions.length === 0 ? <option value="__no_methods__">No methods available</option> : null}
            {visibleSpCoinReadOptions.map((name) => (
              <option key={`sp-read-shared-${name}`} value={name}>
                {spCoinReadProps.spCoinReadMethodDefs[name]?.title || name}
              </option>
            ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
              v
            </span>
          </div>
        </div>
      );
    }
    if (methodPanelMode === 'spcoin_write') {
      return (
        <div className={baseClassName}>
          <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
          <div className="relative w-full min-w-0">
            <select
              aria-label="SpCoin write JSON method"
              title="SpCoin write JSON method"
              className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
              value={visibleSpCoinWriteOptions.includes(spCoinWriteProps.selectedSpCoinWriteMethod) ? spCoinWriteProps.selectedSpCoinWriteMethod : '__no_methods__'}
              onChange={(e) => selectMappedJsonMethod(e.target.value)}
              disabled={visibleSpCoinWriteOptions.length === 0}
            >
            {visibleSpCoinWriteOptions.length === 0 ? <option value="__no_methods__">No methods available</option> : null}
            {visibleSpCoinAddWriteOptions.length > 0 ? (
              <>
                <option value="__sp-write-add-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- Add Methods ----
                </option>
                {visibleSpCoinAddWriteOptions.map((name) => (
                  <option key={`sp-write-add-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </>
            ) : null}
            {visibleSpCoinDeleteWriteOptions.length > 0 ? (
              <>
                <option value="__sp-write-delete-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- Delete Methods ----
                </option>
                {visibleSpCoinDeleteWriteOptions.map((name) => (
                  <option key={`sp-write-delete-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </>
            ) : null}
            {visibleSpCoinUtilityWriteOptions.length > 0 ? (
              <>
                <option value="__sp-write-utils-divider__" disabled style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}>
                  ---- Utils ----
                </option>
                {visibleSpCoinUtilityWriteOptions.map((name) => (
                  <option key={`sp-write-utils-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </>
            ) : null}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
              v
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className={baseClassName}>
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <div className="relative w-full min-w-0">
          <select
            aria-label="Serialization test JSON method"
            title="Serialization test JSON method"
            className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            value={visibleSerializationOptions.includes(serializationTestProps.selectedSerializationTestMethod) ? serializationTestProps.selectedSerializationTestMethod : '__no_methods__'}
            onChange={(e) => selectMappedJsonMethod(e.target.value)}
            disabled={visibleSerializationOptions.length === 0}
          >
          {visibleSerializationOptions.length === 0 ? <option value="__no_methods__">No methods available</option> : null}
          {visibleSerializationOptions.map((name) => (
            <option key={`serialization-shared-${name}`} value={name}>
              {name}
            </option>
          ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
            v
          </span>
        </div>
      </div>
    );
  }, [
    adminUtilsSelectedMethod,
    combinedErc20MethodValue,
    erc20ReadProps,
    erc20WriteProps,
    hasVisibleAdminUtilsMethods,
    hasVisibleErc20Methods,
    isErc20Mode,
    isJavaScriptScriptMode,
    methodPanelMode,
    selectMethodPanelTab,
    showAllCardSectionsForVisualTest,
    activeMethodPanelTab,
    serializationTestProps,
    spCoinReadProps,
    spCoinWriteProps,
    selectMappedJsonMethod,
    visibleErc20ReadOptions,
    visibleErc20WriteOptions,
    visibleAdminUtilsReadOptions,
    visibleAdminUtilsOwnerOptions,
    visibleSerializationOptions,
    visibleSpCoinAddWriteOptions,
    visibleSpCoinDeleteWriteOptions,
    visibleSpCoinReadOptions,
    visibleSpCoinUtilityWriteOptions,
    visibleSpCoinWriteOptions,
  ]);

  return (
    <article ref={methodsCardRef} className={articleClassName}>
      <LabCardHeader title="Script Editor" isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      <div className="grid grid-cols-1 gap-4">
        <ScriptBuilderCard {...scriptBuilderProps} />

        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <h3 className="text-center text-lg font-semibold text-[#5981F3]">{methodPanelTitle}</h3>
          <div className="mb-3 mt-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max flex-nowrap items-start gap-4 whitespace-nowrap text-sm text-[#8FA8FF]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={scriptEditorKind === 'json'}
                  onChange={() => setScriptEditorKind('json')}
                  className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                />
                <span>JSON</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={scriptEditorKind === 'javascript'}
                  onChange={() => setScriptEditorKind('javascript')}
                  className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                />
                <span>Typescript</span>
              </label>
              <label className="inline-flex items-center justify-end gap-2 text-right">
              <input
                type="checkbox"
                className="h-4 w-4 accent-green-500"
                checked={showOnChainMethods}
                onChange={(event) => setShowOnChainMethods(event.target.checked)}
              />
              <span className="text-green-400">On-Chain</span>
              </label>
              <label className="inline-flex items-center justify-end gap-2 text-right">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#5981F3]"
                checked={showOffChainMethods}
                onChange={(event) => setShowOffChainMethods(event.target.checked)}
              />
              <span className="text-[#8FA8FF]">Off-Chain</span>
              </label>
              {isJavaScriptScriptMode ? (
                <div className="ml-auto flex items-start gap-4">
                  <label className="inline-flex items-center justify-end gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#5981F3]"
                      checked={javaScriptEditorProps.isTypeScriptEditEnabled}
                      onChange={(event) => javaScriptEditorProps.setIsTypeScriptEditEnabled(event.target.checked)}
                      disabled={!javaScriptEditorProps.canEditSelectedTypeScriptFile}
                    />
                    <span>Edit</span>
                  </label>
                </div>
              ) : (
                <div className="ml-auto flex items-start gap-4">
                  <label className="inline-flex items-center justify-end gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#E5B94F]"
                      checked={writeTraceEnabled}
                      onChange={toggleWriteTrace}
                    />
                    <span>Trace</span>
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-200">
              {methodPanelOptions.map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name={methodPanelGroupName}
                    value={value}
                    checked={activeMethodPanelTab === value}
                    onMouseDown={(e) => {
                      if (activeMethodPanelTab === value) e.preventDefault();
                    }}
                    onChange={(e) => {
                      if (activeMethodPanelTab === value) return;
                      selectMethodPanelTab(e.target.value as MethodPanelTab);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <>
            {isJavaScriptScriptMode || (showAllCardSectionsForVisualTest && !isJsonScriptMode) ? (
              <div className="mb-3 grid grid-cols-1 gap-3">
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">TypeScript File</span>
                  <select
                    aria-label="TypeScript file"
                    title="TypeScript file"
                    className="w-full min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                    value={typeScriptMethodOptions.includes(currentJsonMethodName) ? currentJsonMethodName : ''}
                    onChange={(event) => selectMappedJsonMethod(event.target.value)}
                  >
                    {typeScriptMethodOptions.length === 0 ? (
                      <option value="">No TypeScript Methods</option>
                    ) : null}
                    {typeScriptMethodOptions.map((methodName) => (
                      <option key={methodName} value={methodName}>
                        {methodName}
                      </option>
                    ))}
                  </select>
                </div>
                {showLoadingPanel ? (
                  loadingPanel
                ) : (
                  <textarea
                    className={`min-h-[20rem] w-full overflow-auto rounded-lg border border-[#31416F] bg-[#0E111B] px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-[#5981F3] ${javaScriptEditorProps.hiddenScrollbarClass}`}
                    value={javaScriptEditorProps.javaScriptFileContent}
                    onChange={(event) => javaScriptEditorProps.setJavaScriptFileContent(event.target.value)}
                    readOnly={!javaScriptEditorProps.isTypeScriptEditEnabled}
                    placeholder={
                      javaScriptEditorProps.selectedFilePath
                        ? javaScriptEditorProps.isJavaScriptFileLoading
                          ? 'Loading TypeScript file...'
                          : 'No TypeScript file contents loaded.'
                        : 'Select a TypeScript file to view it here.'
                    }
                    spellCheck={false}
                  />
                )}
              </div>
            ) : null}
            {isJsonScriptMode ? (
              <div className="mb-3 grid grid-cols-1 gap-3">
                {!showAllCardSectionsForVisualTest ? sharedMethodSelect : null}
                {showLoadingPanel ? (
                  loadingPanel
                ) : (
                  <div>
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || (activeMethodPanelTab !== 'admin_utils' && methodPanelMode === 'ecr20_read')) ? <Erc20ReadController {...erc20ReadProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || (activeMethodPanelTab !== 'admin_utils' && methodPanelMode === 'erc20_write')) ? <Erc20WriteController {...erc20WriteProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || methodPanelMode === 'spcoin_rread') ? <SpCoinReadController {...spCoinReadProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || methodPanelMode === 'spcoin_write') ? <SpCoinWriteController {...spCoinWriteProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || methodPanelMode === 'serialization_tests') ? <SerializationTestController {...serializationTestProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`h-[36px] min-w-0 flex-1 rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors ${
                      activeRunControl.enabled ? 'bg-[#E5B94F] hover:bg-green-500' : 'bg-[#E5B94F] hover:bg-[#d7ae45]'
                    }`}
                    onClick={activeRunControl.onClick}
                  >
                    {activeRunControl.label}
                  </button>
                  <button
                    type="button"
                    className={`h-[36px] min-w-0 flex-1 rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
                      activeAddControl.enabled ? 'bg-[#E5B94F] text-black hover:bg-green-500' : 'bg-[#E5B94F] text-black hover:bg-[#d7ae45]'
                    }`}
                    onClick={activeAddControl.onClick}
                  >
                    {activeAddControl.label}
                  </button>
                </div>
              </div>
            ) : null}
            {isJavaScriptScriptMode ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={`h-[36px] min-w-0 flex-1 rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors ${
                    activeRunControl.enabled ? 'bg-[#E5B94F] hover:bg-green-500' : 'bg-[#E5B94F] hover:bg-[#d7ae45]'
                  }`}
                  onClick={activeRunControl.onClick}
                >
                  {activeRunControl.label}
                </button>
                <button
                  type="button"
                  className={`h-[36px] min-w-0 flex-1 rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
                    !javaScriptEditorProps.isTypeScriptEditEnabled && isHoveringTypeScriptSaveBlocked
                      ? 'bg-red-600 text-white'
                      : javaScriptEditorProps.isTypeScriptEditEnabled && !javaScriptEditorProps.isSavingSelectedTypeScriptFile
                        ? 'bg-[#E5B94F] text-black hover:bg-green-500'
                        : 'bg-[#E5B94F] text-black hover:bg-[#d7ae45]'
                  }`}
                  onClick={() => {
                    if (!javaScriptEditorProps.isTypeScriptEditEnabled || javaScriptEditorProps.isSavingSelectedTypeScriptFile) return;
                    setIsTypeScriptSavePopupOpen(true);
                  }}
                  onMouseEnter={() => {
                    if (!javaScriptEditorProps.isTypeScriptEditEnabled) {
                      setIsHoveringTypeScriptSaveBlocked(true);
                    }
                  }}
                  onMouseLeave={() => setIsHoveringTypeScriptSaveBlocked(false)}
                >
                  {!javaScriptEditorProps.isTypeScriptEditEnabled && isHoveringTypeScriptSaveBlocked
                    ? 'Not Editable'
                    : javaScriptEditorProps.isSavingSelectedTypeScriptFile
                      ? 'Saving...'
                      : 'Save TypeScript'}
                </button>
              </div>
            ) : null}
          </>
        </section>
        {isTypeScriptSavePopupOpen ? (
          <ValidationPopup
            fields={[]}
            title="Save File"
            message={`Saving Save File ${typeScriptFileName}`}
            buttonStyle="rounded-lg border border-[#31416F] bg-[#0E111B] px-3 py-[0.28rem] text-sm font-semibold text-slate-200 transition-colors hover:border-[#5981F3] hover:text-white"
            confirmLabel="Save File"
            cancelLabel="Cancel"
            onClose={() => setIsTypeScriptSavePopupOpen(false)}
            onConfirm={() => {
              setIsTypeScriptSavePopupOpen(false);
              javaScriptEditorProps.saveSelectedTypeScriptFile();
            }}
          />
        ) : null}
      </div>
    </article>
  );
}
