'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useConnectedAccount as useUiConnectedAccount } from '@/lib/context/ConnectedAccountContext';
import { useAppAccount } from '@/lib/context/hooks/nestedHooks/useAccounts';
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
  const connectedAccount = useUiConnectedAccount();

  // 🔹 App-level account stored in ExchangeContext
  const [appAccount, setAppAccount] = useAppAccount();

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
  /*                    1) appAccount ⇄ connectedAccount                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const connectedAddr = connectedAccount?.address?.toLowerCase?.();
    const appAddr = appAccount?.address?.toLowerCase?.();

    debugLog.log?.('🧮 account mirror check', { connectedAddr, appAddr });

    // No connected wallet: intentionally leave appAccount as-is (offline memory)
    if (!connectedAddr) {
      debugLog.log?.(
        'ℹ️ No connectedAccount — leaving appAccount unchanged',
      );
      return;
    }

    // Seed appAccount when empty
    if (!appAddr) {
      debugLog.log?.('🔄 Seeding appAccount from connectedAccount', {
        connectedAddr,
      });
      setAppAccount(connectedAccount);
      return;
    }

    // Follow wallet when it switches accounts
    if (connectedAddr !== appAddr) {
      debugLog.log?.('🔄 Updating appAccount to follow connectedAccount', {
        from: appAddr,
        to: connectedAddr,
      });
      setAppAccount(connectedAccount);
      return;
    }

    // Already in sync
    debugLog.log?.('✅ appAccount already matches connectedAccount — no-op', {
      connectedAddr,
      appAddr,
    });
  }, [connectedAccount, appAccount, setAppAccount]);

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
