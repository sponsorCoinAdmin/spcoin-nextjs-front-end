// @ts-nocheck
/**
 * Subscribes to the contract's TransactionAdded event and invalidates
 * the account cache for all affected accounts (sponsor, recipient, agent).
 */
import { invalidateCachedAccountRecord } from './accountCache';
import { invalidateReadCacheByDependency, invalidateReadCacheForAccount } from './readCache';

const activeListeners = new Map<string, () => void>();

function normalizeAddress(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function buildListenerKey(contractAddress: string): string {
  return normalizeAddress(contractAddress);
}

function invalidateRelationshipReadMethods(): void {
  for (const methodName of [
    'getAccountLinks',
    'getAccountRecord',
    'getAccountRecordBase',
    'getAccountRecordShallow',
    'getRecipientRateList',
    'getRecipientRateAgentList',
    'getAgentRateList',
    'getRecipientRateTransactionSetKey',
    'getAgentRateTransactionSetKey',
    'getRateTransactionSet',
    'getPendingRewards',
  ]) {
    invalidateReadCacheByDependency(`method:${methodName}`);
  }
}

export function startAccountCacheEventListener(
  contract: unknown,
  contractAddress: string,
): void {
  const key = buildListenerKey(contractAddress);
  if (activeListeners.has(key)) return; // already listening

  const typedContract = contract as {
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    off?: (event: string, handler: (...args: unknown[]) => void) => void;
  };

  if (typeof typedContract?.on !== 'function') return;

  const handler = (...args: unknown[]) => {
    // TransactionAdded(transactionId, sponsorKey, recipientKey, agentKey, ...)
    const sponsorKey = normalizeAddress(args[1]);
    const recipientKey = normalizeAddress(args[2]);
    const agentKey = normalizeAddress(args[3]);

    if (sponsorKey) {
      invalidateCachedAccountRecord(contractAddress, sponsorKey);
      invalidateReadCacheForAccount(sponsorKey);
    }
    if (recipientKey) {
      invalidateCachedAccountRecord(contractAddress, recipientKey);
      invalidateReadCacheForAccount(recipientKey);
    }
    if (agentKey && agentKey !== '0x0000000000000000000000000000000000000000') {
      invalidateCachedAccountRecord(contractAddress, agentKey);
      invalidateReadCacheForAccount(agentKey);
    }
    invalidateRelationshipReadMethods();
  };

  typedContract.on('TransactionAdded', handler);

  activeListeners.set(key, () => {
    typedContract.off?.('TransactionAdded', handler);
  });
}

export function stopAccountCacheEventListener(contractAddress: string): void {
  const key = buildListenerKey(contractAddress);
  const cleanup = activeListeners.get(key);
  if (cleanup) {
    cleanup();
    activeListeners.delete(key);
  }
}

export function stopAllAccountCacheEventListeners(): void {
  for (const cleanup of activeListeners.values()) cleanup();
  activeListeners.clear();
}
