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

  // === Reset connectedAccount if wallet disconnects ===
useEffect(() => {
  if (!publicClient || status === 'disconnected') {
    debugLog.warn('🔌 Wallet disconnected → clearing connectedAccount');
    setExchangeContext(prev => {
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
    setExchangeContext(prev => {
      const next = structuredClone(prev);
      if (!next.accounts.connectedAccount) next.accounts.connectedAccount = {} as WalletAccount;
      next.accounts.connectedAccount.address = address;
      next.accounts.connectedAccount.type = 'Active Wallet Account';
      return next;
    });
  }, [publicClient, address]);

  // === Update connectedAccount.balance ===
  useEffect(() => {
    if (!publicClient || !address || balanceData?.value === undefined) return;

    debugLog.log(`💰 Setting connectedAccount.balance → ${balanceData.value.toString()}`);
    setExchangeContext(prev => {
      const next = structuredClone(prev);
      if (!next.accounts.connectedAccount) return prev;
      next.accounts.connectedAccount.balance = balanceData.value;
      return next;
    });
  }, [publicClient, address, balanceData?.value]);

  // === Update connectedAccount.status ===
  useEffect(() => {
    if (!publicClient || !status || !address) return;

    debugLog.log(`📶 Setting connectedAccount.status → ${status}`);
    setExchangeContext(prev => {
      const next = structuredClone(prev);
      if (!next.accounts.connectedAccount) return prev;
      next.accounts.connectedAccount.status = status.toString();
      return next;
    });
  }, [publicClient, status, address]);

  // === Update connectedAccount.logoURL, website, description ===
  useEffect(() => {
    if (!publicClient || !address || !chainId) return;

    const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
    const website = `https://etherscan.io/address/${address}`;
    const description = `Chain ${chainId} Blockchain Signer account for ${address}`;

    debugLog.log(`🖼️ Setting connectedAccount.logoURL → ${logoURL}`);
    debugLog.log(`🌐 Setting connectedAccount.website → ${website}`);
    debugLog.log(`📝 Setting connectedAccount.description → ${description}`);

    setExchangeContext(prev => {
      const next = structuredClone(prev);
      if (!next.accounts.connectedAccount) return prev;
      next.accounts.connectedAccount.logoURL = logoURL;
      next.accounts.connectedAccount.website = website;
      next.accounts.connectedAccount.description = description;
      return next;
    });
  }, [publicClient, address, chainId]);

  // === Set name and symbol (static for now) ===
  useEffect(() => {
    if (!publicClient || !address) return;

    const name = 'Active Wallet';
    const symbol = chainId === 137 ? 'MATIC' : 'ETH';

    debugLog.log(`🏷️ Setting connectedAccount.name → ${name}`);
    debugLog.log(`💱 Setting connectedAccount.symbol → ${symbol}`);

    setExchangeContext(prev => {
      const next = structuredClone(prev);
      if (!next.accounts.connectedAccount) return prev;
      next.accounts.connectedAccount.name = name;
      next.accounts.connectedAccount.symbol = symbol;
      return next;
    });
  }, [publicClient, address, chainId]);

  return {
    connectedAccount: exchangeContext.accounts.connectedAccount,
  };
};
