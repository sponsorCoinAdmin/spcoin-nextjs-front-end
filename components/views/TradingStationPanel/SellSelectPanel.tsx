// File: @/components/views/TradingStationPanel/AssetSelectPanels/SellSelectPanel.tsx
'use client';

import React from 'react';
import BaseSelectPanel from './AssetSelectPanels/BaseSelectPanel';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_ROOT , SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure';

export default function SellSelectPanel() {
  const { isVisible } = usePanelTree();
  const sellVisible = isVisible(SP_TREE.SELL_SELECT_PANEL);
  if (!sellVisible) return null;
  return <BaseSelectPanel containerType={SP_ROOT.SELL_SELECT_PANEL} />;
}
