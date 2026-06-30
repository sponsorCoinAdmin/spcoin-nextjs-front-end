// File: components/views/TradingStationPanel/FeeDisclosure/index.tsx
'use client';

import React from 'react';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

const FeeDisclosure = () => {
  const show = usePanelVisible(SP.FEE_DISCLOSURE);
  if (!show) return null;

  return (
    <div id="FEE_DISCLOSURE" className="relative top-[2px] left-[4px] text-[#94a3b8] text-[16px]">
      Fee Disclosures
    </div>
  );
};

export default FeeDisclosure;
