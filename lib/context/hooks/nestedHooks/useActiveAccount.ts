// File: lib/context/hooks/nestedHooks/useActiveAccount.ts

'use client';

import { useEffect } from 'react';
import { useAccount, useBalance, useChainId, usePublicClient } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import { WalletAccount } from '@/lib/structure/types';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_WALLET_ACCOUNT === 'true';
const debugLog = createDebugLogger('useActiveAccount', DEBUG_ENABLED, LOG_TIME);

export const useActiveAccount = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { address, status } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const { data: balanceData } = useBalance({ address, chainId });

  // Small helper to mutate connectedAccount only if it exists & something changed
  const patchConnected = (mutate: (acc: WalletAccount) => boolean) => {
    setExchangeContext(prev => {
      const curr = prev.accounts.connectedAccount as WalletAccount | undefined;
      if (!curr) return prev;
      const next = structuredClone(prev);
      const changed = mutate(next.accounts.connectedAccount as WalletAccount);
      return changed ? next : prev;
    });
  };

  // Ensure connectedAccount exists & has address/type
  const ensureConnected = () => {
    setExchangeContext(prev => {
      const curr = prev.accounts.connectedAccount as WalletAccount | undefined;
      // If already set with same address/type, skip
      if (curr && curr.address === address && curr.type === 'Active Wallet Account') return prev;

      const next = structuredClone(prev);
      if (!next.accounts.connectedAccount) next.accounts.connectedAccount = {} as WalletAccount;
      const acc = next.accounts.connectedAccount as WalletAccount;
      acc.address = address as `0x${string}`;
      acc.type = 'Active Wallet Account';
      return next;
    });
  };

  // === Reset connectedAccount if wallet disconnects ===
  useEffect(() => {
    if (!publicClient || status === 'disconnected') {
      debugLog.warn('🔌 Wallet disconnected → clearing connectedAccount');
      setExchangeContext(prev => {
        if (prev.accounts.connectedAccount === undefined) return prev; // no-op
        const next = structuredClone(prev);
        next.accounts.connectedAccount = undefined;
        return next;
      });
    }
  }, [publicClient, status]);

  // === Reset connectedAccount if publicClient is missing ===
  useEffect(() => {
    if (!publicClient) {
      debugLog.warn('⛔ publicClient unavailable → setting connectedAccount to undefined');
      setExchangeContext(prev => {
        if (prev.accounts.connectedAccount === undefined) return prev; // no-op
        const next = structuredClone(prev);
        next.accounts.connectedAccount = undefined;
        return next;
      });
    }
  }, [publicClient]);

  // === Update connectedAccount.address and type ===
  useEffect(() => {
    if (!publicClient || !address) return;
    debugLog.log(`📬 Setting connectedAccount.address → ${address}`);
    ensureConnected();
  }, [publicClient, address]);

  // === Update connectedAccount.balance ===
  useEffect(() => {
    if (!publicClient || !address || balanceData?.value === undefined) return;
    const newBalance = balanceData.value;
    debugLog.log(`💰 Setting connectedAccount.balance → ${newBalance.toString()}`);
    patchConnected(acc => {
      if (acc.balance === newBalance) return false;
      acc.balance = newBalance;
      return true;
    });
  }, [publicClient, address, balanceData?.value]);

  // === Update connectedAccount.status ===
  useEffect(() => {
    if (!publicClient || !status || !address) return;
    const s = status.toString();
    debugLog.log(`📶 Setting connectedAccount.status → ${s}`);
    patchConnected(acc => {
      if (acc.status === s) return false;
      acc.status = s;
      return true;
    });
  }, [publicClient, status, address]);

  // === Update static/info fields (logoURL, website, description, name, symbol) ===
  useEffect(() => {
    if (!publicClient || !address || !chainId) return;

    const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
    const website = `https://etherscan.io/address/${address}`;
    const description = `Chain ${chainId} Blockchain Signer account for ${address}`;
    const name = 'Active Wallet';
    const symbol = chainId === 137 ? 'MATIC' : 'ETH';

    debugLog.log(`🖼️ logoURL → ${logoURL}`);
    debugLog.log(`🌐 website → ${website}`);
    debugLog.log(`📝 description → ${description}`);
    debugLog.log(`🏷️ name → ${name}`);
    debugLog.log(`💱 symbol → ${symbol}`);

    patchConnected(acc => {
      let changed = false;
      if (acc.logoURL !== logoURL) { acc.logoURL = logoURL; changed = true; }
      if (acc.website !== website) { acc.website = website; changed = true; }
      if (acc.description !== description) { acc.description = description; changed = true; }
      if (acc.name !== name) { acc.name = name; changed = true; }
      if (acc.symbol !== symbol) { acc.symbol = symbol; changed = true; }
      return changed;
    });
  }, [publicClient, address, chainId]);

  return {
    connectedAccount: exchangeContext.accounts.connectedAccount,
  };
};
