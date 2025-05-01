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
  const [_, setContainerType] = useContainerType();
  const tokenRef = useRef<TokenContract | undefined>(undefined);
  const hasErroredRef = useRef(false);

  const avatarSrc = useMemo(() => {
    if (!tokenContract || !tokenContract.address) return defaultMissingImage;
    return isBlockChainToken(exchangeContext, tokenContract)
      ? getNativeAvatar(tokenContract.chainId || 1)
      : getTokenAvatar(tokenContract);
  }, [tokenContract, exchangeContext]);

  const handleMissingAvatar = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!hasErroredRef.current) {
        event.currentTarget.src = defaultMissingImage;
        hasErroredRef.current = true;
        if (tokenContract) {
          tokenContract.logoURI = `TokenSelectDropDown:***ERR: MISSING AVATAR FILE*** -> ${tokenContract.logoURI}`;
        }
      }
    },
    [tokenContract]
  );

  const handleTokenSelect = useCallback(() => {
    if (tokenRef.current) {
      setDecimalAdjustedContract(tokenRef.current);
    }
  }, [setDecimalAdjustedContract]);

  const handleDialogOpen = useCallback(() => {
    setContainerType(containerType);
    setShowDialog(true);
  }, [containerType, setContainerType]);

  const handleDialogClose = useCallback((contract: TokenContract | undefined, inputState: InputState) => {
    if (inputState === InputState.CLOSE_INPUT && contract) {
      tokenRef.current = contract;
      setDecimalAdjustedContract(contract);
    }
  }, [setDecimalAdjustedContract]);

  return (
    <>
      <TokenSelectDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        onClose={handleDialogClose}
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
