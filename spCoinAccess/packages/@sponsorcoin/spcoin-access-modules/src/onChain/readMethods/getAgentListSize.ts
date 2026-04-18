// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';

const handler = buildHandler('getAgentListSize', async (context) => {
  const method =
    typeof context.read.getAgentList === 'function'
      ? context.read.getAgentList
      : typeof context.read.getAccountAgentList === 'function'
        ? context.read.getAccountAgentList
        : null;
  if (typeof method !== 'function') {
    throw new Error('SpCoin read method getAgentListSize requires getAgentList() or getAccountAgentList() on access modules or contract.');
  }
  const agentList = context.normalizeStringListResult(await method(String(context.methodArgs[0])));
  return agentList.length;
});

export default handler;
