// File: components/containers/AssetSelectPanels/PanelListSelectWrapper.tsx
'use client';

import { useMemo, useCallback } from 'react';
import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  type WalletAccount,
  type TokenContract,
} from '@/lib/structure';

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
  AgentSelectBag,
  ErrorMessageBag,
  SimplePanelBag,
} from '@/lib/context/structure/types/panelBag';

type Props = {
  panel: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instancePrefix: string;
  peerAddress?: `0x${string}`;
  onCommit: (asset: WalletAccount | TokenContract) => void;
};

function makeInitialPanelBag(
  panel: SP_COIN_DISPLAY,
  peerAddress?: `0x${string}`
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
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL: {
      const bag: AgentSelectBag = { type: panel };
      return bag;
    }
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL: {
      // ✅ ErrorMessageBag requires `message`
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
  instancePrefix,
  peerAddress,
  onCommit,
}: Props) {
  const visible = usePanelVisible(panel);
  if (!visible) return null;
  return (
    <PanelListSelectWrapperInner
      panel={panel}
      feedType={feedType}
      instancePrefix={instancePrefix}
      peerAddress={peerAddress}
      onCommit={onCommit}
    />
  );
}

function PanelListSelectWrapperInner({
  panel,
  feedType,
  instancePrefix,
  peerAddress,
  onCommit,
}: Props) {
  const { exchangeContext } = useExchangeContext();
  const { toTrading } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const instanceId = useMemo(
    () => `${instancePrefix.toUpperCase()}_${SP_COIN_DISPLAY[panel]}_${chainId}`,
    [instancePrefix, panel, chainId]
  );

  const initialPanelBag = useMemo(
    () => makeInitialPanelBag(panel, peerAddress),
    [panel, peerAddress]
  );

  const closeForProvider = useCallback((_fromUser?: boolean) => {
    toTrading();
  }, [toTrading]);

  const handleCommit = useCallback(
    (asset: WalletAccount | TokenContract) => {
      onCommit(asset);
      toTrading();
    },
    [onCommit, toTrading]
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={handleCommit}
        containerType={panel}
        initialPanelBag={initialPanelBag}
      >
        <AssetListSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
