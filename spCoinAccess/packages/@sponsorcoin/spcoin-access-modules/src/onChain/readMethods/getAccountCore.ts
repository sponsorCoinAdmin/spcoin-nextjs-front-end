// @ts-nocheck
import { Interface } from 'ethers';
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';
import { timeOnChainCall } from '../../utils/methodTiming';

const accountCoreInterface = new Interface([
  'function getAccountCore(address _accountKey) view returns (address accountKey, uint256 creationTime, uint256 accountBalance, uint256 stakedAccountSPCoins, uint256 accountStakingRewards, uint256 sponsorCount, uint256 recipientCount, uint256 agentCount, uint256 parentRecipientCount, bool active)',
]);

const ACCOUNT_CORE_FIELDS = [
  'accountKey',
  'creationTime',
  'accountBalance',
  'stakedAccountSPCoins',
  'accountStakingRewards',
  'sponsorCount',
  'recipientCount',
  'agentCount',
  'parentRecipientCount',
  'active',
];

async function callGetAccountCore(contract, accountKey) {
  const target = String(contract?.target || (typeof contract?.getAddress === 'function' ? await contract.getAddress() : ''));
  const runner = contract?.runner;
  if (!target || !runner || typeof runner.call !== 'function') {
    throw new Error('SpCoin read method getAccountCore is not available on access modules or contract.');
  }
  const data = accountCoreInterface.encodeFunctionData('getAccountCore', [accountKey]);
  const raw = await timeOnChainCall('getAccountCore', () => runner.call({ to: target, data }));
  return accountCoreInterface.decodeFunctionResult('getAccountCore', raw);
}

function normalizeAccountCoreResult(result, requestedAccountKey) {
  const source = result && typeof result === 'object' ? result : [];
  return Object.fromEntries(
    ACCOUNT_CORE_FIELDS.map((field, index) => [
      field,
      source[field] ?? source[index] ?? (field === 'accountKey' ? requestedAccountKey : undefined),
    ]),
  );
}

const handler = buildHandler('getAccountCore', async (context) => {
  const accountKey = String(context.methodArgs[0] || '');
  const method =
    getDynamicMethod(context.read, 'getAccountCore') ||
    getDynamicMethod(context.staking, 'getAccountCore') ||
    getDynamicMethod(context.contract, 'getAccountCore');
  const result = method ? await method(accountKey) : await callGetAccountCore(context.contract, accountKey);
  return normalizeAccountCoreResult(result, accountKey);
});

export default handler;
