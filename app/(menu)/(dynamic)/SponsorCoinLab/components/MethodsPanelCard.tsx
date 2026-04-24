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
import {
  DEFAULT_METHOD_MEMBER_LIST_PAYLOAD,
  cloneAlterMemberLists,
  type AlterMemberLists,
  type MethodDisplayGroup,
  type MethodMemberListPayload,
  type StoredAlterMode,
} from '@/lib/spCoinLab/methodMemberLists';

type MethodPanelTab = MethodPanelMode | 'todos' | 'erc20' | 'admin_utils';
type AlterModeOption = StoredAlterMode | 'Tested';
type EditableMemberLists = AlterMemberLists;
type MethodIdentityKind = 'erc20Read' | 'erc20Write' | 'spCoinRead' | 'spCoinWrite' | 'serialization';

type MethodCatalogEntry = {
  id: string;
  name: string;
  label: string;
  kind: MethodIdentityKind;
};

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
  getMasterAccountElement: 'getMasterAccountElement.ts',
  getMasterAccountList: 'getMasterAccountList.ts',
  getMasterAccountCount: 'getMasterAccountListSize.ts',
  version: 'getVersion.ts',
};

const SPCOIN_WRITE_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  addRecipient: 'add.ts',
  addAgent: 'add.ts',
  addRecipientTransaction: 'add.ts',
  addAgentTransaction: 'add.ts',
  addBackDatedRecipientTransaction: 'add.ts',
  addBackDatedAgentTransaction: 'add.ts',
  backDateRecipientTransaction: 'add.ts',
  backDateAgentTransaction: 'add.ts',
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
  creationTime: 'creationTime.ts',
  getMasterAccountElement: 'getMasterAccountElement.ts',
  getMasterAccountList: 'getMasterAccountList.ts',
  getMasterAccountCount: 'getMasterAccountListSize.ts',
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

function resolveTypeScriptTargetFileForIdentity(kind: MethodIdentityKind | null, methodName: string) {
  if (!kind) return resolveTypeScriptTargetFile('admin_utils', methodName);
  if (kind === 'erc20Read' || kind === 'erc20Write') return resolveTypeScriptTargetFile('erc20', methodName);
  if (kind === 'spCoinRead') return resolveTypeScriptTargetFile('spcoin_rread', methodName);
  if (kind === 'spCoinWrite') return resolveTypeScriptTargetFile('spcoin_write', methodName);
  return resolveTypeScriptTargetFile('admin_utils', methodName);
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

function filterMethodsByAlterMode(
  methods: string[],
  memberLists: EditableMemberLists,
  mode: AlterModeOption,
) {
  if (mode === 'Tested') {
    const testMemberList = memberLists.Test || {};
    return methods.filter((name) => !Boolean(testMemberList[name]));
  }
  const memberList = memberLists[mode] || {};
  return methods.filter((name) => Boolean(memberList[name]));
}

function isMethodInAlterMode(
  methodName: string,
  memberLists: EditableMemberLists,
  mode: AlterModeOption,
) {
  if (!methodName || methodName === '__no_methods__') return false;
  if (mode === 'Tested') {
    return !Boolean(memberLists.Test?.[methodName]);
  }
  return Boolean(memberLists[mode]?.[methodName]);
}

const BLOCKED_SPCOIN_READ_TITLES = new Set([
  'creationTime',
  'version',
  'getMasterAccountElement',
  'getMasterAccountCount',
  'getMasterAccountKeys',
]);

const ALTER_MODE_OPTIONS: AlterModeOption[] = ['All', 'Standard', 'Test', 'Tested', 'Todo'];
const METHODS_PANEL_UI_STORAGE_KEY = 'spCoinLabMethodsPanelUiKey';

type StoredMethodsPanelUiState = {
  scriptEditorKind?: ScriptEditorKind;
  isManageEnabled?: boolean;
  selectedAlterMode?: AlterModeOption;
  selectedDisplayGroup?: MethodDisplayGroup;
  writeTraceEnabled?: boolean;
  showOnChainMethods?: boolean;
  showOffChainMethods?: boolean;
  selectedMethodId?: string;
};

function readStoredMethodsPanelUiState(): StoredMethodsPanelUiState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(METHODS_PANEL_UI_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const next: StoredMethodsPanelUiState = {};
    if (saved.scriptEditorKind === 'json' || saved.scriptEditorKind === 'javascript') {
      next.scriptEditorKind = saved.scriptEditorKind;
    }
    if (typeof saved.isManageEnabled === 'boolean') {
      next.isManageEnabled = saved.isManageEnabled;
    }
    if (
      saved.selectedAlterMode === 'All' ||
      saved.selectedAlterMode === 'Standard' ||
      saved.selectedAlterMode === 'Test' ||
      saved.selectedAlterMode === 'Tested' ||
      saved.selectedAlterMode === 'Todo'
    ) {
      next.selectedAlterMode = saved.selectedAlterMode;
    }
    if (
      saved.selectedDisplayGroup === 'erc20' ||
      saved.selectedDisplayGroup === 'spcoin_rread' ||
      saved.selectedDisplayGroup === 'spcoin_write' ||
      saved.selectedDisplayGroup === 'admin_utils' ||
      saved.selectedDisplayGroup === 'todos'
    ) {
      next.selectedDisplayGroup = saved.selectedDisplayGroup;
    }
    if (typeof saved.writeTraceEnabled === 'boolean') {
      next.writeTraceEnabled = saved.writeTraceEnabled;
    }
    if (typeof saved.showOnChainMethods === 'boolean') {
      next.showOnChainMethods = saved.showOnChainMethods;
    }
    if (typeof saved.showOffChainMethods === 'boolean') {
      next.showOffChainMethods = saved.showOffChainMethods;
    }
    if (typeof saved.selectedMethodId === 'string') {
      next.selectedMethodId = saved.selectedMethodId;
    }
    return next;
  } catch {
    return null;
  }
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
  selectMappedJsonMethod: (value: string) => void;
  selectMethodByKind: (kind: MethodIdentityKind, value: string) => void;
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
  selectMappedJsonMethod,
  selectMethodByKind,
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
  const storedMethodsPanelUiState = React.useMemo(() => readStoredMethodsPanelUiState(), []);
  const methodPanelGroupName = React.useId();
  const alterModeGroupName = React.useId();
  const [isHoveringTypeScriptSaveBlocked, setIsHoveringTypeScriptSaveBlocked] = React.useState(false);
  const [isTypeScriptSavePopupOpen, setIsTypeScriptSavePopupOpen] = React.useState(false);
  const [isMethodPanelLoading, setIsMethodPanelLoading] = React.useState(false);
  const [selectedAlterMode, setSelectedAlterMode] =
    React.useState<AlterModeOption>(storedMethodsPanelUiState?.selectedAlterMode || 'Standard');
  const [alterModeDropdownValue, setAlterModeDropdownValue] = React.useState('__alter_mode_placeholder__');
  const [serializationMemberLists, setSerializationMemberLists] = React.useState<EditableMemberLists>(() =>
    cloneAlterMemberLists(DEFAULT_METHOD_MEMBER_LIST_PAYLOAD.lists.serialization),
  );
  const [spCoinReadMemberLists, setSpCoinReadMemberLists] = React.useState<EditableMemberLists>(() =>
    cloneAlterMemberLists(DEFAULT_METHOD_MEMBER_LIST_PAYLOAD.lists.spCoinRead),
  );
  const [spCoinWriteMemberLists, setSpCoinWriteMemberLists] = React.useState<EditableMemberLists>(() =>
    cloneAlterMemberLists(DEFAULT_METHOD_MEMBER_LIST_PAYLOAD.lists.spCoinWrite),
  );
  const [erc20ReadMemberLists, setErc20ReadMemberLists] = React.useState<EditableMemberLists>(() =>
    cloneAlterMemberLists(DEFAULT_METHOD_MEMBER_LIST_PAYLOAD.lists.erc20Read),
  );
  const [erc20WriteMemberLists, setErc20WriteMemberLists] = React.useState<EditableMemberLists>(() =>
    cloneAlterMemberLists(DEFAULT_METHOD_MEMBER_LIST_PAYLOAD.lists.erc20Write),
  );
  const [isManageEnabled, setIsManageEnabled] = React.useState(Boolean(storedMethodsPanelUiState?.isManageEnabled));
  const [memberListPersistenceHydrated, setMemberListPersistenceHydrated] = React.useState(false);
  const [methodDisplayGroups, setMethodDisplayGroups] = React.useState<Record<string, MethodDisplayGroup>>(
    () => ({ ...DEFAULT_METHOD_MEMBER_LIST_PAYLOAD.displayGroups }),
  );
  const [selectedDisplayGroup, setSelectedDisplayGroup] = React.useState<MethodDisplayGroup>(
    storedMethodsPanelUiState?.selectedDisplayGroup ||
      (activeMethodPanelTab === 'ecr20_read' || activeMethodPanelTab === 'erc20_write'
        ? 'erc20'
        : activeMethodPanelTab === 'serialization_tests'
          ? 'admin_utils'
          : activeMethodPanelTab),
  );
  const isJavaScriptScriptMode = scriptEditorKind === 'javascript';
  const isJsonScriptMode = scriptEditorKind === 'json';
  const didHydratePanelUiRef = React.useRef(false);
  const didRestoreSelectedMethodRef = React.useRef(false);
  const [isPanelUiPersistenceReady, setIsPanelUiPersistenceReady] = React.useState(false);
  React.useEffect(() => {
    if (didHydratePanelUiRef.current) return;
    if (storedMethodsPanelUiState?.scriptEditorKind && storedMethodsPanelUiState.scriptEditorKind !== scriptEditorKind) {
      setScriptEditorKind(storedMethodsPanelUiState.scriptEditorKind);
    }
    if (
      typeof storedMethodsPanelUiState?.showOnChainMethods === 'boolean' &&
      storedMethodsPanelUiState.showOnChainMethods !== showOnChainMethods
    ) {
      setShowOnChainMethods(storedMethodsPanelUiState.showOnChainMethods);
    }
    if (
      typeof storedMethodsPanelUiState?.showOffChainMethods === 'boolean' &&
      storedMethodsPanelUiState.showOffChainMethods !== showOffChainMethods
    ) {
      setShowOffChainMethods(storedMethodsPanelUiState.showOffChainMethods);
    }
    if (
      typeof storedMethodsPanelUiState?.writeTraceEnabled === 'boolean' &&
      storedMethodsPanelUiState.writeTraceEnabled !== writeTraceEnabled
    ) {
      toggleWriteTrace();
    }
    didHydratePanelUiRef.current = true;
    setIsPanelUiPersistenceReady(true);
  }, [
    scriptEditorKind,
    setScriptEditorKind,
    setShowOffChainMethods,
    setShowOnChainMethods,
    showOffChainMethods,
    showOnChainMethods,
    storedMethodsPanelUiState,
    toggleWriteTrace,
    writeTraceEnabled,
  ]);
  const persistedMemberListPayload = React.useMemo<MethodMemberListPayload>(
    () => ({
      version: 1,
      updatedAt: '',
      lists: {
        serialization: serializationMemberLists,
        spCoinRead: spCoinReadMemberLists,
        spCoinWrite: spCoinWriteMemberLists,
        erc20Read: erc20ReadMemberLists,
        erc20Write: erc20WriteMemberLists,
      },
      displayGroups: methodDisplayGroups,
    }),
    [
      erc20ReadMemberLists,
      erc20WriteMemberLists,
      methodDisplayGroups,
      serializationMemberLists,
      spCoinReadMemberLists,
      spCoinWriteMemberLists,
    ],
  );
  const methodPanelOptions: Array<[MethodPanelTab, string]> = [
    ['erc20', 'ERC20'],
    ['spcoin_rread', 'SpCoin Read'],
    ['spcoin_write', 'SpCoin Write'],
    ['admin_utils', 'Admin Utils'],
    ['todos', 'ToDos'],
  ];
  const visibleErc20ReadOptions = React.useMemo(
    () =>
      sortMethodNames(
        filterMethodsByAlterMode(
          erc20ReadProps.showOnChainMethods ? erc20ReadProps.erc20ReadOptions : [],
          erc20ReadMemberLists,
          selectedAlterMode,
        ),
      ),
    [erc20ReadMemberLists, erc20ReadProps.erc20ReadOptions, erc20ReadProps.showOnChainMethods, selectedAlterMode],
  );
  const visibleErc20WriteOptions = React.useMemo(
    () =>
      sortMethodNames(
        filterMethodsByAlterMode(
          erc20WriteProps.showOnChainMethods ? erc20WriteProps.erc20WriteOptions : [],
          erc20WriteMemberLists,
          selectedAlterMode,
        ),
      ),
    [erc20WriteMemberLists, erc20WriteProps.erc20WriteOptions, erc20WriteProps.showOnChainMethods, selectedAlterMode],
  );
  const visibleSpCoinReadOptions = React.useMemo(
    () => {
      const excludedAdminReadNames = new Set(spCoinReadProps.spCoinAdminReadOptions);
      const excludedAdminReadTitles = new Set(
        spCoinReadProps.spCoinAdminReadOptions.map((name) =>
          String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name),
        ),
      );
      const baseOptions = [
        ...(spCoinReadProps.showOnChainMethods ? spCoinReadProps.spCoinWorldReadOptions : []),
        ...(spCoinReadProps.showOnChainMethods ? spCoinReadProps.spCoinSenderReadOptions : []),
        ...(spCoinReadProps.showOffChainMethods ? spCoinReadProps.spCoinCompoundReadOptions : []),
      ].filter((name) => {
        if (name === 'calcDataTimeDiff' || name === 'calculateStakingRewards') return false;
        if (excludedAdminReadNames.has(name)) return false;
        const title = String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name);
        if (BLOCKED_SPCOIN_READ_TITLES.has(title)) return false;
        return !excludedAdminReadTitles.has(title);
      });
      return dedupeMethodNamesByLabel(
        sortMethodNames(
          filterMethodsByAlterMode(
            baseOptions,
            spCoinReadMemberLists,
            selectedAlterMode,
          ),
        ),
        (name) => String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name),
      );
    },
    [
      selectedAlterMode,
      spCoinReadMemberLists,
      spCoinReadProps.showOffChainMethods,
      spCoinReadProps.showOnChainMethods,
      spCoinReadProps.spCoinAdminReadOptions,
      spCoinReadProps.spCoinReadMethodDefs,
      spCoinReadProps.spCoinCompoundReadOptions,
      spCoinReadProps.spCoinSenderReadOptions,
      spCoinReadProps.spCoinWorldReadOptions,
    ],
  );
  const visibleSpCoinWriteOptions = React.useMemo(
    () =>
      sortMethodNames(
        filterMethodsByAlterMode(
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
          spCoinWriteMemberLists,
          selectedAlterMode,
        ),
      ),
    [
      selectedAlterMode,
      spCoinWriteMemberLists,
      spCoinWriteProps.showOffChainMethods,
      spCoinWriteProps.showOnChainMethods,
      spCoinWriteProps.spCoinSenderWriteOptions,
      spCoinWriteProps.spCoinTodoWriteOptions,
      spCoinWriteProps.spCoinWorldWriteOptions,
    ],
  );
  const visibleTodoWriteOptions = React.useMemo(
    () =>
      sortMethodNames(
        filterMethodsByAlterMode(
          spCoinWriteProps.spCoinTodoWriteOptions,
          spCoinWriteMemberLists,
          selectedAlterMode,
        ),
      ),
    [selectedAlterMode, spCoinWriteMemberLists, spCoinWriteProps.spCoinTodoWriteOptions],
  );
  const visibleSerializationOptions = React.useMemo(
    () =>
      sortMethodNames(
      filterMethodsByAlterMode(
          serializationTestProps.showOffChainMethods ? serializationTestProps.serializationTestOptions : [],
          serializationMemberLists,
          selectedAlterMode,
        ),
      ),
    [
      serializationMemberLists,
      selectedAlterMode,
      serializationTestProps.serializationTestOptions,
      serializationTestProps.showOffChainMethods,
    ],
  );
  const adminUtilityMethodNames = React.useMemo(
    () =>
      filterMethodsByAlterMode(
        Object.keys(serializationTestProps.serializationTestMethodDefs),
        serializationMemberLists,
        selectedAlterMode,
      ),
    [selectedAlterMode, serializationMemberLists, serializationTestProps.serializationTestMethodDefs],
  );
  const adminUtilityReadOptions = React.useMemo(
    () =>
      sortMethodNames(
        adminUtilityMethodNames.filter((name) =>
          ['compareSpCoinContractSize', 'getMasterSponsorList', 'getSponsorAccounts'].includes(name),
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
    () =>
      sortMethodNames(
        Array.from(
          new Set([
            ...adminUtilityReadOptions,
            ...filterMethodsByAlterMode(
              spCoinReadProps.spCoinAdminReadOptions,
              spCoinReadMemberLists,
              selectedAlterMode,
            ),
          ]),
        ),
      ),
    [
      adminUtilityReadOptions,
      spCoinReadProps.spCoinAdminReadOptions,
      spCoinReadMemberLists,
      selectedAlterMode,
    ],
  );
  const visibleAdminUtilsOwnerOptions = React.useMemo(
    () =>
      sortMethodNames([
        ...adminUtilityOwnerOptions,
        ...filterMethodsByAlterMode(
          spCoinWriteProps.spCoinAdminWriteOptions,
          spCoinWriteMemberLists,
          selectedAlterMode,
        ),
      ]),
    [adminUtilityOwnerOptions, spCoinWriteMemberLists, spCoinWriteProps.spCoinAdminWriteOptions, selectedAlterMode],
  );
  const visibleAdminUtilitySerializationOptions = React.useMemo(
    () => sortMethodNames([...adminUtilityReadOptions, ...adminUtilityOwnerOptions]),
    [adminUtilityOwnerOptions, adminUtilityReadOptions],
  );
  const groupedMethodEntries = React.useMemo(() => {
    const entries: MethodCatalogEntry[] = [
      ...visibleErc20ReadOptions.map((name) => ({ id: `erc20Read:${name}`, name, label: name, kind: 'erc20Read' as const })),
      ...visibleErc20WriteOptions.map((name) => ({ id: `erc20Write:${name}`, name, label: name, kind: 'erc20Write' as const })),
      ...visibleSpCoinReadOptions.map((name) => ({
        id: `spCoinRead:${name}`,
        name,
        label: String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name),
        kind: 'spCoinRead' as const,
      })),
      ...visibleSpCoinWriteOptions.map((name) => ({
        id: `spCoinWrite:${name}`,
        name,
        label: String(spCoinWriteProps.spCoinWriteMethodDefs[name]?.title || name),
        kind: 'spCoinWrite' as const,
      })),
      ...visibleAdminUtilsReadOptions.map((name) => ({
        id: `spCoinRead:${name}`,
        name,
        label: String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name),
        kind: 'spCoinRead' as const,
      })),
      ...visibleAdminUtilsOwnerOptions.map((name) => ({
        id: `spCoinWrite:${name}`,
        name,
        label: String(spCoinWriteProps.spCoinWriteMethodDefs[name]?.title || name),
        kind: 'spCoinWrite' as const,
      })),
      ...visibleAdminUtilitySerializationOptions.map((name) => ({
        id: `serialization:${name}`,
        name,
        label: String(serializationTestProps.serializationTestMethodDefs[name]?.title || name),
        kind: 'serialization' as const,
      })),
      ...visibleTodoWriteOptions.map((name) => ({
        id: `spCoinWrite:${name}`,
        name,
        label: String(spCoinWriteProps.spCoinWriteMethodDefs[name]?.title || name),
        kind: 'spCoinWrite' as const,
      })),
    ];
    const unique = new Map<string, MethodCatalogEntry>();
    for (const entry of entries) {
      if (!unique.has(entry.id)) unique.set(entry.id, entry);
    }
    return Array.from(unique.values());
  }, [
    serializationTestProps.serializationTestMethodDefs,
    spCoinReadProps.spCoinReadMethodDefs,
    spCoinWriteProps.spCoinWriteMethodDefs,
    visibleAdminUtilsOwnerOptions,
    visibleAdminUtilsReadOptions,
    visibleAdminUtilitySerializationOptions,
    visibleErc20ReadOptions,
    visibleErc20WriteOptions,
    visibleSpCoinReadOptions,
    visibleSpCoinWriteOptions,
    visibleTodoWriteOptions,
  ]);
  const visibleGroupedMethods = React.useMemo(
    () =>
      groupedMethodEntries
        .filter((entry) => (methodDisplayGroups[entry.id] || 'admin_utils') === selectedDisplayGroup)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    [groupedMethodEntries, methodDisplayGroups, selectedDisplayGroup],
  );
  const selectMethodByIdentity = React.useCallback((entry: MethodCatalogEntry) => {
    selectMethodByKind(entry.kind, entry.name);
  }, [selectMethodByKind]);
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
  const currentMethodIdentity = React.useMemo<MethodCatalogEntry | null>(() => {
    if (methodPanelMode === 'ecr20_read') {
      return {
        id: `erc20Read:${erc20ReadProps.selectedReadMethod}`,
        name: erc20ReadProps.selectedReadMethod,
        label: erc20ReadProps.selectedReadMethod,
        kind: 'erc20Read',
      };
    }
    if (methodPanelMode === 'erc20_write') {
      return {
        id: `erc20Write:${erc20WriteProps.selectedWriteMethod}`,
        name: erc20WriteProps.selectedWriteMethod,
        label: erc20WriteProps.selectedWriteMethod,
        kind: 'erc20Write',
      };
    }
    if (methodPanelMode === 'spcoin_rread') {
      const methodName = spCoinReadProps.selectedSpCoinReadMethod;
      return {
        id: `spCoinRead:${methodName}`,
        name: methodName,
        label: String(spCoinReadProps.spCoinReadMethodDefs[methodName]?.title || methodName),
        kind: 'spCoinRead',
      };
    }
    if (methodPanelMode === 'spcoin_write') {
      const methodName = spCoinWriteProps.selectedSpCoinWriteMethod;
      return {
        id: `spCoinWrite:${methodName}`,
        name: methodName,
        label: String(spCoinWriteProps.spCoinWriteMethodDefs[methodName]?.title || methodName),
        kind: 'spCoinWrite',
      };
    }
    const methodName = serializationTestProps.selectedSerializationTestMethod;
    return {
      id: `serialization:${methodName}`,
      name: methodName,
      label: String(serializationTestProps.serializationTestMethodDefs[methodName]?.title || methodName),
      kind: 'serialization',
    };
  }, [
    erc20ReadProps.selectedReadMethod,
    erc20WriteProps.selectedWriteMethod,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    serializationTestProps.serializationTestMethodDefs,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinReadProps.spCoinReadMethodDefs,
    spCoinWriteProps.selectedSpCoinWriteMethod,
    spCoinWriteProps.spCoinWriteMethodDefs,
  ]);
  React.useEffect(() => {
    if (didRestoreSelectedMethodRef.current) return;
    if (!didHydratePanelUiRef.current) return;
    const storedMethodId = storedMethodsPanelUiState?.selectedMethodId;
    if (!storedMethodId) {
      didRestoreSelectedMethodRef.current = true;
      return;
    }
    const match = groupedMethodEntries.find((entry) => entry.id === storedMethodId);
    if (!match) return;
    if (currentMethodIdentity?.id === storedMethodId) {
      didRestoreSelectedMethodRef.current = true;
      return;
    }
    didRestoreSelectedMethodRef.current = true;
    selectMethodByIdentity(match);
  }, [
    currentMethodIdentity,
    groupedMethodEntries,
    selectMethodByIdentity,
    storedMethodsPanelUiState,
  ]);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPanelUiPersistenceReady) return;
    window.localStorage.setItem(
      METHODS_PANEL_UI_STORAGE_KEY,
      JSON.stringify({
        scriptEditorKind,
        isManageEnabled,
        selectedAlterMode,
        selectedDisplayGroup,
        writeTraceEnabled,
        showOnChainMethods,
        showOffChainMethods,
        selectedMethodId: currentMethodIdentity?.id || '',
      } satisfies StoredMethodsPanelUiState),
    );
  }, [
    currentMethodIdentity,
    isManageEnabled,
    isPanelUiPersistenceReady,
    scriptEditorKind,
    selectedAlterMode,
    selectedDisplayGroup,
    showOffChainMethods,
    showOnChainMethods,
    writeTraceEnabled,
  ]);
  const activeAlterMemberLists = React.useMemo<EditableMemberLists>(() => {
    if (activeMethodPanelTab === 'erc20') {
      return methodPanelMode === 'erc20_write' ? erc20WriteMemberLists : erc20ReadMemberLists;
    }
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') return spCoinReadMemberLists;
      if (methodPanelMode === 'spcoin_write') return spCoinWriteMemberLists;
      return serializationMemberLists;
    }
    if (activeMethodPanelTab === 'todos') return spCoinWriteMemberLists;
    if (methodPanelMode === 'spcoin_rread') return spCoinReadMemberLists;
    if (methodPanelMode === 'spcoin_write') return spCoinWriteMemberLists;
    return serializationMemberLists;
  }, [
    activeMethodPanelTab,
    erc20ReadMemberLists,
    erc20WriteMemberLists,
    methodPanelMode,
    serializationMemberLists,
    spCoinReadMemberLists,
    spCoinWriteMemberLists,
  ]);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const hydrateMethodMemberLists = async () => {
      try {
        const response = await fetch('/api/spCoin/lab/method-member-lists', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as MethodMemberListPayload;
        if (cancelled || !payload?.lists) return;
        setSerializationMemberLists(cloneAlterMemberLists(payload.lists.serialization));
        setSpCoinReadMemberLists(cloneAlterMemberLists(payload.lists.spCoinRead));
        setSpCoinWriteMemberLists(cloneAlterMemberLists(payload.lists.spCoinWrite));
        setErc20ReadMemberLists(cloneAlterMemberLists(payload.lists.erc20Read));
        setErc20WriteMemberLists(cloneAlterMemberLists(payload.lists.erc20Write));
        setMethodDisplayGroups({ ...(payload.displayGroups || {}) });
      } catch {
        // Fall back to the in-memory defaults if file hydration fails.
      } finally {
        if (!cancelled) setMemberListPersistenceHydrated(true);
      }
    };

    void hydrateMethodMemberLists();
    return () => {
      cancelled = true;
    };
  }, []);
  React.useEffect(() => {
    if (!memberListPersistenceHydrated) return;
    void fetch('/api/spCoin/lab/method-member-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(persistedMemberListPayload),
    }).catch(() => {
      // Ignore transient persistence failures in the UI layer.
    });
  }, [memberListPersistenceHydrated, persistedMemberListPayload]);
  const toggleCurrentMethodAlterMembership = React.useCallback((mode: AlterModeOption) => {
    if (!currentJsonMethodName || currentJsonMethodName === '__no_methods__') return;
    const toggleMember =
      (setter: React.Dispatch<React.SetStateAction<EditableMemberLists>>) => {
        const targetMode: StoredAlterMode = mode === 'Tested' ? 'Test' : mode;
        setter((prev) => ({
          ...prev,
          [targetMode]: {
            ...prev[targetMode],
            [currentJsonMethodName]:
              mode === 'Tested'
                ? Boolean(prev.Test?.[currentJsonMethodName])
                : !prev[targetMode]?.[currentJsonMethodName],
          },
        }));
      };
    if (activeMethodPanelTab === 'erc20') {
      if (methodPanelMode === 'erc20_write') {
        toggleMember(setErc20WriteMemberLists);
      } else {
        toggleMember(setErc20ReadMemberLists);
      }
      return;
    }
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') {
        toggleMember(setSpCoinReadMemberLists);
      } else if (methodPanelMode === 'spcoin_write') {
        toggleMember(setSpCoinWriteMemberLists);
      } else {
        toggleMember(setSerializationMemberLists);
      }
      return;
    }
    if (activeMethodPanelTab === 'todos') {
      toggleMember(setSpCoinWriteMemberLists);
      return;
    }
    if (methodPanelMode === 'spcoin_rread') {
      toggleMember(setSpCoinReadMemberLists);
      return;
    }
    if (methodPanelMode === 'spcoin_write') {
      toggleMember(setSpCoinWriteMemberLists);
      return;
    }
    toggleMember(setSerializationMemberLists);
  }, [
    activeMethodPanelTab,
    currentJsonMethodName,
    methodPanelMode,
  ]);
  const changeCurrentMethodGroup = React.useCallback((nextGroup: MethodDisplayGroup) => {
    if (!currentMethodIdentity) {
      setSelectedDisplayGroup(nextGroup);
      return;
    }
    setMethodDisplayGroups((prev) => ({
      ...prev,
      [currentMethodIdentity.id]: nextGroup,
    }));
    setSelectedDisplayGroup(nextGroup);
  }, [currentMethodIdentity]);
  const typeScriptMethodOptions = React.useMemo(() => {
    return sortMethodNames(visibleGroupedMethods.map((entry) => entry.name));
  }, [
    visibleGroupedMethods,
  ]);
  const mappedTypeScriptScriptId = React.useMemo(() => {
    const targetFile = resolveTypeScriptTargetFileForIdentity(currentMethodIdentity?.kind || null, currentJsonMethodName);
    const candidateNames = [targetFile, currentJsonMethodName].filter(Boolean) as string[];
    const normalizedCandidates = new Set(candidateNames.map(normalizeMethodScriptLookup));
    const match = javaScriptEditorProps.visibleJavaScriptScripts.find((script) =>
      normalizedCandidates.has(normalizeMethodScriptLookup(script.name)),
    );
    return match?.id || '';
  }, [
    currentJsonMethodName,
    currentMethodIdentity,
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
  React.useEffect(() => {
    if (!visibleGroupedMethods.length) return;
    if (currentMethodIdentity && visibleGroupedMethods.some((entry) => entry.id === currentMethodIdentity.id)) return;
    selectMethodByIdentity(visibleGroupedMethods[0]);
  }, [currentMethodIdentity, selectMethodByIdentity, visibleGroupedMethods]);
  React.useEffect(() => {
    if (activeMethodPanelTab === 'admin_utils') return;
    if (methodPanelMode !== 'serialization_tests') return;
    if (visibleSerializationOptions.length === 0) return;
    if (visibleSerializationOptions.includes(serializationTestProps.selectedSerializationTestMethod)) return;
    serializationTestProps.setSelectedSerializationTestMethod(visibleSerializationOptions[0]);
  }, [
    activeMethodPanelTab,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    serializationTestProps.setSelectedSerializationTestMethod,
    visibleSerializationOptions,
  ]);
  React.useEffect(() => {
    if (activeMethodPanelTab !== 'admin_utils' || methodPanelMode !== 'serialization_tests') return;
    if (visibleAdminUtilitySerializationOptions.length === 0) return;
    if (visibleAdminUtilitySerializationOptions.includes(serializationTestProps.selectedSerializationTestMethod)) return;
    serializationTestProps.setSelectedSerializationTestMethod(visibleAdminUtilitySerializationOptions[0]);
  }, [
    activeMethodPanelTab,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    serializationTestProps.setSelectedSerializationTestMethod,
    visibleAdminUtilitySerializationOptions,
  ]);
  React.useEffect(() => {
    if (methodPanelMode !== 'ecr20_read') return;
    if (visibleErc20ReadOptions.length === 0) return;
    if (visibleErc20ReadOptions.includes(erc20ReadProps.selectedReadMethod)) return;
    erc20ReadProps.setSelectedReadMethod(visibleErc20ReadOptions[0]);
  }, [
    erc20ReadProps.selectedReadMethod,
    erc20ReadProps.setSelectedReadMethod,
    methodPanelMode,
    visibleErc20ReadOptions,
  ]);
  React.useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    if (visibleErc20WriteOptions.length === 0) return;
    if (visibleErc20WriteOptions.includes(erc20WriteProps.selectedWriteMethod)) return;
    erc20WriteProps.setSelectedWriteMethod(visibleErc20WriteOptions[0]);
  }, [
    erc20WriteProps.selectedWriteMethod,
    erc20WriteProps.setSelectedWriteMethod,
    methodPanelMode,
    visibleErc20WriteOptions,
  ]);
  React.useEffect(() => {
    if (activeMethodPanelTab === 'admin_utils') return;
    if (methodPanelMode !== 'spcoin_rread') return;
    if (visibleSpCoinReadOptions.length === 0) return;
    if (visibleSpCoinReadOptions.includes(spCoinReadProps.selectedSpCoinReadMethod)) return;
    spCoinReadProps.setSelectedSpCoinReadMethod(visibleSpCoinReadOptions[0]);
  }, [
    activeMethodPanelTab,
    methodPanelMode,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinReadProps.setSelectedSpCoinReadMethod,
    visibleSpCoinReadOptions,
  ]);
  React.useEffect(() => {
    if (activeMethodPanelTab === 'admin_utils') return;
    if (activeMethodPanelTab === 'todos') {
      if (visibleTodoWriteOptions.length === 0) return;
      if (visibleTodoWriteOptions.includes(spCoinWriteProps.selectedSpCoinWriteMethod)) return;
      spCoinWriteProps.setSelectedSpCoinWriteMethod(visibleTodoWriteOptions[0]);
      return;
    }
    if (methodPanelMode !== 'spcoin_write') return;
    if (visibleSpCoinWriteOptions.length === 0) return;
    if (visibleSpCoinWriteOptions.includes(spCoinWriteProps.selectedSpCoinWriteMethod)) return;
    spCoinWriteProps.setSelectedSpCoinWriteMethod(visibleSpCoinWriteOptions[0]);
  }, [
    activeMethodPanelTab,
    methodPanelMode,
    spCoinWriteProps.selectedSpCoinWriteMethod,
    spCoinWriteProps.setSelectedSpCoinWriteMethod,
    visibleSpCoinWriteOptions,
    visibleTodoWriteOptions,
  ]);
  React.useEffect(() => {
    if (activeMethodPanelTab !== 'admin_utils' || methodPanelMode !== 'spcoin_rread') return;
    if (visibleAdminUtilsReadOptions.length === 0) return;
    if (visibleAdminUtilsReadOptions.includes(spCoinReadProps.selectedSpCoinReadMethod)) return;
    spCoinReadProps.setSelectedSpCoinReadMethod(visibleAdminUtilsReadOptions[0]);
  }, [
    activeMethodPanelTab,
    methodPanelMode,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinReadProps.setSelectedSpCoinReadMethod,
    visibleAdminUtilsReadOptions,
  ]);
  React.useEffect(() => {
    if (activeMethodPanelTab !== 'admin_utils' || methodPanelMode !== 'spcoin_write') return;
    if (visibleAdminUtilsOwnerOptions.length === 0) return;
    if (visibleAdminUtilsOwnerOptions.includes(spCoinWriteProps.selectedSpCoinWriteMethod)) return;
    spCoinWriteProps.setSelectedSpCoinWriteMethod(visibleAdminUtilsOwnerOptions[0]);
  }, [
    activeMethodPanelTab,
    methodPanelMode,
    spCoinWriteProps.selectedSpCoinWriteMethod,
    spCoinWriteProps.setSelectedSpCoinWriteMethod,
    visibleAdminUtilsOwnerOptions,
  ]);
  const showLoadingPanel = isMethodPanelLoading || (isJavaScriptScriptMode && javaScriptEditorProps.isJavaScriptFileLoading);
  const loadingPanel = (
    <div className="rounded-lg border border-[#31416F] bg-[#0E111B] px-4 py-6 text-sm text-slate-400">
      {isJavaScriptScriptMode ? 'Loading TypeScript file...' : 'Loading method panel...'}
    </div>
  );
  const sharedMethodSelect = React.useMemo(() => {
    if (isJavaScriptScriptMode && !showAllCardSectionsForVisualTest) return null;
    const baseClassName = 'grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]';
    return (
      <div className={baseClassName}>
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <div className="relative w-full min-w-0">
          <select
            aria-label="JSON method"
            title="JSON method"
            className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            value={currentMethodIdentity && visibleGroupedMethods.some((entry) => entry.id === currentMethodIdentity.id) ? currentMethodIdentity.id : '__no_methods__'}
            onChange={(event) => {
              const next = visibleGroupedMethods.find((entry) => entry.id === event.target.value);
              if (!next) return;
              selectMethodByIdentity(next);
            }}
            disabled={visibleGroupedMethods.length === 0}
          >
          {visibleGroupedMethods.length === 0 ? <option value="__no_methods__">No methods available</option> : null}
          {visibleGroupedMethods.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
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
    currentMethodIdentity,
    isJavaScriptScriptMode,
    selectMethodByIdentity,
    showAllCardSectionsForVisualTest,
    visibleGroupedMethods,
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
              <div className="ml-auto flex items-start gap-4">
                <label className="inline-flex items-center justify-end gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#5981F3]"
                    checked={isManageEnabled}
                    onChange={(event) => setIsManageEnabled(event.target.checked)}
                  />
                  <span>manage Method</span>
                </label>
              </div>
              {isJavaScriptScriptMode ? (
                <div className="flex items-start gap-4">
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
              ) : null}
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
                    checked={selectedDisplayGroup === value}
                    onMouseDown={(e) => {
                      if (selectedDisplayGroup === value) e.preventDefault();
                    }}
                    onChange={(e) => {
                      if (selectedDisplayGroup === value) return;
                      setSelectedDisplayGroup(e.target.value as MethodDisplayGroup);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          {isJsonScriptMode && isManageEnabled ? (
            <div className="mb-3 -mx-4 border-y border-[#31416F] bg-[#0E111B] px-4 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0 text-xs text-[#8FA8FF]">
                  {ALTER_MODE_OPTIONS.map((option) => (
                    <label key={option} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={alterModeGroupName}
                        value={option}
                        checked={selectedAlterMode === option}
                        onChange={() => setSelectedAlterMode(option)}
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                      />
                      <span className={isMethodInAlterMode(currentJsonMethodName, activeAlterMemberLists, option) ? 'text-green-400' : 'text-red-400'}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
                <label className="inline-flex shrink-0 items-center justify-end gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#E5B94F]"
                    checked={writeTraceEnabled}
                    onChange={toggleWriteTrace}
                  />
                  <span>Trace</span>
                </label>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-[#8FA8FF]">
                  <span>Group Members</span>
                  <select
                    className="rounded-lg border border-[#334155] bg-[#0B1220] px-3 py-2 text-xs text-white"
                    value={alterModeDropdownValue}
                    onChange={(event) => {
                      const nextMode = event.target.value as AlterModeOption | '__alter_mode_placeholder__';
                      if (nextMode === '__alter_mode_placeholder__') return;
                      toggleCurrentMethodAlterMembership(nextMode);
                      setAlterModeDropdownValue('__alter_mode_placeholder__');
                    }}
                  >
                    <option value="__alter_mode_placeholder__">Toggle List Membership</option>
                    {ALTER_MODE_OPTIONS.map((option) => (
                      <option
                        key={`alter-mode-${option}`}
                        value={option}
                        style={{
                          color: isMethodInAlterMode(currentJsonMethodName, activeAlterMemberLists, option) ? '#22c55e' : '#ef4444',
                          fontWeight: '700',
                        }}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-[#8FA8FF]">
                  <span>Change Group</span>
                  <select
                    className="rounded-lg border border-[#334155] bg-[#0B1220] px-3 py-2 text-xs text-white"
                    value={selectedDisplayGroup}
                    onChange={(event) => {
                      const nextTab = event.target.value as MethodDisplayGroup;
                      if (selectedDisplayGroup === nextTab) return;
                      changeCurrentMethodGroup(nextTab);
                    }}
                  >
                    {methodPanelOptions.map(([value, label]) => (
                      <option key={`change-group-${value}`} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}
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
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || methodPanelMode === 'spcoin_rread') ? <SpCoinReadController {...spCoinReadProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} allowAdminReadMethods={activeMethodPanelTab === 'admin_utils'} /> : null : null}
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || methodPanelMode === 'spcoin_write') ? <SpCoinWriteController {...spCoinWriteProps} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
                    {!isJavaScriptScriptMode || showAllCardSectionsForVisualTest ? (showAllMethodPanelsForVisualTest || methodPanelMode === 'serialization_tests') ? <SerializationTestController {...serializationTestProps} serializationTestOptions={visibleSerializationOptions} hideMethodSelect hideActionButtons hideAddToScript={isJavaScriptScriptMode} /> : null : null}
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
