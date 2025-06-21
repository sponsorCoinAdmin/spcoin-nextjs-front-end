'use client';

import { useMemo } from 'react';
import { Address, isAddress } from 'viem';
import { WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_WALLET_ACCOUNT === 'true';
const debugLog = createDebugLogger('useMappedWalletAccount', DEBUG_ENABLED, LOG_TIME);

export function useMappedWalletAccount(address?: string): WalletAccount | undefined {
  const isValid = !!address && isAddress(address);

  const account = useMemo(() => {
    if (!isValid) return undefined;

    const normalized = address!.toLowerCase();

    const result: WalletAccount = {
        address: normalized as Address,
        name: '', // could load from wallet.json later
        symbol: '', // optional tag (e.g., for UI display)
        balance: 0n, // no balance fetching yet
        type: 'WALLET', // or FEED_TYPE.RECIPIENT_ACCOUNTS if needed
        logoURL: `/assets/wallets/${normalized}/avatar.png`,
        website: '',
        description: '',
        status: ''
    };

    debugLog.log(`🧾 useMappedWalletAccount →`, result);
    return result;
  }, [address, isValid]);

  return account;
}
