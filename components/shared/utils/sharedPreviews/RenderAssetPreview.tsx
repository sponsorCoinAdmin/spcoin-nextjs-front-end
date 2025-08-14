// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx
'use client';

import React, { useMemo } from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import BasePreviewWrapper from './BasePreviewWrapper';

// ✅ New local (nested) display system
import {
  useAssetSelectionDisplay,
} from '@/lib/context/AssetSelection/AssetSelectionDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

export default function RenderAssetPreview() {
  // Visibility is owned by the local sub-display provider
  const { activeSubDisplay } = useAssetSelectionDisplay();
  const showPanel = activeSubDisplay === ASSET_SELECTION_DISPLAY.ASSET_PREVIEW;

  // We still read context for content (but not for visibility)
  const { validatedAsset, handleHexInputChange } = useAssetSelectionContext();

  // If not visible or no asset to render, render nothing
  if (!showPanel || !validatedAsset) return null;

  const { name, symbol, logoURL, address } = useMemo(() => {
    const anyAsset = validatedAsset as any;
    return {
      name: anyAsset?.name ?? '',
      symbol: anyAsset?.symbol ?? '',
      logoURL:
        anyAsset?.logoURL ?? '/assets/miscellaneous/badTokenAddressImage.png',
      address: anyAsset?.address,
    };
  }, [validatedAsset]);

  const handleClick = () => {
    debugLog.log(
      '🖱️ Clicked preview card — calling handleHexInputChange(validatedAsset.address)',
      { address }
    );
    try {
      if (address) handleHexInputChange(address);
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
