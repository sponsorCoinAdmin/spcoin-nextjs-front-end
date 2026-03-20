import type { MethodDef } from '../shared/types';
import { createSpCoinLibraryAccess } from '../shared';
import { buildSerializedSPCoinHeader } from '../shared/buildSerializedSPCoinHeader';
import { Interface } from 'ethers';

export type SerializationBaseMethod =
  | 'getSerializedSPCoinHeader'
  | 'getSerializedAccountRecord'
  | 'getSerializedAccountRewards'
  | 'getSerializedRecipientRecordList'
  | 'getSerializedRecipientRateList'
  | 'serializeAgentRateRecordStr'
  | 'getSerializedRateTransactionList';

type SerializationMethodSpec = {
  title: string;
  params: MethodDef['params'];
  baseMethod: SerializationBaseMethod;
};

function buildHeaderParams() {
  return [] as MethodDef['params'];
}

function buildAccountParams() {
  return [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' as const }];
}

function buildRecipientParams() {
  return [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' as const },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' as const },
  ];
}

function buildRecipientRateParams() {
  return [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' as const },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' as const },
    { label: 'Recipient Rate Key', placeholder: 'uint _recipientRateKey', type: 'uint' as const },
  ];
}

function buildAgentRateParams() {
  return [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' as const },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' as const },
    { label: 'Recipient Rate Key', placeholder: 'uint _recipientRateKey', type: 'uint' as const },
    { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' as const },
    { label: 'Agent Rate Key', placeholder: 'uint _agentRateKey', type: 'uint' as const },
  ];
}

const PARAMS_BY_BASE_METHOD: Record<SerializationBaseMethod, MethodDef['params']> = {
  getSerializedSPCoinHeader: buildHeaderParams(),
  getSerializedAccountRecord: buildAccountParams(),
  getSerializedAccountRewards: buildAccountParams(),
  getSerializedRecipientRecordList: buildRecipientParams(),
  getSerializedRecipientRateList: buildRecipientRateParams(),
  serializeAgentRateRecordStr: buildAgentRateParams(),
  getSerializedRateTransactionList: buildAgentRateParams(),
};

const accountRewardTotalsInterface = new Interface([
  'function getAccountRewardTotals(address _accountKey) view returns (uint256 sponsorRewards, uint256 recipientRewards, uint256 agentRewards)',
]);
const accountCoreInterface = new Interface([
  'function getAccountCore(address _accountKey) view returns (address accountKey, uint256 creationTime, bool verified, uint256 accountBalance, uint256 stakedAccountSPCoins, uint256 accountStakingRewards)',
]);
const accountLinksInterface = new Interface([
  'function getAccountLinks(address _accountKey) view returns (address[] sponsorAccountList, address[] recipientAccountList, address[] agentAccountList, address[] agentParentRecipientAccountList)',
]);
const recipientRecordCoreInterface = new Interface([
  'function getRecipientRecordCore(address _sponsorKey, address _recipientKey) view returns (uint256 creationTime, uint256 stakedSPCoins, bool inserted)',
]);
const recipientRateRecordCoreInterface = new Interface([
  'function getRecipientRateRecordCore(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) view returns (uint256 recipientRate, uint256 creationTime, uint256 lastUpdateTime, uint256 stakedSPCoins, bool inserted)',
]);
const agentRateRecordCoreInterface = new Interface([
  'function getAgentRateRecordCore(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey) view returns (uint256 agentRate, uint256 creationTime, uint256 lastUpdateTime, uint256 stakedSPCoins, bool inserted)',
]);
const agentRateTransactionCountInterface = new Interface([
  'function getAgentRateTransactionCount(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey) view returns (uint256)',
]);
const agentRateTransactionAtInterface = new Interface([
  'function getAgentRateTransactionAt(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey, uint256 _transactionIndex) view returns (uint256 insertionTime, uint256 stakingRewards)',
]);

const METHOD_SPECS = {
  external_getSerializedSPCoinHeader: {
    title: 'External getSerializedSPCoinHeader',
    params: PARAMS_BY_BASE_METHOD.getSerializedSPCoinHeader,
    baseMethod: 'getSerializedSPCoinHeader',
  },
  external_getSerializedAccountRecord: {
    title: 'External getSerializedAccountRecord',
    params: PARAMS_BY_BASE_METHOD.getSerializedAccountRecord,
    baseMethod: 'getSerializedAccountRecord',
  },
  external_getSerializedAccountRewards: {
    title: 'External getSerializedAccountRewards',
    params: PARAMS_BY_BASE_METHOD.getSerializedAccountRewards,
    baseMethod: 'getSerializedAccountRewards',
  },
  external_getSerializedRecipientRecordList: {
    title: 'External getSerializedRecipientRecordList',
    params: PARAMS_BY_BASE_METHOD.getSerializedRecipientRecordList,
    baseMethod: 'getSerializedRecipientRecordList',
  },
  external_getSerializedRecipientRateList: {
    title: 'External getSerializedRecipientRateList',
    params: PARAMS_BY_BASE_METHOD.getSerializedRecipientRateList,
    baseMethod: 'getSerializedRecipientRateList',
  },
  external_serializeAgentRateRecordStr: {
    title: 'External serializeAgentRateRecordStr',
    params: PARAMS_BY_BASE_METHOD.serializeAgentRateRecordStr,
    baseMethod: 'serializeAgentRateRecordStr',
  },
  external_getSerializedRateTransactionList: {
    title: 'External getSerializedRateTransactionList',
    params: PARAMS_BY_BASE_METHOD.getSerializedRateTransactionList,
    baseMethod: 'getSerializedRateTransactionList',
  },
} as const satisfies Record<string, SerializationMethodSpec>;

export type SerializationTestMethod = Extract<keyof typeof METHOD_SPECS, string>;
export const SERIALIZATION_TEST_METHOD_DEFS: Record<SerializationTestMethod, MethodDef & SerializationMethodSpec> =
  METHOD_SPECS as Record<SerializationTestMethod, MethodDef & SerializationMethodSpec>;

export function getSerializationTestOptions(): SerializationTestMethod[] {
  return (Object.keys(SERIALIZATION_TEST_METHOD_DEFS) as SerializationTestMethod[]).sort((a, b) => a.localeCompare(b));
}

type RunArgs = {
  selectedMethod: SerializationTestMethod;
  params: string[];
  coerceParamValue: (raw: string, def: any) => any;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<any>;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

export async function buildExternalSerializerResult(contract: any, baseMethod: SerializationBaseMethod, methodArgs: any[]) {
  try {
    switch (baseMethod) {
      case 'getSerializedSPCoinHeader':
        return { blocked: false as const, value: await buildSerializedSPCoinHeader(contract) };
      case 'getSerializedAccountRecord':
        return { blocked: false as const, value: await buildSerializedAccountRecord(contract, methodArgs) };
      case 'getSerializedAccountRewards':
        return { blocked: false as const, value: await buildSerializedAccountRewards(contract, methodArgs) };
      case 'getSerializedRecipientRecordList':
        return { blocked: false as const, value: await buildSerializedRecipientRecordList(contract, methodArgs) };
      case 'getSerializedRecipientRateList':
        return { blocked: false as const, value: await buildSerializedRecipientRateList(contract, methodArgs) };
      case 'serializeAgentRateRecordStr':
        return { blocked: false as const, value: await buildSerializedAgentRateRecordStr(contract, methodArgs) };
      case 'getSerializedRateTransactionList':
        return { blocked: false as const, value: await buildSerializedRateTransactionList(contract, methodArgs) };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const methodSpecificGetterNames: Partial<Record<SerializationBaseMethod, string[]>> = {
      getSerializedAccountRecord: ['getAccountCore', 'getAccountLinks'],
      getSerializedAccountRewards: ['getAccountRewardTotals'],
      getSerializedRecipientRecordList: ['getRecipientRecordCore'],
      getSerializedRecipientRateList: ['getRecipientRateRecordCore'],
      serializeAgentRateRecordStr: ['getAgentRateRecordCore'],
      getSerializedRateTransactionList: ['getAgentRateTransactionCount', 'getAgentRateTransactionAt'],
    };
    const missingGetter = (methodSpecificGetterNames[baseMethod] || []).find((name) => message.includes(name));
    return {
      blocked: true as const,
      reason: missingGetter
        ? `Blocked: deployed contract does not yet expose ${missingGetter}. Redeploy with the new raw getter set to compare this serializer externally.`
        : `Blocked: unable to rebuild ${baseMethod} externally. ${message}`,
    };
  }

  throw new Error(`External serializer builder missing for ${baseMethod}.`);
}

async function callViewFunction(contract: any, iface: Interface, functionName: string, args: unknown[]) {
  const target = String(contract.target || (typeof contract.getAddress === 'function' ? await contract.getAddress() : ''));
  const runner = contract.runner;
  if (!target || !runner || typeof runner.call !== 'function') {
    throw new Error(`${functionName} runner unavailable.`);
  }

  const data = iface.encodeFunctionData(functionName, args);
  const raw = await runner.call({ to: target, data });
  return iface.decodeFunctionResult(functionName, raw);
}

function normalizeAddress(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeAddressList(values: unknown[]) {
  return values.map((value) => normalizeAddress(value)).join(',');
}

async function buildSerializedAccountRecord(contract: any, methodArgs: any[]) {
  const [accountKey, creationTime, verified, accountBalance, stakedAccountSPCoins, accountStakingRewards] =
    await callViewFunction(contract, accountCoreInterface, 'getAccountCore', [methodArgs[0]]);
  const [sponsorAccountList, recipientAccountList, agentAccountList, agentParentRecipientAccountList] =
    await callViewFunction(contract, accountLinksInterface, 'getAccountLinks', [methodArgs[0]]);

  let serialized = `accountKey: ${normalizeAddress(accountKey)}\\,\ncreationTime: ${String(creationTime)}\\,\nverified: ${
    Boolean(verified) ? 'true' : 'false'
  }`;
  serialized += `\\,balanceOf: ${String(accountBalance)}`;
  serialized += `\\,stakedSPCoins: ${String(stakedAccountSPCoins)}`;
  serialized += `\\,sponsorAccountList:${normalizeAddressList(Array.from(sponsorAccountList as unknown[]))}`;
  serialized += `\\,recipientAccountList:${normalizeAddressList(Array.from(recipientAccountList as unknown[]))}`;
  serialized += `\\,agentAccountList:${normalizeAddressList(Array.from(agentAccountList as unknown[]))}`;
  serialized += `\\,agentParentRecipientAccountList:${normalizeAddressList(Array.from(agentParentRecipientAccountList as unknown[]))}`;
  serialized += `\\,stakingRewards: ${String(accountStakingRewards)}`;
  return serialized;
}

async function buildSerializedAccountRewards(contract: any, methodArgs: any[]) {
  const [sponsorRewards, recipientRewards, agentRewards] = await callViewFunction(
    contract,
    accountRewardTotalsInterface,
    'getAccountRewardTotals',
    [methodArgs[0]],
  );

  return [String(sponsorRewards), String(recipientRewards), String(agentRewards)].join(',');
}

async function buildSerializedRecipientRecordList(contract: any, methodArgs: any[]) {
  const [creationTime, stakedSPCoins] = await callViewFunction(
    contract,
    recipientRecordCoreInterface,
    'getRecipientRecordCore',
    [methodArgs[0], methodArgs[1]],
  );

  return `${String(creationTime)},${String(stakedSPCoins)}`;
}

async function buildSerializedRecipientRateList(contract: any, methodArgs: any[]) {
  const [, creationTime, lastUpdateTime, stakedSPCoins] = await callViewFunction(
    contract,
    recipientRateRecordCoreInterface,
    'getRecipientRateRecordCore',
    [methodArgs[0], methodArgs[1], methodArgs[2]],
  );

  return `${String(creationTime)},${String(lastUpdateTime)},${String(stakedSPCoins)}`;
}

async function buildSerializedAgentRateRecordStr(contract: any, methodArgs: any[]) {
  const [, creationTime, lastUpdateTime, stakedSPCoins] = await callViewFunction(
    contract,
    agentRateRecordCoreInterface,
    'getAgentRateRecordCore',
    [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4]],
  );

  return `${String(creationTime)},${String(lastUpdateTime)},${String(stakedSPCoins)}`;
}

async function buildSerializedRateTransactionList(contract: any, methodArgs: any[]) {
  const [transactionCountRaw] = await callViewFunction(
    contract,
    agentRateTransactionCountInterface,
    'getAgentRateTransactionCount',
    [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4]],
  );
  const transactionCount = Number(transactionCountRaw);
  const rows: string[] = [];

  for (let idx = 0; idx < transactionCount; idx += 1) {
    const [insertionTime, stakingRewards] = await callViewFunction(
      contract,
      agentRateTransactionAtInterface,
      'getAgentRateTransactionAt',
      [methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], methodArgs[4], idx],
    );
    rows.push(`${String(insertionTime)},${String(stakingRewards)}`);
  }

  return rows.join('\n');
}

export async function runSerializationTestMethod(args: RunArgs): Promise<unknown> {
  const {
    selectedMethod,
    params,
    coerceParamValue,
    requireContractAddress,
    ensureReadRunner,
    appendLog,
    setStatus,
  } = args;
  const def = SERIALIZATION_TEST_METHOD_DEFS[selectedMethod];
  const target = requireContractAddress();
  const runner = await ensureReadRunner();
  const access = createSpCoinLibraryAccess(target, runner);
  const methodArgs = def.params.map((param, idx) => coerceParamValue(params[idx], param));

  const external = await buildExternalSerializerResult(access.contract as any, def.baseMethod, methodArgs);
  appendLog(
    external.blocked
      ? `${selectedMethod} -> external rebuild blocked.`
      : `${selectedMethod} -> external rebuild complete.`,
  );
  setStatus(external.blocked ? `${def.title} blocked.` : `${def.title} complete.`);
  return external.blocked ? { blocked: true, reason: external.reason } : external.value;
}
