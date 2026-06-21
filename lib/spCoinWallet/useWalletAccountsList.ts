'use client';

import { useMemo } from 'react';
import { normalizeAddress } from '@/lib/utils/address';
import { useSpCoinWallet } from './spCoinWallet';

export function useWalletAccountsList() {
  const { session, walletSource, hardhatAccounts, selectionRequest } = useSpCoinWallet();

  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );

  const normalizedWorkingAddress = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
  );

  const visibleAccounts = useMemo(() => {
    if (walletSource === 'hardhat') return hardhatAccounts;
    if (session.metamaskAuthorized && session.signerAddress) {
      return [{ address: session.signerAddress, label: 'MetaMask Active Account', source: 'metamask' as const }];
    }
    return [];
  }, [hardhatAccounts, session.metamaskAuthorized, session.signerAddress, walletSource]);

  return { selectedAddressKey, normalizedWorkingAddress, visibleAccounts };
}
