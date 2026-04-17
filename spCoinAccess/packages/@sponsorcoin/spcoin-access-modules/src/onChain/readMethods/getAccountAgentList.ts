// @ts-nocheck
import { Interface } from 'ethers';
import { buildHandler } from '../../readMethodRuntime';

const accountLinksInterface = new Interface([
  'function getAccountLinks(address _accountKey) view returns (address[] sponsorAccountList, address[] recipientAccountList, address[] agentAccountList, address[] agentParentRecipientAccountList)',
]);

async function callGetAccountLinks(contract, accountKey) {
  const target = String(contract?.target || (typeof contract?.getAddress === 'function' ? await contract.getAddress() : ''));
  const runner = contract?.runner;
  if (!target || !runner || typeof runner.call !== 'function') {
    throw new Error('SpCoin read method getAccountAgentList is not available on access modules or contract.');
  }
  const data = accountLinksInterface.encodeFunctionData('getAccountLinks', [accountKey]);
  const raw = await runner.call({ to: target, data });
  const decoded = accountLinksInterface.decodeFunctionResult('getAccountLinks', raw);
  return decoded;
}

const handler = buildHandler('getAccountAgentList', async (context) => {
  const accountKey = String(context.methodArgs[0] || '');
  if (typeof context.contract.getAccountLinks === 'function') {
    const links = await context.contract.getAccountLinks(accountKey);
    return context.normalizeStringListResult(Array.isArray(links?.[2]) ? links[2] : []);
  }

  const decoded = await callGetAccountLinks(context.contract, accountKey);
  return context.normalizeStringListResult(Array.isArray(decoded?.[2]) ? decoded[2] : []);
});

export default handler;
