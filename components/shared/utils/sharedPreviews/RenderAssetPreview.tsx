'use client';

import React, { useEffect, useState } from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState, TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';

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
  const [showPanel, setShowPanel] = useState(false);

  const debugShowPanel = (value: boolean, reason?: string) => {
    debugLog.log(
      `🧭 debugShowPanel → set to ${value} (inputState=${InputState[inputState]}, validatedAsset=${!!validatedAsset}, reason=${reason || 'none'})`
    );
    setShowPanel(value);
  };
console.log('⚡ RenderAssetPreview re-rendered');

  useEffect(() => {
    const shouldShow = showRenderPanel && !!validatedAsset;
    debugShowPanel(shouldShow, 'RenderAssetPreview visibility check');
  }, [showRenderPanel, validatedAsset, inputState]);

  if (!showPanel) return null;

  const name = 'name' in validatedAsset! ? validatedAsset!.name ?? '' : '';
  const symbol = 'symbol' in validatedAsset! ? validatedAsset!.symbol ?? '' : '';

  let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';
  if ('logoURL' in validatedAsset! && 'address' in validatedAsset!) {
    logoURL = validatedAsset!.logoURL || logoURL;
  }

  const handleClick = () => {
    debugLog.log(`🖱️ Clicked preview card — calling onSelect(validatedAsset)`, validatedAsset);
    onSelect(validatedAsset!);
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
