// File: components/containers/AssetSelectDropDown.tsx

'use client';

import React, { useState, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { InputState, FEED_TYPE, CONTAINER_TYPE } from '@/lib/structure/types';
import { useContainerType } from '@/lib/context/contextHooks';
import { useSafeAvatarURL } from '@/lib/hooks/useSafeAvatarURL';
import { TokenDialogWrapper, RecipientDialogWrapper } from '@/components/Dialogs/AssetSelectDialog';

type GenericAsset = {
  address: string;
  name?: string;
  symbol?: string;
  avatar?: string;
};

interface AssetSelectDropDownProps<T extends GenericAsset> {
  asset: T | undefined;
  onSelectAsset: (asset: T) => void;
  containerType?: CONTAINER_TYPE; // only needed for TokenSelect flow
  isToken?: boolean;
}

function AssetSelectDropDown<T extends GenericAsset>({
  asset,
  onSelectAsset,
  containerType,
  isToken = false,
}: AssetSelectDropDownProps<T>) {
  const [showDialog, setShowDialog] = useState(false);
  const [, setContainerType] = useContainerType();

  const avatarSrc = useSafeAvatarURL(asset?.address, undefined, asset?.avatar);

  const handleAvatarError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (asset) {
        event.currentTarget.src = avatarSrc;
        console.warn(`[AssetSelectDropDown] Missing avatar for ${asset.symbol} (${asset.avatar})`);
      }
    },
    [asset, avatarSrc]
  );

  const handleAssetSelect = useCallback(
    (selected: T) => {
      console.debug('✅ [AssetSelectDropDown] Received asset from dialog:', selected);
      onSelectAsset(selected);
      setShowDialog(false);
    },
    [onSelectAsset]
  );

  const openDialog = useCallback(() => {
    if (isToken && containerType) setContainerType(containerType);
    setShowDialog(true);
  }, [isToken, containerType, setContainerType]);

  return (
    <>
      {isToken ? (
        <TokenDialogWrapper
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          onSelect={handleAssetSelect as any}
        />
      ) : (
        <RecipientDialogWrapper
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          onSelect={handleAssetSelect as any}
        />
      )}

      <div className={styles.assetSelect}>
        {asset ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${asset.name} avatar`}
              src={avatarSrc}
              onClick={() => alert(JSON.stringify(asset, null, 2))}
              onError={handleAvatarError}
            />
            {asset.symbol}
          </>
        ) : (
          <>{isToken ? 'Select Token:' : 'Select Recipient:'}</>
        )}
        <ChevronDown
          size={18}
          className="ml-2 cursor-pointer"
          onClick={openDialog}
        />
      </div>
    </>
  );
}

export default AssetSelectDropDown;
