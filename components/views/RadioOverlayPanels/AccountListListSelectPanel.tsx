// File: @/components/views/RadioOverlayPanels/AccountListSelectPanel.tsx
'use client';

import React, { useCallback, useEffect, useContext, useMemo } from 'react';

import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  LIST_TYPE,
  type WalletAccount,
  type TokenContract,
} from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';


// ✅ Provide the context AddressSelect expects (without going through the old wrapper)
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AccountListPanel from '@/components/views/AccountListPanel';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_UNSTAKING_SPCOINS === 'true';

const debugLog = createDebugLogger('AccountListSelectPanel', DEBUG_ENABLED, LOG_TIME);

function computeListType(activePanel: SP_COIN_DISPLAY): LIST_TYPE {
  return activePanel === SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    ? LIST_TYPE.SPONSOR_UNSPONSOR
    : LIST_TYPE.SPONSOR_CLAIM_REWARDS;
}

function computeInstanceId(activePanel: SP_COIN_DISPLAY): string {
  // Keep it stable and descriptive; if you later want chainId in here, add it.
  return `ACCOUNT_LIST_${SP_COIN_DISPLAY[activePanel]}`;
}

/**
 * Merged list overlay for:
 * - Claim Sponsor Rewards (SPONSOR_LIST_SELECT_PANEL)
 * - Unstaking SpCoins      (UNSTAKING_SPCOINS_PANEL)
 *
 * ✅ Simplified:
 * - Direct feed → AccountListPanel
 * - Still wraps minimal AssetSelect providers because AccountListPanel renders AddressSelect,
 *   and AddressSelect requires AssetSelectContext.
 */
export default function AccountListSelectPanel() {
  const vUnstaking = usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL);
  const vClaim = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL);
  const vSponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);

  const activePanel: SP_COIN_DISPLAY | null = vUnstaking
    ? SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    : vClaim
      ? SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL
      : null;

  useEffect(() => {
    debugLog.log?.('[visibility]', {
      vUnstaking,
      vClaim,
      vSponsorDetail,
      activePanel: activePanel != null ? SP_COIN_DISPLAY[activePanel] : null,
    });
  }, [vUnstaking, vClaim, vSponsorDetail, activePanel]);

  if (!activePanel) return null;

  // ✅ If detail is open, do NOT render the list UI (prevents stacked screens)
  if (vSponsorDetail) return null;

  return <AccountListSelectPanelInner activePanel={activePanel} />;
}

function AccountListSelectPanelInner({ activePanel }: { activePanel: SP_COIN_DISPLAY }) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  const listType = useMemo(() => computeListType(activePanel), [activePanel]);
  const instanceId = useMemo(() => computeInstanceId(activePanel), [activePanel]);

  // ✅ Directly load sponsor accounts (same source as before)
  const { feedData, loading, error } = useFeedData(FEED_TYPE.SPONSOR_ACCOUNTS);

  const wallets: WalletAccount[] = useMemo(() => {
    const anyData: any = feedData;
    return Array.isArray(anyData?.wallets) ? (anyData.wallets as WalletAccount[]) : [];
  }, [feedData]);

  useEffect(() => {
    debugLog.log?.('[data]', {
      activePanel: SP_COIN_DISPLAY[activePanel],
      listType: LIST_TYPE[listType],
      loading,
      error: error ?? null,
      walletsLen: wallets.length,
      sourceId: (feedData as any)?.__sourceId ?? '(missing __sourceId)',
      sourceKind: (feedData as any)?.__sourceKind ?? '(missing __sourceKind)',
    });
  }, [activePanel, listType, loading, error, wallets.length, feedData]);

  const setWalletCallBack = useCallback(
    (wallet?: WalletAccount) => {
      if (!wallet?.address) {
        debugLog.log?.('[setWalletCallBack] ignored (no wallet/address)', { wallet });
        return;
      }

      debugLog.log?.('[setWalletCallBack]', {
        activePanel: SP_COIN_DISPLAY[activePanel],
        listType: LIST_TYPE[listType],
        addressPreview: String(wallet.address).slice(0, 12),
        name: (wallet as any)?.name,
      });

      // 1) Store selected wallet in ExchangeContext
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccount: wallet,
            },
          };
        },
        `AccountListSelectPanel:setWalletCallBack(${SP_COIN_DISPLAY[activePanel]}:sponsorAccount)`,
      );

      // 2) Open sponsor detail panel
      // Use a microtask/0-timeout defer so the detail panel sees the updated ExchangeContext reliably.
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          openPanel(
            SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
            `AccountListSelectPanel:setWalletCallBack(open SPONSOR_ACCOUNT_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
            activePanel,
          );
        }, 0);
      } else {
        openPanel(
          SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
          `AccountListSelectPanel:setWalletCallBack(open SPONSOR_ACCOUNT_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
          activePanel,
        );
      }
    },
    [activePanel, ctx, listType, openPanel],
  );

  // Minimal render states
  if (loading) {
    return (
      <div id="AccountListSelectPanel" className="p-3 text-sm opacity-70">
        Loading sponsor accounts…
      </div>
    );
  }

  if (error) {
    return (
      <div id="AccountListSelectPanel" className="p-3 text-sm opacity-70">
        Failed to load sponsor accounts: {error}
      </div>
    );
  }

  /**
   * ✅ Key point:
   * Wrap AccountListPanel so AddressSelect has AssetSelectContext.
   *
   * We keep callbacks as no-ops because we are not using the FSM commit path here —
   * AccountListPanel selection is handled by setWalletCallBack (which opens SPONSOR_ACCOUNT_PANEL).
   *
   * Also: pass a stable instanceId to AssetSelectDisplayProvider to prevent cross-panel bleed.
   */
  return (
    <div id="AccountListSelectPanel">
      <AssetSelectDisplayProvider instanceId={instanceId}>
        <AssetSelectProvider
          containerType={activePanel}
          feedTypeOverride={FEED_TYPE.SPONSOR_ACCOUNTS}
          closePanelCallback={() => {
            /* no-op: visibility is controlled by overlay system */
          }}
          setSelectedAssetCallback={(_asset: TokenContract | WalletAccount) => {
            /* no-op: selection is handled by setWalletCallBack */
          }}
        >
          <AccountListPanel
            walletList={wallets}
            setWalletCallBack={setWalletCallBack}
            containerType={activePanel}
            listType={listType}
          />
        </AssetSelectProvider>
      </AssetSelectDisplayProvider>
    </div>
  );
}
