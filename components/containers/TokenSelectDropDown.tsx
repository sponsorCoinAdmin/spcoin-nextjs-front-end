'use client';

import React, { useState, useRef, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenSelectDialog } from '../Dialogs/Dialogs';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  TokenContract,
  InputState,
} from '@/lib/structure/types';
import {
  defaultMissingImage,
  getTokenAvatar,
} from '@/lib/network/utils';
import { useContainerType } from '@/lib/context/contextHooks';

interface Props {
  containerType: CONTAINER_TYPE;
  tokenContract: TokenContract | undefined;
  setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
}

function TokenSelectDropDown({
  containerType,
  tokenContract,
  setDecimalAdjustedContract,
}: Props) {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [, setContainerType] = useContainerType();
  const seenBrokenImagesRef = useRef<Set<string>>(new Set());

  const avatarSrc = useMemo(() => {
    if (tokenContract?.address && !seenBrokenImagesRef.current.has(tokenContract.address)) {
      return getTokenAvatar(tokenContract);
    }
    return defaultMissingImage;
  }, [tokenContract]);

  const handleMissingAvatar = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const tokenAddr = tokenContract?.address;
    if (!tokenAddr || seenBrokenImagesRef.current.has(tokenAddr)) return;

    seenBrokenImagesRef.current.add(tokenAddr);
    event.currentTarget.src = defaultMissingImage;

    console.warn(
      `[TokenSelectDropDown] Missing avatar for ${tokenContract?.symbol} (${tokenAddr})`
    );
  };

  return (
    <>
      <TokenSelectDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        onClose={(contract: TokenContract | undefined, inputState: InputState) => {
          if (inputState === InputState.CLOSE_INPUT && contract) {
            setDecimalAdjustedContract(contract);
          }
        }}
      />
      <div className={styles.assetSelect}>
        {tokenContract ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${tokenContract.name} Token Avatar`}
              src={avatarSrc}
              onClick={() => setDecimalAdjustedContract(tokenContract)}
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
          onClick={() => {
            setContainerType(containerType);
            setShowDialog(true);
          }}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;
