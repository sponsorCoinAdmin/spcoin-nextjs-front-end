// File: components/containers/AssetSelectPanels/BuyAssetPanel.tsx
'use client';

import React from 'react';
import TradeAssetPanel from './TradeAssetPanel';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_ROOT , SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure';


export default function BuyAssetPanel() {
  const { isVisible } = usePanelTree();
  const buyVisible = isVisible(SP_TREE.BUY_SELECT_PANEL);
  if (!buyVisible) return null;
  return <TradeAssetPanel containerType={SP_ROOT.BUY_SELECT_PANEL} />;
}
