'use client';

import React from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState, TokenContract, WalletAccount } from '@/lib/structure/types';

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
  if (!validatedAsset || inputState !== InputState.VALID_INPUT_PENDING) return null;

  const name = 'name' in validatedAsset ? validatedAsset.name ?? '' : '';
  const symbol = 'symbol' in validatedAsset ? validatedAsset.symbol ?? '' : '';

  let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';
  if ('logoURL' in validatedAsset && 'address' in validatedAsset && !hasBrokenLogoURL()) {
    logoURL = validatedAsset.logoURL || logoURL;
  }

  return (
    <div
      id="pendingDiv"
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
        avatarSrc={logoURL}
        onSelect={() => onSelect(validatedAsset)}
        onError={reportMissingLogoURL}
      />
    </div>
  );
}
