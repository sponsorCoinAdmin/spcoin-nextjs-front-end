import { defaultMissingImage, getAccountLogoURL, normalizeAddressForAssets } from '@/lib/context/helpers/assetHelpers';
import { isAddress, normalizeAddress } from '@/lib/utils/address';
import type { SpCoinWalletAccount } from './types';

const HARDHAT_CHAIN_ID = 31337;

type TestAccountFileEntry =
  | string
  | {
      address?: unknown;
      privateKey?: unknown;
      name?: unknown;
      symbol?: unknown;
      email?: unknown;
      website?: unknown;
      description?: unknown;
      logoURL?: unknown;
    };

function normalizeAccountAddress(value: unknown): string {
  const raw = String(value ?? '').trim();
  return isAddress(raw) ? normalizeAddress(raw) : '';
}

type AccountJsonMetadata = {
  name?: unknown;
  symbol?: unknown;
  email?: unknown;
  website?: unknown;
  description?: unknown;
  logoURL?: unknown;
};

async function loadAccountMetadata(address: string): Promise<{
  name?: string;
  symbol?: string;
  email?: string;
  website?: string;
  description?: string;
  logoURL: string;
}> {
  const fallbackLogoURL = getAccountLogoURL(address);
  const folder = normalizeAddressForAssets(address);
  if (!folder) {
    return { logoURL: defaultMissingImage };
  }

  try {
    const response = await fetch(`/assets/accounts/${folder}/account.json`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { logoURL: fallbackLogoURL };
    }

    const accountData = (await response.json()) as AccountJsonMetadata;
    const name = String(accountData?.name ?? '').trim();
    const symbol = String(accountData?.symbol ?? '').trim();
    const email = String(accountData?.email ?? '').trim();
    const website = String(accountData?.website ?? '').trim();
    const description = String(accountData?.description ?? '').trim();
    const logoURL = String(accountData?.logoURL ?? '').trim() || fallbackLogoURL;

    return {
      ...(name ? { name } : {}),
      ...(symbol ? { symbol } : {}),
      ...(email ? { email } : {}),
      ...(website ? { website } : {}),
      ...(description ? { description } : {}),
      logoURL,
    };
  } catch {
    return { logoURL: fallbackLogoURL };
  }
}

export async function loadHardhatWalletAccounts(
  chainId = HARDHAT_CHAIN_ID,
): Promise<SpCoinWalletAccount[]> {
  const response = await fetch(`/assets/spCoinLab/networks/${chainId}/testAccounts.json`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Unable to load Hardhat wallet accounts for chain ${chainId}.`);
  }

  const rawEntries = (await response.json()) as TestAccountFileEntry[];
  if (!Array.isArray(rawEntries)) return [];

  const accounts: SpCoinWalletAccount[] = [];

  await Promise.all(rawEntries.map(async (entry, index) => {
    if (typeof entry === 'string') {
      const address = normalizeAccountAddress(entry);
      if (!address) return;
      const metadata = await loadAccountMetadata(address);
      accounts.push({
        address,
        label: metadata.name || metadata.symbol || `Account ${index}`,
        ...(metadata.name ? { name: metadata.name } : {}),
        ...(metadata.symbol ? { symbol: metadata.symbol } : {}),
        ...(metadata.email ? { email: metadata.email } : {}),
        ...(metadata.website ? { website: metadata.website } : {}),
        ...(metadata.description ? { description: metadata.description } : {}),
        logoURL: metadata.logoURL,
        source: 'hardhat',
      });
      return;
    }

    const address = normalizeAccountAddress(entry?.address);
    if (!address) return;
    const privateKey = String(entry?.privateKey ?? '').trim();
    const name = String(entry?.name ?? '').trim();
    const symbol = String(entry?.symbol ?? '').trim();
    const email = String(entry?.email ?? '').trim();
    const website = String(entry?.website ?? '').trim();
    const description = String(entry?.description ?? '').trim();
    const logoURL = String(entry?.logoURL ?? '').trim();
    const metadata = await loadAccountMetadata(address);

    accounts.push({
      address,
      ...(privateKey ? { privateKey } : {}),
      label: name || symbol || metadata.name || metadata.symbol || `Account ${index}`,
      ...(name || metadata.name ? { name: name || metadata.name } : {}),
      ...(symbol || metadata.symbol ? { symbol: symbol || metadata.symbol } : {}),
      ...(email || metadata.email ? { email: email || metadata.email } : {}),
      ...(website || metadata.website ? { website: website || metadata.website } : {}),
      ...(description || metadata.description ? { description: description || metadata.description } : {}),
      logoURL: logoURL || metadata.logoURL,
      source: 'hardhat',
    });
  }));

  return accounts;
}
