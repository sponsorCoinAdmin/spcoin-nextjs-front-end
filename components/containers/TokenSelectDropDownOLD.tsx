'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenSelectDialog } from '../Dialogs/Dialogs';
import { ChevronDown } from 'lucide-react'; // ✅ Lucide icon

import {
  CONTAINER_TYPE,
  ExchangeContext,
  TokenContract,
} from '@/lib/structure/types';
import {
  defaultMissingImage,
  getNativeAvatar,
  getTokenAvatar,
  isBlockChainToken,
} from '@/lib/network/utils';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

type Props = {
  containerType: CONTAINER_TYPE;
  tokenContract: TokenContract | undefined;
  setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
  exchangeContext: ExchangeContext;
};

function AssetSelect({
  containerType,
  tokenContract,
  setDecimalAdjustedContract,
  exchangeContext,
}: Props) {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const { tradeData } = exchangeContext;

  const avatarSrc = useMemo(() => {
    if (!tokenContract || !tokenContract.address) return defaultMissingImage;
    return isBlockChainToken(exchangeContext, tokenContract)
      ? getNativeAvatar(tokenContract.chainId || 1)
      : getTokenAvatar(tokenContract);
  }, [tokenContract]);

  const handleMissingAvatar = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      event.currentTarget.src = defaultMissingImage;
      if (tokenContract) {
        tokenContract.img = `***ERROR: MISSING AVATAR FILE*** -> ${tokenContract.img}`;
      }
    },
    [tokenContract]
  );

  const handleTokenSelect = useCallback(() => {
    if (tokenContract) {
      setDecimalAdjustedContract(tokenContract);
    } else {
      console.warn('No token contract selected');
    }
    alert(`handleTokenSelect ${stringifyBigInt(tokenContract)}`);
  }, [tokenContract, setDecimalAdjustedContract]);

  return (
    <>
      <TokenSelectDialog
        containerType={containerType}
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        callBackSetter={setDecimalAdjustedContract}
      />
      <div className={styles.assetSelect}>
        {tokenContract ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${tokenContract?.name} Token Avatar`}
              src={avatarSrc}
              onClick={handleTokenSelect}
              onError={handleMissingAvatar}
            />
            {tokenContract.symbol}
          </>
        ) : (
          <>Select Token:</>
        )}
        <ChevronDown
          size={18}
          className="ml-2 cursor-pointer"
          onClick={() => setShowDialog(true)}
        />
      </div>
    </>
  );
}

export default AssetSelect;
