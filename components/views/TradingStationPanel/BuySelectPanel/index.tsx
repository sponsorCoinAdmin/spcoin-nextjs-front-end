// File: @/components/views/TradingStationPanel/BuySelectPanel/index.tsx
'use client';

import React from 'react';
import { BaseSelectPanel } from '@/components/views/AssetSelectPanels';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_ROOT , SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure';


export default function BuySelectPanel() {
  const { isVisible } = usePanelTree();
  const buyVisible = isVisible(SP_TREE.BUY_SELECT_PANEL);
  if (!buyVisible) return null;
  return (
    <div id="BUY_SELECT_PANEL">
      <BaseSelectPanel containerType={SP_ROOT.BUY_SELECT_PANEL} />
    </div>
  );
}
