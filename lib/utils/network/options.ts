// File: @/lib/utils/network/options.ts

import configuredNetworks from '@/lib/network/initialize/networks.json';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';
import { DEFAULT_CHAIN_ID, isTestnetChainId } from './chains';
import { toChainIdString } from './appChainId';

export interface NetworkOption {
  id: number;
  name: string;
  symbol: string;
  logo?: string;
}

export const ALL_NETWORKS_VALUE = 'ALL_NETWORKS' as const;

interface NetworkEntry {
  chainId?: unknown;
  name?: unknown;
  symbol?: unknown;
  logoURL?: unknown;
  img?: unknown;
}

const toNetworkOption = (entry: NetworkEntry): NetworkOption => {
  const id = Number(entry.chainId);
  const name = typeof entry.name === 'string' ? entry.name : '';
  const symbol = typeof entry.symbol === 'string' ? entry.symbol : '';
  const logo =
    typeof entry.logoURL === 'string'
      ? entry.logoURL
      : typeof entry.img === 'string'
        ? entry.img
        : getBlockChainLogoURL(id);

  return {
    id,
    name,
    symbol,
    logo,
  };
};

export const getConfiguredNetworkOptions = (): NetworkOption[] =>
  (configuredNetworks as NetworkEntry[])
    .map(toNetworkOption)
    .filter((n) => Number.isFinite(n.id));

export const splitNetworkOptionsByTestnet = (options: NetworkOption[]) => ({
  mainnetOptions: options.filter((o) => !isTestnetChainId(o.id)),
  testnetOptions: options.filter((o) => isTestnetChainId(o.id)),
});

export const filterNetworkOptionsByShowTestNets = (
  options: NetworkOption[],
  showTestNets: boolean,
): NetworkOption[] =>
  showTestNets ? options : options.filter((o) => !isTestnetChainId(o.id));

export const getTokenListNetworkOptions = (showTestNets: boolean) => {
  const visible = filterNetworkOptionsByShowTestNets(
    getConfiguredNetworkOptions(),
    showTestNets,
  );

  return [
    ...visible.map((option) => ({
      value: toChainIdString(option.id),
      label: option.name,
    })),
    { value: ALL_NETWORKS_VALUE, label: 'All Networks' },
  ] as const;
};

export const getDefaultTokenListNetworkValue = (
  appChainId: number | undefined,
  showTestNets: boolean,
): string => {
  const options = getTokenListNetworkOptions(showTestNets);
  const appChainValue = toChainIdString(appChainId);
  const hasAppChain = options.some((o) => o.value === appChainValue);
  return hasAppChain ? appChainValue : toChainIdString(DEFAULT_CHAIN_ID);
};
