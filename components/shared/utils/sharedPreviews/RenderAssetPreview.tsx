// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx

'use client';

import React, { useEffect, useState } from 'react';
import BasePreviewCard from '../../BasePreviewCard';
import { InputState, TokenContract, WalletAccount } from '@/lib/structure';
import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import BasePreviewWrapper from './BasePreviewWrapper';

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

  useEffect(() => {
    const shouldShow = showRenderPanel && !!validatedAsset;
    debugLog.log(
      `🧭 debugShowPanel → set to ${shouldShow} (inputState=${InputState[inputState]}, validatedAsset=${!!validatedAsset})`
    );
    setShowPanel(shouldShow);
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
  );
}
