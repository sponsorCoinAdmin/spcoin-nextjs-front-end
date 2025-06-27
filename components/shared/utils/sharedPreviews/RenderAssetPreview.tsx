'use client';

import React from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState, TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED, LOG_TIME);

interface Props<T extends TokenContract | WalletAccount> {
  validatedAsset: T | undefined;
  inputState: InputState;
  hasBrokenLogoURL: () => boolean;
  reportMissingLogoURL: () => void;
  onSelect: (asset: T) => void;
}

export default function RenderAssetPreview<T extends TokenContract | WalletAccount>({
  validatedAsset,
  inputState,
  hasBrokenLogoURL,
  reportMissingLogoURL,
  onSelect,
}: Props<T>) {
  if (!validatedAsset) {
    debugLog.log('🚫 RenderAssetPreview: validatedAsset is undefined');
    return null;
  }

  if (inputState !== InputState.VALID_INPUT_PENDING) {
    debugLog.log(`🚫 RenderAssetPreview: inputState is not VALID_INPUT_PENDING →`, inputState);
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
      className="cursor-pointer"
      style={{
        padding: '8px',
        backgroundColor: '#243056',
        color: '#5981F3',
        borderRadius: '22px',
      }}
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
