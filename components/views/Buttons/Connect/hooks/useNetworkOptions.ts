'use client';

import { useMemo } from 'react';
import {
  getConfiguredNetworkOptions,
  splitNetworkOptionsByTestnet,
} from '@/lib/utils/network';

export type NetOpt = { id: number; name: string; symbol: string; logo?: string };

export function useNetworkOptions() {
  const allOptions: NetOpt[] = useMemo(
    () => getConfiguredNetworkOptions(),
    []
  );

  const { mainnetOptions, testnetOptions } = useMemo(
    () => splitNetworkOptionsByTestnet(allOptions),
    [allOptions],
  );

  const findById = (id?: number) =>
    typeof id === 'number' ? allOptions.find((o) => o.id === id) : undefined;

  return { allOptions, mainnetOptions, testnetOptions, findById };
}
