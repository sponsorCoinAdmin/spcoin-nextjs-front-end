// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/index.ts
import { SPCOIN_READ_METHOD_DEFS } from './defs';
export { SPCOIN_READ_METHOD_DEFS };
import { createSpCoinLibraryAccess } from '../../shared';
import { normalizeStringListResult } from '../../shared/normalizeListResult';

export type SpCoinReadMethod =
  | 'getSerializedSPCoinHeader'
  | 'annualInflation'
  | 'calculateStakingRewards'
  | 'creationTime'
  | 'getSPCoinHeaderRecord'
  | 'getAccountList'
  | 'getAccountListSize'
  | 'getAccountRecipientList'
  | 'getAccountRecipientListSize'
  | 'getRateTransactionStr'
  | 'getSerializedAccountRecord'
  | 'getSerializedRecipientRateList'
  | 'getSerializedRecipientRecordList'
  | 'getAccountRecord'
  | 'getAccountRecords'
  | 'getSerializedAccountRewards'
  | 'getAccountStakingRewards'
  | 'getRewardAccounts'
  | 'getRewardTypeRecord'
  | 'getAccountRewardTransactionList'
  | 'getAccountRewardTransactionRecord'
  | 'getAccountRateRecordList'
  | 'getRateTransactionList'
  | 'getRecipientRateList'
  | 'getRecipientRateRecord'
  | 'getRecipientRateRecordList'
  | 'getRecipientRateAgentList'
  | 'getRecipientRecord'
  | 'getRecipientRecordList'
  | 'getAgentRateList'
  | 'getAgentRateRecord'
  | 'getAgentRateRecordList'
  | 'getAgentTotalRecipient'
  | 'getSerializedRateTransactionList'
  | 'getAgentRateTransactionList'
  | 'getRecipientRateTransactionList'
  | 'getAgentRecord'
  | 'getAgentRecordList'
  | 'initialTotalSupply'
  | 'isAccountInserted'
  | 'masterAccountList'
  | 'msgSender'
  | 'serializeAgentRateRecordStr'
  | 'strToUint'
  | 'testStakingRewards'
  | 'getStakingRewards'
  | 'getTimeMultiplier'
  | 'getAccountTimeInSecondeSinceUpdate'
  | 'getMillenniumTimeIntervalDivisor'
  | 'totalBalanceOf'
  | 'totalStakedSPCoins'
  | 'totalStakingRewards'
  | 'version';

export function getSpCoinReadOptions(hideUnexecutables: boolean): SpCoinReadMethod[] {
  const all = (Object.keys(SPCOIN_READ_METHOD_DEFS) as SpCoinReadMethod[]).sort((a, b) => a.localeCompare(b));
  if (!hideUnexecutables) return all;
  return all.filter((name) => SPCOIN_READ_METHOD_DEFS[name].executable !== false);
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
    case 'getSPCoinHeaderRecord': {
      const getBody = Boolean(methodArgs[0]);
      const header = await (access.contract as any).getSerializedSPCoinHeader();
      if (!getBody) {
        result = { header };
        break;
      }
      const accountList = normalizeStringListResult(await (access.read as any).getAccountList());
      const body = await Promise.all(
        accountList.map(async (accountKey) => ({
          accountKey,
          serializedAccountRecord: await (access.contract as any).getSerializedAccountRecord(accountKey),
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
      const serializedAccountRecord = await (access.contract as any).getSerializedAccountRecord(accountKey);
      const serializedAccountRewards = await (access.contract as any).getSerializedAccountRewards(accountKey);
      const recipientAccountList = normalizeStringListResult(await (access.read as any).getAccountRecipientList(accountKey));
      result = { accountKey, serializedAccountRecord, serializedAccountRewards, recipientAccountList };
      break;
    }
    case 'getAccountRecords': {
      const accountList = normalizeStringListResult(await (access.read as any).getAccountList());
      result = await Promise.all(
        accountList.map(async (accountKey) => ({
          accountKey,
          serializedAccountRecord: await (access.contract as any).getSerializedAccountRecord(accountKey),
        })),
      );
      break;
    }
    case 'getAccountStakingRewards': {
      result = await (access.contract as any).getSerializedAccountRewards(methodArgs[0]);
      break;
    }
    case 'getRewardTypeRecord': {
      const rewardAccounts = await (access.contract as any).getRewardAccounts(methodArgs[0], methodArgs[1]);
      result = { reward: methodArgs[2], rewardAccounts };
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
      const serializedRecipientRateList = await (access.contract as any).getSerializedRecipientRateList(methodArgs[0], methodArgs[1], methodArgs[2]);
      const agentAccountList = await (access.contract as any).getRecipientRateAgentList(methodArgs[0], methodArgs[1], methodArgs[2]);
      const transactions = await (access.contract as any).getRecipientRateTransactionList(methodArgs[0], methodArgs[1], methodArgs[2]);
      result = { serializedRecipientRateList, agentAccountList, transactions };
      break;
    }
    case 'getRecipientRateRecordList': {
      const rates = (await (access.contract as any).getRecipientRateList(methodArgs[0], methodArgs[1])) as Array<string | bigint>;
      result = await Promise.all(
        rates.map(async (rate) => ({
          recipientRateKey: String(rate),
          serializedRecipientRateList: await (access.contract as any).getSerializedRecipientRateList(methodArgs[0], methodArgs[1], String(rate)),
        })),
      );
      break;
    }
    case 'getRecipientRecord': {
      const serializedRecipientRecordList = await (access.contract as any).getSerializedRecipientRecordList(methodArgs[0], methodArgs[1]);
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
          serializedRecipientRecordList: await (access.contract as any).getSerializedRecipientRecordList(sponsorKey, recipientKey),
        })),
      );
      break;
    }
    case 'getAgentRateRecord': {
      const serializedAgentRateRecord = await (access.contract as any).serializeAgentRateRecordStr(
        methodArgs[0],
        methodArgs[1],
        methodArgs[2],
        methodArgs[3],
        methodArgs[4],
      );
      const transactions = await (access.contract as any).getSerializedRateTransactionList(
        methodArgs[0],
        methodArgs[1],
        methodArgs[2],
        methodArgs[3],
        methodArgs[4],
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
          serializedAgentRateRecord: await (access.contract as any).serializeAgentRateRecordStr(
            methodArgs[0],
            methodArgs[1],
            methodArgs[2],
            methodArgs[3],
            String(agentRateKey),
          ),
        })),
      );
      break;
    }
    case 'getAgentRateTransactionList': {
      result = await (access.contract as any).getSerializedRateTransactionList(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4]);
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

