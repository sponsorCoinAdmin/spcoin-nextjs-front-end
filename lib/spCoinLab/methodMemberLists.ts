import { SERIALIZATION_TEST_METHOD_MEMBER_LISTS } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests';
import { SPCOIN_ADMIN_READ_METHODS, SPCOIN_READ_METHOD_MEMBER_LISTS } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/read';
import { SPCOIN_ADMIN_WRITE_METHODS, SPCOIN_TODO_WRITE_METHODS, SPCOIN_WRITE_METHOD_MEMBER_LISTS } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write';
import { ERC20_READ_METHOD_MEMBER_LISTS } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/erc20/read';
import { ERC20_WRITE_METHOD_MEMBER_LISTS } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/erc20/write';

export type StoredAlterMode = 'Basic' | 'Standard' | 'Test' | 'Todo' | 'Complete';
type SourceAlterMode = StoredAlterMode | 'All';
export type AlterMemberLists = Record<StoredAlterMode, Record<string, boolean>>;
type SourceAlterMemberLists = Record<SourceAlterMode, Record<string, boolean>>;
export type MethodDisplayGroup = 'erc20' | 'spcoin_rread' | 'spcoin_write' | 'admin_utils' | 'todos';

export type MethodMemberListCollection = {
  serialization: AlterMemberLists;
  spCoinRead: AlterMemberLists;
  spCoinWrite: AlterMemberLists;
  erc20Read: AlterMemberLists;
  erc20Write: AlterMemberLists;
};

export type MethodMemberListPayload = {
  version: 1;
  updatedAt: string;
  lists: MethodMemberListCollection;
  displayGroups: Record<string, MethodDisplayGroup>;
};

type SourceMethodMemberListCollection = {
  serialization: SourceAlterMemberLists;
  spCoinRead: SourceAlterMemberLists;
  spCoinWrite: SourceAlterMemberLists;
  erc20Read: SourceAlterMemberLists;
  erc20Write: SourceAlterMemberLists;
};

const DEFAULT_METHOD_MEMBER_LIST_COLLECTION: SourceMethodMemberListCollection = {
  serialization: SERIALIZATION_TEST_METHOD_MEMBER_LISTS as SourceAlterMemberLists,
  spCoinRead: SPCOIN_READ_METHOD_MEMBER_LISTS as SourceAlterMemberLists,
  spCoinWrite: SPCOIN_WRITE_METHOD_MEMBER_LISTS as SourceAlterMemberLists,
  erc20Read: ERC20_READ_METHOD_MEMBER_LISTS as SourceAlterMemberLists,
  erc20Write: ERC20_WRITE_METHOD_MEMBER_LISTS as SourceAlterMemberLists,
};

export function cloneAlterMemberLists(
  source: Partial<Record<SourceAlterMode, Record<string, boolean>>>,
): AlterMemberLists {
  return {
    Basic: { ...(source.Basic || source.Standard || {}) },
    Standard: { ...(source.Standard || {}) },
    Test: { ...(source.Test || {}) },
    Todo: { ...(source.Todo || {}) },
    Complete: { ...(source.Complete || {}) },
  };
}

export function cloneMethodMemberListCollection(
  source: SourceMethodMemberListCollection | MethodMemberListCollection = DEFAULT_METHOD_MEMBER_LIST_COLLECTION,
): MethodMemberListCollection {
  return {
    serialization: cloneAlterMemberLists(source.serialization),
    spCoinRead: cloneAlterMemberLists(source.spCoinRead),
    spCoinWrite: cloneAlterMemberLists(source.spCoinWrite),
    erc20Read: cloneAlterMemberLists(source.erc20Read),
    erc20Write: cloneAlterMemberLists(source.erc20Write),
  };
}

function getSourceMethodNames(source: Partial<Record<SourceAlterMode, Record<string, boolean>>>): string[] {
  return Array.from(
    new Set([
      ...Object.keys(source.All ?? {}),
      ...Object.keys(source.Basic ?? {}),
      ...Object.keys(source.Standard ?? {}),
      ...Object.keys(source.Test ?? {}),
      ...Object.keys(source.Todo ?? {}),
      ...Object.keys(source.Complete ?? {}),
    ]),
  );
}

const DEFAULT_DISPLAY_GROUPS: Record<string, MethodDisplayGroup> = {
  ...Object.fromEntries(getSourceMethodNames(DEFAULT_METHOD_MEMBER_LIST_COLLECTION.erc20Read).map((name) => [`erc20Read:${name}`, 'erc20'] as const)),
  ...Object.fromEntries(getSourceMethodNames(DEFAULT_METHOD_MEMBER_LIST_COLLECTION.erc20Write).map((name) => [`erc20Write:${name}`, 'erc20'] as const)),
  ...Object.fromEntries(
    getSourceMethodNames(DEFAULT_METHOD_MEMBER_LIST_COLLECTION.spCoinRead).map((name) => [
      `spCoinRead:${name}`,
      SPCOIN_ADMIN_READ_METHODS.includes(name as never) ? 'admin_utils' : 'spcoin_rread',
    ] as const),
  ),
  ...Object.fromEntries(
    getSourceMethodNames(DEFAULT_METHOD_MEMBER_LIST_COLLECTION.spCoinWrite).map((name) => [
      `spCoinWrite:${name}`,
      SPCOIN_TODO_WRITE_METHODS.includes(name as never)
        ? 'todos'
        : SPCOIN_ADMIN_WRITE_METHODS.includes(name as never)
          ? 'admin_utils'
          : 'spcoin_write',
    ] as const),
  ),
  ...Object.fromEntries(getSourceMethodNames(DEFAULT_METHOD_MEMBER_LIST_COLLECTION.serialization).map((name) => [`serialization:${name}`, 'admin_utils'] as const)),
};

function markAdminUtilsAsTest(
  lists: MethodMemberListCollection,
  displayGroups: Record<string, MethodDisplayGroup>,
): MethodMemberListCollection {
  const next = cloneMethodMemberListCollection(lists);
  const listByKind: Record<string, AlterMemberLists> = {
    serialization: next.serialization,
    spCoinRead: next.spCoinRead,
    spCoinWrite: next.spCoinWrite,
    erc20Read: next.erc20Read,
    erc20Write: next.erc20Write,
  };

  for (const [methodId, group] of Object.entries(displayGroups)) {
    if (group !== 'admin_utils') continue;
    const separatorIndex = methodId.indexOf(':');
    if (separatorIndex < 0) continue;
    const kind = methodId.slice(0, separatorIndex);
    const methodName = methodId.slice(separatorIndex + 1);
    const memberLists = listByKind[kind];
    if (!memberLists?.Test || !(methodName in memberLists.Test)) continue;
    memberLists.Test[methodName] = true;
  }

  return next;
}

export const DEFAULT_METHOD_MEMBER_LIST_PAYLOAD: MethodMemberListPayload = {
  version: 1,
  updatedAt: '',
  lists: markAdminUtilsAsTest(cloneMethodMemberListCollection(), DEFAULT_DISPLAY_GROUPS),
  displayGroups: DEFAULT_DISPLAY_GROUPS,
};

function normalizeAlterMemberLists(
  input: unknown,
  defaults: SourceAlterMemberLists,
): AlterMemberLists {
  const source = input && typeof input === 'object' ? (input as Partial<Record<SourceAlterMode, Record<string, boolean>>>) : {};
  const normalized = cloneAlterMemberLists(defaults);
  const knownMethods = Array.from(
    new Set([
      ...getSourceMethodNames(defaults),
      ...getSourceMethodNames(source),
    ]),
  );

  for (const methodName of knownMethods) {
    normalized.Basic[methodName] =
      typeof source.Basic?.[methodName] === 'boolean'
        ? Boolean(source.Basic?.[methodName])
        : Boolean(defaults.Basic?.[methodName] ?? defaults.Standard?.[methodName]);
    normalized.Standard[methodName] =
      typeof source.Standard?.[methodName] === 'boolean'
        ? Boolean(source.Standard?.[methodName])
        : Boolean(defaults.Standard?.[methodName]);
    normalized.Test[methodName] =
      typeof source.Test?.[methodName] === 'boolean'
        ? Boolean(source.Test?.[methodName])
        : Boolean(defaults.Test?.[methodName]);
    normalized.Todo[methodName] =
      typeof source.Todo?.[methodName] === 'boolean'
        ? Boolean(source.Todo?.[methodName])
        : Boolean(defaults.Todo?.[methodName]);
    normalized.Complete[methodName] =
      typeof source.Complete?.[methodName] === 'boolean'
        ? Boolean(source.Complete?.[methodName])
        : Boolean(defaults.Complete?.[methodName]);
  }

  return normalized;
}

export function normalizeMethodMemberListPayload(input: unknown): MethodMemberListPayload {
  const source = input && typeof input === 'object' ? (input as Partial<MethodMemberListPayload>) : {};
  const sourceLists: Partial<MethodMemberListCollection> =
    source.lists && typeof source.lists === 'object'
      ? (source.lists as Partial<MethodMemberListCollection>)
      : {};
  const sourceDisplayGroups =
    source.displayGroups && typeof source.displayGroups === 'object'
      ? (source.displayGroups as Record<string, MethodDisplayGroup>)
      : {};

  const displayGroups = Object.fromEntries(
    Object.entries(DEFAULT_DISPLAY_GROUPS).map(([methodId, defaultGroup]) => {
      const nextGroup = sourceDisplayGroups[methodId];
      return [
        methodId,
        nextGroup === 'erc20' ||
        nextGroup === 'spcoin_rread' ||
        nextGroup === 'spcoin_write' ||
        nextGroup === 'admin_utils' ||
        nextGroup === 'todos'
          ? nextGroup
          : defaultGroup,
      ];
    }),
  );
  const lists = {
    serialization: normalizeAlterMemberLists(sourceLists?.serialization, DEFAULT_METHOD_MEMBER_LIST_COLLECTION.serialization),
    spCoinRead: normalizeAlterMemberLists(sourceLists?.spCoinRead, DEFAULT_METHOD_MEMBER_LIST_COLLECTION.spCoinRead),
    spCoinWrite: normalizeAlterMemberLists(sourceLists?.spCoinWrite, DEFAULT_METHOD_MEMBER_LIST_COLLECTION.spCoinWrite),
    erc20Read: normalizeAlterMemberLists(sourceLists?.erc20Read, DEFAULT_METHOD_MEMBER_LIST_COLLECTION.erc20Read),
    erc20Write: normalizeAlterMemberLists(sourceLists?.erc20Write, DEFAULT_METHOD_MEMBER_LIST_COLLECTION.erc20Write),
  };

  return {
    version: 1,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : '',
    lists,
    displayGroups,
  };
}
