'use client';

import { useMemo } from 'react';
import networks from '@/lib/network/initialize/networks.json';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';

export type NetOpt = { id: number; name: string; symbol: string; logo?: string };

const TESTNET_IDS = new Set([11155111, 31337, 1337]); // Sepolia + Hardhat flavors

export function useNetworkOptions() {
  const allOptions: NetOpt[] = useMemo(
    () =>
      (networks as any[]).map((n) => ({
        id: Number(n.chainId),
        name: String(n.name ?? ''),
        symbol: String(n.symbol ?? ''),
        logo: n.logoURL ?? getBlockChainLogoURL(Number(n.chainId)),
      })),
    []
  );

  const mainnetOptions = useMemo(
    () => allOptions.filter((o) => !TESTNET_IDS.has(o.id)),
    [allOptions]
  );

  const testnetOptions = useMemo(
    () => allOptions.filter((o) => TESTNET_IDS.has(o.id)),
    [allOptions]
  );

  const findById = (id?: number) =>
    typeof id === 'number' ? allOptions.find((o) => o.id === id) : undefined;

  return { allOptions, mainnetOptions, testnetOptions, findById };
}
