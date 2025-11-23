// File: @/lib/context/hooks/nestedHooks/useAccounts.ts

'use client';

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

const useActiveAccount = (): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts;

  if (!accounts) {
    warnMissingAccounts();
  }

  const activeAccount = accounts?.activeAccount;

  const setActiveAccount = (next: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (!cloned.accounts) {
        warnMissingAccounts();
        return cloned;
      }

      const prevVal = cloned.accounts.activeAccount;
      debugHookChange('accounts.activeAccount', prevVal, next);
      cloned.accounts.activeAccount = next;
      return cloned;
    });
  };

  return [activeAccount, setActiveAccount];
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
/*                                AGGREGATE HOOK                              */
/* -------------------------------------------------------------------------- */

const useAccounts = () => {
  const [activeAccount, setActiveAccount] = useActiveAccount();

  const [sponsorAccount, setSponsorAccount] = useSponsorAccount();
  const [recipientAccount, setRecipientAccount] = useRecipientAccount();
  const [agentAccount, setAgentAccount] = useAgentAccount();

  const [sponsorAccounts, setSponsorAccounts] = useSponsorAccounts();
  const [recipientAccounts, setRecipientAccounts] = useRecipientAccounts();
  const [agentAccounts, setAgentAccounts] = useAgentAccounts();

  // 🔍 Top-level render log to prove the hook is actually running
  debugLog.log?.('🎯 useAccounts render', {
    ctxConnected: activeAccount?.address,
  });

  return {
    // single accounts
    activeAccount,
    setActiveAccount,
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
  useAccounts,
  useActiveAccount,
  useSponsorAccount,
  useRecipientAccount,
  useAgentAccount,
  useSponsorAccounts,
  useRecipientAccounts,
  useAgentAccounts,
};
