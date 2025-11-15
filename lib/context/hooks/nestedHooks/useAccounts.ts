// File: lib/context/hooks/nestedHooks/useAccounts.ts

'use client';

import { useEffect } from 'react';

import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';
import type { WalletAccount } from '@/lib/structure';

const LOG_TIME = false;
const DEBUG_ENABLED =
  (process.env.NEXT_PUBLIC_DEBUG_LOG_USE_ACCOUNTS === 'true') || true;

const debugLog = createDebugLogger('useAccounts', DEBUG_ENABLED, LOG_TIME);

/* -------------------------------------------------------------------------- */
/*                                 BASE HELPERS                               */
/* -------------------------------------------------------------------------- */

const warnMissingAccounts = () => {
  debugLog.warn(
    '⚠️ exchangeContext.accounts is undefined — account getters will return undefined/[]',
  );
};

/* -------------------------------------------------------------------------- */
/*                             INDIVIDUAL ACCOUNT HOOKS                       */
/* -------------------------------------------------------------------------- */

const useConnectedAccount = (): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const connectedAccount = accounts?.connectedAccount;

  const setConnectedAccount = (next: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.connectedAccount;
      debugHookChange('accounts.connectedAccount', prevVal, next);
      cloned.accounts.connectedAccount = next;
      return cloned;
    });
  };

  return [connectedAccount, setConnectedAccount];
};

const useSponsorAccount = (): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const sponsorAccount = accounts?.sponsorAccount;

  const setSponsorAccount = (next: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.sponsorAccount;
      debugHookChange('accounts.sponsorAccount', prevVal, next);
      cloned.accounts.sponsorAccount = next;
      return cloned;
    });
  };

  return [sponsorAccount, setSponsorAccount];
};

const useRecipientAccount = (): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const recipientAccount = accounts?.recipientAccount;

  const setRecipientAccount = (next: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.recipientAccount;
      debugHookChange('accounts.recipientAccount', prevVal, next);
      cloned.accounts.recipientAccount = next;
      return cloned;
    });
  };

  return [recipientAccount, setRecipientAccount];
};

const useAgentAccount = (): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const agentAccount = accounts?.agentAccount;

  const setAgentAccount = (next: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.agentAccount;
      debugHookChange('accounts.agentAccount', prevVal, next);
      cloned.accounts.agentAccount = next;
      return cloned;
    });
  };

  return [agentAccount, setAgentAccount];
};

const useSponsorAccounts = (): [
  WalletAccount[],
  (next: WalletAccount[]) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const sponsorAccounts = accounts?.sponsorAccounts ?? [];

  const setSponsorAccounts = (next: WalletAccount[]) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.sponsorAccounts;
      debugHookChange('accounts.sponsorAccounts', prevVal, next);
      cloned.accounts.sponsorAccounts = next;
      return cloned;
    });
  };

  return [sponsorAccounts, setSponsorAccounts];
};

const useRecipientAccounts = (): [
  WalletAccount[],
  (next: WalletAccount[]) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const recipientAccounts = accounts?.recipientAccounts ?? [];

  const setRecipientAccounts = (next: WalletAccount[]) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.recipientAccounts;
      debugHookChange('accounts.recipientAccounts', prevVal, next);
      cloned.accounts.recipientAccounts = next;
      return cloned;
    });
  };

  return [recipientAccounts, setRecipientAccounts];
};

const useAgentAccounts = (): [
  WalletAccount[],
  (next: WalletAccount[]) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const agentAccounts = accounts?.agentAccounts ?? [];

  const setAgentAccounts = (next: WalletAccount[]) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.agentAccounts;
      debugHookChange('accounts.agentAccounts', prevVal, next);
      cloned.accounts.agentAccounts = next;
      return cloned;
    });
  };

  return [agentAccounts, setAgentAccounts];
};

/* -------------------------------------------------------------------------- */
/*                            ACTIVE ACCOUNT HOOK                              */
/* -------------------------------------------------------------------------- */

const useAppAccount = (): [
  WalletAccount | undefined,
  (acc?: WalletAccount) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const active = exchangeContext.accounts?.appAccount;

  const setAppAccount = (next?: WalletAccount) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.accounts = cloned.accounts ?? {};

      const prevVal = cloned.accounts.appAccount;
      debugHookChange('accounts.appAccount', prevVal, next);
      cloned.accounts.appAccount = next;

      return cloned;
    });
  };

  return [active, setAppAccount];
};

/* -------------------------------------------------------------------------- */
/*                                AGGREGATE HOOK                              */
/* -------------------------------------------------------------------------- */

const useAccounts = () => {
  const [connectedAccount, setConnectedAccount] = useConnectedAccount();
  const [appAccount, setAppAccount] = useAppAccount();

  const [sponsorAccount, setSponsorAccount] = useSponsorAccount();
  const [recipientAccount, setRecipientAccount] = useRecipientAccount();
  const [agentAccount, setAgentAccount] = useAgentAccount();

  const [sponsorAccounts, setSponsorAccounts] = useSponsorAccounts();
  const [recipientAccounts, setRecipientAccounts] = useRecipientAccounts();
  const [agentAccounts, setAgentAccounts] = useAgentAccounts();

  // 🔍 Top-level render log to prove the hook is actually running
  debugLog.log?.('🎯 useAccounts render', {
    ctxConnected: connectedAccount?.address,
    ctxActive: appAccount?.address,
  });

  // 🔄 Mirror logic:
  // - If connectedAccount becomes defined and appAccount is empty → seed from connected.
  // - If connectedAccount switches to a different address → overwrite appAccount.
  // - If connectedAccount becomes undefined → keep appAccount as-is.
  useEffect(() => {
    const connectedAddr = connectedAccount?.address?.toLowerCase?.();
    const activeAddr = appAccount?.address?.toLowerCase?.();

    alert("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")

    debugLog.log?.('🧮 mirrorEffect check', {
      connectedAddr,
      activeAddr,
    });

    // If there is no connected wallet, we deliberately DO NOT clear appAccount.
    if (!connectedAddr) {
      debugLog.log?.(
        'ℹ️ connectedAccount is undefined — leaving appAccount unchanged',
      );
      return;
    }

    // Seed when empty
    if (!activeAddr) {
      debugLog.log?.('🔄 Seeding appAccount from connectedAccount', {
        connectedAddr,
        activeAddr,
      });
      setAppAccount(connectedAccount);
      return;
    }

    // Update on wallet switch
    if (connectedAddr !== activeAddr) {
      debugLog.log?.('🔄 Updating appAccount to follow connectedAccount', {
        connectedAddr,
        previousActive: activeAddr,
      });
      setAppAccount(connectedAccount);
      return;
    }

    debugLog.log?.('✅ appAccount already matches connectedAccount — no-op', {
      connectedAddr,
      activeAddr,
    });
  }, [connectedAccount, appAccount, setAppAccount]);

  return {
    // app-level account
    appAccount,
    setAppAccount,

    // single accounts
    connectedAccount,
    setConnectedAccount,
    sponsorAccount,
    setSponsorAccount,
    recipientAccount,
    setRecipientAccount,
    agentAccount,
    setAgentAccount,

    // account lists
    sponsorAccounts,
    setSponsorAccounts,
    recipientAccounts,
    setRecipientAccounts,
    agentAccounts,
    setAgentAccounts,
  };
};

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export {
  useAppAccount,
  useAccounts,
  useConnectedAccount,
  useSponsorAccount,
  useRecipientAccount,
  useAgentAccount,
  useSponsorAccounts,
  useRecipientAccounts,
  useAgentAccounts,
};
