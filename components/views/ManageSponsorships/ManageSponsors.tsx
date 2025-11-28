// File: @/components/views/ManageSponsorships/ManageSponsors.tsx
'use client';

import React, { useEffect } from 'react';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
  type TokenContract,
} from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from '../../containers/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';
const debugLog = createDebugLogger('ManageSponsors', DEBUG_ENABLED, LOG_TIME);

/**
 * Wrapper for the sponsors panel:
 * - Visibility is driven by MANAGE_SPONSORS_PANEL
 * - Inner content is a PanelListSelectWrapper
 */
export default function ManageSponsors() {
  // This is the panel that ManageSponsorshipsPanel.openOnly() toggles
  const visible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);

  useEffect(() => {
    debugLog.log?.('[visibility] MANAGE_SPONSORS_PANEL', { visible });
    if (visible) {
      // eslint-disable-next-line no-alert
      debugLog.log('OPENING ManageSponsors');
    }
  }, [visible]);

  debugLog.log?.('[render]', { visible });

  // Always return the inner component; its content is still constrained
  // by the surrounding ManageSponsorshipsPanel layout.
  return <ManageSponsorsInner />;
}

/** Shim: define feed + commit behavior. */
function ManageSponsorsInner() {
  const { commitRecipient } = useSelectionCommit();

  const handleCommit = (asset: WalletAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';

    debugLog.log?.('[handleCommit]', {
      isToken,
      assetPreview: {
        address: (asset as any)?.address,
        name: (asset as any)?.name,
      },
    });

    if (isToken) return;
    commitRecipient(asset as WalletAccount);
  };

  debugLog.log?.('[inner] mounting PanelListSelectWrapper', {
    panel: 'MANAGE_SPONSORS_PANEL',
    feedType: 'RECIPIENT_ACCOUNTS',
    instancePrefix: 'recipient',
  });

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL}
      feedType={FEED_TYPE.MANAGE_SPONSORS}
      instancePrefix="recipient"
      onCommit={handleCommit}
    />
  );
}
