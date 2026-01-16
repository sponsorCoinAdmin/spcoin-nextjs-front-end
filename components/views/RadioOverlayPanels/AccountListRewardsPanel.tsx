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

type ActiveListPanel =
  | SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
  | SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL
  | SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL
  | SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL;

function computeInstanceId(activePanel: SP_COIN_DISPLAY): string {
  return `ACCOUNT_LIST_${SP_COIN_DISPLAY[activePanel]}`;
}

function computeListType(activePanel: ActiveListPanel): LIST_TYPE {
  // keep your existing semantics
  return activePanel === SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    ? LIST_TYPE.SPONSOR_UNSPONSOR
    : LIST_TYPE.SPONSOR_CLAIM_REWARDS;
}

function computeFeedType(activePanel: ActiveListPanel): FEED_TYPE {
  switch (activePanel) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return FEED_TYPE.AGENT_ACCOUNTS;
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return FEED_TYPE.RECIPIENT_ACCOUNTS;
    default:
      return FEED_TYPE.SPONSOR_ACCOUNTS;
  }
}

function computeDetailPanel(activePanel: ActiveListPanel): SP_COIN_DISPLAY {
  switch (activePanel) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL;
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL;
    default:
      return SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL;
  }
}

export default function AccountListRewardsPanel() {
  // These MUST be checked here, because this component self-gates
  const vUnstaking = usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL);
  const vSponsor = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);

  // ✅ new panels
  const vAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL);
  const vRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);

  // detail suppression
  const vSponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);
  const vAgentDetail = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL);
  const vRecipientDetail = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL);

  const anyDetailVisible = vSponsorDetail || vAgentDetail || vRecipientDetail;

  const activePanel: ActiveListPanel | null = vUnstaking
    ? SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    : vSponsor
      ? SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL
      : vAgent
        ? SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL
        : vRecipient
          ? SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL
          : null;

  useEffect(() => {
    debugLog.log?.('[visibility]', {
      vUnstaking,
      vSponsor,
      vAgent,
      vRecipient,
      vSponsorDetail,
      vAgentDetail,
      vRecipientDetail,
      anyDetailVisible,
      activePanel: activePanel != null ? SP_COIN_DISPLAY[activePanel] : null,
    });
  }, [
    vUnstaking,
    vSponsor,
    vAgent,
    vRecipient,
    vSponsorDetail,
    vAgentDetail,
    vRecipientDetail,
    anyDetailVisible,
    activePanel,
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
        maxWidth: 420,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {[
        `AccountListRewardsPanel: mounted ✅`,
        `activePanel: ${activePanel != null ? SP_COIN_DISPLAY[activePanel] : 'null'}`,
        `visible: { sponsor:${String(vSponsor)} agent:${String(vAgent)} recipient:${String(vRecipient)} unstake:${String(vUnstaking)} }`,
        `detailVisible: ${String(anyDetailVisible)}`,
      ].join('\n')}
    </div>
  ) : null;

  if (!activePanel) return hud;

  if (anyDetailVisible) return hud;

  return (
    <>
      {hud}
      <AccountListSelectPanelInner activePanel={activePanel} />
    </>
  );
}

function AccountListSelectPanelInner({ activePanel }: { activePanel: ActiveListPanel }) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  const listType = useMemo(() => computeListType(activePanel), [activePanel]);
  const instanceId = useMemo(() => computeInstanceId(activePanel), [activePanel]);
  const detailPanel = useMemo(() => computeDetailPanel(activePanel), [activePanel]);
  const feedType = useMemo(() => computeFeedType(activePanel), [activePanel]);

  const { feedData, loading, error } = useFeedData(feedType);

  const wallets: WalletAccount[] = useMemo(() => {
    const anyData: any = feedData;
    return Array.isArray(anyData?.wallets) ? (anyData.wallets as WalletAccount[]) : [];
  }, [feedData]);

  useEffect(() => {
    debugLog.log?.('[data]', {
      activePanel: SP_COIN_DISPLAY[activePanel],
      feedType: FEED_TYPE[feedType],
      listType: LIST_TYPE[listType],
      loading,
      error: error ?? null,
      walletsLen: wallets.length,
    });
  }, [activePanel, feedType, listType, loading, error, wallets.length]);

  const setWalletCallBack = useCallback(
    (wallet?: WalletAccount) => {
      if (!wallet?.address) return;

      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          const nextAccounts = { ...prev.accounts };

          if (activePanel === SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL) {
            (nextAccounts as any).agentAccount = wallet;
          } else if (activePanel === SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL) {
            (nextAccounts as any).recipientAccount = wallet;
          } else {
            (nextAccounts as any).sponsorAccount = wallet;
          }

          return { ...prev, accounts: nextAccounts };
        },
        `AccountListRewardsPanel:setWalletCallBack(${SP_COIN_DISPLAY[activePanel]} -> ${SP_COIN_DISPLAY[detailPanel]})`,
      );

      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          openPanel(
            detailPanel,
            `AccountListRewardsPanel:setWalletCallBack(open ${SP_COIN_DISPLAY[detailPanel]} from ${SP_COIN_DISPLAY[activePanel]})`,
            activePanel,
          );
        }, 0);
      } else {
        openPanel(
          detailPanel,
          `AccountListRewardsPanel:setWalletCallBack(open ${SP_COIN_DISPLAY[detailPanel]} from ${SP_COIN_DISPLAY[activePanel]})`,
          activePanel,
        );
      }
    },
    [activePanel, ctx, detailPanel, openPanel],
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
          containerType={activePanel}
          feedTypeOverride={feedType}
          closePanelCallback={() => {}}
          setSelectedAssetCallback={(_asset: TokenContract | WalletAccount) => {}}
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
