// File: @/app/(menu)/_providers/AppBootstrap.tsx
'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useActiveAccount as useUiActiveAccount } from '@/lib/context/ActiveAccountContext';
import { useActiveAccount as useCtxActiveAccount } from '@/lib/context/hooks/nestedHooks/useAccounts';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_APP_BOOTSTRAP === 'true';

const debugLog = createDebugLogger('AppBootstrap', DEBUG_ENABLED, LOG_TIME);

type AppBootstrapProps = {
  children?: ReactNode;
};

export function AppBootstrap(_props: AppBootstrapProps) {
  // 🔹 UI-level wallet (loaded from account.json or fallback)
  const uiActiveAccount = useUiActiveAccount();
  const { address: wagmiAddress, isConnected } = useAccount();

  // 🔹 ExchangeContext-level connected account
  const [ctxActiveAccount, setCtxActiveAccount] = useCtxActiveAccount();

  /* ------------------------------------------------------------------------ */
  /*           1) Mirror UI activeAccount → ExchangeContext.accounts          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const uiAddr = uiActiveAccount?.address?.toLowerCase?.();
    const ctxAddr = ctxActiveAccount?.address?.toLowerCase?.();
    const walletAddr = isConnected ? wagmiAddress?.toLowerCase?.() : undefined;

    debugLog.log?.('🧮 account mirror check', { uiAddr, ctxAddr, walletAddr });

    // No UI connected wallet: intentionally leave ctxActiveAccount as-is
    if (!uiAddr) {
      debugLog.log?.(
        'ℹ️ No UI activeAccount — leaving context.activeAccount unchanged',
      );
      return;
    }

    // Guard: never mirror stale UI account into context.
    // If UI data lags behind wagmi account switch, skip this write.
    if (walletAddr && uiAddr !== walletAddr) {
      debugLog.log?.('⏭️ UI account is stale vs wagmi; skipping mirror write', {
        uiAddr,
        walletAddr,
        ctxAddr,
      });
      return;
    }

    // Seed context activeAccount when empty
    if (!ctxAddr) {
      debugLog.log?.(
        '🔄 Seeding context.activeAccount from UI activeAccount',
        { uiAddr },
      );
      setCtxActiveAccount(uiActiveAccount);
      return;
    }

    // Follow when UI wallet switches accounts
    if (uiAddr !== ctxAddr) {
      debugLog.log?.(
        '🔄 Updating context.activeAccount to follow UI activeAccount',
        { from: ctxAddr, to: uiAddr },
      );
      setCtxActiveAccount(uiActiveAccount);
      return;
    }

    // Already in sync
    debugLog.log?.(
      '✅ context.activeAccount already matches UI activeAccount — no-op',
      { uiAddr, ctxAddr },
    );
  }, [uiActiveAccount, ctxActiveAccount, setCtxActiveAccount, wagmiAddress, isConnected]);

  // No UI rendering; just side-effects
  return null;
}
