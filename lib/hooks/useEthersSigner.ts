import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useMemo } from 'react';
import type { Account, Chain, Client, Transport } from 'viem';
import { type Config, useConnectorClient } from 'wagmi';

/** Converts a Wagmi connector client to an ethers.js JsonRpcSigner */
export function clientToSigner(client: Client<Transport, Chain, Account>): JsonRpcSigner {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account.address);
}

/** ✅ Custom Hook: Converts a viem wallet client into an ethers.js Signer */
export function useEthersSigner({ chainId }: { chainId?: number } = {}): JsonRpcSigner | undefined {
  const { data: client } = useConnectorClient<Config>({ chainId });

  return useMemo(() => {
    if (!client) return undefined;
    return clientToSigner(client);
  }, [client]);
}
