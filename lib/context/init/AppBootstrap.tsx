// File: app/(menu)/_providers/AppBootstrap.tsx (or similar – adjust path if needed)
'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useConnectedAccount as useUiConnectedAccount } from '@/lib/context/ConnectedAccountContext';
import { useConnectedAccount as useCtxConnectedAccount } from '@/lib/context/hooks/nestedHooks/useAccounts';
import { useExchangeContext } from '@/lib/context/hooks';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_APP_BOOTSTRAP === 'true';

const debugLog = createDebugLogger('AppBootstrap', DEBUG_ENABLED, LOG_TIME);

type AppBootstrapProps = {
  children?: ReactNode;
};

export function AppBootstrap(_props: AppBootstrapProps) {
  // 🔹 UI-level wallet (loaded from wallet.json or fallback)
  const uiConnectedAccount = useUiConnectedAccount();

  // 🔹 ExchangeContext-level connected account
  const [ctxConnectedAccount, setCtxConnectedAccount] = useCtxConnectedAccount();

  // 🔹 Access to ExchangeContext for appNetwork wiring
  const {
    exchangeContext,
    setExchangeContext,
    setSellTokenContract,
    setBuyTokenContract,
  } = useExchangeContext();

  const appChainId = exchangeContext?.network?.appChainId ?? 0;
  const logoURL = exchangeContext?.network?.logoURL ?? '';

  const prevAppChainIdRef = useRef<number | undefined>(undefined);

  /* ------------------------------------------------------------------------ */
  /*           1) Mirror UI connectedAccount → ExchangeContext.accounts       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const uiAddr = uiConnectedAccount?.address?.toLowerCase?.();
    const ctxAddr = ctxConnectedAccount?.address?.toLowerCase?.();

    debugLog.log?.('🧮 account mirror check', { uiAddr, ctxAddr });

    // No UI connected wallet: intentionally leave ctxConnectedAccount as-is
    if (!uiAddr) {
      debugLog.log?.(
        'ℹ️ No UI connectedAccount — leaving context.connectedAccount unchanged',
      );
      return;
    }

    // Seed context connectedAccount when empty
    if (!ctxAddr) {
      debugLog.log?.(
        '🔄 Seeding context.connectedAccount from UI connectedAccount',
        { uiAddr },
      );
      setCtxConnectedAccount(uiConnectedAccount);
      return;
    }

    // Follow when UI wallet switches accounts
    if (uiAddr !== ctxAddr) {
      debugLog.log?.(
        '🔄 Updating context.connectedAccount to follow UI connectedAccount',
        { from: ctxAddr, to: uiAddr },
      );
      setCtxConnectedAccount(uiConnectedAccount);
      return;
    }

    // Already in sync
    debugLog.log?.(
      '✅ context.connectedAccount already matches UI connectedAccount — no-op',
      { uiAddr, ctxAddr },
    );
  }, [uiConnectedAccount, ctxConnectedAccount, setCtxConnectedAccount]);

  /* ------------------------------------------------------------------------ */
  /*                    2) appChainId → appNetwork (display)                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!appChainId) return;

    // First observation of appChainId: just remember it, don't fire side effects
    if (prevAppChainIdRef.current === undefined) {
      prevAppChainIdRef.current = appChainId;
      debugLog.log?.('🔎 initial appChainId observed', { appChainId });
      return;
    }

    if (prevAppChainIdRef.current === appChainId) {
      return;
    }

    debugLog.log?.('🌐 appChainId changed, deriving appNetwork', {
      from: prevAppChainIdRef.current,
      to: appChainId,
    });

    setExchangeContext(
      (prev) => {
        const derived = deriveNetworkFromApp(appChainId, undefined as any);

        return {
          ...prev,
          network: {
            ...prev.network,
            appChainId,
            name: derived?.name ?? '',
            symbol: derived?.symbol ?? '',
            url: derived?.url ?? '',
            // canonical logo path for this chain
            logoURL: `/assets/blockchains/${appChainId}/info/network.png`,
          },
        };
      },
      'AppBootstrap:onAppChainChange-refreshDisplay',
    );

    // When the app network changes, clear selected tokens
    setSellTokenContract(undefined);
    setBuyTokenContract(undefined);

    prevAppChainIdRef.current = appChainId;
  }, [appChainId, setExchangeContext, setSellTokenContract, setBuyTokenContract]);

  /* ------------------------------------------------------------------------ */
  /*                    3) Safety net: normalize network logo                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!appChainId) return;

    const expected = `/assets/blockchains/${appChainId}/info/network.png`;
    if (logoURL === expected || !logoURL) return;

    debugLog.log?.('🔧 Normalizing network.logoURL', {
      appChainId,
      from: logoURL,
      to: expected,
    });

    setExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          logoURL: expected,
        },
      }),
      'AppBootstrap:normalizeLogoURL',
    );
  }, [appChainId, logoURL, setExchangeContext]);

  return null;
}
