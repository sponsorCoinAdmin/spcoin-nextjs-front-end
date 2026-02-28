import type { ExchangeContext } from '@/lib/structure';

import { toPersistedAccountRef } from '@/lib/accounts/accountAddress';

export function stripPersistedAccounts(accounts: unknown) {
  if (!accounts || typeof accounts !== 'object') return accounts ?? {};

  const src = accounts as any;
  return {
    ...src,
    activeAccount: toPersistedAccountRef(src.activeAccount),
    sponsorAccount: toPersistedAccountRef(src.sponsorAccount),
    recipientAccount: toPersistedAccountRef(src.recipientAccount),
    agentAccount: toPersistedAccountRef(src.agentAccount),
    sponsorAccounts: Array.isArray(src.sponsorAccounts)
      ? src.sponsorAccounts
          .map((account: unknown) => toPersistedAccountRef(account))
          .filter(Boolean)
      : src.sponsorAccounts,
    recipientAccounts: Array.isArray(src.recipientAccounts)
      ? src.recipientAccounts
          .map((account: unknown) => toPersistedAccountRef(account))
          .filter(Boolean)
      : src.recipientAccounts,
    agentAccounts: Array.isArray(src.agentAccounts)
      ? src.agentAccounts
          .map((account: unknown) => toPersistedAccountRef(account))
          .filter(Boolean)
      : src.agentAccounts,
  };
}

export function stripPersistedAccountData(ctx: ExchangeContext): ExchangeContext {
  const accounts = (ctx as any)?.accounts;
  if (!accounts || typeof accounts !== 'object') return ctx;

  return {
    ...(ctx as any),
    accounts: stripPersistedAccounts(accounts),
  } as ExchangeContext;
}
