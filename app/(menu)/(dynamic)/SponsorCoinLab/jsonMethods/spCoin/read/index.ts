// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/index.ts
import { SPCOIN_READ_METHOD_DEFS } from './defs';
export { SPCOIN_READ_METHOD_DEFS };
import { createSpCoinLibraryAccess, type SpCoinAccessSource, type SpCoinContractAccess, type SpCoinReadAccess, type SpCoinStakingAccess } from '../../shared';
import type { ParamDef } from '../../shared/types';
import { normalizeStringListResult } from '../../shared/normalizeListResult';
import { buildExternalserializedRResult, type SerializationBaseMethod } from '../../serializationTests';

export type SpCoinReadMethod =
  | 'getInflationRate'
  | 'calculateStakingRewards'
  | 'creationTime'
  | 'getSpCoinMetaData'
  | 'getMasterAccountMetaData'
  | 'getMasterAccountList'
  | 'getMasterAccountKeys'
  | 'getMasterAccountKeyCount'
  | 'getMasterAccountCount'
  | 'getMasterAccountListSize'
  | 'getAccountListSize'
  | 'getActiveAccountKeys'
  | 'getActiveAccountList'
  | 'getActiveAccountCount'
  | 'getActiveAccountListSize'
  | 'getActiveAccountElement'
  | 'getActiveAccountKeyAt'
  | 'getRecipientList'
  | 'getAgentList'
  | 'getRecipientListSize'
  | 'getAgentListSize'
  | 'getAccountKeys'
  | 'getSponsorKeys'
  | 'getRecipientKeys'
  | 'getAgentKeys'
  | 'getParentRecipientKeys'
  | 'getRecipientKeyCount'
  | 'getAgentKeyCount'
  | 'getAccountAgentCount'
  | 'getAccountLinks'
  | 'getAccountRecord'
  | 'getAccountRoleSummary'
  | 'getAccountRoles'
  | 'isSponsor'
  | 'isRecipient'
  | 'isAgent'
  | 'getAccountStakingRewards'
  | 'getStakingRewards'
  | 'getAccountRewardTransactionList'
  | 'getAccountRewardTransactionRecord'
  | 'getAccountTransactionList'
  | 'getTransactionList'
  | 'getTransactionRecord'
  | 'getRecipientTransactionIdKeys'
  | 'getAgentTransactionIdKeys'
  | 'getRecipientRateList'
  | 'getRecipientRateKeys'
  | 'getSponsorRecipientRates'
  | 'getSponsorRecipientRateKeys'
  | 'getRecipientTransaction'
  | 'getRecipientTransactionList'
  | 'getRecipientRateAgentList'
  | 'getRecipientRateAgentKeys'
  | 'getLowerRecipientRate'
  | 'getUpperRecipientRate'
  | 'getRecipientRateRange'
  | 'getRecipientRateIncrement'
  | 'getRecipientRecordList'
  | 'getAgentRateList'
  | 'getAgentRateKeys'
  | 'getLowerAgentRate'
  | 'getUpperAgentRate'
  | 'getAgentRateRange'
  | 'getAgentRateIncrement'
  | 'getAgentTransaction'
  | 'getAgentTotalRecipient'
  | 'getRecipientTransactionCount'
  | 'getSponsorRecipientRateTransactionCount'
  | 'getAgentRateTransactionCount'
  | 'getAgentTransactionCount'
  | 'getRecipientTransactionAt'
  | 'getAgentTransactionAt'
  | 'getAgentTransactionList'
  | 'getAgentRecordList'
  | 'totalInitialSupply'
  | 'isDeployed'
  | 'isAccountInserted'
  | 'getMasterAccountElement'
  | 'getAccountElement'
  | 'calcDataTimeDiff'
  | 'totalUnstakedSpCoins'
  | 'totalStakedSPCoins'
  | 'totalStakingRewards'
  | 'version';

export type SpCoinReadAlterMode = 'Standard' | 'All' | 'Test' | 'Todo';

const LEGACY_READ_METHOD_RENAMES: Partial<Record<string, SpCoinReadMethod>> = {
  getVersion: 'version',
  version: 'version',
  getInitialTotalSupply: 'totalInitialSupply',
  initialTotalSupply: 'totalInitialSupply',
  totalInitialSupply: 'totalInitialSupply',
  getAccountTransactionList: 'getAccountTransactionList',
  getMasterMetaData: 'getMasterAccountMetaData',
  getMasterAccountList: 'getMasterAccountKeys',
  getAccountKeys: 'getMasterAccountKeys',
  getAccountElement: 'getMasterAccountElement',
  getMasterAccountKeyAt: 'getMasterAccountElement',
  getAccountKeyAt: 'getMasterAccountElement',
  getAccountKeyCount: 'getMasterAccountKeyCount',
  getMasterAccountCount: 'getMasterAccountKeyCount',
  getMasterAccountListSize: 'getMasterAccountKeyCount',
  getAccountListSize: 'getMasterAccountKeyCount',
  getAccountRecipientList: 'getRecipientKeys',
  getAccountRecipientListSize: 'getRecipientKeyCount',
  getAccountAgentList: 'getAgentKeys',
  getRecipientList: 'getRecipientKeys',
  getRecipientListSize: 'getRecipientKeyCount',
  getAgentList: 'getAgentKeys',
  getAgentListSize: 'getAgentKeyCount',
  getRecipientRateList: 'getRecipientRateKeys',
  getSponsorRecipientRates: 'getRecipientRateKeys',
  getSponsorRecipientRateKeys: 'getRecipientRateKeys',
  getRecipientRateAgentList: 'getRecipientRateAgentKeys',
  getAgentRateList: 'getAgentRateKeys',
  getSerializedAccountRecord: 'getAccountRecord',
  getSerializedAccountRewards: 'getStakingRewards',
  getSerializedRecipientRateList: 'getRecipientTransaction',
  serializedAgentTransactionStr: 'getAgentTransaction',
  getAccountTimeInSecondeSinceUpdate: 'calcDataTimeDiff',
};

export const SPCOIN_OFFCHAIN_READ_METHODS: SpCoinReadMethod[] = [
  'getAccountStakingRewards',
  'getStakingRewards',
  'getRecipientTransaction',
  'getAgentTransaction',
  'getAgentRateTransactionCount',
];

export const SPCOIN_COMPOUND_READ_METHODS = SPCOIN_OFFCHAIN_READ_METHODS;

export const SPCOIN_ADMIN_READ_METHODS: SpCoinReadMethod[] = [
  'calcDataTimeDiff',
  'calculateStakingRewards',
  'creationTime',
  'version',
  'getInflationRate',
  'isDeployed',
  'isAccountInserted',
  'getMasterAccountMetaData',
  'getMasterAccountKeys',
  'getMasterAccountElement',
  'getAccountElement',
  'getMasterAccountList',
  'getActiveAccountKeys',
  'getActiveAccountList',
  'getActiveAccountCount',
  'getActiveAccountListSize',
  'getActiveAccountElement',
  'getActiveAccountKeyAt',
  'getAccountKeys',
  'totalUnstakedSpCoins',
  'totalStakedSPCoins',
  'totalStakingRewards',
];

export const SPCOIN_SENDER_READ_METHODS: SpCoinReadMethod[] = [];

export const SPCOIN_LEGACY_READ_METHODS: SpCoinReadMethod[] = [
  'getMasterAccountKeyCount',
  'getMasterAccountCount',
  'getMasterAccountListSize',
  'getAccountListSize',
];

const ALL_SPCOIN_READ_METHODS = Object.keys(SPCOIN_READ_METHOD_DEFS) as SpCoinReadMethod[];

function buildSpCoinReadMemberList(
  predicate: (name: SpCoinReadMethod) => boolean,
): Record<SpCoinReadMethod, boolean> {
  return Object.fromEntries(
    ALL_SPCOIN_READ_METHODS.map((name) => [name, predicate(name)]),
  ) as Record<SpCoinReadMethod, boolean>;
}

export const SPCOIN_READ_METHOD_MEMBER_LISTS: Record<
  SpCoinReadAlterMode,
  Record<SpCoinReadMethod, boolean>
> = {
  Standard: buildSpCoinReadMemberList(
    (name) =>
      !SPCOIN_OFFCHAIN_READ_METHODS.includes(name) &&
      !SPCOIN_ADMIN_READ_METHODS.includes(name) &&
      !SPCOIN_LEGACY_READ_METHODS.includes(name),
  ),
  All: buildSpCoinReadMemberList(() => true),
  Test: buildSpCoinReadMemberList((name) => SPCOIN_OFFCHAIN_READ_METHODS.includes(name)),
  Todo: buildSpCoinReadMemberList(() => false),
};

export function filterSpCoinReadMethodsByAlterMode(
  methods: SpCoinReadMethod[],
  mode: SpCoinReadAlterMode,
): SpCoinReadMethod[] {
  const memberList = SPCOIN_READ_METHOD_MEMBER_LISTS[mode];
  return methods.filter((name) => Boolean(memberList?.[name]));
}

export function getSpCoinWorldReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter(
    (name) =>
      !SPCOIN_OFFCHAIN_READ_METHODS.includes(name) &&
      !SPCOIN_ADMIN_READ_METHODS.includes(name) &&
      !SPCOIN_SENDER_READ_METHODS.includes(name) &&
      !SPCOIN_LEGACY_READ_METHODS.includes(name),
  );
}

export function getSpCoinSenderReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter((name) => SPCOIN_SENDER_READ_METHODS.includes(name));
}

export function getSpCoinAdminReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter((name) => SPCOIN_ADMIN_READ_METHODS.includes(name));
}

export function getSpCoinReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  const all = (Object.keys(SPCOIN_READ_METHOD_DEFS) as SpCoinReadMethod[]).sort((a, b) => a.localeCompare(b));
  if (!hideUnexecutables) return all;
  return all.filter((name) => SPCOIN_READ_METHOD_DEFS[name].executable !== false);
}

export function getSpCoinStandardReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinWorldReadOptions(hideUnexecutables);
}

export function getSpCoinCompoundReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter((name) => SPCOIN_OFFCHAIN_READ_METHODS.includes(name));
}

export function getSpCoinOffChainReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinCompoundReadOptions(hideUnexecutables);
}

export function getSpCoinLegacyReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter((name) => SPCOIN_LEGACY_READ_METHODS.includes(name));
}

export function normalizeSpCoinReadMethod(method: string): SpCoinReadMethod {
  const normalized = LEGACY_READ_METHOD_RENAMES[method as SpCoinReadMethod];
  return (normalized || method) as SpCoinReadMethod;
}

async function requireExternalSerializedValue(
  contract: SpCoinContractAccess,
  method: SerializationBaseMethod,
  methodArgs: unknown[],
): Promise<unknown> {
  const external = await buildExternalserializedRResult(contract, method, methodArgs);
  if (external.blocked) {
    throw new Error(external.reason);
  }
  return external.value;
}

function toStringOrNumber(value: unknown): string | number {
  return typeof value === 'number' ? value : String(value);
}

function isBadDataError(error: unknown) {
  const code = String((error as { code?: unknown } | null)?.code || '');
  const message = String((error as { message?: unknown } | null)?.message || '');
  return code === 'BAD_DATA' || /could not decode result data/i.test(message);
}

async function buildReadDecodeError(params: {
  error: unknown;
  method: string;
  target: string;
  runner: any;
}) {
  const { error, method, target, runner } = params;
  const provider = runner?.provider ?? runner;
  if (!provider || typeof provider.getCode !== 'function') {
    return error;
  }

  try {
    const [code, network] = await Promise.all([
      provider.getCode(target),
      typeof provider.getNetwork === 'function' ? provider.getNetwork() : Promise.resolve(null),
    ]);
    const chainId = network?.chainId != null ? String(network.chainId) : 'unknown';
    const hasCode = typeof code === 'string' && code !== '0x';
    const nextError = new Error(
      hasCode
        ? `SpCoin read method ${method} failed at ${target} on chain ${chainId}: the contract returned undecodable data. This usually means the deployed bytecode does not match the current SPCoin ABI or does not implement ${method}().`
        : `SpCoin read method ${method} failed at ${target} on chain ${chainId}: no contract code was found at that address.`,
    );
    (nextError as Error & { cause?: unknown; code?: unknown }).cause = error;
    (nextError as Error & { cause?: unknown; code?: unknown }).code =
      (error as { code?: unknown } | null)?.code || 'BAD_DATA';
    return nextError;
  } catch {
    return error;
  }
}

function formatCreationTimeResult(value: unknown) {
  const raw = typeof value === 'bigint' ? value : BigInt(String(value ?? '0'));
  const seconds = Number(raw);
  const timestamp = new Date(seconds * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad2 = (input: number) => String(input).padStart(2, '0');
  const month = months[timestamp.getUTCMonth()] || 'Jan';
  const hours24 = timestamp.getUTCHours();
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const formatted = `${month}-${pad2(timestamp.getUTCDate())}-${timestamp.getUTCFullYear()} ${pad2(hours12)}:${pad2(timestamp.getUTCMinutes())}:${pad2(timestamp.getUTCSeconds())} ${meridiem} UTC`;
  const localFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
  const localParts = localFormatter.formatToParts(timestamp);
  const localMonth = localParts.find((part) => part.type === 'month')?.value || month;
  const localDay = localParts.find((part) => part.type === 'day')?.value || pad2(timestamp.getDate());
  const localYear = localParts.find((part) => part.type === 'year')?.value || String(timestamp.getFullYear());
  const localHour = localParts.find((part) => part.type === 'hour')?.value || pad2(((timestamp.getHours() % 12) || 12));
  const localMinute = localParts.find((part) => part.type === 'minute')?.value || pad2(timestamp.getMinutes());
  const localSecond = localParts.find((part) => part.type === 'second')?.value || pad2(timestamp.getSeconds());
  const localMeridiem = localParts.find((part) => part.type === 'dayPeriod')?.value || (timestamp.getHours() >= 12 ? 'PM' : 'AM');
  const localZone = localParts.find((part) => part.type === 'timeZoneName')?.value || 'Local';
  const localTime = `${localMonth}-${localDay}-${localYear} ${localHour}:${localMinute}:${localSecond} ${localMeridiem} ${localZone}`;

  return {
    source: 'StartDateTime',
    offset_seconds: seconds.toLocaleString('en-US'),
    formatted: {
      universalTime: formatted,
      localTime,
    },
  };
}

function parseDateTimeInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);
  const date = new Date(year, month, day, hours, minutes, seconds, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    return null;
  }
  return date;
}

const DATE_DIFF_UNITS = ['Years', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds'] as const;
const DATE_DIFF_DIVISORS: Record<(typeof DATE_DIFF_UNITS)[number], number> = {
  Years: 365 * 24 * 60 * 60,
  Months: 30 * 24 * 60 * 60,
  Weeks: 7 * 24 * 60 * 60,
  Days: 24 * 60 * 60,
  Hours: 60 * 60,
  Minutes: 60,
  Seconds: 1,
};
const DATE_DIFF_UNIT_LABELS: Record<(typeof DATE_DIFF_UNITS)[number], string> = {
  Years: 'YY',
  Months: 'MM',
  Weeks: 'W',
  Days: 'DD',
  Hours: 'hh',
  Minutes: 'mm',
  Seconds: 'ss',
};

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
}

function parseSelectedDateDiffUnits(unitRaw: string) {
  const rawUnits = String(unitRaw || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return DATE_DIFF_UNITS.filter((unit) => rawUnits.includes(unit));
}

function formatSegmentValue(value: number, pad: boolean) {
  const prefix = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const formatted = formatDecimal(absolute);
  if (!pad) return `${prefix}${formatted}`;
  const [whole, fraction] = formatted.split('.');
  return `${prefix}${String(whole).padStart(2, '0')}${fraction ? `.${fraction}` : ''}`;
}

function formatDateDifferenceOutput(diffSeconds: number, unitRaw: string) {
  const units = parseSelectedDateDiffUnits(unitRaw);
  if (units.length === 0) {
    return { units: [], display: '', secondsDifference: String(diffSeconds) };
  }
  if (units.length === 1) {
    const unit = units[0];
    return {
      units,
      display: `${DATE_DIFF_UNIT_LABELS[unit]}: ${formatDecimal(diffSeconds / DATE_DIFF_DIVISORS[unit])}`,
      secondsDifference: String(diffSeconds),
    };
  }
  let remaining = Math.abs(diffSeconds);
  const values = units.map((unit, index) => {
    const divisor = DATE_DIFF_DIVISORS[unit];
    if (index === units.length - 1) {
      const value = remaining / divisor;
      return formatSegmentValue(index === 0 && diffSeconds < 0 ? -value : value, index > 0);
    }
    const value = Math.floor(remaining / divisor);
    remaining -= value * divisor;
    return formatSegmentValue(index === 0 && diffSeconds < 0 ? -value : value, index > 0);
  });
  return {
    units,
    display: `${units.map((unit) => DATE_DIFF_UNIT_LABELS[unit]).join(':')}: ${values.join(':')}`,
    secondsDifference: String(diffSeconds),
  };
}

function isMissingContractReadError(error: unknown) {
  const source = (error && typeof error === 'object' ? error : {}) as Record<string, unknown>;
  const nested = ((source.error || source.info || source.cause) && typeof (source.error || source.info || source.cause) === 'object'
    ? (source.error || source.info || source.cause)
    : {}) as Record<string, unknown>;
  const code = String(source.code || nested.code || '');
  const data = String(source.data || nested.data || '');
  const message = String(source.message || nested.message || '');
  return code === 'CALL_EXCEPTION' || data === '0x' || /execution reverted|require\(false\)|no matching fragment/i.test(message);
}

type RunArgs = {
  selectedMethod: SpCoinReadMethod;
  spReadParams: string[];
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  stringifyResult: (result: unknown) => string;
  spCoinAccessSource: SpCoinAccessSource;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<any>;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

function getReadMethodHandlers() {
  const { ONCHAIN_READ_METHOD_HANDLERS } = require('../../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/onChain/readMethods/index') as {
    ONCHAIN_READ_METHOD_HANDLERS: Record<string, { run: (context: unknown) => Promise<unknown> }>;
  };
  const { OFFCHAIN_READ_METHOD_HANDLERS } = require('../../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/offChain/readMethods/index') as {
    OFFCHAIN_READ_METHOD_HANDLERS: Record<string, { run: (context: unknown) => Promise<unknown> }>;
  };

  return {
    ...ONCHAIN_READ_METHOD_HANDLERS,
    ...OFFCHAIN_READ_METHOD_HANDLERS,
  } as const;
}

export async function runSpCoinReadMethod(args: RunArgs): Promise<unknown> {
  const {
    selectedMethod,
    spReadParams,
    coerceParamValue,
    stringifyResult,
    spCoinAccessSource,
    requireContractAddress,
    ensureReadRunner,
    appendLog,
    setStatus,
  } = args;

  const canonicalMethod = normalizeSpCoinReadMethod(selectedMethod);
  const activeDef = SPCOIN_READ_METHOD_DEFS[canonicalMethod];
  if (!activeDef) {
    throw new Error(`SpCoin read method ${selectedMethod} is not registered.`);
  }
  if (canonicalMethod === 'calcDataTimeDiff') {
    const fromRaw = String(spReadParams[0] || '').trim();
    const toRaw = String(spReadParams[1] || '').trim();
    const unitRaw = String(spReadParams[2] || 'Seconds').trim();
    const fromDate = parseDateTimeInput(fromRaw);
    const toDate = parseDateTimeInput(toRaw);
    if (!fromDate) throw new Error('From Date/Time must be a valid date/time.');
    if (!toDate) throw new Error('To Date/Time must be a valid date/time.');
    const diffSeconds = (toDate.getTime() - fromDate.getTime()) / 1000;
    const normalized = formatDateDifferenceOutput(diffSeconds, unitRaw);
    const result = {
      fromDateTime: fromRaw,
      toDateTime: toRaw,
      selectedUnits: normalized.units,
      dateDifference: normalized.display,
      secondsDifference: normalized.secondsDifference,
    };
    const out = stringifyResult(result);
    appendLog(`${activeDef.title}(${[fromRaw, toRaw, unitRaw].join(', ')}) -> ${out}`);
    setStatus(`${activeDef.title} read complete.`);
    return result;
  }
  const target = requireContractAddress();
  const runner = await ensureReadRunner();
  const access = createSpCoinLibraryAccess(target, runner, undefined, spCoinAccessSource);
  const read = access.read as SpCoinReadAccess | undefined;
  const staking = access.staking as SpCoinStakingAccess & Record<string, unknown>;
  const contract = access.contract as SpCoinContractAccess;
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spReadParams[idx], def));
  if (canonicalMethod === 'getMasterAccountKeyCount') {
    appendLog(
      `[debug:getMasterAccountKeyCount] access read=${String(Boolean(access?.read))} contract=${String(Boolean(access?.contract))}`,
    );
    const readHost =
      read && typeof read === 'object'
        ? (read as SpCoinReadAccess & Record<string, unknown>)
        : ({} as SpCoinReadAccess & Record<string, unknown>);
    if (typeof readHost.getMasterAccountKeyCount === 'function') {
      const count = Number(await readHost.getMasterAccountKeyCount());
      const out = stringifyResult(count);
      appendLog(`${activeDef.title}() -> ${out}`);
      setStatus(`${activeDef.title} read complete.`);
      return count;
    }
    if (typeof readHost.getMasterAccountMetaData === 'function') {
      const metaData = (await readHost.getMasterAccountMetaData()) as Record<string, unknown>;
      const count = Number(metaData?.masterAccountSize ?? metaData?.numberOfAccounts ?? (Array.isArray(metaData) ? metaData[0] : 0));
      const out = stringifyResult(count);
      appendLog(`${activeDef.title}() -> ${out}`);
      setStatus(`${activeDef.title} read complete.`);
      return count;
    }
    if (typeof contract?.getMasterAccountKeyCount === 'function') {
      try {
        const rawCount = await contract.getMasterAccountKeyCount();
        const count = Number(rawCount ?? 0);
        const out = stringifyResult(count);
        appendLog(`${activeDef.title}() -> ${out}`);
        setStatus(`${activeDef.title} read complete.`);
        return count;
      } catch (error) {
        if (!isMissingContractReadError(error)) throw error;
      }
    }
    if (typeof contract?.getAccountKeyCount === 'function') {
      try {
        const rawCount = await contract.getAccountKeyCount();
        const count = Number(rawCount ?? 0);
        const out = stringifyResult(count);
        appendLog(`${activeDef.title}() -> ${out}`);
        setStatus(`${activeDef.title} read complete.`);
        return count;
      } catch (error) {
        if (!isMissingContractReadError(error)) throw error;
      }
    }
    let rawAccountKeys: unknown = [];
    if (typeof readHost.getMasterAccountKeys === 'function') {
      rawAccountKeys = await readHost.getMasterAccountKeys();
    } else if (typeof readHost.getAccountKeys === 'function') {
      rawAccountKeys = await readHost.getAccountKeys();
    } else if (typeof readHost.getMasterAccountList === 'function') {
      rawAccountKeys = await readHost.getMasterAccountList();
    } else if (typeof contract?.getMasterAccountKeys === 'function') {
      try {
        rawAccountKeys = await contract.getMasterAccountKeys();
      } catch (error) {
        if (!isMissingContractReadError(error)) throw error;
      }
    }
    const accountKeys = normalizeStringListResult(rawAccountKeys ?? []);
    const out = stringifyResult(accountKeys.length || 0);
    appendLog(`${activeDef.title}() -> ${out}`);
    setStatus(`${activeDef.title} read complete.`);
    return accountKeys.length;
  }
  const handler = getReadMethodHandlers()[canonicalMethod];
  if (!handler) {
    throw new Error(`SpCoin read method ${selectedMethod} is not wired to a read-method source file.`);
  }
  let result: unknown;
  try {
    result = await handler.run({
      canonicalMethod,
      selectedMethod,
      methodArgs,
      spCoinAccessSource,
      target,
      read: read as Record<string, unknown>,
      staking,
      contract: contract as Record<string, unknown>,
      normalizeStringListResult,
      toStringOrNumber,
      formatCreationTimeResult,
      requireExternalSerializedValue: (method: string, args: unknown[]) =>
        requireExternalSerializedValue(contract, method as SerializationBaseMethod, args),
      compareSpCoinContractSize: async (previousReleaseDir: string, latestReleaseDir: string) => {
        const response = await fetch('/api/spCoin/contract-size-comparison', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousReleaseDir,
            latestReleaseDir,
          }),
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          report?: unknown;
          scriptPath?: string;
          compilerBackend?: string;
          stderr?: string;
          previousReleaseDir?: string;
          latestReleaseDir?: string;
          previousFingerprint?: string;
          latestFingerprint?: string;
          cached?: boolean;
        };
        if (!response.ok || payload?.ok === false) {
          throw new Error(payload?.message || `Unable to compare SPCoin contract size (${response.status})`);
        }
        const reportRecord =
          payload?.report && typeof payload.report === 'object' && !Array.isArray(payload.report)
            ? (payload.report as Record<string, unknown>)
            : {};
        const variants = Array.isArray(reportRecord.variants) ? (reportRecord.variants as Array<Record<string, unknown>>) : [];
        const latestVariant = variants.find((entry) => String(entry?.label || '') === 'latest') || null;
        const previousVariant = variants.find((entry) => String(entry?.label || '') === 'previous') || null;
        const latestBytesVsLimit = Number(latestVariant?.deployedMarginBytes ?? NaN);
        const previousBytesVsLimit = Number(previousVariant?.deployedMarginBytes ?? NaN);
        const deltaRecord =
          reportRecord.delta && typeof reportRecord.delta === 'object' && !Array.isArray(reportRecord.delta)
            ? (reportRecord.delta as Record<string, unknown>)
            : {};
        return {
          delta: deltaRecord,
          latestSizeStatus: latestVariant
            ? {
                deployedBytes: latestVariant.deployedBytes ?? null,
                bytesVsLimit: latestVariant.deployedMarginBytes ?? null,
                limitStatus: latestVariant.deployedMarginLabel ?? '',
              }
            : null,
          previousSizeStatus: previousVariant
            ? {
                deployedBytes: previousVariant.deployedBytes ?? null,
                bytesVsLimit: previousVariant.deployedMarginBytes ?? null,
                limitStatus: previousVariant.deployedMarginLabel ?? '',
              }
            : null,
          latestLimitSummary: Number.isFinite(latestBytesVsLimit)
            ? latestBytesVsLimit >= 0
              ? `Latest build is not oversized yet. It is ${latestBytesVsLimit.toLocaleString()} bytes under the EIP-170 limit.`
              : `Latest build is oversized by ${Math.abs(latestBytesVsLimit).toLocaleString()} bytes vs the EIP-170 limit.`
            : '',
          previousLimitSummary: Number.isFinite(previousBytesVsLimit)
            ? previousBytesVsLimit >= 0
              ? `Previous build was ${previousBytesVsLimit.toLocaleString()} bytes under the EIP-170 limit.`
              : `Previous build was oversized by ${Math.abs(previousBytesVsLimit).toLocaleString()} bytes vs the EIP-170 limit.`
            : '',
          stderr: String(payload?.stderr || ''),
        };
      },
    });
  } catch (error) {
    if (isBadDataError(error)) {
      throw await buildReadDecodeError({
        error,
        method: canonicalMethod,
        target,
        runner,
      });
    }
    throw error;
  }

  const out = stringifyResult(result);
  appendLog(`${activeDef.title}(${methodArgs.join(', ')}) -> ${out}`);
  setStatus(`${activeDef.title} read complete.`);
  return result;
}

