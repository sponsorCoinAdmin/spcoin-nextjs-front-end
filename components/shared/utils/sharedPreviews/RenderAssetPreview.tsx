// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx
'use client';

import React from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import BasePreviewWrapper from './BasePreviewWrapper';
import { isRenderFSMState } from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';
import { InputState } from '@/lib/structure/assetSelection';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

export default function RenderAssetPreview() {
  const { inputState, validatedAsset, handleHexInputChange } = useAssetSelectionContext();
  const visible = isRenderFSMState(inputState);

  if (!visible) return null;
  alert(`RenderAssetPreview.InputState: ${InputState[inputState]} visible: ${visible} validatedAsset: ${validatedAsset}`);

  if (!validatedAsset) return null;

  const name = validatedAsset.name ?? '';
  const symbol = validatedAsset.symbol ?? '';
  const logoURL =
    validatedAsset.logoURL ?? '/assets/miscellaneous/badTokenAddressImage.png';
  const address = validatedAsset.address;

  const handleClick = () => {
    debugLog.log('🖱️ Clicked preview card — calling handleHexInputChange', { address });
    try {
      if (address) handleHexInputChange(address);
    } catch (err) {
      debugLog.error('❌ handleHexInputChange in RenderAssetPreview failed:', err);
    }
  };

  return (
    <div id="RenderAssetPreview">
      <BasePreviewWrapper show={true}>
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
