'use client';

import { useMemo } from 'react';
import { normalizeAddress } from '@/lib/utils/address';
import { useSpCoinWallet } from './spCoinWallet';

export function useWalletAccountsList() {
  const { session, hardhatAccounts, selectionRequest } = useSpCoinWallet();

  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );

  const normalizedWorkingAddress = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
  );

  const visibleAccounts = useMemo(() => {
    // Always prefer network-specific accounts (loaded per current chain)
    if (hardhatAccounts.length > 0) return hardhatAccounts;
    // Fall back to MetaMask signer when no network accounts are available
    if (session.metamaskAuthorized && session.signerAddress) {
      return [{ address: session.signerAddress, label: 'MetaMask Active Account', source: 'metamask' as const }];
    }
    return [];
  }, [hardhatAccounts, session.metamaskAuthorized, session.signerAddress]);

  return { selectedAddressKey, normalizedWorkingAddress, visibleAccounts };
}
