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
import { NativeSelectChevron, SelectChevron } from './SelectChevron';
import { normalizeSpCoinReadMethod } from '../jsonMethods/spCoin/read';
import {
  DEFAULT_METHOD_MEMBER_LIST_PAYLOAD,
  cloneAlterMemberLists,
  type AlterMemberLists,
  type MethodDisplayGroup,
  type MethodMemberListPayload,
  type StoredAlterMode,
} from '@/lib/spCoinLab/methodMemberLists';

type MethodPanelTab = MethodPanelMode | 'todos' | 'erc20' | 'admin_utils';
type MethodDisplayFilter = MethodDisplayGroup | 'all';
type AlterModeOption = StoredAlterMode | 'All' | 'Tested';
type AlterMembershipOption = StoredAlterMode | 'Tested';
type EditableMemberLists = AlterMemberLists;
type MethodIdentityKind = 'erc20Read' | 'erc20Write' | 'spCoinRead' | 'spCoinWrite' | 'serialization';

type MethodCatalogEntry = {
  id: string;
  name: string;
  label: string;
  kind: MethodIdentityKind;
};

const METHOD_DISPLAY_GROUP_OPTIONS: Array<[MethodDisplayGroup, string]> = [
  ['erc20', 'ERC20'],
  ['spcoin_rread', 'SpCoin Read'],
  ['spcoin_write', 'SpCoin Write'],
  ['admin_utils', 'Admin Utils'],
  ['todos', 'ToDos'],
];
const METHOD_DISPLAY_FILTER_OPTIONS: Array<[MethodDisplayFilter, string]> = [
  ['all', 'All'],
  ...METHOD_DISPLAY_GROUP_OPTIONS,
];

function isMethodDisplayGroup(value: unknown): value is MethodDisplayGroup {
  return (
    value === 'erc20' ||
    value === 'spcoin_rread' ||
    value === 'spcoin_write' ||
    value === 'admin_utils' ||
    value === 'todos'
  );
}

function isMethodDisplayFilter(value: unknown): value is MethodDisplayFilter {
  return value === 'all' || isMethodDisplayGroup(value);
}

function getMethodDisplayGroupLabel(value: MethodDisplayGroup) {
  return METHOD_DISPLAY_GROUP_OPTIONS.find(([group]) => group === value)?.[1] || value;
}

function getDisplayGroupForPanelTab(tab: MethodPanelTab): MethodDisplayGroup {
  if (tab === 'ecr20_read' || tab === 'erc20_write' || tab === 'erc20') return 'erc20';
  if (tab === 'serialization_tests') return 'admin_utils';
  if (isMethodDisplayGroup(tab)) return tab;
  return 'admin_utils';
}

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
  getMasterAccountMetaData: 'getMasterAccountMetaData.ts',
  getMasterAccountElement: 'getMasterAccountElement.ts',
  getMasterAccountList: 'getMasterAccountList.ts',
  getMasterAccountKeyCount: 'getMasterAccountKeyCount.ts',
  getMasterAccountCount: 'getMasterAccountListSize.ts',
  version: 'getVersion.ts',
};

const SPCOIN_WRITE_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  addRecipientTransaction: 'add.ts',
  addAgentTransaction: 'add.ts',
  addBackDatedRecipientTransaction: 'add.ts',
  addBackDatedAgentTransaction: 'add.ts',
  backDateRecipientTransaction: 'add.ts',
  backDateAgentTransaction: 'add.ts',
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
  updateSponsorAccountRewards: 'rewards.ts',
  updateRecipientAccountRewards: 'rewards.ts',
  updateAgentAccountRewards: 'rewards.ts',
  updateMasterStakingRewards: 'rewards.ts',
  setInflationRate: 'add.ts',
  setRecipientRateRange: 'add.ts',
  setRecipientRateIncrement: 'add.ts',
  setAgentRateRange: 'add.ts',
  setAgentRateIncrement: 'add.ts',
  setLowerRecipientRate: 'setLowerRecipientRate.ts',
  setUpperRecipientRate: 'setUpperRecipientRate.ts',
  setLowerAgentRate: 'setLowerAgentRate.ts',
  setUpperAgentRate: 'setUpperAgentRate.ts',
};

const TODO_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  deleteAccountTree: 'delete.ts',
};

const UTILS_TYPESCRIPT_TARGET_BY_METHOD: Record<string, string> = {
  compareSpCoinContractSize: 'compareSpCoinContractSize.ts',
  creationTime: 'creationTime.ts',
  getMasterAccountMetaData: 'getMasterAccountMetaData.ts',
  getMasterAccountElement: 'getMasterAccountElement.ts',
  getMasterAccountList: 'getMasterAccountList.ts',
  getMasterAccountKeyCount: 'getMasterAccountKeyCount.ts',
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

function getMethodEntryDisplayKey(entry: MethodCatalogEntry) {
  return String(entry.label || entry.name || '').trim().toLowerCase();
}

function getMethodEntryPriority(entry: MethodCatalogEntry) {
  if (entry.kind === 'erc20Write' || entry.kind === 'spCoinWrite') return 3;
  if (entry.kind === 'erc20Read' || entry.kind === 'spCoinRead') return 2;
  return 1;
}

function dedupeMethodCatalogEntries(entries: MethodCatalogEntry[]) {
  const uniqueById = new Map<string, MethodCatalogEntry>();
  for (const entry of entries) {
    if (!uniqueById.has(entry.id)) uniqueById.set(entry.id, entry);
  }

  const uniqueByLabel = new Map<string, MethodCatalogEntry>();
  for (const entry of uniqueById.values()) {
    const key = getMethodEntryDisplayKey(entry);
    const existing = uniqueByLabel.get(key);
    if (!existing || getMethodEntryPriority(entry) > getMethodEntryPriority(existing)) {
      uniqueByLabel.set(key, entry);
    }
  }

  return Array.from(uniqueByLabel.values());
}

function filterMethodsByAlterMode(
  methods: string[],
  memberLists: EditableMemberLists,
  mode: AlterModeOption,
) {
  if (mode === 'All') return methods;
  if (mode === 'Tested') {
    const testMemberList = memberLists.Test ?? {};
    return methods.filter((name) => testMemberList[name] !== true);
  }
  const memberList = memberLists[mode] ?? {};
  return methods.filter((name) => memberList[name] === true);
}

function isMethodInAlterMode(
  methodName: string,
  memberLists: EditableMemberLists,
  mode: AlterModeOption,
) {
  if (!methodName || methodName === '__no_methods__') return false;
  if (mode === 'All') return true;
  if (mode === 'Tested') {
    return memberLists.Test?.[methodName] !== true;
  }
  return memberLists[mode]?.[methodName] === true;
}

function isMethodIdentityInAlterMode(
  kind: MethodIdentityKind,
  methodName: string,
  memberLists: EditableMemberLists,
  mode: AlterModeOption,
) {
  const methodNames = getEquivalentMemberListMethodNames(kind, methodName, memberLists);
  if (mode === 'Tested') {
    return methodNames.every((name) => isMethodInAlterMode(name, memberLists, mode));
  }
  return methodNames.some((name) => isMethodInAlterMode(name, memberLists, mode));
}

function getEquivalentMemberListMethodNames(
  kind: MethodIdentityKind,
  methodName: string,
  memberLists: EditableMemberLists,
) {
  if (kind !== 'spCoinRead') return [methodName];
  const normalizedMethod = normalizeSpCoinReadMethod(methodName);
  const allKnownNames = new Set<string>();
  for (const memberList of Object.values(memberLists)) {
    for (const name of Object.keys(memberList ?? {})) allKnownNames.add(name);
  }
  const equivalentNames = Array.from(allKnownNames).filter(
    (name) => normalizeSpCoinReadMethod(name) === normalizedMethod,
  );
  return equivalentNames.length > 0 ? equivalentNames : [methodName];
}

const BLOCKED_SPCOIN_READ_TITLES = new Set([
  'creationTime',
  'version',
  'getMasterAccountMetaData',
  'getMasterAccountElement',
  'getMasterAccountKeyCount',
  'getMasterAccountCount',
  'getMasterAccountKeys',
]);

const ALTER_MODE_OPTIONS: AlterModeOption[] = ['All', 'Basic', 'Standard', 'Test', 'Tested', 'Todo', 'Complete'];
const ALTER_MEMBERSHIP_OPTIONS: AlterMembershipOption[] = ['Basic', 'Standard', 'Test', 'Tested', 'Todo', 'Complete'];
const METHODS_PANEL_UI_STORAGE_KEY = 'spCoinLabMethodsPanelUiKey';
const METHOD_MEMBER_LISTS_API_PATH = '/api/spCoin/lab/method-member-lists';
const refreshIconButtonClassName =
  'h-[30px] w-[30px] min-w-[30px] shrink-0 rounded-full flex items-center justify-center text-base leading-none text-[#5981F3] bg-[#243056] border-0 outline-none ring-0 transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

function isAlterModeOption(value: unknown): value is AlterModeOption {
  return ALTER_MODE_OPTIONS.includes(value as AlterModeOption);
}

function saveMethodMemberListPayload(payload: MethodMemberListPayload, keepalive = false) {
  return fetch(METHOD_MEMBER_LISTS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    keepalive,
  });
}

function flushMethodMemberListPayload(payload: MethodMemberListPayload) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const sent = navigator.sendBeacon(
      METHOD_MEMBER_LISTS_API_PATH,
      new Blob([body], { type: 'application/json' }),
    );
    if (sent) return;
  }
  void fetch(METHOD_MEMBER_LISTS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
    keepalive: true,
  }).catch(() => {
    // Ignore unload-time persistence failures.
  });
}

type StoredMethodsPanelUiState = {
  scriptEditorKind?: ScriptEditorKind;
  isManageEnabled?: boolean;
  selectedDisplayGroup?: MethodDisplayFilter;
  selectedAlterMode?: AlterModeOption;
  writeTraceEnabled?: boolean;
  useReadCache?: boolean;
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
    if (isMethodDisplayFilter(saved.selectedDisplayGroup)) {
      next.selectedDisplayGroup = saved.selectedDisplayGroup;
    }
    if (isAlterModeOption(saved.selectedAlterMode)) {
      next.selectedAlterMode = saved.selectedAlterMode;
    }
    if (typeof saved.writeTraceEnabled === 'boolean') {
      next.writeTraceEnabled = saved.writeTraceEnabled;
    }
    if (typeof saved.useReadCache === 'boolean') {
      next.useReadCache = saved.useReadCache;
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

function areEquivalentMethodEntries(a: MethodCatalogEntry | null, b: MethodCatalogEntry | null) {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.id === b.id || a.name === b.name) return true;
  if (a.kind === 'spCoinRead') {
    return normalizeSpCoinReadMethod(a.name) === normalizeSpCoinReadMethod(b.name);
  }
  return false;
}

function hasEquivalentSpCoinReadMethod(values: string[], methodName: string) {
  const normalizedMethod = normalizeSpCoinReadMethod(methodName);
  return values.some((value) => normalizeSpCoinReadMethod(value) === normalizedMethod);
}

function getAlterModeLabel(option: AlterModeOption) {
  return option === 'Todo' ? 'Depreciated' : option;
}

type Props = {
  articleClassName: string;
  methodsCardRef: MutableRefObject<HTMLElement | null>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  methodPanelTitle: string;
  isEditingScriptMethod: boolean;
  scriptEditorKind: ScriptEditorKind;
  setScriptEditorKind: React.Dispatch<React.SetStateAction<ScriptEditorKind>>;
  methodPanelMode: MethodPanelMode;
  activeMethodPanelTab: MethodPanelTab;
  selectMappedJsonMethod: (value: string) => void;
  selectMethodByKind: (kind: MethodIdentityKind, value: string) => void;
  beginNewMethodDraft: (afterReset?: () => void) => void;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  useReadCache: boolean;
  setUseReadCache: (value: boolean) => void;
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
  isEditingScriptMethod,
  scriptEditorKind,
  setScriptEditorKind,
  methodPanelMode,
  activeMethodPanelTab,
  selectMappedJsonMethod,
  selectMethodByKind,
  beginNewMethodDraft,
  writeTraceEnabled,
  toggleWriteTrace,
  useReadCache,
  setUseReadCache,
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
  const [selectedAlterMode, setSelectedAlterMode] = React.useState<AlterModeOption>(
    storedMethodsPanelUiState?.selectedAlterMode || 'Standard',
  );
  const [completeLockedPopupOpen, setCompleteLockedPopupOpen] = React.useState(false);
  const handleAlterModeChange = React.useCallback((option: AlterModeOption) => {
    setSelectedAlterMode(option);
  }, []);
  const [isAlterMembershipMenuOpen, setIsAlterMembershipMenuOpen] = React.useState(false);
  const [isChangeGroupMenuOpen, setIsChangeGroupMenuOpen] = React.useState(false);
  const [isReloadingMemberLists, setIsReloadingMemberLists] = React.useState(false);
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
  const [selectedDisplayGroup, setSelectedDisplayGroup] = React.useState<MethodDisplayFilter>(
    storedMethodsPanelUiState?.selectedDisplayGroup || getDisplayGroupForPanelTab(activeMethodPanelTab),
  );
  const changeSelectedDisplayGroup = React.useCallback((nextGroup: MethodDisplayFilter) => {
    if (selectedDisplayGroup === nextGroup) return;
    const applyGroupChange = () => {
      if (nextGroup === 'erc20' && !showOnChainMethods) {
        setShowOnChainMethods(true);
      }
      setSelectedDisplayGroup(nextGroup);
      setIsAlterMembershipMenuOpen(false);
      setIsChangeGroupMenuOpen(false);
    };
    if (isEditingScriptMethod) {
      beginNewMethodDraft(applyGroupChange);
      return;
    }
    applyGroupChange();
  }, [
    beginNewMethodDraft,
    isEditingScriptMethod,
    selectedDisplayGroup,
    setShowOnChainMethods,
    showOnChainMethods,
  ]);
  const isJavaScriptScriptMode = scriptEditorKind === 'javascript';
  const isJsonScriptMode = scriptEditorKind === 'json';
  const didHydratePanelUiRef = React.useRef(false);
  const didRestoreSelectedMethodRef = React.useRef(false);
  const alterMembershipMenuRef = React.useRef<HTMLDivElement | null>(null);
  const changeGroupMenuRef = React.useRef<HTMLDivElement | null>(null);
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
    if (
      typeof storedMethodsPanelUiState?.useReadCache === 'boolean' &&
      storedMethodsPanelUiState.useReadCache !== useReadCache
    ) {
      setUseReadCache(storedMethodsPanelUiState.useReadCache);
    }
    didHydratePanelUiRef.current = true;
    setIsPanelUiPersistenceReady(true);
  }, [
    scriptEditorKind,
    setScriptEditorKind,
    setShowOffChainMethods,
    setShowOnChainMethods,
    setUseReadCache,
    showOffChainMethods,
    showOnChainMethods,
    storedMethodsPanelUiState,
    toggleWriteTrace,
    useReadCache,
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
  const latestPersistedMemberListPayloadRef = React.useRef(persistedMemberListPayload);
  latestPersistedMemberListPayloadRef.current = persistedMemberListPayload;
  const queuedMemberListPayloadRef = React.useRef<MethodMemberListPayload | null>(null);
  const isSavingMemberListPayloadRef = React.useRef(false);
  const runQueuedMemberListPayloadSave = React.useCallback(async () => {
    if (isSavingMemberListPayloadRef.current) return;
    isSavingMemberListPayloadRef.current = true;
    try {
      while (queuedMemberListPayloadRef.current) {
        const payload = queuedMemberListPayloadRef.current;
        queuedMemberListPayloadRef.current = null;
        try {
          await saveMethodMemberListPayload(payload);
        } catch {
          // Ignore transient persistence failures in the UI layer.
        }
      }
    } finally {
      isSavingMemberListPayloadRef.current = false;
    }
  }, []);
  const queueMemberListPayloadSave = React.useCallback((payload: MethodMemberListPayload) => {
    queuedMemberListPayloadRef.current = payload;
    void runQueuedMemberListPayloadSave();
  }, [runQueuedMemberListPayloadSave]);
  const methodPanelOptions = METHOD_DISPLAY_FILTER_OPTIONS;
  const methodGroupOptions = METHOD_DISPLAY_GROUP_OPTIONS;
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
      dedupeMethodNamesByLabel(
        sortMethodNames(
          filterMethodsByAlterMode(
            spCoinReadProps.spCoinAdminReadOptions,
            spCoinReadMemberLists,
            selectedAlterMode,
          ),
        ),
        (name) => String(spCoinReadProps.spCoinReadMethodDefs[name]?.title || name),
      ),
    [
      spCoinReadProps.spCoinReadMethodDefs,
      spCoinReadProps.spCoinAdminReadOptions,
      spCoinReadMemberLists,
      selectedAlterMode,
    ],
  );
  const visibleAdminUtilsOwnerOptions = React.useMemo(
    () =>
      sortMethodNames(
        filterMethodsByAlterMode(
          spCoinWriteProps.spCoinAdminWriteOptions,
          spCoinWriteMemberLists,
          selectedAlterMode,
        ),
      ),
    [spCoinWriteMemberLists, spCoinWriteProps.spCoinAdminWriteOptions, selectedAlterMode],
  );
  const visibleAdminUtilitySerializationOptions = React.useMemo(
    () =>
      sortMethodNames(
        [...adminUtilityReadOptions, ...adminUtilityOwnerOptions].filter(
          (name) => Boolean(serializationTestProps.serializationTestMethodDefs[name]),
        ),
      ),
    [adminUtilityOwnerOptions, adminUtilityReadOptions, serializationTestProps.serializationTestMethodDefs],
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
    return dedupeMethodCatalogEntries(entries);
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
        .filter((entry) => selectedDisplayGroup === 'all' || (methodDisplayGroups[entry.id] || 'admin_utils') === selectedDisplayGroup)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    [groupedMethodEntries, methodDisplayGroups, selectedDisplayGroup],
  );
  const selectMethodByIdentity = React.useCallback((entry: MethodCatalogEntry) => {
    selectMethodByKind(entry.kind, entry.name);
  }, [selectMethodByKind]);
  const getMethodEntryMemberLists = React.useCallback(
    (entry: MethodCatalogEntry): EditableMemberLists => {
      if (entry.kind === 'erc20Read') return erc20ReadMemberLists;
      if (entry.kind === 'erc20Write') return erc20WriteMemberLists;
      if (entry.kind === 'spCoinRead') return spCoinReadMemberLists;
      if (entry.kind === 'spCoinWrite') return spCoinWriteMemberLists;
      return serializationMemberLists;
    },
    [
      erc20ReadMemberLists,
      erc20WriteMemberLists,
      serializationMemberLists,
      spCoinReadMemberLists,
      spCoinWriteMemberLists,
    ],
  );
  const methodEntryNeedsTesting = React.useCallback(
    (entry: MethodCatalogEntry) => {
      const memberLists = getMethodEntryMemberLists(entry);
      return isMethodIdentityInAlterMode(entry.kind, entry.name, memberLists, 'Test');
    },
    [getMethodEntryMemberLists],
  );
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
  const currentMethodDisplayGroup = React.useMemo<MethodDisplayGroup>(() => {
    if (!currentMethodIdentity) {
      return selectedDisplayGroup === 'all' ? 'spcoin_rread' : selectedDisplayGroup;
    }
    return methodDisplayGroups[currentMethodIdentity.id] || 'admin_utils';
  }, [currentMethodIdentity, methodDisplayGroups, selectedDisplayGroup]);
  const currentMethodMemberLists = React.useMemo(
    () => (currentMethodIdentity ? getMethodEntryMemberLists(currentMethodIdentity) : null),
    [currentMethodIdentity, getMethodEntryMemberLists],
  );
  const isCurrentMethodInSelectedAlterMode = React.useMemo(
    () =>
      currentMethodIdentity && currentMethodMemberLists
        ? isMethodIdentityInAlterMode(
            currentMethodIdentity.kind,
            currentMethodIdentity.name,
            currentMethodMemberLists,
            selectedAlterMode,
          )
        : true,
    [currentMethodIdentity, currentMethodMemberLists, selectedAlterMode],
  );
  React.useEffect(() => {
    if (!isEditingScriptMethod || !currentMethodIdentity) return;
    if (!isCurrentMethodInSelectedAlterMode && selectedAlterMode !== 'All') {
      setSelectedAlterMode('All');
    }
  }, [
    currentMethodIdentity,
    isCurrentMethodInSelectedAlterMode,
    isEditingScriptMethod,
    selectedAlterMode,
  ]);
  const selectedDisplayGroupLabel = getMethodDisplayGroupLabel(currentMethodDisplayGroup);
  const visibleCurrentMethodIdentity = React.useMemo(
    () =>
      currentMethodIdentity
        ? visibleGroupedMethods.find((entry) => areEquivalentMethodEntries(entry, currentMethodIdentity)) || null
        : null,
    [currentMethodIdentity, visibleGroupedMethods],
  );
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
        selectedDisplayGroup,
        selectedAlterMode,
        writeTraceEnabled,
        useReadCache,
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
    useReadCache,
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
  const currentMethodInAlterMode = React.useCallback(
    (mode: AlterModeOption) => {
      if (!currentJsonMethodName || currentJsonMethodName === '__no_methods__') return false;
      if (!currentMethodIdentity) return isMethodInAlterMode(currentJsonMethodName, activeAlterMemberLists, mode);
      return isMethodIdentityInAlterMode(
        currentMethodIdentity.kind,
        currentJsonMethodName,
        activeAlterMemberLists,
        mode,
      );
    },
    [activeAlterMemberLists, currentJsonMethodName, currentMethodIdentity],
  );
  React.useEffect(() => {
    if (!isAlterMembershipMenuOpen && !isChangeGroupMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (completeLockedPopupOpen) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!alterMembershipMenuRef.current?.contains(target)) setIsAlterMembershipMenuOpen(false);
      if (!changeGroupMenuRef.current?.contains(target)) setIsChangeGroupMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [isAlterMembershipMenuOpen, isChangeGroupMenuOpen]);
  React.useEffect(() => {
    if (currentJsonMethodName && currentJsonMethodName !== '__no_methods__') return;
    setIsAlterMembershipMenuOpen(false);
    setIsChangeGroupMenuOpen(false);
  }, [currentJsonMethodName]);
  const applyMethodMemberListPayload = React.useCallback((payload: MethodMemberListPayload) => {
    setSerializationMemberLists(cloneAlterMemberLists(payload.lists.serialization));
    setSpCoinReadMemberLists(cloneAlterMemberLists(payload.lists.spCoinRead));
    setSpCoinWriteMemberLists(cloneAlterMemberLists(payload.lists.spCoinWrite));
    setErc20ReadMemberLists(cloneAlterMemberLists(payload.lists.erc20Read));
    setErc20WriteMemberLists(cloneAlterMemberLists(payload.lists.erc20Write));
    setMethodDisplayGroups({ ...(payload.displayGroups || {}) });
  }, []);
  const loadMethodMemberListPayload = React.useCallback(async () => {
    const response = await fetch(METHOD_MEMBER_LISTS_API_PATH, { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = (await response.json()) as MethodMemberListPayload;
    return payload?.lists ? payload : null;
  }, []);
  const reloadMethodMemberLists = React.useCallback(async () => {
    setIsReloadingMemberLists(true);
    queuedMemberListPayloadRef.current = null;
    try {
      const payload = await loadMethodMemberListPayload();
      if (!payload) return;
      applyMethodMemberListPayload(payload);
      setMemberListPersistenceHydrated(true);
    } catch {
      // Keep the current editable lists if the disk reload fails.
    } finally {
      setIsReloadingMemberLists(false);
    }
  }, [applyMethodMemberListPayload, loadMethodMemberListPayload]);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const hydrateMethodMemberLists = async () => {
      try {
        const payload = await loadMethodMemberListPayload();
        if (cancelled || !payload) return;
        applyMethodMemberListPayload(payload);
        setMemberListPersistenceHydrated(true);
      } catch {
        // Do not save in-memory defaults over the JSON file if hydration fails.
      }
    };

    void hydrateMethodMemberLists();
    return () => {
      cancelled = true;
    };
  }, [applyMethodMemberListPayload, loadMethodMemberListPayload]);
  React.useEffect(() => {
    if (!memberListPersistenceHydrated) return;
    queueMemberListPayloadSave(persistedMemberListPayload);
  }, [memberListPersistenceHydrated, persistedMemberListPayload, queueMemberListPayloadSave]);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!memberListPersistenceHydrated) return;
    const flushLatestPayload = () => {
      flushMethodMemberListPayload(latestPersistedMemberListPayloadRef.current);
    };
    window.addEventListener('pagehide', flushLatestPayload);
    return () => {
      window.removeEventListener('pagehide', flushLatestPayload);
    };
  }, [memberListPersistenceHydrated]);
  const toggleCurrentMethodAlterMembership = React.useCallback((mode: AlterMembershipOption) => {
    if (currentMethodInAlterMode('Complete') && mode !== 'Complete' && selectedAlterMode !== 'Complete') {
      setIsAlterMembershipMenuOpen(true);
      setCompleteLockedPopupOpen(true);
      return;
    }
    const effectiveSelectedMode: AlterModeOption = selectedAlterMode === 'Tested' ? 'Test' : selectedAlterMode;
    const effectiveMode: AlterModeOption = mode === 'Tested' ? 'Test' : mode;
    if (effectiveMode === effectiveSelectedMode && currentMethodInAlterMode(mode)) {
      setIsAlterMembershipMenuOpen(true);
      setCompleteLockedPopupOpen(true);
      return;
    }
    if (!currentJsonMethodName || currentJsonMethodName === '__no_methods__') return;
    const toggleMember =
      (setter: React.Dispatch<React.SetStateAction<EditableMemberLists>>, kind: MethodIdentityKind) => {
        const targetMode: StoredAlterMode = mode === 'Tested' ? 'Test' : mode;
        setter((prev) => {
          const targetNames = getEquivalentMemberListMethodNames(kind, currentJsonMethodName, prev);
          const nextTargetList = { ...prev[targetMode] };
          for (const methodName of targetNames) {
            nextTargetList[methodName] =
              mode === 'Tested'
                ? false
                : mode === 'Test'
                  ? true
                  : !prev[targetMode]?.[methodName];
          }
          return {
            ...prev,
            [targetMode]: nextTargetList,
          };
        });
      };
    if (activeMethodPanelTab === 'erc20') {
      if (methodPanelMode === 'erc20_write') {
        toggleMember(setErc20WriteMemberLists, 'erc20Write');
      } else {
        toggleMember(setErc20ReadMemberLists, 'erc20Read');
      }
      return;
    }
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') {
        toggleMember(setSpCoinReadMemberLists, 'spCoinRead');
      } else if (methodPanelMode === 'spcoin_write') {
        toggleMember(setSpCoinWriteMemberLists, 'spCoinWrite');
      } else {
        toggleMember(setSerializationMemberLists, 'serialization');
      }
      return;
    }
    if (activeMethodPanelTab === 'todos') {
      toggleMember(setSpCoinWriteMemberLists, 'spCoinWrite');
      return;
    }
    if (methodPanelMode === 'spcoin_rread') {
      toggleMember(setSpCoinReadMemberLists, 'spCoinRead');
      return;
    }
    if (methodPanelMode === 'spcoin_write') {
      toggleMember(setSpCoinWriteMemberLists, 'spCoinWrite');
      return;
    }
    toggleMember(setSerializationMemberLists, 'serialization');
  }, [
    activeMethodPanelTab,
    currentJsonMethodName,
    currentMethodInAlterMode,
    methodPanelMode,
    selectedAlterMode,
  ]);
  const changeCurrentMethodGroup = React.useCallback((nextGroup: MethodDisplayGroup) => {
    if (nextGroup === 'erc20' && !showOnChainMethods) {
      setShowOnChainMethods(true);
    }
    if (!currentMethodIdentity) {
      setSelectedDisplayGroup(nextGroup);
      return;
    }
    setMethodDisplayGroups((prev) => ({
      ...prev,
      [currentMethodIdentity.id]: nextGroup,
    }));
    setSelectedDisplayGroup(nextGroup);
  }, [currentMethodIdentity, setShowOnChainMethods, showOnChainMethods]);
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
    if (isEditingScriptMethod) return;
    if (!visibleGroupedMethods.length) return;
    if (visibleCurrentMethodIdentity) return;
    selectMethodByIdentity(visibleGroupedMethods[0]);
  }, [isEditingScriptMethod, selectMethodByIdentity, visibleCurrentMethodIdentity, visibleGroupedMethods]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (activeMethodPanelTab === 'admin_utils') return;
    if (methodPanelMode !== 'serialization_tests') return;
    if (visibleSerializationOptions.length === 0) return;
    if (visibleSerializationOptions.includes(serializationTestProps.selectedSerializationTestMethod)) return;
    serializationTestProps.setSelectedSerializationTestMethod(visibleSerializationOptions[0]);
  }, [
    activeMethodPanelTab,
    isEditingScriptMethod,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    serializationTestProps.setSelectedSerializationTestMethod,
    visibleSerializationOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (activeMethodPanelTab !== 'admin_utils' || methodPanelMode !== 'serialization_tests') return;
    if (visibleAdminUtilitySerializationOptions.length === 0) return;
    if (visibleAdminUtilitySerializationOptions.includes(serializationTestProps.selectedSerializationTestMethod)) return;
    serializationTestProps.setSelectedSerializationTestMethod(visibleAdminUtilitySerializationOptions[0]);
  }, [
    activeMethodPanelTab,
    isEditingScriptMethod,
    methodPanelMode,
    serializationTestProps.selectedSerializationTestMethod,
    serializationTestProps.setSelectedSerializationTestMethod,
    visibleAdminUtilitySerializationOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (methodPanelMode !== 'ecr20_read') return;
    if (visibleErc20ReadOptions.length === 0) return;
    if (visibleErc20ReadOptions.includes(erc20ReadProps.selectedReadMethod)) return;
    erc20ReadProps.setSelectedReadMethod(visibleErc20ReadOptions[0]);
  }, [
    erc20ReadProps.selectedReadMethod,
    erc20ReadProps.setSelectedReadMethod,
    isEditingScriptMethod,
    methodPanelMode,
    visibleErc20ReadOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (methodPanelMode !== 'erc20_write') return;
    if (visibleErc20WriteOptions.length === 0) return;
    if (visibleErc20WriteOptions.includes(erc20WriteProps.selectedWriteMethod)) return;
    erc20WriteProps.setSelectedWriteMethod(visibleErc20WriteOptions[0]);
  }, [
    erc20WriteProps.selectedWriteMethod,
    erc20WriteProps.setSelectedWriteMethod,
    isEditingScriptMethod,
    methodPanelMode,
    visibleErc20WriteOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (activeMethodPanelTab === 'admin_utils') return;
    if (methodPanelMode !== 'spcoin_rread') return;
    if (visibleSpCoinReadOptions.length === 0) return;
    if (hasEquivalentSpCoinReadMethod(visibleSpCoinReadOptions, spCoinReadProps.selectedSpCoinReadMethod)) return;
    spCoinReadProps.setSelectedSpCoinReadMethod(visibleSpCoinReadOptions[0]);
  }, [
    activeMethodPanelTab,
    isEditingScriptMethod,
    methodPanelMode,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinReadProps.setSelectedSpCoinReadMethod,
    visibleSpCoinReadOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
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
    isEditingScriptMethod,
    methodPanelMode,
    spCoinWriteProps.selectedSpCoinWriteMethod,
    spCoinWriteProps.setSelectedSpCoinWriteMethod,
    visibleSpCoinWriteOptions,
    visibleTodoWriteOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (activeMethodPanelTab !== 'admin_utils' || methodPanelMode !== 'spcoin_rread') return;
    if (visibleAdminUtilsReadOptions.length === 0) return;
    if (hasEquivalentSpCoinReadMethod(visibleAdminUtilsReadOptions, spCoinReadProps.selectedSpCoinReadMethod)) return;
    spCoinReadProps.setSelectedSpCoinReadMethod(visibleAdminUtilsReadOptions[0]);
  }, [
    activeMethodPanelTab,
    isEditingScriptMethod,
    methodPanelMode,
    spCoinReadProps.selectedSpCoinReadMethod,
    spCoinReadProps.setSelectedSpCoinReadMethod,
    visibleAdminUtilsReadOptions,
  ]);
  React.useEffect(() => {
    if (isEditingScriptMethod) return;
    if (activeMethodPanelTab !== 'admin_utils' || methodPanelMode !== 'spcoin_write') return;
    if (visibleAdminUtilsOwnerOptions.length === 0) return;
    if (visibleAdminUtilsOwnerOptions.includes(spCoinWriteProps.selectedSpCoinWriteMethod)) return;
    spCoinWriteProps.setSelectedSpCoinWriteMethod(visibleAdminUtilsOwnerOptions[0]);
  }, [
    activeMethodPanelTab,
    isEditingScriptMethod,
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
            className="peer w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            style={{
              color:
                visibleCurrentMethodIdentity && !methodEntryNeedsTesting(visibleCurrentMethodIdentity)
                  ? '#22c55e'
                  : undefined,
            }}
            value={visibleCurrentMethodIdentity?.id ?? '__no_methods__'}
            onChange={(event) => {
              const next = visibleGroupedMethods.find((entry) => entry.id === event.target.value);
              if (!next) return;
              selectMethodByIdentity(next);
            }}
            disabled={visibleGroupedMethods.length === 0}
          >
          {visibleGroupedMethods.length === 0 ? <option value="__no_methods__">No methods available</option> : null}
          {visibleGroupedMethods.map((entry) => (
            <option
              key={entry.id}
              value={entry.id}
              style={{
                color: methodEntryNeedsTesting(entry) ? '#ffffff' : '#22c55e',
              }}
            >
              {entry.label}
            </option>
          ))}
          </select>
          <NativeSelectChevron />
        </div>
      </div>
    );
  }, [
    isJavaScriptScriptMode,
    methodEntryNeedsTesting,
    selectMethodByIdentity,
    showAllCardSectionsForVisualTest,
    visibleCurrentMethodIdentity,
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
                <span className={scriptEditorKind === 'json' ? 'text-green-400' : 'text-[#8FA8FF]'}>JSON</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  checked={scriptEditorKind === 'javascript'}
                  onChange={() => setScriptEditorKind('javascript')}
                  className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                />
                <span className={scriptEditorKind === 'javascript' ? 'text-green-400' : 'text-[#8FA8FF]'}>Typescript</span>
              </label>
              <label className="inline-flex items-center justify-end gap-2 text-right">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-[#5981F3] bg-transparent accent-green-500 checked:border-green-500 checked:bg-green-500"
                checked={showOnChainMethods}
                onChange={(event) => setShowOnChainMethods(event.target.checked)}
              />
              <span className={showOnChainMethods ? 'text-green-400' : 'text-[#8FA8FF]'}>On-Chain</span>
              </label>
              <label className="inline-flex items-center justify-end gap-2 text-right">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-[#5981F3] bg-transparent accent-green-500 checked:border-green-500 checked:bg-green-500"
                checked={showOffChainMethods}
                onChange={(event) => setShowOffChainMethods(event.target.checked)}
              />
              <span className={showOffChainMethods ? 'text-green-400' : 'text-[#8FA8FF]'}>Off-Chain</span>
              </label>
              <label className="inline-flex items-center justify-end gap-2 text-right">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-[#5981F3] bg-transparent accent-green-500 checked:border-green-500 checked:bg-green-500"
                  checked={useReadCache}
                  onChange={(event) => setUseReadCache(event.target.checked)}
                />
                <span className={useReadCache ? 'text-green-400' : 'text-[#8FA8FF]'}>Cache</span>
              </label>
              <label className="inline-flex items-center justify-end gap-2 text-right">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-[#5981F3] bg-transparent accent-green-500 checked:border-green-500 checked:bg-green-500"
                  checked={isManageEnabled}
                  onChange={(event) => setIsManageEnabled(event.target.checked)}
                />
                <span className={isManageEnabled ? 'text-green-400' : 'text-[#8FA8FF]'}>Manage</span>
              </label>
              {isJavaScriptScriptMode ? (
                <div className="flex items-start gap-4">
                  <label className="inline-flex items-center justify-end gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-[#5981F3] bg-transparent accent-green-500 checked:border-green-500 checked:bg-green-500"
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
            <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-[#8FA8FF]">
              {methodPanelOptions.map(([value, label]) => (
                <label key={value} className="inline-flex flex-row items-center gap-1">
                  <input
                    type="radio"
                    className="order-first h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name={methodPanelGroupName}
                    value={value}
                    checked={selectedDisplayGroup === value}
                    onMouseDown={(e) => {
                      if (selectedDisplayGroup === value) e.preventDefault();
                    }}
                    onChange={(e) => {
                      changeSelectedDisplayGroup(e.target.value as MethodDisplayFilter);
                    }}
                  />
                  <span className={selectedDisplayGroup === value ? 'text-green-400' : 'text-[#8FA8FF]'}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {isJsonScriptMode && isManageEnabled ? (
            <div className="mb-3 -mx-4 border-y border-[#31416F] bg-[#0E111B] px-4 py-2">
              <div className="flex flex-wrap items-center gap-3">
                <div ref={alterMembershipMenuRef} className="relative inline-flex items-center gap-2 text-xs text-[#8FA8FF]">
                  <span>Group Members</span>
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex w-[128px] items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#0B1220] px-3 py-2 text-left text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-haspopup="menu"
                      aria-expanded={isAlterMembershipMenuOpen}
                      disabled={!currentJsonMethodName || currentJsonMethodName === '__no_methods__'}
                      onClick={() => {
                        setIsAlterMembershipMenuOpen((open) => !open);
                        setIsChangeGroupMenuOpen(false);
                      }}
                    >
                      <span>Select Group</span>
                      <SelectChevron open={isAlterMembershipMenuOpen} />
                    </button>
                    {isAlterMembershipMenuOpen ? (
                      <div
                        role="menu"
                        aria-label="Group Members"
                        className="absolute bottom-full left-0 z-30 mb-1 w-[128px] overflow-hidden rounded-lg border border-[#334155] bg-[#0B1220] shadow-xl shadow-black/40"
                      >
                        {ALTER_MEMBERSHIP_OPTIONS.map((option) => {
                          const isMember = currentMethodInAlterMode(option);
                          return (
                            <button
                              key={`alter-mode-${option}`}
                              type="button"
                              role="menuitemcheckbox"
                              aria-checked={isMember}
                              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-bold hover:bg-[#162033] ${
                                isMember ? 'text-green-400' : 'text-[#8FA8FF]'
                              }`}
                              onClick={() => toggleCurrentMethodAlterMembership(option)}
                            >
                              <span
                                aria-hidden="true"
                                className={`order-first h-2 w-2 shrink-0 rounded-full ${isMember ? 'bg-green-400' : 'bg-red-400'}`}
                              />
                              <span>{getAlterModeLabel(option)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div ref={changeGroupMenuRef} className="relative inline-flex items-center gap-2 text-xs text-[#8FA8FF]">
                  <span>Change Group</span>
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex w-[132px] items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#0B1220] px-3 py-2 text-left text-xs font-semibold text-white"
                      aria-haspopup="menu"
                      aria-expanded={isChangeGroupMenuOpen}
                      onClick={() => {
                        setIsChangeGroupMenuOpen((open) => !open);
                        setIsAlterMembershipMenuOpen(false);
                      }}
                    >
                      <span>{selectedDisplayGroupLabel}</span>
                      <SelectChevron open={isChangeGroupMenuOpen} />
                    </button>
                    {isChangeGroupMenuOpen ? (
                      <div
                        role="menu"
                        aria-label="Change Group"
                        className="absolute left-0 top-full z-30 mt-1 w-[132px] overflow-hidden rounded-lg border border-[#334155] bg-[#0B1220] shadow-xl shadow-black/40"
                      >
                        {methodGroupOptions.map(([value, label]) => {
                          const isSelected = currentMethodDisplayGroup === value;
                          return (
                            <button
                              key={`change-group-${value}`}
                              type="button"
                              role="menuitemradio"
                              aria-checked={isSelected}
                              className={`flex w-full items-center px-3 py-2 text-left text-xs font-bold hover:bg-[#162033] ${
                                isSelected ? 'text-green-400' : 'text-[#8FA8FF]'
                              }`}
                              onClick={() => {
                                if (!isSelected) changeCurrentMethodGroup(value);
                                setIsChangeGroupMenuOpen(false);
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="ml-auto inline-flex items-center justify-end pl-3">
                  <button
                    type="button"
                    className={refreshIconButtonClassName}
                    onClick={() => void reloadMethodMemberLists()}
                    title="Reload method member lists"
                    aria-label="Reload method member lists"
                    disabled={isReloadingMemberLists}
                  >
                    <span aria-hidden="true" className={isReloadingMemberLists ? 'animate-spin' : undefined}>
                      {'\u21BB'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0 text-xs text-[#8FA8FF]">
                  {ALTER_MODE_OPTIONS.map((option) => (
                    <label key={option} className="inline-flex flex-row items-center gap-2">
                      <input
                        type="radio"
                        name={alterModeGroupName}
                        value={option}
                        checked={selectedAlterMode === option}
                        onChange={() => handleAlterModeChange(option)}
                        className="order-first h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                      />
                      <span className={selectedAlterMode === option ? 'text-green-400' : 'text-[#8FA8FF]'}>
                        {getAlterModeLabel(option)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <>
            {isJavaScriptScriptMode || (showAllCardSectionsForVisualTest && !isJsonScriptMode) ? (
              <div className="mb-3 grid grid-cols-1 gap-3">
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">TypeScript File</span>
                  <div className="relative w-full min-w-0">
                    <select
                      aria-label="TypeScript file"
                      title="TypeScript file"
                      className="peer w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
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
                    <NativeSelectChevron />
                  </div>
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
        {completeLockedPopupOpen ? (
          <ValidationPopup
            fields={[]}
            title="Group Membership Locked"
            message='Cannot change "Group Membership" when the group is currently active or Complete is selected.'
            buttonStyle="rounded-lg border border-[#31416F] bg-[#0E111B] px-3 py-[0.28rem] text-sm font-semibold text-slate-200 transition-colors hover:border-[#5981F3] hover:text-white"
            confirmLabel="OK"
            onClose={() => { setCompleteLockedPopupOpen(false); setIsAlterMembershipMenuOpen(true); }}
            onConfirm={() => { setCompleteLockedPopupOpen(false); setIsAlterMembershipMenuOpen(true); }}
          />
        ) : null}
      </div>
    </article>
  );
}
