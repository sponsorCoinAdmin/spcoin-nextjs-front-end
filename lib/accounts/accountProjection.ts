import type { ExchangeContext as ExchangeContextTypeOnly, spCoinAccount } from '@/lib/structure';

import {
  accountRegistry,
  getAccountRegistryRecord,
  syncAccountRegistryPins,
  upsertAccountRegistryRecord,
  type AccountRegistry,
  type AccountRegistryRecord,
} from '@/lib/context/accounts/accountRegistry';
import {
  getAccountAddress,
  normalizeAccountAddressKey,
} from '@/lib/accounts/accountAddress';

export function normalizeExchangeAccountsWithRegistry(
  ctx: ExchangeContextTypeOnly,
  registry: AccountRegistry = accountRegistry,
): ExchangeContextTypeOnly {
  const next = ctx;
  const accounts = (next as any).accounts ?? {};
  (next as any).accounts = accounts;

  const syncSingle = (
    field:
      | 'activeAccount'
      | 'sponsorAccount'
      | 'recipientAccount'
      | 'agentAccount',
    pinKey: string,
  ) => {
    const current = accounts[field] as AccountRegistryRecord | undefined;
    const address =
      typeof current?.address === 'string' ? current.address.trim() : '';

    syncAccountRegistryPins(registry, pinKey, address ? [address] : []);

    if (!address) {
      accounts[field] = current;
      return;
    }

    accounts[field] = current
      ? upsertAccountRegistryRecord(registry, current, pinKey)
      : getAccountRegistryRecord<AccountRegistryRecord>(registry, address, pinKey);
  };

  const syncList = (
    field: 'sponsorAccounts' | 'recipientAccounts' | 'agentAccounts',
    pinKey: string,
  ) => {
    const list = Array.isArray(accounts[field]) ? accounts[field] : [];
    const seen = new Set<string>();
    const pinnedAddresses: string[] = [];
    const nextList: AccountRegistryRecord[] = [];

    for (const current of list as AccountRegistryRecord[]) {
      const address =
        typeof current?.address === 'string' ? current.address.trim() : '';
      const key = normalizeAccountAddressKey(address);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const canonical = upsertAccountRegistryRecord(registry, current, pinKey);
      nextList.push(canonical);
      pinnedAddresses.push(address);
    }

    syncAccountRegistryPins(registry, pinKey, pinnedAddresses);
    accounts[field] = nextList;
  };

  syncSingle('activeAccount', 'slot:active');
  syncSingle('sponsorAccount', 'slot:sponsor');
  syncSingle('recipientAccount', 'slot:recipient');
  syncSingle('agentAccount', 'slot:agent');

  syncList('sponsorAccounts', 'list:sponsor');
  syncList('recipientAccounts', 'list:recipient');
  syncList('agentAccounts', 'list:agent');

  return next;
}

export function rehydrateAccountRefs(
  accounts: ExchangeContextTypeOnly['accounts'],
  hydratedByAddress: Map<string, spCoinAccount>,
): ExchangeContextTypeOnly['accounts'] {
  const mapOne = (account: unknown) => {
    const address = getAccountAddress(account);
    if (!address) return undefined;
    return hydratedByAddress.get(normalizeAccountAddressKey(address));
  };

  const mapList = (list: unknown) => {
    if (!Array.isArray(list)) return [];
    const next: spCoinAccount[] = [];
    const seen = new Set<string>();

    for (const item of list) {
      const hydrated = mapOne(item);
      const key = normalizeAccountAddressKey(hydrated?.address);
      if (!hydrated || !key || seen.has(key)) continue;
      seen.add(key);
      next.push(hydrated);
    }

    return next;
  };

  return {
    ...accounts,
    activeAccount: mapOne(accounts.activeAccount),
    sponsorAccount: mapOne(accounts.sponsorAccount),
    recipientAccount: mapOne(accounts.recipientAccount),
    agentAccount: mapOne(accounts.agentAccount),
    sponsorAccounts: mapList(accounts.sponsorAccounts),
    recipientAccounts: mapList(accounts.recipientAccounts),
    agentAccounts: mapList(accounts.agentAccounts),
  };
}
