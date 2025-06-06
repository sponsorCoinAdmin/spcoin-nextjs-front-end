'use client';

import React, { useState, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ChevronDown } from 'lucide-react';
import { CONTAINER_TYPE } from '@/lib/structure';
import { useSafeLogoURL } from '@/lib/hooks/useSafeLogoURL';
import { TokenDialogWrapper, RecipientDialogWrapper } from '@/components/Dialogs/AssetSelectDialog';

type GenericAsset = {
  address: string;
  name?: string;
  symbol?: string;
  logo?: string;
};

interface AssetSelectDropDownProps<T extends GenericAsset> {
  asset: T | undefined;
  onSelectAsset: (asset: T) => void;
  containerType?: CONTAINER_TYPE; // required for isToken === true
  isToken?: boolean;
}

function AssetSelectDropDown<T extends GenericAsset>({
  asset,
  onSelectAsset,
  containerType,
  isToken = false,
}: AssetSelectDropDownProps<T>) {
  const [showDialog, setShowDialog] = useState(false);

  const logoSrc = useSafeLogoURL(asset?.address, undefined, asset?.logo);

  const handleLogoError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (asset) {
        event.currentTarget.src = logoSrc;
        console.warn(`[AssetSelectDropDown] Missing logo for ${asset.symbol} (${asset.logo})`);
      }
    },
    [asset, logoSrc]
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
    if (isToken && !containerType) {
      throw new Error('containerType is required when selecting a token.');
    }
    setShowDialog(true);
  }, [isToken, containerType]);

  return (
    <>
      {isToken ? (
        <TokenDialogWrapper
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          containerType={containerType!} // assert present for tokens
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
              alt={`${asset.name} logo`}
              src={logoSrc}
              onClick={() => alert(JSON.stringify(asset, null, 2))}
              onError={handleLogoError}
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
