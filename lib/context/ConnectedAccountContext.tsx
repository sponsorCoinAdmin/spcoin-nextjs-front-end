'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { WalletAccount } from '@/lib/structure';

const ConnectedAccountContext = createContext<WalletAccount | undefined>(undefined);

export const useConnectedAccount = (): WalletAccount | undefined => {
  return useContext(ConnectedAccountContext);
};

export const ConnectedAccountProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | undefined>(undefined);

  useEffect(() => {
    if (!isConnected || !address) {
      setConnectedAccount(undefined);
      return;
    }

    const fetchWalletAccount = async () => {
      const accountPath = `/assets/accounts/${address}/wallet.json`;

      try {
        const response = await fetch(accountPath);
        if (!response.ok) throw new Error('File not found');

        const metadata = await response.json();
        const wallet: WalletAccount = {
          ...metadata,
          address,
        };

        setConnectedAccount(wallet);
      } catch (error) {
        const fallback: WalletAccount = {
          address,
          type: 'ERC20_WALLET',
          description: `Account ${address} not registered on this site`,
          name: '',
          symbol: '',
          website: '',
          status: 'Missing',
          logoURL: '/assets/miscellaneous/SkullAndBones.png',
        };

        setConnectedAccount(fallback);
      }
    };

    fetchWalletAccount();
  }, [address, isConnected]);

  return (
    <ConnectedAccountContext.Provider value={connectedAccount}>
      {children}
    </ConnectedAccountContext.Provider>
  );
};
