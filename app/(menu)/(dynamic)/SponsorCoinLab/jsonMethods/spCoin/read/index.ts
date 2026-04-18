// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/index.ts
import { SPCOIN_READ_METHOD_DEFS } from './defs';
export { SPCOIN_READ_METHOD_DEFS };
import { createSpCoinLibraryAccess, type SpCoinAccessSource, type SpCoinContractAccess, type SpCoinReadAccess, type SpCoinStakingAccess } from '../../shared';
import type { ParamDef } from '../../shared/types';
import { normalizeStringListResult } from '../../shared/normalizeListResult';
import { buildExternalSerializerResult, type SerializationBaseMethod } from '../../serializationTests';

export type SpCoinReadMethod =
  | 'getInflationRate'
  | 'calculateStakingRewards'
  | 'creationTime'
  | 'getSpCoinMetaData'
  | 'getMasterAccountList'
  | 'getMasterAccountListSize'
  | 'getRecipientList'
  | 'getAgentList'
  | 'getRecipientListSize'
  | 'getAgentListSize'
  | 'getAccountRecord'
  | 'getAccountStakingRewards'
  | 'getAccountRewardTransactionList'
  | 'getAccountRewardTransactionRecord'
  | 'getAccountRateRecordList'
  | 'getRateTransactionList'
  | 'getRecipientRateList'
  | 'getRecipientRateRecord'
  | 'getRecipientRateRecordList'
  | 'getRecipientRateAgentList'
  | 'getLowerRecipientRate'
  | 'getUpperRecipientRate'
  | 'getRecipientRateRange'
  | 'getRecipientRecord'
  | 'getRecipientRecordList'
  | 'getAgentRateList'
  | 'getLowerAgentRate'
  | 'getUpperAgentRate'
  | 'getAgentRateRange'
  | 'getAgentRateRecord'
  | 'getAgentRateRecordList'
  | 'getAgentTotalRecipient'
  | 'getRecipientRateTransactionCount'
  | 'getAgentRateTransactionCount'
  | 'getAgentRateTransactionAt'
  | 'getAgentRateTransactionList'
  | 'getAgentRecord'
  | 'getAgentRecordList'
  | 'getInitialTotalSupply'
  | 'isDeployed'
  | 'isAccountInserted'
  | 'getMasterAccountElement'
  | 'getStakingRewards'
  | 'calcDataTimeDiff'
  | 'totalUnstakedSpCoins'
  | 'totalStakedSPCoins'
  | 'totalStakingRewards'
  | 'getVersion';

export const SPCOIN_LEGACY_READ_METHODS: SpCoinReadMethod[] = [];

const LEGACY_READ_METHOD_RENAMES: Partial<Record<string, SpCoinReadMethod>> = {
  version: 'getVersion',
  initialTotalSupply: 'getInitialTotalSupply',
  getAccountListSize: 'getMasterAccountListSize',
  getAccountRecipientList: 'getRecipientList',
  getAccountRecipientListSize: 'getRecipientListSize',
  getAccountAgentList: 'getAgentList',
  getSerializedAccountRecord: 'getAccountRecord',
  getSerializedAccountRewards: 'getAccountStakingRewards',
  getSerializedRecipientRecordList: 'getRecipientRecord',
  getSerializedRecipientRateList: 'getRecipientRateRecord',
  serializeAgentRateRecordStr: 'getAgentRateRecord',
  getSerializedRateTransactionList: 'getAgentRateTransactionList',
  getAccountTimeInSecondeSinceUpdate: 'calcDataTimeDiff',
};

export const SPCOIN_OFFCHAIN_READ_METHODS: SpCoinReadMethod[] = [
  'getAccountRecord',
  'getAccountStakingRewards',
  'getRecipientRecord',
  'getRecipientRateRecord',
  'getAgentRateRecord',
  'getAgentRateTransactionList',
];

export const SPCOIN_COMPOUND_READ_METHODS = SPCOIN_OFFCHAIN_READ_METHODS;

export const SPCOIN_ADMIN_READ_METHODS: SpCoinReadMethod[] = ['calcDataTimeDiff'];

export const SPCOIN_SENDER_READ_METHODS: SpCoinReadMethod[] = [];

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
): Promise<string> {
  const external = await buildExternalSerializerResult(contract, method, methodArgs);
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
  const pad3 = (input: number) => String(input).padStart(3, '0');
  const month = months[timestamp.getUTCMonth()] || 'Jan';
  const formatted = `${month}-${pad2(timestamp.getUTCDate())}-${timestamp.getUTCFullYear()},.${pad2(timestamp.getUTCHours())}:${pad2(timestamp.getUTCMinutes())}:${pad2(timestamp.getUTCSeconds())}:${pad3(timestamp.getUTCMilliseconds())}`;

  return {
    ms_offset: seconds.toLocaleString('en-US'),
    formatted,
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
  const read = access.read as SpCoinReadAccess;
  const staking = access.staking as SpCoinStakingAccess & Record<string, unknown>;
  const contract = access.contract as SpCoinContractAccess;
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spReadParams[idx], def));
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
          stderr?: string;
          previousReleaseDir?: string;
          latestReleaseDir?: string;
          cached?: boolean;
        };
        if (!response.ok || payload?.ok === false) {
          throw new Error(payload?.message || `Unable to compare SPCoin contract size (${response.status})`);
        }
        return {
          scriptPath: String(payload?.scriptPath || ''),
          previousReleaseDir: String(payload?.previousReleaseDir || ''),
          latestReleaseDir: String(payload?.latestReleaseDir || ''),
          cached: Boolean(payload?.cached),
          report: payload?.report ?? {},
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

