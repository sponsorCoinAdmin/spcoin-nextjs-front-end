// File: components/views/ConfigSponsorshipPanel_NEW.tsx
'use client';

import React, { useCallback } from 'react';

import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

const ConfigSponsorshipPanel_NEW: React.FC = () => {
  const { closePanel } = usePanelTree();

  // Visibility comes from panel state (either ADD_SPONSORSHIP_PANEL or CONFIG_SLIPPAGE_PANEL)
  const isAddVisible = usePanelVisible(SP_TREE.ADD_SPONSORSHIP_PANEL);
  const isSlippageVisible = usePanelVisible(SP_TREE.CONFIG_SPONSORSHIP_PANEL);
  const isVisible = isAddVisible || isSlippageVisible;

  const handleClose = useCallback(() => {
    // Close whichever logical panel(s) are currently using this view
    if (isAddVisible) {
      closePanel(
        SP_TREE.ADD_SPONSORSHIP_PANEL,
        'ConfigSponsorshipPanel_NEW:close(ADD_SPONSORSHIP_PANEL)',
      );
    }

    if (isSlippageVisible) {
      closePanel(
        SP_TREE.CONFIG_SPONSORSHIP_PANEL,
        'ConfigSponsorshipPanel_NEW:close(CONFIG_SLIPPAGE_PANEL)',
      );
    }
  }, [closePanel, isAddVisible, isSlippageVisible]);

  if (!isVisible) return null;

  return (
    <div
      id='ConfigSponsorshipPanel_NEW'
      className='
        pt-[8px]
        relative
        mb-[5px]
        rounded-t-[12px]
        rounded-b-[12px]
        overflow-hidden
        bg-[#1f2639] text-[#94a3b8]'
    >
      <div className='h-[90px]'>
        <div
          id='closeConfigSponsorshipPanel_NEW'
          className='pt-[12px] absolute -top-2 right-[15px] text-[#94a3b8] text-[20px] cursor-pointer'
          onClick={handleClose}
        >
          X
        </div>
      </div>
    </div>
  );
};

export default ConfigSponsorshipPanel_NEW;
