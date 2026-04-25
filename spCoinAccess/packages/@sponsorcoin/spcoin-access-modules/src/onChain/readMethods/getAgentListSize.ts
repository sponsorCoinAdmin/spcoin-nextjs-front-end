// @ts-nocheck
import { Interface } from 'ethers';
import { buildHandler } from '../../readMethodRuntime';
import { timeOnChainCall } from '../../utils/methodTiming';

const accountLinksInterface = new Interface([
  'function getAccountLinks(address _accountKey) view returns (address[] sponsorKeys, address[] recipientKeys, address[] agentKeys, address[] parentRecipientKeys)',
]);

async function callGetAccountLinks(contract, accountKey) {
  const target = String(contract?.target || (typeof contract?.getAddress === 'function' ? await contract.getAddress() : ''));
  const runner = contract?.runner;
  if (!target || !runner || typeof runner.call !== 'function') {
    throw new Error('SpCoin read method getAgentKeyCount requires getAgentKeys() or getAccountAgentList() on access modules or contract.');
  }
  const data = accountLinksInterface.encodeFunctionData('getAccountLinks', [accountKey]);
  const raw = await timeOnChainCall('getAccountLinks', () => runner.call({ to: target, data }));
  return accountLinksInterface.decodeFunctionResult('getAccountLinks', raw);
}

const handler = buildHandler('getAgentKeyCount', async (context) => {
  const accountKey = String(context.methodArgs[0] || '');
  const method =
    typeof context.read.getAgentKeys === 'function'
      ? context.read.getAgentKeys
      : typeof context.read.getAgentList === 'function'
        ? context.read.getAgentList
      : typeof context.read.getAccountAgentList === 'function'
        ? context.read.getAccountAgentList
        : null;
  if (typeof method !== 'function') {
    if (typeof context.contract.getAccountLinks === 'function') {
      const links = await context.contract.getAccountLinks(accountKey);
      const agentList = context.normalizeStringListResult(Array.isArray(links?.[2]) ? links[2] : []);
      return agentList.length;
    }
    const decoded = await callGetAccountLinks(context.contract, accountKey);
    const agentList = context.normalizeStringListResult(Array.isArray(decoded?.[2]) ? decoded[2] : []);
    return agentList.length;
  }
  const agentList = context.normalizeStringListResult(await method(accountKey));
  return agentList.length;
});

export default handler;
