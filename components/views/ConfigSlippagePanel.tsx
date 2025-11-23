// File: @/components/views/ConfigSlippagePanel.tsx
'use client';

import React, { useCallback } from 'react';

import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSlippage } from '@/lib/context/hooks';

// Slippage bounds in basis points (bps)
const MIN_BPS = 50;   // 0.50%
const MAX_BPS = 500;  // 5.00%
// 0.05% increments → 5 bps
const STEP_BPS = 5;   // 0.05% increments

const ConfigSlippagePanel: React.FC = () => {
  const { closePanel } = usePanelTree();
  const isVisible = usePanelVisible(SP_TREE.CONFIG_SLIPPAGE_PANEL);
  const { data: slippage, setBps } = useSlippage();

  const selected = slippage?.bps ?? 100; // default 1.00%

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (!Number.isFinite(next)) return;
      if (next !== selected) setBps(next);
    },
    [selected, setBps],
  );

  const handleClose = useCallback(() => {
    if (isVisible) {
      closePanel(
        SP_TREE.CONFIG_SLIPPAGE_PANEL,
        'ConfigSlippagePanel:close(CONFIG_SLIPPAGE_PANEL)',
      );
    }
  }, [closePanel, isVisible]);

  if (!isVisible) return null;

  // selected is in bps → convert to percent and format as #,##%
  const percentValue = selected / 100; // 100 bps -> 1.00
  const spRateLabel =
    `${percentValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;

  return (
    <div
      id='ConfigSlippagePanel'
      className='
        bg-[#1f2639] text-[#94a3b8]
        border-0 h-[45px]
        rounded-[12px]
        px-[11px]
        flex items-center
      '
    >
      {/* Slider on the left */}
      <input
        type='range'
        title='Adjust slippage tolerance'
        className='border-0 h-[1px] w-[224px] rounded-none outline-none bg-white cursor-pointer'
        min={MIN_BPS}
        max={MAX_BPS}
        step={STEP_BPS}
        value={selected}
        onChange={handleSliderChange}
      />

      {/* Slippage pill (formatted #,##%) */}
      <div className='ml-[32px] min-w-[50px] h-[24px] bg-[#243056] rounded-full flex items-center gap-[5px] font-bold text-[17px] pr-2'>
        Slippage:
        <div id='slippage'>{spRateLabel}</div>
      </div>

      {/* Spacer to push X to the far right */}
      <div className='flex-1' />

      {/* Close button */}
      <button
        type='button'
        aria-label='Close'
        onClick={handleClose}
        className='
          cursor-pointer w-5 text-xl leading-none
          bg-transparent
          border-0 outline-none ring-0 appearance-none
          focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0
          hover:bg-transparent active:bg-transparent
          text-[#94a3b8]
        '
      >
        X
      </button>
    </div>
  );
};

export default ConfigSlippagePanel;
