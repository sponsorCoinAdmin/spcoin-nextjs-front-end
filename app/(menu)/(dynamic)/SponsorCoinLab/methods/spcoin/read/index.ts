// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/index.ts
import { SPCOIN_READ_METHOD_DEFS } from './defs';
export { SPCOIN_READ_METHOD_DEFS };
import { createSpCoinLibraryAccess } from '../../shared';
import { buildSerializedSPCoinHeader } from '../../shared/buildSerializedSPCoinHeader';
import { normalizeStringListResult } from '../../shared/normalizeListResult';
import { buildExternalSerializerResult, type SerializationBaseMethod } from '../../serializationTests';

export type SpCoinReadMethod =
  | 'getSerializedSPCoinHeader'
  | 'getInflationRate'
  | 'calculateStakingRewards'
  | 'creationTime'
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
  | 'version';

export const SPCOIN_COMPOUND_READ_METHODS: SpCoinReadMethod[] = [
  'getSerializedSPCoinHeader',
  'getSerializedAccountRecord',
  'getSerializedAccountRewards',
  'getSerializedRecipientRecordList',
  'getSerializedRecipientRateList',
  'serializeAgentRateRecordStr',
  'getSerializedRateTransactionList',
];

export const SPCOIN_ADMIN_READ_METHODS: SpCoinReadMethod[] = [
  'getInflationRate',
  'getLowerRecipientRate',
  'getUpperRecipientRate',
  'getRecipientRateRange',
  'getLowerAgentRate',
  'getUpperAgentRate',
  'getAgentRateRange',
];

export const SPCOIN_SENDER_READ_METHODS: SpCoinReadMethod[] = [];

export function getSpCoinWorldReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  return getSpCoinReadOptions(hideUnexecutables).filter(
    (name) => !SPCOIN_COMPOUND_READ_METHODS.includes(name) && !SPCOIN_ADMIN_READ_METHODS.includes(name) && !SPCOIN_SENDER_READ_METHODS.includes(name),
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

async function requireExternalSerializedValue(
  contract: any,
  method: SerializationBaseMethod,
  methodArgs: any[],
): Promise<string> {
  const external = await buildExternalSerializerResult(contract, method, methodArgs);
  if (external.blocked) {
    throw new Error(external.reason);
  }
  return external.value;
}

type RunArgs = {
  selectedMethod: SpCoinReadMethod;
  spReadParams: string[];
  coerceParamValue: (raw: string, def: any) => any;
  stringifyResult: (result: unknown) => string;
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
    requireContractAddress,
    ensureReadRunner,
    appendLog,
    setStatus,
  } = args;

  const activeDef = SPCOIN_READ_METHOD_DEFS[selectedMethod];
  const target = requireContractAddress();
  const runner = await ensureReadRunner();
  const access = createSpCoinLibraryAccess(target, runner);
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spReadParams[idx], def));
  let result: unknown;

  switch (selectedMethod) {
    case 'getSerializedSPCoinHeader':
    case 'getSerializedAccountRecord':
    case 'getSerializedAccountRewards':
    case 'getSerializedRecipientRecordList':
    case 'getSerializedRecipientRateList':
    case 'serializeAgentRateRecordStr':
    case 'getSerializedRateTransactionList': {
      const external = await buildExternalSerializerResult(
        access.contract as any,
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
      const getBody = Boolean(methodArgs[0]);
      const header = await buildSerializedSPCoinHeader(access.contract as any);
      if (!getBody) {
        result = { header };
        break;
      }
      const accountList = normalizeStringListResult(await (access.read as any).getAccountList());
      const body = await Promise.all(
        accountList.map(async (accountKey) => ({
          accountKey,
          serializedAccountRecord: await requireExternalSerializedValue(
            access.contract as any,
            'getSerializedAccountRecord',
            [accountKey],
          ),
        })),
      );
      result = { header, body };
      break;
    }
    case 'getAccountListSize': {
      const accountList = normalizeStringListResult(await (access.read as any).getAccountList());
      result = accountList.length;
      break;
    }
    case 'getAccountRecipientListSize': {
      const recipientList = normalizeStringListResult(await (access.read as any).getAccountRecipientList(methodArgs[0]));
      result = recipientList.length;
      break;
    }
    case 'getAccountRecord': {
      const accountKey = String(methodArgs[0]);
      const serializedAccountRecord = await requireExternalSerializedValue(
        access.contract as any,
        'getSerializedAccountRecord',
        [accountKey],
      );
      const serializedAccountRewards = await requireExternalSerializedValue(
        access.contract as any,
        'getSerializedAccountRewards',
        [accountKey],
      );
      const recipientAccountList = normalizeStringListResult(await (access.read as any).getAccountRecipientList(accountKey));
      result = { accountKey, serializedAccountRecord, serializedAccountRewards, recipientAccountList };
      break;
    }
    case 'getAccountRecords': {
      const accountList = normalizeStringListResult(await (access.read as any).getAccountList());
      result = await Promise.all(
        accountList.map(async (accountKey) => ({
          accountKey,
          serializedAccountRecord: await requireExternalSerializedValue(
            access.contract as any,
            'getSerializedAccountRecord',
            [accountKey],
          ),
        })),
      );
      break;
    }
    case 'getAccountStakingRewards': {
      result = await requireExternalSerializedValue(access.contract as any, 'getSerializedAccountRewards', [methodArgs[0]]);
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
      const serializedRecipientRateList = await requireExternalSerializedValue(
        access.contract as any,
        'getSerializedRecipientRateList',
        [methodArgs[0], methodArgs[1], methodArgs[2]],
      );
      const agentAccountList = await (access.contract as any).getRecipientRateAgentList(methodArgs[0], methodArgs[1], methodArgs[2]);
      const transactions = '';
      result = { serializedRecipientRateList, agentAccountList, transactions };
      break;
    }
    case 'getRecipientRateRecordList': {
      const rates = (await (access.contract as any).getRecipientRateList(methodArgs[0], methodArgs[1])) as Array<string | bigint>;
      result = await Promise.all(
        rates.map(async (rate) => ({
          recipientRateKey: String(rate),
          serializedRecipientRateList: await requireExternalSerializedValue(
            access.contract as any,
            'getSerializedRecipientRateList',
            [methodArgs[0], methodArgs[1], String(rate)],
          ),
        })),
      );
      break;
    }
    case 'getRecipientRecord': {
      const serializedRecipientRecordList = await requireExternalSerializedValue(
        access.contract as any,
        'getSerializedRecipientRecordList',
        [methodArgs[0], methodArgs[1]],
      );
      const recipientRateList = await (access.contract as any).getRecipientRateList(methodArgs[0], methodArgs[1]);
      result = { serializedRecipientRecordList, recipientRateList };
      break;
    }
    case 'getRecipientRecordList': {
      const sponsorKey = String(methodArgs[0]);
      const recipientAccountList = methodArgs[1] as string[];
      result = await Promise.all(
        recipientAccountList.map(async (recipientKey) => ({
          recipientKey,
          serializedRecipientRecordList: await requireExternalSerializedValue(
            access.contract as any,
            'getSerializedRecipientRecordList',
            [sponsorKey, recipientKey],
          ),
        })),
      );
      break;
    }
    case 'getAgentRateRecord': {
      const serializedAgentRateRecord = await requireExternalSerializedValue(
        access.contract as any,
        'serializeAgentRateRecordStr',
        [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4]],
      );
      const transactions = await requireExternalSerializedValue(
        access.contract as any,
        'getSerializedRateTransactionList',
        [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4]],
      );
      result = { serializedAgentRateRecord, transactions };
      break;
    }
    case 'getAgentRateRecordList': {
      const agentRateKeys = (await (access.contract as any).getAgentRateList(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3])) as Array<
        string | bigint
      >;
      result = await Promise.all(
        agentRateKeys.map(async (agentRateKey) => ({
          agentRateKey: String(agentRateKey),
          serializedAgentRateRecord: await requireExternalSerializedValue(
            access.contract as any,
            'serializeAgentRateRecordStr',
            [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], String(agentRateKey)],
          ),
        })),
      );
      break;
    }
    case 'getAgentRateTransactionList': {
      result = await requireExternalSerializedValue(
        access.contract as any,
        'getSerializedRateTransactionList',
        [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4]],
      );
      break;
    }
    case 'getAgentRecord': {
      const stakedSPCoins = await (access.contract as any).getAgentTotalRecipient(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3]);
      const agentRateList = await (access.contract as any).getAgentRateList(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3]);
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
          stakedSPCoins: await (access.contract as any).getAgentTotalRecipient(sponsorKey, recipientKey, recipientRateKey, agentKey),
          agentRateList: await (access.contract as any).getAgentRateList(sponsorKey, recipientKey, recipientRateKey, agentKey),
        })),
      );
      break;
    }
    default:
      if (typeof (access.read as any)[selectedMethod] === 'function') {
        result = await (access.read as any)[selectedMethod](...methodArgs);
      } else if (typeof (access.staking as any)[selectedMethod] === 'function') {
        result = await (access.staking as any)[selectedMethod](...methodArgs);
      } else {
        result = await (access.contract as any)[selectedMethod](...methodArgs);
      }
      break;
  }

  const out = stringifyResult(result);
  appendLog(`${activeDef.title}(${methodArgs.join(', ')}) -> ${out}`);
  setStatus(`${activeDef.title} read complete.`);
  return result;
}

