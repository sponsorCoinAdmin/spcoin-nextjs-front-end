// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/index.ts
import { SPCOIN_READ_METHOD_DEFS } from './defs';
export { SPCOIN_READ_METHOD_DEFS };
import { createSpCoinLibraryAccess, type SpCoinAccessSource, type SpCoinContractAccess, type SpCoinReadAccess, type SpCoinStakingAccess } from '../../shared';
import type { ParamDef } from '../../shared/types';
import { normalizeStringListResult } from '../../shared/normalizeListResult';
import { buildExternalSerializerResult, type SerializationBaseMethod } from '../../serializationTests';

export type SpCoinReadMethod =
  | 'getSerializedSPCoinHeader'
  | 'getInflationRate'
  | 'calculateStakingRewards'
  | 'creationTime'
  | 'getSpCoinMetaData'
  | 'getSPCoinHeaderRecord'
  | 'getAccountList'
  | 'getAccountListSize'
  | 'getAccountRecipientList'
  | 'getAccountRecipientListSize'
  | 'getSerializedAccountRecord'
  | 'getSerializedRecipientRateList'
  | 'getSerializedRecipientRecordList'
  | 'getAccountRecord'
  | 'getAccountRecords'
  | 'getSerializedAccountRewards'
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
  | 'getSerializedRateTransactionList'
  | 'getAgentRateTransactionList'
  | 'getAgentRecord'
  | 'getAgentRecordList'
  | 'initialTotalSupply'
  | 'isAccountInserted'
  | 'masterAccountList'
  | 'serializeAgentRateRecordStr'
  | 'getStakingRewards'
  | 'getTimeMultiplier'
  | 'getAccountTimeInSecondeSinceUpdate'
  | 'getMillenniumTimeIntervalDivisor'
  | 'totalBalanceOf'
  | 'totalStakedSPCoins'
  | 'totalStakingRewards'
  | 'getVersion';

export const SPCOIN_LEGACY_READ_METHODS: SpCoinReadMethod[] = [
  'getSerializedSPCoinHeader',
  'getSerializedAccountRecord',
  'getSerializedAccountRewards',
  'getSerializedRecipientRecordList',
  'getSerializedRecipientRateList',
  'serializeAgentRateRecordStr',
  'getSerializedRateTransactionList',
];

const LEGACY_READ_METHOD_RENAMES: Partial<Record<string, SpCoinReadMethod>> = {
  version: 'getVersion',
  getSerializedSPCoinHeader: 'getSPCoinHeaderRecord',
  getSerializedAccountRecord: 'getAccountRecord',
  getSerializedAccountRewards: 'getAccountStakingRewards',
  getSerializedRecipientRecordList: 'getRecipientRecord',
  getSerializedRecipientRateList: 'getRecipientRateRecord',
  serializeAgentRateRecordStr: 'getAgentRateRecord',
  getSerializedRateTransactionList: 'getAgentRateTransactionList',
};

export const SPCOIN_COMPOUND_READ_METHODS: SpCoinReadMethod[] = [
  'getSPCoinHeaderRecord',
  'getAccountRecord',
  'getAccountStakingRewards',
  'getRecipientRecord',
  'getRecipientRateRecord',
  'getAgentRateRecord',
  'getAgentRateTransactionList',
];

export const SPCOIN_ADMIN_READ_METHODS: SpCoinReadMethod[] = [];

export const SPCOIN_SENDER_READ_METHODS: SpCoinReadMethod[] = [];

export function getSpCoinWorldReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter(
    (name) =>
      !SPCOIN_COMPOUND_READ_METHODS.includes(name) &&
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
  return getSpCoinReadOptions(hideUnexecutables).filter((name) => SPCOIN_COMPOUND_READ_METHODS.includes(name));
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

function getDynamicMethod(target: Record<string, unknown>, method: string) {
  const candidate = target[method];
  return typeof candidate === 'function' ? (candidate as (...args: unknown[]) => unknown) : undefined;
}

function toStringOrNumber(value: unknown): string | number {
  return typeof value === 'number' ? value : String(value);
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
  const target = requireContractAddress();
  const runner = await ensureReadRunner();
  const access = createSpCoinLibraryAccess(target, runner, undefined, spCoinAccessSource);
  const read = access.read as SpCoinReadAccess;
  const staking = access.staking as SpCoinStakingAccess & Record<string, unknown>;
  const contract = access.contract as SpCoinContractAccess;
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spReadParams[idx], def));
  let result: unknown;

  switch (canonicalMethod) {
    case 'getSerializedSPCoinHeader': {
      if (spCoinAccessSource === 'local') {
        result = await read.getSPCoinHeaderRecord(false);
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'getSerializedAccountRecord': {
      if (spCoinAccessSource === 'local') {
        result = await read.getAccountRecord(String(methodArgs[0]));
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'getSerializedAccountRewards': {
      if (spCoinAccessSource === 'local') {
        result = await read.getAccountStakingRewards(String(methodArgs[0]));
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'getSerializedRecipientRecordList': {
      if (spCoinAccessSource === 'local') {
        result = await read.getRecipientRecord(String(methodArgs[0]), String(methodArgs[1]));
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'getSerializedRecipientRateList': {
      if (spCoinAccessSource === 'local') {
        result = await read.getRecipientRateRecord(
          String(methodArgs[0]),
          String(methodArgs[1]),
          toStringOrNumber(methodArgs[2]),
        );
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'serializeAgentRateRecordStr': {
      if (spCoinAccessSource === 'local') {
        result = await read.getAgentRateRecord(
          String(methodArgs[0]),
          String(methodArgs[1]),
          toStringOrNumber(methodArgs[2]),
          String(methodArgs[3]),
          toStringOrNumber(methodArgs[4]),
        );
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'getSerializedRateTransactionList': {
      if (spCoinAccessSource === 'local') {
        result = await read.getAgentRateTransactionList(
          String(methodArgs[0]),
          String(methodArgs[1]),
          toStringOrNumber(methodArgs[2]),
          String(methodArgs[3]),
          toStringOrNumber(methodArgs[4]),
        );
        break;
      }
      const external = await buildExternalSerializerResult(
        contract,
        selectedMethod as SerializationBaseMethod,
        methodArgs,
      );
      if (external.blocked) {
        throw new Error(external.reason);
      }
      result = external.value;
      break;
    }
    case 'getSPCoinHeaderRecord': {
      result = await read.getSPCoinHeaderRecord(Boolean(methodArgs[0]));
      break;
    }
    case 'getAccountListSize': {
      const accountList = normalizeStringListResult(await read.getAccountList());
      result = accountList.length;
      break;
    }
    case 'getAccountRecipientListSize': {
      const recipientList = normalizeStringListResult(await read.getAccountRecipientList(String(methodArgs[0])));
      result = recipientList.length;
      break;
    }
    case 'getAccountRecord': {
      result = await read.getAccountRecord(String(methodArgs[0]));
      break;
    }
    case 'getAccountRecords': {
      result = await read.getAccountRecords();
      break;
    }
    case 'getAccountStakingRewards': {
      result = await read.getAccountStakingRewards(String(methodArgs[0]));
      break;
    }
    case 'getAccountRewardTransactionList':
    case 'getAccountRewardTransactionRecord':
    case 'getAccountRateRecordList':
    case 'getRateTransactionList': {
      result = methodArgs[0];
      break;
    }
    case 'getRecipientRateRecord': {
      result = await read.getRecipientRateRecord(
        String(methodArgs[0]),
        String(methodArgs[1]),
        toStringOrNumber(methodArgs[2]),
      );
      break;
    }
    case 'getRecipientRateRecordList': {
      const rates = (await contract.getRecipientRateList?.(methodArgs[0], methodArgs[1])) ?? [];
      result = await Promise.all(
        rates.map(async (rate) => ({
          recipientRateKey: String(rate),
          serializedRecipientRateList: await requireExternalSerializedValue(
            contract,
            'getSerializedRecipientRateList',
            [methodArgs[0], methodArgs[1], String(rate)],
          ),
        })),
      );
      break;
    }
    case 'getRecipientRecord': {
      result = await read.getRecipientRecord(String(methodArgs[0]), String(methodArgs[1]));
      break;
    }
    case 'getRecipientRecordList': {
      const sponsorKey = String(methodArgs[0]);
      const recipientAccountList = methodArgs[1] as string[];
      result = await Promise.all(
        recipientAccountList.map(async (recipientKey) => ({
          recipientKey,
          serializedRecipientRecordList: await requireExternalSerializedValue(
            contract,
            'getSerializedRecipientRecordList',
            [sponsorKey, recipientKey],
          ),
        })),
      );
      break;
    }
    case 'getAgentRateRecord': {
      result = await read.getAgentRateRecord(
        String(methodArgs[0]),
        String(methodArgs[1]),
        toStringOrNumber(methodArgs[2]),
        String(methodArgs[3]),
        toStringOrNumber(methodArgs[4]),
      );
      break;
    }
    case 'getAgentRateRecordList': {
      const agentRateKeys = (await contract.getAgentRateList?.(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3])) as
        | Array<string | bigint>
        | undefined;
      result = await Promise.all(
        (agentRateKeys ?? []).map(async (agentRateKey) => ({
          agentRateKey: String(agentRateKey),
          serializedAgentRateRecord: await requireExternalSerializedValue(
            contract,
            'serializeAgentRateRecordStr',
            [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], String(agentRateKey)],
          ),
        })),
      );
      break;
    }
    case 'getAgentRateTransactionList': {
      result = await read.getAgentRateTransactionList(
        String(methodArgs[0]),
        String(methodArgs[1]),
        toStringOrNumber(methodArgs[2]),
        String(methodArgs[3]),
        toStringOrNumber(methodArgs[4]),
      );
      break;
    }
    case 'getAgentRecord': {
      const stakedSPCoins = await contract.getAgentTotalRecipient?.(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3]);
      const agentRateList = await contract.getAgentRateList?.(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3]);
      result = { agentKey: methodArgs[3], stakedSPCoins, agentRateList };
      break;
    }
    case 'getAgentRecordList': {
      const sponsorKey = String(methodArgs[0]);
      const recipientKey = String(methodArgs[1]);
      const recipientRateKey = String(methodArgs[2]);
      const agentAccountList = methodArgs[3] as string[];
      result = await Promise.all(
        agentAccountList.map(async (agentKey) => ({
          agentKey,
          stakedSPCoins: await contract.getAgentTotalRecipient?.(sponsorKey, recipientKey, recipientRateKey, agentKey),
          agentRateList: await contract.getAgentRateList?.(sponsorKey, recipientKey, recipientRateKey, agentKey),
        })),
      );
      break;
    }
    default:
      if (getDynamicMethod(read as Record<string, unknown>, selectedMethod)) {
        result = await getDynamicMethod(read as Record<string, unknown>, selectedMethod)!(...methodArgs);
      } else if (getDynamicMethod(staking, selectedMethod)) {
        result = await getDynamicMethod(staking, selectedMethod)!(...methodArgs);
      } else {
        const contractMethod = getDynamicMethod(contract as Record<string, unknown>, selectedMethod);
        if (!contractMethod) {
          throw new Error(`SpCoin read method ${selectedMethod} is not available on access modules or contract.`);
        }
        result = await contractMethod(...methodArgs);
      }
      break;
  }

  const out = stringifyResult(result);
  appendLog(`${activeDef.title}(${methodArgs.join(', ')}) -> ${out}`);
  setStatus(`${activeDef.title} read complete.`);
  return result;
}

