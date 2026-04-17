import type { MethodDef, ParamDef } from '../shared/types';
import { createSpCoinLibraryAccess } from '../shared';
import { buildSerializedSPCoinHeader } from '../shared/buildSerializedSPCoinHeader';
import { normalizeStringListResult } from '../shared/normalizeListResult';
import { Interface, getAddress, parseUnits } from 'ethers';

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

type UtilityMethodSpec = {
  title: string;
  params: MethodDef['params'];
  utilityMethod:
    | 'compareSpCoinContractSize'
    | 'getSponsorAccounts'
    | 'getMasterSponsorList'
    | 'getMasterSponsorList_BAK'
    | 'hhFundAccounts'
    | 'deleteMasterSponsorships'
    | 'deleteSponsorTree'
    | 'deleteSponsorRecipient'
    | 'deleteRecipientRateBranch'
    | 'deleteRecipientAgent'
    | 'deleteAgentRateBranch'
    | 'deleteRecipientSponsorships'
    | 'deleteRecipientSponsorshipTree'
    | 'deleteAgentSponsorships';
};

type MethodSpec = SerializationMethodSpec | UtilityMethodSpec;

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

function buildContractSizeComparisonParams() {
  return [
    {
      label: 'Previous Release Directory',
      placeholder: 'spCoinAccess/contracts/spCoinOrig.BAK',
      type: 'string' as const,
    },
    {
      label: 'Latest Release Directory',
      placeholder: 'spCoinAccess/contracts/spCoin',
      type: 'string' as const,
    },
  ];
}

function buildHardhatFundAccountsParams() {
  return [
    {
      label: 'Total Token Amount',
      placeholder: 'total amount to divide across Hardhat accounts 1-19',
      type: 'string' as const,
    },
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
  compareSpCoinContractSize: {
    title: 'compareSpCoinContractSize',
    params: buildContractSizeComparisonParams(),
    utilityMethod: 'compareSpCoinContractSize',
  },
  getSponsorAccounts: {
    title: 'getSponsorAccounts',
    params: [],
    utilityMethod: 'getSponsorAccounts',
  },
  getMasterSponsorList: {
    title: 'getMasterSponsorList',
    params: [],
    utilityMethod: 'getMasterSponsorList',
  },
  getMasterSponsorList_BAK: {
    title: 'getMasterSponsorList_BAK',
    params: [],
    utilityMethod: 'getMasterSponsorList_BAK',
  },
  hhFundAccounts: {
    title: 'hhFundAccounts',
    params: buildHardhatFundAccountsParams(),
    utilityMethod: 'hhFundAccounts',
  },
  deleteMasterSponsorships: {
    title: 'deleteMasterSponsorships',
    params: [],
    utilityMethod: 'deleteMasterSponsorships',
  },
  deleteSponsorTree: {
    title: 'deleteSponsorTree',
    params: [{ label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' as const }],
    utilityMethod: 'deleteSponsorTree',
  },
  deleteSponsorRecipient: {
    title: 'deleteSponsorRecipient',
    params: buildRecipientScopeParams(),
    utilityMethod: 'deleteSponsorRecipient',
  },
  deleteRecipientRateBranch: {
    title: 'deleteRecipientRateBranch',
    params: buildRecipientRateParams(),
    utilityMethod: 'deleteRecipientRateBranch',
  },
  deleteRecipientAgent: {
    title: 'deleteRecipientAgent',
    params: buildAgentScopeParams(),
    utilityMethod: 'deleteRecipientAgent',
  },
  deleteAgentRateBranch: {
    title: 'deleteAgentRateBranch',
    params: [
      ...buildAgentScopeParams(),
      { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' as const },
    ],
    utilityMethod: 'deleteAgentRateBranch',
  },
  deleteRecipientSponsorships: {
    title: 'deleteRecipientSponsorships',
    params: buildRecipientScopeParams(),
    utilityMethod: 'deleteRecipientSponsorships',
  },
  deleteRecipientSponsorshipTree: {
    title: 'deleteRecipientSponsorshipTree',
    params: buildRecipientRateParams(),
    utilityMethod: 'deleteRecipientSponsorshipTree',
  },
  deleteAgentSponsorships: {
    title: 'deleteAgentSponsorships',
    params: buildAgentScopeParams(),
    utilityMethod: 'deleteAgentSponsorships',
  },
} as const satisfies Record<string, MethodSpec>;

export type SerializationTestMethod = Extract<keyof typeof METHOD_SPECS, string>;
export const SERIALIZATION_TEST_METHOD_DEFS: Record<SerializationTestMethod, MethodDef & MethodSpec> =
  METHOD_SPECS as Record<SerializationTestMethod, MethodDef & MethodSpec>;

export function getSerializationTestOptions(): SerializationTestMethod[] {
  return (Object.keys(SERIALIZATION_TEST_METHOD_DEFS) as SerializationTestMethod[])
    .filter((name) => 'baseMethod' in SERIALIZATION_TEST_METHOD_DEFS[name])
    .sort((a, b) => a.localeCompare(b));
}

export function getUtilityMethodOptions(): SerializationTestMethod[] {
  const hiddenUtilityMethods = new Set<SerializationTestMethod>([
    'deleteRecipientSponsorships',
    'deleteRecipientSponsorshipTree',
    'deleteAgentSponsorships',
  ]);
  return (Object.keys(SERIALIZATION_TEST_METHOD_DEFS) as SerializationTestMethod[])
    .filter((name) => 'utilityMethod' in SERIALIZATION_TEST_METHOD_DEFS[name])
    .filter((name) => !hiddenUtilityMethods.has(name))
    .sort((a, b) => a.localeCompare(b));
}

function attachSerializationDebugTrace(error: unknown, trace: string[]) {
  if (!error || typeof error !== 'object') return error;
  (error as { spCoinDebugTrace?: string[] }).spCoinDebugTrace = [...trace];
  return error;
}

type RunArgs = {
  selectedMethod: SerializationTestMethod;
  params: string[];
  coerceParamValue: (raw: string, def: ParamDef) => unknown;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<any>;
  mode: 'hardhat' | 'metamask';
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: any, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  spCoinAccessSource?: 'local' | 'node_modules';
  selectedHardhatAddress?: string;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

function getReadMethodHandlers() {
  const { ONCHAIN_READ_METHOD_HANDLERS } = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/onChain/readMethods/index') as {
    ONCHAIN_READ_METHOD_HANDLERS: Record<string, { run: (context: unknown) => Promise<unknown> }>;
  };
  const { OFFCHAIN_READ_METHOD_HANDLERS } = require('../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/offChain/readMethods/index') as {
    OFFCHAIN_READ_METHOD_HANDLERS: Record<string, { run: (context: unknown) => Promise<unknown> }>;
  };

  return { ONCHAIN_READ_METHOD_HANDLERS, OFFCHAIN_READ_METHOD_HANDLERS };
}

async function runMasterDeleteReadMethod(
  access: ReturnType<typeof createSpCoinLibraryAccess>,
  method: 'getMasterAccountList' | 'getAccountRecipientList',
  methodArgs: unknown[] = [],
) {
  const directReadMethod = (access.read as Record<string, unknown>)[method];
  if (typeof directReadMethod === 'function') {
    return (directReadMethod as (...args: unknown[]) => Promise<unknown>)(...methodArgs);
  }

  const { ONCHAIN_READ_METHOD_HANDLERS, OFFCHAIN_READ_METHOD_HANDLERS } = getReadMethodHandlers();
  const handler = ONCHAIN_READ_METHOD_HANDLERS[method] || OFFCHAIN_READ_METHOD_HANDLERS[method];
  if (!handler) {
    throw new Error(`Serialization utility read method ${method} is not wired to a handler.`);
  }

  return handler.run({
    canonicalMethod: method,
    selectedMethod: method,
    methodArgs,
    spCoinAccessSource: 'local',
    read: access.read as Record<string, unknown>,
    staking: access.staking as Record<string, unknown>,
    contract: access.contract as Record<string, unknown>,
    normalizeStringListResult,
    requireExternalSerializedValue: () => {
      throw new Error(`Serialization utility read method ${method} does not support external serializer fallback.`);
    },
  });
}

async function loadSponsorAccounts(access: ReturnType<typeof createSpCoinLibraryAccess>) {
  const accountList = Array.from((await runMasterDeleteReadMethod(access, 'getMasterAccountList')) as unknown[]).map((value) =>
    normalizeAddress(value),
  );
  const recipientLists = await Promise.all(
    accountList.map(async (account) => {
      const recipients = Array.from((await runMasterDeleteReadMethod(access, 'getAccountRecipientList', [account])) as unknown[]).map(
        (value) => normalizeAddress(value),
      );
      return { account, recipients };
    }),
  );
  return recipientLists.filter((entry) => entry.recipients.length > 0).map((entry) => entry.account);
}

async function loadAccountList(access: ReturnType<typeof createSpCoinLibraryAccess>) {
  return Array.from((await runMasterDeleteReadMethod(access, 'getMasterAccountList')) as unknown[]).map((value) =>
    normalizeAddress(value),
  );
}

async function loadRecipientAccounts(access: ReturnType<typeof createSpCoinLibraryAccess>, sponsorKey: string) {
  return Array.from((await runMasterDeleteReadMethod(access, 'getAccountRecipientList', [sponsorKey])) as unknown[]).map((value) =>
    normalizeAddress(value),
  );
}

async function loadRecipientRateKeys(
  access: ReturnType<typeof createSpCoinLibraryAccess>,
  sponsorKey: string,
  recipientKey: string,
) {
  if (typeof access.read.getRecipientRateList !== 'function') {
    throw new Error('getRecipientRateList() read method is required.');
  }
  try {
    return Array.from((await access.read.getRecipientRateList(sponsorKey, recipientKey)) as unknown[]).map((value) => String(value));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`loadRecipientRateKeys(${sponsorKey}, ${recipientKey}) failed: ${message}`);
  }
}

async function loadRecipientRateAgents(
  access: ReturnType<typeof createSpCoinLibraryAccess>,
  sponsorKey: string,
  recipientKey: string,
  recipientRateKey: string,
) {
  if (typeof access.read.getRecipientRateAgentList !== 'function') {
    throw new Error('getRecipientRateAgentList() read method is required.');
  }
  return Array.from((await access.read.getRecipientRateAgentList(sponsorKey, recipientKey, recipientRateKey)) as unknown[]).map(
    (value) => normalizeAddress(value),
  );
}

async function loadAgentRateKeys(
  access: ReturnType<typeof createSpCoinLibraryAccess>,
  sponsorKey: string,
  recipientKey: string,
  recipientRateKey: string,
  agentKey: string,
) {
  const getAgentRateList = (access.contract as { getAgentRateList?: (...args: unknown[]) => Promise<unknown> }).getAgentRateList;
  if (typeof getAgentRateList !== 'function') {
    throw new Error('getAgentRateList() is not available on the current SpCoin contract access path.');
  }
  return Array.from((await getAgentRateList(sponsorKey, recipientKey, recipientRateKey, agentKey)) as unknown[]).map((value) =>
    String(value),
  );
}

function buildRecipientScopeParams() {
  return [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' as const },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' as const },
  ];
}

function buildAgentScopeParams() {
  return [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' as const },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' as const },
    { label: 'Recipient Rate Key', placeholder: 'uint _recipientRateKey', type: 'uint' as const },
    { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' as const },
  ];
}

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
  const trimmed = String(value || '').trim();
  return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed.toLowerCase();
}

function toCanonicalAddress(value: unknown, label: string) {
  const trimmed = String(value || '').trim();
  if (!/^0[xX][0-9a-fA-F]{40}$/.test(trimmed)) {
    throw new Error(`${label} is not a valid address: ${trimmed || '(empty)'}`);
  }
  return getAddress(trimmed.replace(/^0X/, '0x'));
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
    mode,
    hardhatAccounts,
    executeWriteConnected,
    selectedHardhatAddress,
    appendLog,
    setStatus,
  } = args;
  const def = SERIALIZATION_TEST_METHOD_DEFS[selectedMethod];
  const target = requireContractAddress();
  const debugTrace: string[] = [];
  const trace = (line: string) => {
    debugTrace.push(line);
  };
  const cleanupSignerAddress =
    mode === 'hardhat'
      ? (selectedHardhatAddress || hardhatAccounts[0]?.address || '').trim()
      : undefined;

  try {
    trace(`start ${selectedMethod}`);
    trace(`contract ${target}`);
    const runner = await ensureReadRunner();
    trace(`ensureReadRunner ok`);
    const access = createSpCoinLibraryAccess(target, runner);
    const methodArgs = def.params.map((param, idx) => coerceParamValue(params[idx], param));

    if ('utilityMethod' in def && def.utilityMethod === 'compareSpCoinContractSize') {
      trace('utility compareSpCoinContractSize');
      const response = await fetch('/api/spCoin/contract-size-comparison', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousReleaseDir: String(methodArgs[0] || ''),
          latestReleaseDir: String(methodArgs[1] || ''),
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
      appendLog(`${selectedMethod} -> contract size comparison complete.`);
      setStatus(`${def.title} complete.`);
      return {
        scriptPath: String(payload?.scriptPath || ''),
        previousReleaseDir: String(payload?.previousReleaseDir || ''),
        latestReleaseDir: String(payload?.latestReleaseDir || ''),
        cached: Boolean(payload?.cached),
        report: payload?.report ?? {},
        stderr: String(payload?.stderr || ''),
      };
    }

    if (
      'utilityMethod' in def &&
      (def.utilityMethod === 'getSponsorAccounts' ||
        def.utilityMethod === 'getMasterSponsorList' ||
        def.utilityMethod === 'getMasterSponsorList_BAK')
    ) {
      trace('loadSponsorAccounts start');
      const sponsorAccounts = await loadSponsorAccounts(access);
      trace(`loadSponsorAccounts ok count=${sponsorAccounts.length}`);
      appendLog(`${selectedMethod} -> loaded ${sponsorAccounts.length} sponsor account(s).`);
      setStatus(`${def.title} complete.`);
      return sponsorAccounts;
    }

    if ('utilityMethod' in def && def.utilityMethod === 'hhFundAccounts') {
      if (mode !== 'hardhat') {
        throw new Error('hhFundAccounts only works when connected to Hardhat.');
      }

      const senderAccount = hardhatAccounts[0];
      const senderAddress = toCanonicalAddress(senderAccount?.address, 'Hardhat funding account 0');
      const recipientAccounts = hardhatAccounts
        .slice(1, 20)
        .map((account, idx) => toCanonicalAddress(account.address, `Hardhat account ${idx + 1}`))
        .filter(Boolean);
      if (recipientAccounts.length !== 19) {
        throw new Error('hhFundAccounts requires Hardhat accounts 1 through 19 to be available.');
      }

      const normalizedAmount = String(methodArgs[0] || '').replace(/,/g, '').trim();
      if (!normalizedAmount) {
        throw new Error('Total Token Amount is required.');
      }

      const summary = await executeWriteConnected(
        def.title,
        async (contract, signer) => {
        const decimalsValue = typeof contract.decimals === 'function' ? await contract.decimals() : 18;
        const decimals = Number(decimalsValue);
        const totalUnits = parseUnits(normalizedAmount, decimals);
        const recipientCount = BigInt(recipientAccounts.length);
        const baseShare = totalUnits / recipientCount;
        const remainder = totalUnits % recipientCount;
        const txHashes: string[] = [];
        let nextNonce =
          signer && typeof (signer as any).getNonce === 'function' ? await (signer as any).getNonce('pending') : undefined;

        for (let idx = 0; idx < recipientAccounts.length; idx += 1) {
          const recipient = recipientAccounts[idx];
          const amountUnits = baseShare + (BigInt(idx) < remainder ? 1n : 0n);
          if (amountUnits <= 0n) continue;
          const tx =
            typeof nextNonce === 'number'
              ? await contract.transfer(recipient, amountUnits, { nonce: nextNonce++ })
              : await contract.transfer(recipient, amountUnits);
          txHashes.push(String(tx?.hash || ''));
          await tx.wait();
        }

        return {
          sender: senderAddress,
          recipientCount: recipientAccounts.length,
          totalAmount: normalizedAmount,
          recipients: recipientAccounts,
          txHashes,
          baseShareUnits: baseShare.toString(),
          remainderUnits: remainder.toString(),
        };
      },
        senderAddress,
      );

      appendLog(`${selectedMethod} -> funded ${recipientAccounts.length} Hardhat account(s).`);
      setStatus(`${def.title} complete.`);
      return summary;
    }

    const executeAs = async <T>(label: string, signerAddress: string, writeCall: (contract: any, signer: any) => Promise<T>) => {
      trace(`write start ${label}`);
      const result = await executeWriteConnected(label, writeCall, signerAddress);
      trace(`write ok ${label}`);
      return result;
    };

  const isRetryableDeleteAccountError = (error: unknown) => {
    const code = String((error as { code?: unknown } | null)?.code || '');
    const message = String((error as { message?: unknown } | null)?.message ?? error ?? '');
    return code === 'NONCE_EXPIRED' || /Failed to fetch/i.test(message);
  };

  const deleteAccountRecordWithRecovery = async (accountKey: string) =>
    executeAs(`deleteAccountRecord(${accountKey})`, cleanupSignerAddress || accountKey, async (contract) => {
      const fn = (contract as { deleteAccountRecord?: (...args: unknown[]) => Promise<any> }).deleteAccountRecord;
      const isAccountInsertedFn = (contract as { isAccountInserted?: (...args: unknown[]) => Promise<any> }).isAccountInserted;
      if (typeof fn !== 'function') {
        throw new Error('deleteAccountRecord is not available on the current SpCoin contract access path.');
      }
      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const tx = await fn(accountKey);
          await tx.wait();
          await new Promise((resolve) => setTimeout(resolve, 500));
          return tx;
        } catch (error) {
          lastError = error;
          if (!isRetryableDeleteAccountError(error) || typeof isAccountInsertedFn !== 'function') {
            throw error;
          }
          trace(`deleteAccountRecord(${accountKey}) retryable cleanup error attempt ${attempt}: ${String((error as { code?: unknown; message?: unknown })?.code || '')} ${String((error as { message?: unknown })?.message ?? error ?? '')}`);
          await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
          const stillInserted = await isAccountInsertedFn(accountKey);
          if (!stillInserted) {
            return null;
          }
        }
      }
      throw lastError;
    });

  const deleteAgentRateBranch = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string,
    agentKey: string,
    agentRateKey: string,
  ) =>
    executeAs(
      `deleteAgentRateBranch(${sponsorKey}, ${recipientKey}, ${recipientRateKey}, ${agentKey}, ${agentRateKey})`,
      sponsorKey,
      async (contract) => {
        const fn = (contract as { deleteAgentRateBranch?: (...args: unknown[]) => Promise<any> }).deleteAgentRateBranch;
        if (typeof fn !== 'function') {
          throw new Error('deleteAgentRateBranch is not available on the current SpCoin contract access path.');
        }
        const tx = await fn(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
        await tx.wait();
        return tx;
      },
    );

  const deleteAgentNode = async (sponsorKey: string, recipientKey: string, recipientRateKey: string, agentKey: string) =>
    executeAs(`deleteRecipientAgent(${sponsorKey}, ${recipientKey}, ${recipientRateKey}, ${agentKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { deleteRecipientAgent?: (...args: unknown[]) => Promise<any> }).deleteRecipientAgent;
      if (typeof fn !== 'function') {
        throw new Error('deleteRecipientAgent is not available on the current SpCoin contract access path.');
      }
      const tx = await fn(sponsorKey, recipientKey, recipientRateKey, agentKey);
      await tx.wait();
      return tx;
    });

  const deleteRecipientRateNode = async (sponsorKey: string, recipientKey: string, recipientRateKey: string) =>
    executeAs(`deleteRecipientRateBranch(${sponsorKey}, ${recipientKey}, ${recipientRateKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { deleteRecipientRateBranch?: (...args: unknown[]) => Promise<any> }).deleteRecipientRateBranch;
      if (typeof fn !== 'function') {
        throw new Error('deleteRecipientRateBranch is not available on the current SpCoin contract access path.');
      }
      const tx = await fn(sponsorKey, recipientKey, recipientRateKey);
      await tx.wait();
      return tx;
    });

  const deleteRecipientNode = async (sponsorKey: string, recipientKey: string) =>
    executeAs(`deleteSponsorRecipient(${sponsorKey}, ${recipientKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { deleteSponsorRecipient?: (...args: unknown[]) => Promise<any> }).deleteSponsorRecipient;
      if (typeof fn !== 'function') {
        throw new Error('deleteSponsorRecipient is not available on the current SpCoin contract access path.');
      }
      const tx = await fn(sponsorKey, recipientKey);
      await tx.wait();
      return tx;
    });

  const deleteSponsorAccount = async (sponsorKey: string) =>
    executeAs(`deleteSponsor(${sponsorKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { deleteSponsor?: (...args: unknown[]) => Promise<any> }).deleteSponsor;
      if (typeof fn !== 'function') {
        throw new Error('deleteSponsor is not available on the current SpCoin contract access path.');
      }
      const tx = await fn(sponsorKey);
      await tx.wait();
      return tx;
    });

  const deleteRecipientAgent = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string,
    agentKey: string,
  ) => {
    const deletedAgentRateKeys: string[] = [];
    trace(
      `deleteRecipientAgent loadAgentRateKeys start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}`,
    );
    let agentRateKeys = await loadAgentRateKeys(access, sponsorKey, recipientKey, recipientRateKey, agentKey);
    trace(
      `deleteRecipientAgent loadAgentRateKeys ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey} = ${JSON.stringify(
        agentRateKeys,
      )}`,
    );
    while (agentRateKeys.length > 0) {
      const agentRateKey = agentRateKeys[0];
      trace(
        `deleteRecipientAgent deleteAgentRateTree start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey} rate=${agentRateKey}`,
      );
      await deleteAgentRateBranch(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
      trace(
        `deleteRecipientAgent deleteAgentRateTree ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey} rate=${agentRateKey}`,
      );
      deletedAgentRateKeys.push(agentRateKey);
      trace(
        `deleteRecipientAgent reloadAgentRateKeys start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}`,
      );
      agentRateKeys = await loadAgentRateKeys(access, sponsorKey, recipientKey, recipientRateKey, agentKey);
      trace(
        `deleteRecipientAgent reloadAgentRateKeys ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey} = ${JSON.stringify(
          agentRateKeys,
        )}`,
      );
    }
    trace(
      `deleteRecipientAgent loadRemainingAgents start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}`,
    );
    const remainingAgents = await loadRecipientRateAgents(access, sponsorKey, recipientKey, recipientRateKey);
    trace(
      `deleteRecipientAgent loadRemainingAgents ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} = ${JSON.stringify(
        remainingAgents,
      )}`,
    );
    if (agentRateKeys.length === 0 && remainingAgents.includes(normalizeAddress(agentKey))) {
      throw new Error(
        `deleteRecipientAgent found a partial agent link with no agent-rate records for ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}. ` +
          'Repair it by rerunning addAgentSponsorship with the original agent rate/quantity, or redeploy/reset to a contract build that includes empty-agent cleanup.',
      );
    }
    if (remainingAgents.includes(normalizeAddress(agentKey))) {
      trace(`deleteRecipientAgent deleteAgentNode start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}`);
      await deleteAgentNode(sponsorKey, recipientKey, recipientRateKey, agentKey);
      trace(`deleteRecipientAgent deleteAgentNode ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}`);
    }
    return {
      sponsorKey,
      recipientKey,
      recipientRateKey,
      agentKey,
      deletedAgentRateKeys,
    };
  };

  const deleteRecipientRateTree = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string,
    visitedSponsors = new Set<string>(),
  ) => {
    trace(`deleteRecipientRateTree loadRecipientRateAgents start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}`);
    const agentKeys = await loadRecipientRateAgents(access, sponsorKey, recipientKey, recipientRateKey);
    trace(
      `deleteRecipientRateTree loadRecipientRateAgents ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} = ${JSON.stringify(
        agentKeys,
      )}`,
    );
    const childResults = [];
    for (const agentKey of agentKeys) {
      trace(`deleteRecipientRateTree child agent start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}`);
      childResults.push(await deleteRecipientAgent(sponsorKey, recipientKey, recipientRateKey, agentKey));
      trace(`deleteRecipientRateTree child agent ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} agent=${agentKey}`);
    }
    trace(`deleteRecipientRateTree reloadRemainingAgentKeys start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}`);
    const remainingAgentKeys = await loadRecipientRateAgents(access, sponsorKey, recipientKey, recipientRateKey);
    trace(
      `deleteRecipientRateTree reloadRemainingAgentKeys ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey} = ${JSON.stringify(
        remainingAgentKeys,
      )}`,
    );
    if (remainingAgentKeys.length > 0) {
      throw new Error(
        `deleteRecipientSponsorshipTree incomplete: agent accounts remain for ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}: ${remainingAgentKeys.join(', ')}`,
      );
    }
    trace(`deleteRecipientRateTree reloadRemainingRateKeys start ${sponsorKey} -> ${recipientKey}`);
    const remainingRateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
    trace(
      `deleteRecipientRateTree reloadRemainingRateKeys ok ${sponsorKey} -> ${recipientKey} = ${JSON.stringify(
        remainingRateKeys,
      )}`,
    );
    if (remainingRateKeys.includes(String(recipientRateKey))) {
      trace(`deleteRecipientRateTree deleteRecipientRateNode start ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}`);
      await deleteRecipientRateNode(sponsorKey, recipientKey, recipientRateKey);
      trace(`deleteRecipientRateTree deleteRecipientRateNode ok ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}`);
    }
    return {
      sponsorKey,
      recipientKey,
      recipientRateKey,
      deletedAgentCount: childResults.length,
      deletedAgents: childResults,
      visitedSponsors: Array.from(visitedSponsors),
    };
  };

  const deleteSponsorRecipient = async (
    sponsorKey: string,
    recipientKey: string,
    visitedSponsors = new Set<string>(),
  ) => {
    trace(`deleteSponsorRecipient loadRecipientRateKeys start ${sponsorKey} -> ${recipientKey}`);
    let rateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
    trace(`deleteSponsorRecipient loadRecipientRateKeys ok ${sponsorKey} -> ${recipientKey} = ${JSON.stringify(rateKeys)}`);
    const deletedRates = [];
    while (rateKeys.length > 0) {
      const rateKey = rateKeys[0];
      trace(`deleteSponsorRecipient deleteRecipientRateTree start ${sponsorKey} -> ${recipientKey} @ ${rateKey}`);
      deletedRates.push(await deleteRecipientRateTree(sponsorKey, recipientKey, rateKey, visitedSponsors));
      trace(`deleteSponsorRecipient deleteRecipientRateTree ok ${sponsorKey} -> ${recipientKey} @ ${rateKey}`);
      trace(`deleteSponsorRecipient reloadRemainingRateKeys start ${sponsorKey} -> ${recipientKey}`);
      rateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
      trace(`deleteSponsorRecipient reloadRemainingRateKeys ok ${sponsorKey} -> ${recipientKey} = ${JSON.stringify(rateKeys)}`);
    }
    trace(`deleteSponsorRecipient reloadRemainingRecipients start ${sponsorKey}`);
    const remainingRecipients = await loadRecipientAccounts(access, sponsorKey);
    trace(`deleteSponsorRecipient reloadRemainingRecipients ok ${sponsorKey} = ${JSON.stringify(remainingRecipients)}`);
    const normalizedRecipientKey = normalizeAddress(recipientKey);
    if (remainingRecipients.includes(normalizedRecipientKey)) {
      trace(`deleteSponsorRecipient deleteRecipientNode start ${sponsorKey} -> ${recipientKey}`);
      await deleteRecipientNode(sponsorKey, recipientKey);
      trace(`deleteSponsorRecipient deleteRecipientNode ok ${sponsorKey} -> ${recipientKey}`);
    }
    return {
      sponsorKey,
      recipientKey,
      deletedRateCount: deletedRates.length,
      deletedRates,
      visitedSponsors: Array.from(visitedSponsors),
    };
  };

  const deleteSponsorTree = async (sponsorKey: string, visitedSponsors = new Set<string>()) => {
    const normalizedSponsorKey = normalizeAddress(sponsorKey);
    if (visitedSponsors.has(normalizedSponsorKey)) {
      trace(`deleteSponsorTree skip already_visited ${sponsorKey}`);
      return { sponsorKey, skipped: true, reason: 'already_visited' as const };
    }
    visitedSponsors.add(normalizedSponsorKey);

    trace(`deleteSponsorTree loadSponsorAccounts start ${sponsorKey}`);
    const currentSponsorAccounts = new Set(await loadSponsorAccounts(access));
    trace(`deleteSponsorTree loadSponsorAccounts ok ${sponsorKey} -> ${JSON.stringify(Array.from(currentSponsorAccounts))}`);
    trace(`deleteSponsorTree loadRecipientAccounts start ${sponsorKey}`);
    const recipients = await loadRecipientAccounts(access, sponsorKey);
    trace(`deleteSponsorTree loadRecipientAccounts ok ${sponsorKey} -> ${JSON.stringify(recipients)}`);
    const deletedRecipients = [];
    for (const recipientKey of recipients) {
      const normalizedRecipientKey = normalizeAddress(recipientKey);
      trace(`deleteSponsorTree recipient start ${sponsorKey} -> ${recipientKey}`);
      if (currentSponsorAccounts.has(normalizedRecipientKey)) {
        trace(`deleteSponsorTree recurse child sponsor ${recipientKey}`);
        await deleteSponsorTree(recipientKey, visitedSponsors);
      }
      trace(`deleteSponsorTree deleteSponsorRecipient start ${sponsorKey} -> ${recipientKey}`);
      deletedRecipients.push(await deleteSponsorRecipient(sponsorKey, recipientKey, visitedSponsors));
      trace(`deleteSponsorTree deleteSponsorRecipient ok ${sponsorKey} -> ${recipientKey}`);
    }

    trace(`deleteSponsorTree final remainingRecipients start ${sponsorKey}`);
    const remainingRecipients = await loadRecipientAccounts(access, sponsorKey);
    trace(`deleteSponsorTree final remainingRecipients ok ${sponsorKey} = ${JSON.stringify(remainingRecipients)}`);
    if (remainingRecipients.length > 0) {
      throw new Error(`deleteSponsorTree incomplete: recipients remain for ${sponsorKey}: ${remainingRecipients.join(', ')}`);
    }

    trace(`deleteSponsorTree loadAccountList start ${sponsorKey}`);
    const accountList = await loadAccountList(access);
    trace(`deleteSponsorTree loadAccountList ok ${sponsorKey} = ${JSON.stringify(accountList)}`);
    if (accountList.includes(normalizedSponsorKey)) {
      trace(`deleteSponsorTree deleteSponsorAccount start ${sponsorKey}`);
      await deleteSponsorAccount(sponsorKey);
      trace(`deleteSponsorTree deleteSponsorAccount ok ${sponsorKey}`);
    }

    return {
      sponsorKey,
      deletedRecipientCount: deletedRecipients.length,
      deletedRecipients,
      visitedSponsors: Array.from(visitedSponsors),
    };
  };

  if ('utilityMethod' in def && def.utilityMethod === 'deleteAgentSponsorships') {
      const result = await deleteRecipientAgent(
        toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
        toCanonicalAddress(methodArgs[1], 'Recipient Key'),
        String(methodArgs[2]),
        toCanonicalAddress(methodArgs[3], 'Agent Key'),
      );
      appendLog(
        `${selectedMethod} -> deleted ${result.deletedAgentRateKeys.length} agent sponsorship leaf/leaves for ${result.agentKey}.`,
      );
      setStatus(`${def.title} complete.`);
      return result;
    }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteRecipientAgent') {
    const result = await deleteRecipientAgent(
      toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
      toCanonicalAddress(methodArgs[1], 'Recipient Key'),
      String(methodArgs[2]),
      toCanonicalAddress(methodArgs[3], 'Agent Key'),
    );
    appendLog(
      `${selectedMethod} -> unsponsored agent tree ${result.sponsorKey} -> ${result.recipientKey} @ ${result.recipientRateKey} agent=${result.agentKey}.`,
    );
    setStatus(`${def.title} complete.`);
    return result;
  }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteAgentRateBranch') {
    await deleteAgentRateBranch(
      toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
      toCanonicalAddress(methodArgs[1], 'Recipient Key'),
      String(methodArgs[2]),
      toCanonicalAddress(methodArgs[3], 'Agent Key'),
      String(methodArgs[4]),
    );
    const result = {
      sponsorKey: toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
      recipientKey: toCanonicalAddress(methodArgs[1], 'Recipient Key'),
      recipientRateKey: String(methodArgs[2]),
      agentKey: toCanonicalAddress(methodArgs[3], 'Agent Key'),
      agentRateKey: String(methodArgs[4]),
    };
    appendLog(
      `${selectedMethod} -> deleted agent-rate branch ${result.sponsorKey} -> ${result.recipientKey} @ ${result.recipientRateKey} agent=${result.agentKey} rate=${result.agentRateKey}.`,
    );
    setStatus(`${def.title} complete.`);
    return result;
  }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteRecipientRateBranch') {
    const result = await deleteRecipientRateTree(
      toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
      toCanonicalAddress(methodArgs[1], 'Recipient Key'),
      String(methodArgs[2]),
    );
    appendLog(
      `${selectedMethod} -> deleted recipient-rate branch ${result.sponsorKey} -> ${result.recipientKey} @ ${result.recipientRateKey}.`,
    );
    setStatus(`${def.title} complete.`);
    return result;
  }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteRecipientSponsorshipTree') {
    const result = await deleteRecipientRateTree(
      toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
      toCanonicalAddress(methodArgs[1], 'Recipient Key'),
      String(methodArgs[2]),
    );
    appendLog(
      `${selectedMethod} -> deleted recipient sponsorship branch ${result.sponsorKey} -> ${result.recipientKey} @ ${result.recipientRateKey}.`,
    );
    setStatus(`${def.title} complete.`);
    return result;
  }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteSponsorRecipient') {
    const result = await deleteSponsorRecipient(
      toCanonicalAddress(methodArgs[0], 'Sponsor Key'),
      toCanonicalAddress(methodArgs[1], 'Recipient Key'),
    );
    appendLog(
      `${selectedMethod} -> unsponsored recipient tree ${result.sponsorKey} -> ${result.recipientKey}.`,
    );
    setStatus(`${def.title} complete.`);
    return result;
  }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteRecipientSponsorships') {
    const sponsorKey = toCanonicalAddress(methodArgs[0], 'Sponsor Key');
    const recipientKey = toCanonicalAddress(methodArgs[1], 'Recipient Key');
    const rateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
    const results = [];
    for (const rateKey of rateKeys) {
      results.push(await deleteRecipientRateTree(sponsorKey, recipientKey, rateKey));
    }
    appendLog(`${selectedMethod} -> deleted ${results.length} recipient sponsorship branch(es) for ${recipientKey}.`);
    setStatus(`${def.title} complete.`);
    return { sponsorKey, recipientKey, deletedRecipientSponsorships: results };
  }

    if ('utilityMethod' in def && def.utilityMethod === 'deleteSponsorTree') {
      const sponsorKey = toCanonicalAddress(methodArgs[0], 'Sponsor Key');
      const currentSponsorAccounts = await loadSponsorAccounts(access);
      if (!currentSponsorAccounts.includes(normalizeAddress(sponsorKey))) {
        throw new Error(
          `deleteSponsorTree requires a sponsor-root account with recipient children. ${sponsorKey} is not a sponsor root in the current tree; use deleteSponsorRecipient or deleteRecipientAgent for lower branches.`,
        );
      }
      trace(`deleteSponsorTree method start ${sponsorKey}`);
      const treeSummary = await deleteSponsorTree(sponsorKey);
      trace(`deleteSponsorTree method ok ${sponsorKey}`);
      appendLog(`${selectedMethod} -> unsponsored sponsor tree ${sponsorKey}.`);
      setStatus(`${def.title} complete.`);
      return treeSummary;
    }

    if ('utilityMethod' in def && def.utilityMethod === 'deleteMasterSponsorships') {
      const deletedSponsorships = [];
      let sponsorAccounts: string[];
      try {
        trace('loadSponsorAccounts start');
        sponsorAccounts = await loadSponsorAccounts(access);
        trace(`loadSponsorAccounts ok ${JSON.stringify(sponsorAccounts)}`);
        appendLog(`${selectedMethod} -> initial sponsorAccounts=${JSON.stringify(sponsorAccounts)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        trace(`loadSponsorAccounts failed ${message}`);
        appendLog(`${selectedMethod} -> loadSponsorAccounts failed: ${message}`);
        throw error;
      }
      while (sponsorAccounts.length > 0) {
        const sponsorKey = sponsorAccounts[0];
        trace(`deleteSponsorTree start ${sponsorKey}`);
        const treeSummary = await deleteSponsorTree(sponsorKey);
        trace(`deleteSponsorTree ok ${sponsorKey}`);
        deletedSponsorships.push({ sponsorKey, treeSummary });
        try {
          trace(`reload sponsorAccounts start after ${sponsorKey}`);
          sponsorAccounts = await loadSponsorAccounts(access);
          trace(`reload sponsorAccounts ok ${JSON.stringify(sponsorAccounts)}`);
          appendLog(`${selectedMethod} -> sponsorAccounts after ${sponsorKey}=${JSON.stringify(sponsorAccounts)}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          trace(`reload sponsorAccounts failed after ${sponsorKey}: ${message}`);
          appendLog(`${selectedMethod} -> loadSponsorAccounts after ${sponsorKey} failed: ${message}`);
          throw error;
        }
      }
      const deletedOrphanAccounts: string[] = [];
      let remainingAccounts: string[];
      try {
        trace('loadAccountList start');
        remainingAccounts = await loadAccountList(access);
        trace(`loadAccountList ok ${JSON.stringify(remainingAccounts)}`);
        trace(`cleanupSignerAddress ${String(cleanupSignerAddress || '(per-account fallback)')}`);
        appendLog(`${selectedMethod} -> initial remainingAccounts=${JSON.stringify(remainingAccounts)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        trace(`loadAccountList failed ${message}`);
        appendLog(`${selectedMethod} -> loadAccountList failed: ${message}`);
        throw error;
      }
      let previousRemainingSnapshot = '';
      while (remainingAccounts.length > 0) {
        const snapshot = remainingAccounts.join(',');
        if (snapshot === previousRemainingSnapshot) {
          break;
        }
        previousRemainingSnapshot = snapshot;
        for (const accountKey of remainingAccounts) {
          await deleteAccountRecordWithRecovery(accountKey);
          deletedOrphanAccounts.push(accountKey);
        }
        try {
          trace('reload remainingAccounts start');
          remainingAccounts = await loadAccountList(access);
          trace(`reload remainingAccounts ok ${JSON.stringify(remainingAccounts)}`);
          appendLog(`${selectedMethod} -> remainingAccounts after orphan cleanup=${JSON.stringify(remainingAccounts)}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          trace(`reload remainingAccounts failed ${message}`);
          appendLog(`${selectedMethod} -> loadAccountList after orphan cleanup failed: ${message}`);
          throw error;
        }
      }
      if (remainingAccounts.length > 0) {
        throw new Error(`deleteMasterSponsorships incomplete: ${remainingAccounts.length} account(s) remain: ${remainingAccounts.join(', ')}`);
      }
      appendLog(`${selectedMethod} -> deleted ${deletedSponsorships.length} sponsorship tree(s).`);
      setStatus(`${def.title} complete.`);
      return { deletedSponsorships, deletedOrphanAccounts };
    }

    if (!('baseMethod' in def)) {
      throw new Error(`Unsupported utility method: ${selectedMethod}`);
    }

    const external = await buildExternalSerializerResult(access.contract as any, def.baseMethod, methodArgs);
    appendLog(
      external.blocked
        ? `${selectedMethod} -> external rebuild blocked.`
        : `${selectedMethod} -> external rebuild complete.`,
    );
    setStatus(external.blocked ? `${def.title} blocked.` : `${def.title} complete.`);
    return external.blocked ? { blocked: true, reason: external.reason } : external.value;
  } catch (error) {
    throw attachSerializationDebugTrace(error, debugTrace);
  }
}
