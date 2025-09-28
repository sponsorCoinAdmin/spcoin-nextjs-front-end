// File: components/containers/AssetSelectPanels/BuyAssetPanel.tsx
'use client';

import React from 'react';
import TradeAssetPanel from './TradeAssetPanel';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_ROOT } from '@/lib/structure';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';

export default function BuyAssetPanel() {
  const { isVisible } = usePanelTree();

  // Gate by the subtree node: BUY_SELECT_PANEL
  const buyVisible = isVisible(SP_TREE.BUY_SELECT_PANEL);
  if (DEBUG) console.log('[BuyAssetPanel] visible:', buyVisible);

  if (!buyVisible) return null;

  // Provide the root container type that the rest of the app expects
  return <TradeAssetPanel containerType={SP_ROOT.BUY_SELECT_PANEL} />;
}
