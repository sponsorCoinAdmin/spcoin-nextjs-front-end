// File: @/components/views/ManageSponsorships/ManageSponsorRecipients.tsx
'use client';

import React, { useEffect, useContext, useCallback } from 'react';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
  type TokenContract,
  LIST_TYPE,
} from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import PanelListSelectWrapper from '@/components/containers/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_UNSTAKING_SPCOINS === 'true';

const debugLog = createDebugLogger(
  'ManageSponsorRecipients',
  DEBUG_ENABLED,
  LOG_TIME,
);

/**
 * Merged list panel for:
 * - ClaimSponsorRewardsList (CLAIM_SPONSOR_REWARDS_LIST_PANEL)
 * - UnstakingSpCoins (UNSTAKING_SPCOINS_PANEL)
 *
 * These two lists share the same underlying table (ManageWalletList via AssetListSelectPanel).
 * Differences are driven by `listType`:
 * - SPONSOR_CLAIM_REWARDS → header/button labels for Claim flow
 * - SPONSOR_UNSPONSOR    → header/button labels for Unstake flow
 *
 * IMPORTANT UX RULE:
 * When MANAGE_SPONSOR_PANEL (detail) is visible, we keep the parent radio panel
 * (UNSTAKING / CLAIM) logically open, but we suppress the list UI to avoid
 * duplicate headers and stacked screens.
 */
export default function ManageSponsorRecipients() {
  const vUnstaking = usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL);
  const vClaim = usePanelVisible(SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL);
  const vSponsorDetail = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL);

  // Choose a single active panel to pass to PanelListSelectWrapper (it gates by that panel)
  const activePanel: SP_COIN_DISPLAY | null = vUnstaking
    ? SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
    : vClaim
      ? SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL
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

  // ✅ If detail is open, do NOT render the list UI.
  // The parent radio panel stays visible in the tree, but visually yields to MANAGE_SPONSOR_PANEL.
  if (vSponsorDetail) return null;

  return <ManageSponsorRecipientsInner activePanel={activePanel} />;
}

function ManageSponsorRecipientsInner({
  activePanel,
}: {
  activePanel: SP_COIN_DISPLAY;
}) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  const listType =
    activePanel === SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
      ? LIST_TYPE.SPONSOR_UNSPONSOR
      : LIST_TYPE.SPONSOR_CLAIM_REWARDS;

  const instancePrefix =
    activePanel === SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL
      ? 'unstaking'
      : 'sponsor';

  const handleCommit = useCallback(
    (asset: WalletAccount | TokenContract) => {
      const isToken = typeof (asset as any)?.decimals === 'number';

      debugLog.log?.('[handleCommit]', {
        activePanel: SP_COIN_DISPLAY[activePanel],
        listType: LIST_TYPE[listType],
        isToken,
        assetPreview: {
          address: (asset as any)?.address,
          name: (asset as any)?.name,
        },
      });

      // These panels are for sponsor *wallets*, not tokens
      if (isToken) return;

      const wallet = asset as WalletAccount;

      // 1) Store selected wallet in ExchangeContext (match ClaimSponsorRewardsList behavior)
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
        `ManageSponsorRecipients:handleCommit(${SP_COIN_DISPLAY[activePanel]}:sponsorAccount)`,
      );

      // 2) Open detail panel like tree behavior:
      //    - keep UNSTAKING/CLAIM visible (radio invariant)
      //    - pass parent so usePanelTree can preserve/restore correctly
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          debugLog.log?.(
            '[handleCommit] deferred open of MANAGE_SPONSOR_PANEL (keep parent visible)',
            { from: SP_COIN_DISPLAY[activePanel] },
          );

          openPanel(
            SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
            `ManageSponsorRecipients:handleCommit(deferred open MANAGE_SPONSOR_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
            activePanel, // ✅ parent
          );
        }, 0);
      } else {
        openPanel(
          SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
          `ManageSponsorRecipients:handleCommit(open MANAGE_SPONSOR_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
          activePanel, // ✅ parent
        );
      }
    },
    [activePanel, ctx, openPanel, listType],
  );

  return (
    <PanelListSelectWrapper
      panel={activePanel}
      feedType={FEED_TYPE.SPONSOR_ACCOUNTS}
      listType={listType}
      instancePrefix={instancePrefix}
      onCommit={handleCommit}
      suppressToTrading
    />
  );
}
