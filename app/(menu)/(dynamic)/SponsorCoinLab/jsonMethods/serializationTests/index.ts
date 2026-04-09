import type { MethodDef, ParamDef } from '../shared/types';
import { createSpCoinLibraryAccess } from '../shared';
import { buildSerializedSPCoinHeader } from '../shared/buildSerializedSPCoinHeader';
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
    | 'hhFundAccounts'
    | 'deleteMasterSponsorships'
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
  return (Object.keys(SERIALIZATION_TEST_METHOD_DEFS) as SerializationTestMethod[])
    .filter((name) => 'utilityMethod' in SERIALIZATION_TEST_METHOD_DEFS[name])
    .sort((a, b) => a.localeCompare(b));
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
  selectedHardhatAddress?: string;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

async function loadSponsorAccounts(access: ReturnType<typeof createSpCoinLibraryAccess>) {
  if (typeof access.read.getAccountList !== 'function' || typeof access.read.getAccountRecipientList !== 'function') {
    throw new Error(`getMasterSponsorList requires getAccountList() and getAccountRecipientList() read methods.`);
  }
  const accountList = Array.from((await access.read.getAccountList()) as unknown[]).map((value) => normalizeAddress(value));
  const recipientLists = await Promise.all(
    accountList.map(async (account) => {
      const recipients = Array.from((await access.read.getAccountRecipientList(account)) as unknown[]).map((value) =>
        normalizeAddress(value),
      );
      return { account, recipients };
    }),
  );
  return recipientLists.filter((entry) => entry.recipients.length > 0).map((entry) => entry.account);
}

async function loadAccountList(access: ReturnType<typeof createSpCoinLibraryAccess>) {
  if (typeof access.read.getAccountList !== 'function') {
    throw new Error('getAccountList() read method is required.');
  }
  return Array.from((await access.read.getAccountList()) as unknown[]).map((value) => normalizeAddress(value));
}

async function loadRecipientAccounts(access: ReturnType<typeof createSpCoinLibraryAccess>, sponsorKey: string) {
  if (typeof access.read.getAccountRecipientList !== 'function') {
    throw new Error('getAccountRecipientList() read method is required.');
  }
  return Array.from((await access.read.getAccountRecipientList(sponsorKey)) as unknown[]).map((value) => normalizeAddress(value));
}

async function loadRecipientRateKeys(
  access: ReturnType<typeof createSpCoinLibraryAccess>,
  sponsorKey: string,
  recipientKey: string,
) {
  if (typeof access.read.getRecipientRateList !== 'function') {
    throw new Error('getRecipientRateList() read method is required.');
  }
  return Array.from((await access.read.getRecipientRateList(sponsorKey, recipientKey)) as unknown[]).map((value) => String(value));
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
    appendLog,
    setStatus,
  } = args;
  const def = SERIALIZATION_TEST_METHOD_DEFS[selectedMethod];
  const target = requireContractAddress();
  const runner = await ensureReadRunner();
  const access = createSpCoinLibraryAccess(target, runner);
  const methodArgs = def.params.map((param, idx) => coerceParamValue(params[idx], param));

  if ('utilityMethod' in def && def.utilityMethod === 'compareSpCoinContractSize') {
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

  if ('utilityMethod' in def && (def.utilityMethod === 'getSponsorAccounts' || def.utilityMethod === 'getMasterSponsorList')) {
    const sponsorAccounts = await loadSponsorAccounts(access);
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

  const executeAs = async <T>(label: string, signerAddress: string, writeCall: (contract: any, signer: any) => Promise<T>) =>
    executeWriteConnected(label, writeCall, signerAddress);

  const deleteAgentSponsorshipLeaf = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string,
    agentKey: string,
    agentRateKey: string,
  ) =>
    executeAs(
      `deleteAgentSponsorship(${recipientKey}, ${recipientRateKey}, ${agentKey}, ${agentRateKey})`,
      sponsorKey,
      async (contract) => {
        const fn = (contract as { deleteAgentSponsorship?: (...args: unknown[]) => Promise<any> }).deleteAgentSponsorship;
        if (typeof fn !== 'function') {
          throw new Error('deleteAgentSponsorship is not available on the current SpCoin contract access path.');
        }
        const tx = await fn(recipientKey, recipientRateKey, agentKey, agentRateKey);
        await tx.wait();
        return tx;
      },
    );

  const deleteAgentNode = async (sponsorKey: string, recipientKey: string, recipientRateKey: string, agentKey: string) =>
    executeAs(`deleteAgent(${recipientKey}, ${recipientRateKey}, ${agentKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { deleteAgent?: (...args: unknown[]) => Promise<any> }).deleteAgent;
      if (typeof fn !== 'function') {
        throw new Error('deleteAgent is not available on the current SpCoin contract access path.');
      }
      const tx = await fn(recipientKey, recipientRateKey, agentKey);
      await tx.wait();
      return tx;
    });

  const deleteRecipientRateNode = async (sponsorKey: string, recipientKey: string, recipientRateKey: string) =>
    executeAs(`deleteRecipientRate(${recipientKey}, ${recipientRateKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { deleteRecipientRate?: (...args: unknown[]) => Promise<any> }).deleteRecipientRate;
      if (typeof fn !== 'function') {
        throw new Error('deleteRecipientRate is not available on the current SpCoin contract access path.');
      }
      const tx = await fn(recipientKey, recipientRateKey);
      await tx.wait();
      return tx;
    });

  const deleteRecipientRelationship = async (sponsorKey: string, recipientKey: string) =>
    executeAs(`delRecipient(${sponsorKey}, ${recipientKey})`, sponsorKey, async (contract) => {
      const fn = (contract as { delRecipient?: (...args: unknown[]) => Promise<any> }).delRecipient;
      if (typeof fn !== 'function') {
        throw new Error('delRecipient is not available on the current SpCoin contract access path.');
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

  const deleteAgentSponsorshipsWorkflow = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string,
    agentKey: string,
  ) => {
    const deletedAgentRateKeys: string[] = [];
    let agentRateKeys = await loadAgentRateKeys(access, sponsorKey, recipientKey, recipientRateKey, agentKey);
    while (agentRateKeys.length > 0) {
      const agentRateKey = agentRateKeys[0];
      await deleteAgentSponsorshipLeaf(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
      deletedAgentRateKeys.push(agentRateKey);
      agentRateKeys = await loadAgentRateKeys(access, sponsorKey, recipientKey, recipientRateKey, agentKey);
    }
    const remainingAgents = await loadRecipientRateAgents(access, sponsorKey, recipientKey, recipientRateKey);
    if (remainingAgents.includes(normalizeAddress(agentKey))) {
      await deleteAgentNode(sponsorKey, recipientKey, recipientRateKey, agentKey);
    }
    return {
      sponsorKey,
      recipientKey,
      recipientRateKey,
      agentKey,
      deletedAgentRateKeys,
    };
  };

  const deleteRecipientSponsorshipWorkflow = async (
    sponsorKey: string,
    recipientKey: string,
    recipientRateKey: string,
    visitedSponsors = new Set<string>(),
  ) => {
    const agentKeys = await loadRecipientRateAgents(access, sponsorKey, recipientKey, recipientRateKey);
    const childResults = [];
    for (const agentKey of agentKeys) {
      childResults.push(await deleteAgentSponsorshipsWorkflow(sponsorKey, recipientKey, recipientRateKey, agentKey));
    }
    const remainingAgentKeys = await loadRecipientRateAgents(access, sponsorKey, recipientKey, recipientRateKey);
    if (remainingAgentKeys.length > 0) {
      throw new Error(
        `deleteRecipientSponsorshipTree incomplete: agent accounts remain for ${sponsorKey} -> ${recipientKey} @ ${recipientRateKey}: ${remainingAgentKeys.join(', ')}`,
      );
    }
    const remainingRateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
    if (remainingRateKeys.includes(String(recipientRateKey))) {
      await deleteRecipientRateNode(sponsorKey, recipientKey, recipientRateKey);
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

  const deleteSponsorshipWorkflow = async (sponsorKey: string, visitedSponsors = new Set<string>()) => {
    const normalizedSponsorKey = normalizeAddress(sponsorKey);
    if (visitedSponsors.has(normalizedSponsorKey)) {
      return { sponsorKey, skipped: true, reason: 'already_visited' as const };
    }
    visitedSponsors.add(normalizedSponsorKey);

    const currentSponsorAccounts = new Set(await loadSponsorAccounts(access));
    const recipients = await loadRecipientAccounts(access, sponsorKey);
    const deletedRecipients = [];
    for (const recipientKey of recipients) {
      const normalizedRecipientKey = normalizeAddress(recipientKey);
      if (currentSponsorAccounts.has(normalizedRecipientKey)) {
        await deleteSponsorshipWorkflow(recipientKey, visitedSponsors);
      }
      const rateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
      const deletedRates = [];
      for (const rateKey of rateKeys) {
        deletedRates.push(await deleteRecipientSponsorshipWorkflow(sponsorKey, recipientKey, rateKey, visitedSponsors));
      }
      const remainingRecipientRateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
      if (remainingRecipientRateKeys.length === 0) {
        const remainingRecipients = await loadRecipientAccounts(access, sponsorKey);
        if (remainingRecipients.includes(normalizedRecipientKey)) {
          await deleteRecipientRelationship(sponsorKey, recipientKey);
        }
      }
      deletedRecipients.push({ recipientKey, deletedRates });
    }

    const remainingRecipients = await loadRecipientAccounts(access, sponsorKey);
    if (remainingRecipients.length > 0) {
      throw new Error(`deleteSponsorshipTree incomplete: recipients remain for ${sponsorKey}: ${remainingRecipients.join(', ')}`);
    }

    const accountList = await loadAccountList(access);
    if (accountList.includes(normalizedSponsorKey)) {
      await deleteSponsorAccount(sponsorKey);
    }

    return {
      sponsorKey,
      deletedRecipientCount: deletedRecipients.length,
      deletedRecipients,
      visitedSponsors: Array.from(visitedSponsors),
    };
  };

  if ('utilityMethod' in def && def.utilityMethod === 'deleteAgentSponsorships') {
    const result = await deleteAgentSponsorshipsWorkflow(
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

  if ('utilityMethod' in def && def.utilityMethod === 'deleteRecipientSponsorshipTree') {
    const result = await deleteRecipientSponsorshipWorkflow(
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

  if ('utilityMethod' in def && def.utilityMethod === 'deleteRecipientSponsorships') {
    const sponsorKey = toCanonicalAddress(methodArgs[0], 'Sponsor Key');
    const recipientKey = toCanonicalAddress(methodArgs[1], 'Recipient Key');
    const rateKeys = await loadRecipientRateKeys(access, sponsorKey, recipientKey);
    const results = [];
    for (const rateKey of rateKeys) {
      results.push(await deleteRecipientSponsorshipWorkflow(sponsorKey, recipientKey, rateKey));
    }
    appendLog(`${selectedMethod} -> deleted ${results.length} recipient sponsorship branch(es) for ${recipientKey}.`);
    setStatus(`${def.title} complete.`);
    return { sponsorKey, recipientKey, deletedRecipientSponsorships: results };
  }

  if ('utilityMethod' in def && def.utilityMethod === 'deleteMasterSponsorships') {
    const deletedSponsorships = [];
    let sponsorAccounts = await loadSponsorAccounts(access);
    while (sponsorAccounts.length > 0) {
      deletedSponsorships.push(await deleteSponsorshipWorkflow(sponsorAccounts[0]));
      sponsorAccounts = await loadSponsorAccounts(access);
    }
    const remainingAccounts = await loadAccountList(access);
    if (remainingAccounts.length > 0) {
      throw new Error(`deleteMasterSponsorships incomplete: ${remainingAccounts.length} account(s) remain: ${remainingAccounts.join(', ')}`);
    }
    appendLog(`${selectedMethod} -> deleted ${deletedSponsorships.length} sponsorship tree(s).`);
    setStatus(`${def.title} complete.`);
    return { deletedSponsorships };
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
}
