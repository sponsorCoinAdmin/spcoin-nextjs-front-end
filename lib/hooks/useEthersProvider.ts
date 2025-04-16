import { FallbackProvider, JsonRpcProvider } from 'ethers';
import { useMemo } from 'react';
import { type Chain, type Client, type Transport } from 'viem';
import { type Config, useClient } from 'wagmi';

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  if (transport.type === 'fallback') {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network)
    );
    return providers.length === 1 ? providers[0] : new FallbackProvider(providers);
  }

  return new JsonRpcProvider(transport.url, network);
}

/** ✅ Custom Hook: Converts a viem Client to an ethers.js Provider */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId });

  return useMemo(() => {
    if (!client) return undefined;
    return clientToProvider(client);
  }, [client]);
}
