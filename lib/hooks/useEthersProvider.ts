import { FallbackProvider, JsonRpcProvider } from 'ethers'
import { useMemo } from 'react'
import type { Chain, Client, Transport } from 'viem'
import { type Config, useClient } from 'wagmi'

interface TransportValue {
  url?: string;
}

interface FallbackTransportEntry {
  value?: TransportValue;
}

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback') {
    const providers = (transport.transports as FallbackTransportEntry[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network),
    )
    return new FallbackProvider(providers)
  }
  return new JsonRpcProvider((transport as { url?: string }).url, network)
}

/** Action to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId })
  return useMemo(() => (client ? clientToProvider(client) : undefined), [client])
}
