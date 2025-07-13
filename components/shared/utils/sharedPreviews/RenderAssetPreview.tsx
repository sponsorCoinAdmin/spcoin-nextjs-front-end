'use client';

import React from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState, TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

interface Props<T extends TokenContract | WalletAccount> {
  validatedAsset: T | undefined;
  onSelect: (asset: T) => void;
}

export default function RenderAssetPreview<T extends TokenContract | WalletAccount>({
  validatedAsset,
  onSelect,
}: Props<T>) {
  const { inputState, showRenderPanel } = useTerminalFSMState();

  // ✅ Show if FSM is at or beyond VALIDATE_BALANCE
  if (!showRenderPanel || !validatedAsset) {
    debugLog.log(`🚫 RenderAssetPreview hidden: inputState=${InputState[inputState]}, showRenderPanel=${showRenderPanel}, validatedAsset=${!!validatedAsset}`);
    return null;
  }

  debugLog.log(`🧩 RenderAssetPreview rendered with asset:`, validatedAsset);

  const name = 'name' in validatedAsset ? validatedAsset.name ?? '' : '';
  const symbol = 'symbol' in validatedAsset ? validatedAsset.symbol ?? '' : '';

  let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';
  if ('logoURL' in validatedAsset && 'address' in validatedAsset) {
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
      />
    </div>
  );
}
