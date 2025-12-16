// File: @/components/containers/AssetSelectPanels/PanelListSelectWrapper.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { SP_COIN_DISPLAY, LIST_TYPE } from '@/lib/structure';
import type { WalletAccount, TokenContract, FEED_TYPE } from '@/lib/structure';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AssetListSelectPanel from './AssetListSelectPanel';

import type {
  AssetSelectBag as UnionBag,
  TokenSelectBag,
  RecipientSelectBag,
  // AgentSelectBag, // ❌ removed (AGENT_LIST_SELECT_PANEL deprecated)
  ErrorMessageBag,
  SimplePanelBag,
} from '@/lib/context/structure/types/panelBag';

type Props = {
  panel: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  /** TEMP: mandatory so we can find all call sites that must choose a list behavior */
  listType: LIST_TYPE;
  instancePrefix: string;
  peerAddress?: `0x${string}`;
  onCommit: (asset: WalletAccount | TokenContract) => void;

  /**
   * If true, this wrapper will NOT auto-run toTrading() after commit/close.
   * Use this for flows where the parent panel must remain visible
   * (e.g. UNSTAKING/CLAIM sponsor lists opening MANAGE_SPONSOR_PANEL).
   */
  suppressToTrading?: boolean;
};

function makeInitialPanelBag(
  panel: SP_COIN_DISPLAY,
  peerAddress?: `0x${string}`,
): UnionBag | undefined {
  switch (panel) {
    case SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL:
    case SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL: {
      const bag: TokenSelectBag = { type: panel, peerAddress };
      return bag;
    }
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL: {
      const bag: RecipientSelectBag = { type: panel };
      return bag;
    }
    // ❌ Removed: AGENT_LIST_SELECT_PANEL (per app changes to drop this panel)
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL: {
      const bag: ErrorMessageBag = { type: panel, message: '' };
      return bag;
    }
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL:
    case SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL:
    case SP_COIN_DISPLAY.UNDEFINED: {
      const bag: SimplePanelBag = { type: panel };
      return bag;
    }
    default:
      return undefined;
  }
}

export default function PanelListSelectWrapper({
  panel,
  feedType,
  listType,
  instancePrefix,
  peerAddress,
  onCommit,
  suppressToTrading,
}: Props) {
  const visible = usePanelVisible(panel);
  if (!visible) return null;

  return (
    <PanelListSelectWrapperInner
      panel={panel}
      feedType={feedType}
      listType={listType}
      instancePrefix={instancePrefix}
      peerAddress={peerAddress}
      onCommit={onCommit}
      suppressToTrading={suppressToTrading}
    />
  );
}

function PanelListSelectWrapperInner({
  panel,
  feedType,
  listType,
  instancePrefix,
  peerAddress,
  onCommit,
  suppressToTrading,
}: Props) {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { toTrading } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const instanceId = useMemo(
    () => `${instancePrefix.toUpperCase()}_${SP_COIN_DISPLAY[panel]}_${chainId}`,
    [instancePrefix, panel, chainId],
  );

  const initialPanelBag = useMemo(
    () => makeInitialPanelBag(panel, peerAddress),
    [panel, peerAddress],
  );

  const closeForProvider = useCallback(
    (_fromUser?: boolean) => {
      // Default behavior: close list overlay back to trading.
      // For sponsor detail flows we keep the parent open.
      if (!suppressToTrading) toTrading();
    },
    [toTrading, suppressToTrading],
  );

  // ✅ Route selection directly to ExchangeContext.tradeData.{buy|sell}TokenContract
  const handleCommit = useCallback(
    (asset: WalletAccount | TokenContract) => {
      if (
        panel === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL ||
        panel === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL
      ) {
        setExchangeContext?.((prev) => {
          const prevTD = prev?.tradeData ?? ({} as any);
          const nextTD =
            panel === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL
              ? { ...prevTD, buyTokenContract: asset }
              : { ...prevTD, sellTokenContract: asset };
          return { ...prev, tradeData: nextTD } as typeof prev;
        });
      }

      onCommit?.(asset);

      // Default behavior: return to trading.
      // Sponsor flows: DO NOT auto-close the parent manage panel.
      if (!suppressToTrading) toTrading();
    },
    [panel, setExchangeContext, onCommit, toTrading, suppressToTrading],
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={handleCommit}
        containerType={panel}
        initialPanelBag={initialPanelBag}
        feedTypeOverride={feedType} // ⬅️ thread feedType into provider
      >
        {/* listType drives display/actions; keep it explicit so we can evolve UI per feed */}
        <AssetListSelectPanel listType={listType} />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
