// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx

'use client';

import React, { useEffect, useState } from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState } from '@/lib/structure';
import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import BasePreviewWrapper from './BasePreviewWrapper';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

export default function RenderAssetPreview() {
  const { inputState, validatedAsset, handleHexInputChange } = useSharedPanelContext();
  const { showRenderPanel } = useTerminalFSMState();
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const shouldShow = showRenderPanel && !!validatedAsset;
    debugLog.log(
      `🧭 debugShowPanel → set to ${shouldShow} (inputState=${InputState[inputState]}, validatedAsset=${!!validatedAsset})`
    );
    setShowPanel(shouldShow);
  }, [showRenderPanel, validatedAsset, inputState]);

  if (!showPanel || !validatedAsset) return null;

  const name = 'name' in validatedAsset ? validatedAsset.name ?? '' : '';
  const symbol = 'symbol' in validatedAsset ? validatedAsset.symbol ?? '' : '';
  let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';

  if ('logoURL' in validatedAsset && 'address' in validatedAsset) {
    logoURL = validatedAsset.logoURL || logoURL;
  }

  const handleClick = () => {
    debugLog.log(`🖱️ Clicked preview card — calling handleHexInputChange(validatedAsset.address, true)`, validatedAsset);
    try {
      handleHexInputChange(validatedAsset.address, true);
    } catch (err) {
      debugLog.error('❌ handleHexInputChange in RenderAssetPreview failed:', err);
    }
  };

  return (
    <div id="RenderAssetPreview">
      <BasePreviewWrapper show={showPanel}>
        <div
          id="pendingDiv"
          onClick={handleClick}
          className="cursor-pointer w-full flex items-center"
        >
          <BasePreviewCard
            name={name}
            symbol={symbol}
            logoSrc={logoURL}
            onSelect={handleClick}
          />
        </div>
      </BasePreviewWrapper>
    </div>
  );
}
