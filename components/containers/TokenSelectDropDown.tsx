'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenSelectDialog } from '../Dialogs/Dialogs';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  ExchangeContext,
  TokenContract,
  InputState
} from '@/lib/structure/types';
import {
  defaultMissingImage,
  getNativeAvatar,
  getTokenAvatar,
  isBlockChainToken
} from '@/lib/network/utils';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useContainerType } from '@/lib/context/contextHooks';

interface Props {
  containerType: CONTAINER_TYPE;
  tokenContract: TokenContract | undefined;
  setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
  exchangeContext: ExchangeContext;
}

function TokenSelectDropDown({
  containerType,
  tokenContract,
  setDecimalAdjustedContract,
  exchangeContext,
}: Props) {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const { tradeData } = exchangeContext;
  const [_, setContainerType] = useContainerType();
  const tokenRef = useRef<TokenContract | undefined>(undefined);

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
        tokenContract.logoURI = `***ERROR: MISSING AVATAR FILE*** -> ${tokenContract.logoURI}`;
      }
    },
    [tokenContract]
  );

  useEffect(() => {
    console.log('[TokenSelectDropDown] RENDERED with tokenContract:', stringifyBigInt(tokenContract));
  }, [tokenContract]);

  const handleTokenSelect = useCallback(() => {
    console.log('[TokenSelectDropDown] handleTokenSelect fired');
    if (tokenRef.current) {
      console.log('[TokenSelectDropDown] Setting tokenContract from ref:', tokenRef.current);
      setDecimalAdjustedContract(tokenRef.current);
    } else {
      console.warn('[TokenSelectDropDown] No tokenContract selected');
    }
  }, [setDecimalAdjustedContract]);

  const handleDialogOpen = useCallback(() => {
    console.log('[TokenSelectDropDown] Opening dialog for containerType:', containerType);
    setContainerType(containerType);
    setShowDialog(true);
  }, [containerType, setContainerType]);

  const handleDialogClose = useCallback((contract: TokenContract | undefined, inputState: InputState) => {
    console.log('[TokenSelectDropDown] Dialog closed with state:', inputState);
    if (inputState === InputState.CLOSE_INPUT && contract) {
      tokenRef.current = contract;
      console.log('[TokenSelectDropDown] Token selected from dialog:', stringifyBigInt(contract));
      setDecimalAdjustedContract(contract);
    }
  }, [setDecimalAdjustedContract]);

  useEffect(() => {
    console.log('[TokenSelectDropDown] tokenContract prop changed:', stringifyBigInt(tokenContract));
  }, [tokenContract]);

  return (
    <>
      <TokenSelectDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
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
          onClick={handleDialogOpen}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;
