// File: lib/context/hooks/nestedHooks/useActiveAccount.ts

'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_WALLET_ACCOUNT === 'true';
const debugLog = createDebugLogger('useActiveAccount', DEBUG_ENABLED, LOG_TIME);

export const useActiveAccount = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { address, status } = useAccount();

  const setActiveAccountName = (name?: string) => {
    const prev = exchangeContext.accounts.connectedAccount?.name;
    debugHookChange('connectedAccount.name', prev, name);
    debugLog.log(`🧾 setActiveAccountName → ${name}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.name = name || '';
      return cloned;
    });
  };

  const setActiveAccountSymbol = (symbol?: string) => {
    const prev = exchangeContext.accounts.connectedAccount?.symbol;
    debugHookChange('connectedAccount.symbol', prev, symbol);
    debugLog.log(`💱 setActiveAccountSymbol → ${symbol}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.symbol = symbol || '';
      return cloned;
    });
  };

  const setActiveAccountWebsite = (website?: string) => {
    const prev = exchangeContext.accounts.connectedAccount?.website;
    debugHookChange('connectedAccount.website', prev, website);
    debugLog.log(`🌐 setActiveAccountWebsite → ${website}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.website = website || '';
      return cloned;
    });
  };

  const setActiveAccountDescription = (description?: string) => {
    const prev = exchangeContext.accounts.connectedAccount?.description;
    debugHookChange('connectedAccount.description', prev, description);
    debugLog.log(`📝 setActiveAccountDescription → ${description}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.description = description || '';
      return cloned;
    });
  };

  const setActiveAccountStatus = (status?: string) => {
    const prev = exchangeContext.accounts.connectedAccount?.status;
    debugHookChange('connectedAccount.status', prev, status);
    debugLog.log(`🔖 setActiveAccountStatus → ${status}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.status = status || '';
      return cloned;
    });
  };

  const setActiveAccountLogoURL = (logoURL?: string) => {
    const prev = exchangeContext.accounts.connectedAccount?.logoURL;
    debugHookChange('connectedAccount.logoURL', prev, logoURL);
    debugLog.log(`🖼️ setActiveAccountLogoURL → ${logoURL}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.logoURL = logoURL;
      return cloned;
    });
  };

  const setActiveAccountBalance = (balance: bigint) => {
    const prev = exchangeContext.accounts.connectedAccount?.balance;
    debugHookChange('connectedAccount.balance', prev, balance);
    debugLog.log(`💰 setActiveAccountBalance → ${balance.toString()}`);
    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.balance = balance;
      return cloned;
    });
  };

  useEffect(() => {
    debugLog.log(`🔁 useActiveAccount initialized. address=${address}, status=${status}`);

    setExchangeContext(prevContext => {
      const cloned = structuredClone(prevContext);
      if (cloned.accounts.connectedAccount) cloned.accounts.connectedAccount.type = 'Active Wallet Account';
      return cloned;
    });
  }, [address, status]);

  return {
    connectedAccount: exchangeContext.accounts.connectedAccount,
    setActiveAccountName,
    setActiveAccountSymbol,
    setActiveAccountWebsite,
    setActiveAccountDescription,
    setActiveAccountStatus,
    setActiveAccountLogoURL,
    setActiveAccountBalance,
  };
};
