// File: components/containers/AssetSelectPanels/SellAssetPanel.tsx
'use client';

import React from 'react';
import TradeAssetPanel from './TradeAssetPanel';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_ROOT } from '@/lib/structure';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';

export default function SellAssetPanel() {
  // Always call hooks in a consistent order
  const { isVisible } = usePanelTree();

  const sellVisible = isVisible(SP_TREE.SELL_SELECT_PANEL);
  if (DEBUG) console.log('[SellAssetPanel] visible:', sellVisible);

  if (!sellVisible) return null;

  // Provide the root container type that the rest of the app expects
  return <TradeAssetPanel containerType={SP_ROOT.SELL_SELECT_PANEL_LIST} />;
}
