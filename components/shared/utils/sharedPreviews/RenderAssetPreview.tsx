// File: components/shared/AssetPreviews/RenderAssetPreview.tsx

'use client';

import React from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { TokenContract, WalletAccount, FEED_TYPE, CONTAINER_TYPE, InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
import { usePanelFeedContext } from '@/lib/context/ScrollSelectPanels';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED, LOG_TIME);

interface Props<T extends TokenContract | WalletAccount> {
  validatedAsset: T | undefined;
  hasBrokenLogoURL: () => boolean;
  reportMissingLogoURL: () => void;
  onSelect: (asset: T) => void;
}

export default function RenderAssetPreview<T extends TokenContract | WalletAccount>({
  validatedAsset,
  hasBrokenLogoURL,
  reportMissingLogoURL,
  onSelect,
}: Props<T>) {
  const { containerType, feedType } = usePanelFeedContext();
  const { inputState } = useValidateFSMInput(validatedAsset?.address, feedType, containerType);

  if (!validatedAsset) {
    debugLog.log('🚫 RenderAssetPreview skipped: validatedAsset is undefined');
    return null;
  }

  debugLog.log(`🧩 RenderAssetPreview rendered with asset:`, validatedAsset);

  const name = 'name' in validatedAsset ? validatedAsset.name ?? '' : '';
  const symbol = 'symbol' in validatedAsset ? validatedAsset.symbol ?? '' : '';

  let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';
  if ('logoURL' in validatedAsset && 'address' in validatedAsset && !hasBrokenLogoURL()) {
    logoURL = validatedAsset.logoURL || logoURL;
  }

  const handleClick = () => {
    debugLog.log(`🖱️ Clicked preview card — calling onSelect(validatedAsset)`, validatedAsset);
    onSelect(validatedAsset);
  };

  return (
    <div
      id="pendingDiv"
      onClick={handleClick}
      className="cursor-pointer p-2 bg-[#243056] text-[#5981F3] rounded-[22px]"
    >
      <BasePreviewCard
        name={name}
        symbol={symbol}
        logoSrc={logoURL}
        onSelect={handleClick}
        onError={reportMissingLogoURL}
      />
    </div>
  );
}
