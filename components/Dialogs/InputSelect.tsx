`use client`;

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';

import { getTokenAvatar } from '@/lib/network/utils';
import { isAddress } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InputState, getInputStateString , CONTAINER_TYPE, TokenContract } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenAddress,
  useSellTokenAddress,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import { useIsAddressInput, useIsEmptyInput, useValidateTokenAddress } from '@/lib/hooks/UseAddressSelectHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const INPUT_PLACEHOLDER = 'Enter token address';

type Props = {
  externalAddress?: string;
  setTokenContractCallback: (token: TokenContract | undefined, state: InputState) => void;
};

export default function InputSelect({ externalAddress, setTokenContractCallback }: Props) {
  const [inputValue, setInputValue] = useState<string>('');
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(undefined);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const lastCheckedTokenRef = useRef<string | null>(null);

  const debouncedAddress = useDebounce(inputValue, 250);
  const [containerType] = useContainerType();
  const sellAddress = useSellTokenAddress()?.toLowerCase();
  const buyAddress = useBuyTokenAddress()?.toLowerCase();

  const isEmpty = useIsEmptyInput(debouncedAddress);
  const isAddressValid = useIsAddressInput(debouncedAddress);
  const [validatedToken, isLoading] = useValidateTokenAddress(debouncedAddress, () => {});

  useEffect(() => {
    if (externalAddress && externalAddress !== inputValue) {
      setInputValue(externalAddress);
    }
  }, [externalAddress]);

  useEffect(() => {
    if (isEmpty) {
      setInputState(InputState.EMPTY_INPUT);
      setTokenContract(undefined);
      return;
    }

    if (!isAddressValid) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      setTokenContract(undefined);
      return;
    }

    const selectedAddress = debouncedAddress.toLowerCase();
    if (selectedAddress === sellAddress || selectedAddress === buyAddress) {
      setInputState(InputState.DUPLICATE_INPUT);
      setTokenContract(undefined);
      return;
    }

    if (isLoading) return;

    if (!validatedToken) {
      setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      setTokenContract(undefined);
      return;
    }

    const tokenAddress = validatedToken.address.toLowerCase();
    if (lastCheckedTokenRef.current === tokenAddress) return;
    lastCheckedTokenRef.current = tokenAddress;

    const localTokenLogo = `/assets/blockchains/1/contracts/${tokenAddress}/avatar.png`;

    fetch(localTokenLogo)
      .then((res) => {
        if (!res.ok) {
          setInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
        } else {
          setInputState(InputState.VALID_INPUT_PENDING);
        }
      })
      .catch(() => {
        setInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
      });

    setTokenContract(validatedToken);
  }, [debouncedAddress, isEmpty, isAddressValid, isLoading, validatedToken, sellAddress, buyAddress]);

  // Don't elevate to VALID_INPUT automatically to prevent premature dialog closure
  // It will now only display VALID_INPUT_PENDING for pending state

  const getErrorImage = (token?: TokenContract): string => {
    return token?.address && isAddress(token.address) ? defaultMissingImage : badTokenAddressImage;
  };

  const tokenAvatarPath = tokenContract?.address ? getTokenAvatar(tokenContract) : undefined;

  const validateInputStatus = (state: InputState): JSX.Element => {
    const textStyle: React.CSSProperties = { fontSize: '15px', position: 'relative', top: -6 };
    const emojiStyle: React.CSSProperties = { fontSize: 40, lineHeight: 1, marginRight: 6 };

    switch (state) {
      case InputState.INVALID_ADDRESS_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>❓</span>
            <span style={textStyle}>Valid Token Address Required !</span>
          </span>
        );
      case InputState.DUPLICATE_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>❌</span>
            <span style={textStyle}>Selected token is already active on the other side.</span>
          </span>
        );
      case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>⚠️</span>
            <span style={textStyle}>Blockchain Token Missing Local Logo Image</span>
          </span>
        );
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return (
          <span style={{ color: 'red' }}>
            <span style={emojiStyle}>❌</span>
            <span style={textStyle}>Contract Not Found on Blockchain !!!</span>
          </span>
        );
      default:
        return <span></span>;
    }
  };

  return (
    <div id="inputSelect" className={styles.inputSelectWrapper}>
      <div className={`${styles.modalElementSelectContainer} ${styles.leftH} mb-[-0.25rem]`}>
        <div className={styles.searchImage}>🔍</div>
        <input
          className={`${styles.modalElementInput} w-full`}
          autoComplete="off"
          placeholder={INPUT_PLACEHOLDER}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {tokenContract && inputState === InputState.VALID_INPUT_PENDING && (
        <div id="pendingDiv" className={`${styles.modalInputSelect} ${styles.tokenPreviewWrap}`}>
          <div className="flex flex-row justify-between mb-1 pt-0 px-5 hover:bg-spCoin_Blue-900">
            <div className="cursor-pointer flex flex-row justify-between">
              <Image
                src={tokenAvatarPath ?? getErrorImage(tokenContract)}
                alt='Token preview'
                width={42}
                height={38}
                className={styles.tokenPreviewImg}
                onError={(e) => {
                  const fallback = getErrorImage(tokenContract);
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
              <div>
                <div className={styles.elementName}>{tokenContract.name}</div>
                <div className={styles.elementSymbol}>{tokenContract.symbol}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {inputState !== InputState.EMPTY_INPUT && inputState !== InputState.VALID_INPUT_PENDING && (
        <div id="validateInputDiv" className={`${styles.modalInputSelect} indent-5`}>
          {validateInputStatus(inputState)}
        </div>
      )}
    </div>
  );
}
