// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
import { getCachedAccountRecord, setCachedAccountRecord } from '../../utils/accountCache';
import { startAccountCacheEventListener } from '../../utils/accountCacheEventListener';

const handler = buildHandler('getAccountRecord', async (context) => {
  const accountKey = String(context.methodArgs[0]);
  const contractAddress = String(context.target || '');

  // Start event listener for this contract if not already running
  if (contractAddress && context.contract) {
    startAccountCacheEventListener(context.contract, contractAddress);
  }

  // Check cache first
  const cached = contractAddress ? getCachedAccountRecord(contractAddress, accountKey) : null;
  if (cached !== null) return cached;

  // Cache miss — fetch from chain
  const result = await context.read.getAccountRecord(accountKey);

  // Store in cache
  if (contractAddress && result != null) {
    setCachedAccountRecord(contractAddress, accountKey, result);
  }

  return result;
});

export default handler;
