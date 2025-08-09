// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx
'use client';

import React, { useEffect, useState } from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import BasePreviewWrapper from './BasePreviewWrapper';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

export default function RenderAssetPreview() {
  const { inputState, validatedAsset, handleHexInputChange } = useSharedPanelContext();

  // Derive "render panel should show" locally (replaces useTerminalFSMState)
  // Matches previous behavior: show when we've reached/ passed RESOLVE_ASSET.
  const derivedShowRenderPanel = inputState >= InputState.RESOLVE_ASSET;

  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const shouldShow = derivedShowRenderPanel && !!validatedAsset;
    debugLog.log(
      `🧭 debugShowPanel → set to ${shouldShow} (inputState=${InputState[inputState]}, validatedAsset=${!!validatedAsset})`
    );
    setShowPanel(shouldShow);
  }, [derivedShowRenderPanel, validatedAsset, inputState]);

  if (!showPanel || !validatedAsset) return null;

  const name = (validatedAsset as any).name ?? '';
  const symbol = (validatedAsset as any).symbol ?? '';
  let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';
  if ((validatedAsset as any).logoURL) {
    logoURL = (validatedAsset as any).logoURL;
  }

  const handleClick = () => {
    debugLog.log(
      `🖱️ Clicked preview card — calling handleHexInputChange(validatedAsset.address)`,
      validatedAsset
    );
    try {
      // cast to any to be safe; TokenContract should have address
      handleHexInputChange((validatedAsset as any).address);
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
