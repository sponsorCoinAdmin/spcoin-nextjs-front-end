// File: @/components/views/RadioOverlayPanels/AccountListRewardsPanel.tsx
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

import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';

import AccountListPanel from '@/components/views/AccountListPanel';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_UNSTAKING_SPCOINS === 'true';

const debugLog = createDebugLogger('AccountListRewardsPanel', DEBUG_ENABLED, LOG_TIME);

/**
 * ✅ New model:
 * - ACCOUNT_LIST_REWARDS_PANEL is the parent container panel
 * - AGENT_LIST_SELECT_PANEL / RECIPIENT_LIST_SELECT_PANEL are children (modes)
 * - UNSPONSOR_SP_COINS / CLAIM_PENDING_* are also children (modes)
 */
type ModePanel =
  | SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL
  | SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL
  | SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;

function computeInstanceId(containerPanel: SP_COIN_DISPLAY, modePanel: ModePanel): string {
  return `ACCOUNT_LIST_${SP_COIN_DISPLAY[containerPanel]}_${SP_COIN_DISPLAY[modePanel]}`;
}

function computeListType(containerPanel: SP_COIN_DISPLAY): LIST_TYPE {
  // keep your existing semantics
  return containerPanel === SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    ? LIST_TYPE.SPONSOR_UNSPONSOR
    : LIST_TYPE.SPONSOR_CLAIM_REWARDS;
}

function computeFeedType(modePanel: ModePanel): FEED_TYPE {
  switch (modePanel) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return FEED_TYPE.AGENT_ACCOUNTS;
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return FEED_TYPE.RECIPIENT_ACCOUNTS;
    default:
      return FEED_TYPE.SPONSOR_ACCOUNTS;
  }
}

function computeDetailPanel(modePanel: ModePanel): SP_COIN_DISPLAY {
  switch (modePanel) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL;
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL;
    default:
      return SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL;
  }
}

export default function AccountListRewardsPanel() {
  // ✅ Parent container visibility gates
  const vUnstaking = usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL);
  const vRewards = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);

  // ✅ Child mode visibility (these are no longer overlays / no longer stack members)
  const vAgentMode = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  const vRecipientMode = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);

  // detail suppression
  const vSponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);
  const vAgentDetail = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL);
  const vRecipientDetail = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL);

  const anyDetailVisible = vSponsorDetail || vAgentDetail || vRecipientDetail;

  // ✅ Container panel: unstaking takes precedence, otherwise rewards
  const containerPanel: SP_COIN_DISPLAY | null = vUnstaking
    ? SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    : vRewards
      ? SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL
      : null;

  // ✅ Mode panel: child modes override within rewards container
  // - If container is UNSTAKING, we treat mode as sponsor (same as before)
  const modePanel: ModePanel | null =
    containerPanel == null
      ? null
      : containerPanel === SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
        ? SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL
        : vAgentMode
          ? SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL
          : vRecipientMode
            ? SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL
            : SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;

  useEffect(() => {
    debugLog.log?.('[visibility]', {
      vUnstaking,
      vRewards,
      vAgentMode,
      vRecipientMode,
      vSponsorDetail,
      vAgentDetail,
      vRecipientDetail,
      anyDetailVisible,
      containerPanel: containerPanel != null ? SP_COIN_DISPLAY[containerPanel] : null,
      modePanel: modePanel != null ? SP_COIN_DISPLAY[modePanel] : null,
    });
  }, [
    vUnstaking,
    vRewards,
    vAgentMode,
    vRecipientMode,
    vSponsorDetail,
    vAgentDetail,
    vRecipientDetail,
    anyDetailVisible,
    containerPanel,
    modePanel,
  ]);

  // ✅ DEBUG HUD: proves the component is mounted and shows what it sees
  const hud = DEBUG_ENABLED ? (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        zIndex: 99999,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 11,
        background: 'rgba(0,0,0,0.75)',
        color: '#9BE28F',
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        maxWidth: 520,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {[
        `AccountListRewardsPanel: mounted ✅`,
        `containerPanel: ${
          containerPanel != null ? SP_COIN_DISPLAY[containerPanel] : 'null'
        }`,
        `modePanel: ${modePanel != null ? SP_COIN_DISPLAY[modePanel] : 'null'}`,
        `visible: { rewards:${String(vRewards)} unstake:${String(
          vUnstaking,
        )} agentMode:${String(vAgentMode)} recipientMode:${String(vRecipientMode)} }`,
        `detailVisible: ${String(anyDetailVisible)}`,
      ].join('\n')}
    </div>
  ) : null;

  // Only show when the container is visible
  if (!containerPanel || !modePanel) return hud;

  // Never show list while detail is up
  if (anyDetailVisible) return hud;

  return (
    <>
      {hud}
      <AccountListSelectPanelInner containerPanel={containerPanel} modePanel={modePanel} />
    </>
  );
}

function AccountListSelectPanelInner({
  containerPanel,
  modePanel,
}: {
  containerPanel: SP_COIN_DISPLAY;
  modePanel: ModePanel;
}) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  const listType = useMemo(() => computeListType(containerPanel), [containerPanel]);
  const instanceId = useMemo(
    () => computeInstanceId(containerPanel, modePanel),
    [containerPanel, modePanel],
  );
  const detailPanel = useMemo(() => computeDetailPanel(modePanel), [modePanel]);
  const feedType = useMemo(() => computeFeedType(modePanel), [modePanel]);

  const { feedData, loading, error } = useFeedData(feedType);

  const wallets: WalletAccount[] = useMemo(() => {
    const anyData: any = feedData;
    return Array.isArray(anyData?.wallets) ? (anyData.wallets as WalletAccount[]) : [];
  }, [feedData]);

  useEffect(() => {
    debugLog.log?.('[data]', {
      containerPanel: SP_COIN_DISPLAY[containerPanel],
      modePanel: SP_COIN_DISPLAY[modePanel],
      feedType: FEED_TYPE[feedType],
      listType: LIST_TYPE[listType],
      loading,
      error: error ?? null,
      walletsLen: wallets.length,
    });
  }, [containerPanel, modePanel, feedType, listType, loading, error, wallets.length]);

  const setWalletCallBack = useCallback(
    (wallet?: WalletAccount) => {
      if (!wallet?.address) return;

      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          const nextAccounts = { ...prev.accounts };

          if (modePanel === SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL) {
            (nextAccounts as any).agentAccount = wallet;
          } else if (modePanel === SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL) {
            (nextAccounts as any).recipientAccount = wallet;
          } else {
            (nextAccounts as any).sponsorAccount = wallet;
          }

          return { ...prev, accounts: nextAccounts };
        },
        `AccountListRewardsPanel:setWalletCallBack(${SP_COIN_DISPLAY[modePanel]} -> ${SP_COIN_DISPLAY[detailPanel]})`,
      );

      // ✅ Parent passed to openPanel:
      // - If we are in a child mode, parent should be the child mode panel.
      // - Otherwise parent is the container (ACCOUNT_LIST_REWARDS_PANEL or UNSTAKING_SPCOINS_PANEL).
      const parentForDetail =
        modePanel === SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL ||
        modePanel === SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL
          ? modePanel
          : containerPanel;

      const invoker = `AccountListRewardsPanel:setWalletCallBack(open ${SP_COIN_DISPLAY[detailPanel]} from ${SP_COIN_DISPLAY[parentForDetail]})`;

      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          openPanel(detailPanel, invoker, parentForDetail);
        }, 0);
      } else {
        openPanel(detailPanel, invoker, parentForDetail);
      }
    },
    [containerPanel, modePanel, ctx, detailPanel, openPanel],
  );

  if (loading) {
    return (
      <div id="AccountListRewardsPanel" className="p-3 text-sm opacity-70">
        Loading accounts…
      </div>
    );
  }

  if (error) {
    return (
      <div id="AccountListRewardsPanel" className="p-3 text-sm opacity-70">
        Failed to load accounts: {error}
      </div>
    );
  }

  return (
    <div id="AccountListRewardsPanel">
      <AssetSelectDisplayProvider instanceId={instanceId}>
        <AssetSelectProvider
          containerType={containerPanel}
          feedTypeOverride={feedType}
          closePanelCallback={() => {}}
          setSelectedAssetCallback={(_asset: TokenContract | WalletAccount) => {}}
        >
          <AccountListPanel
            walletList={wallets}
            setWalletCallBack={setWalletCallBack}
            // ✅ Keep containerType consistent with what you want the list to “be”
            // - This drives labels like "Agent Account:" / "Recipient Account:" in AccountListPanel.
            containerType={modePanel}
            listType={listType}
          />
        </AssetSelectProvider>
      </AssetSelectDisplayProvider>
    </div>
  );
}
