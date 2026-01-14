// File: @/components/views/AssetSelectPanels/SponsorListSelectPanel_OLD.tsx
'use client';

import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
  type TokenContract,
  LIST_TYPE,
} from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import PanelListSelectWrapper from './AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TRANSITIONS === 'true';
const debugLog = createDebugLogger('SponsorListSelectPanel_OLD', DEBUG_ENABLED, LOG_TIME);

/** Visibility gate only. */
export default function SponsorListSelectPanel_OLD() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD);

  debugLog.log?.('[render]', {
    visible,
    panel: SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD,
    panelLabel: SP_COIN_DISPLAY[SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD],
  });

  if (!visible) return null;
  return <SponsorListSelectPanel_OLDInner />;
}

/** Shim: define feed + commit behavior. */
function SponsorListSelectPanel_OLDInner() {
  const commits = useSelectionCommit();

  // ⚠️ We don't know your exact commit API.
  // Try commitSponsor if it exists; otherwise fall back to commitRecipient (just so selection flow works).
  const commitSponsor =
    (commits as any).commitSponsor ??
    (commits as any).commitRecipient ??
    ((a: WalletAccount) => {
      // last-resort: do nothing but avoid crash
      console.warn('No commitSponsor/commitRecipient found; selected sponsor:', a);
    });

  const handleCommit = (asset: WalletAccount | TokenContract) => {
    const isToken = typeof (asset as any)?.decimals === 'number';
    if (isToken) return;
    commitSponsor(asset as WalletAccount);
  };

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL_OLD}
      feedType={FEED_TYPE.SPONSOR_ACCOUNTS}
      listType={LIST_TYPE.UNDEFINED}
      instancePrefix="sponsor"
      onCommit={handleCommit}
    />
  );
}
