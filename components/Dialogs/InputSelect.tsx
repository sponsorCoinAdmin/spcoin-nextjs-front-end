'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';

import { getTokenAvatar } from '@/lib/network/utils';
import { isAddress } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InputState, TokenContract, CONTAINER_TYPE } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import { useIsAddressInput, useIsEmptyInput, useValidateTokenAddress } from '@/lib/hooks/UseAddressSelectHooks';
import DataList from './Resources/DataList';

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const INPUT_PLACEHOLDER = 'Enter token address';

const InputSelect = ({ closeDialog }: { closeDialog: () => void }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(undefined);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const manualEntryRef = useRef<boolean>(false);
  const lastCheckedTokenRef = useRef<string | null>(null);

  const debouncedAddress = useDebounce(inputValue, 250);
  const [containerType] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const isEmpty = useIsEmptyInput(debouncedAddress);
  const isAddressValid = useIsAddressInput(debouncedAddress);
  const [validatedToken, isLoading] = useValidateTokenAddress(debouncedAddress, () => {});

  const clearFields = useCallback(() => {
    setInputValue('');
    setInputState(InputState.EMPTY_INPUT);
    setTokenContract(undefined);
  }, []);

  const validateAndMaybeClose = useCallback((token: TokenContract) => {
    setTokenContract(token);
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellTokenContract(token);
    } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
      setBuyTokenContract(token);
    }
    setInputState(InputState.VALID_INPUT);

    clearFields();
    closeDialog();
  }, [closeDialog, containerType, clearFields, setSellTokenContract, setBuyTokenContract]);

  useEffect(() => {
    if (debouncedAddress === '') {
      setInputState(InputState.EMPTY_INPUT);
      setTokenContract(undefined);
      return;
    }

    if (!isAddressValid) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
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
          setTokenContract(undefined);
        } else {
          if (manualEntryRef.current) {
            setInputState(InputState.VALID_INPUT_PENDING);
          } else {
            validateAndMaybeClose(validatedToken);
          }
        }
      })
      .catch(() => {
        setInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
        setTokenContract(undefined);
      });
  }, [debouncedAddress, isAddressValid, isLoading, validatedToken, validateAndMaybeClose]);

  const getErrorImage = (token?: TokenContract): string => {
    return token?.address && isAddress(token.address) ? defaultMissingImage : badTokenAddressImage;
  };

  const tokenAvatarPath = tokenContract?.address ? getTokenAvatar(tokenContract) : undefined;

  const validateInputStatus = (state: InputState): JSX.Element => {
    const textStyle: React.CSSProperties = { fontSize: '15px', position: 'relative', top: -6 };
    const emojiStyle: React.CSSProperties = { fontSize: 36, lineHeight: 1, marginRight: 6 };

    switch (state) {
      case InputState.INVALID_ADDRESS_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>❓</span>
            <span style={textStyle}>Valid Token Address Required!</span>
          </span>
        );
      case InputState.DUPLICATE_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>❌</span>
            <span style={textStyle}>Selected token already active on the other side.</span>
          </span>
        );
      case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>⚠️</span>
            <span style={textStyle}>Blockchain token missing local image.</span>
          </span>
        );
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return (
          <span style={{ color: 'red' }}>
            <span style={emojiStyle}>❌</span>
            <span style={textStyle}>Contract not found on blockchain!</span>
          </span>
        );
      default:
        return <span></span>;
    }
  };

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>      {/* 🔵 inputSelectDiv */}
      <div className={`${styles.modalElementSelectContainer} ${styles.leftH} mb-[-0.25rem]`}>
        <div>🔍</div>
        <input
          className={`${styles.modalElementInput} w-full`}
          autoComplete="off"
          placeholder={INPUT_PLACEHOLDER}
          value={inputValue}
          onChange={(e) => {
            manualEntryRef.current = true;
            setInputValue(e.target.value);
          }}
        />
      </div>

      {/* 🔵 pendingDiv */}
      {tokenContract && inputState === InputState.VALID_INPUT_PENDING && (
        <div id="pendingDiv" className={`${styles.modalInputSelect} ${styles.tokenPreviewWrap}`}>
          <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
            <div className="cursor-pointer flex flex-row justify-between">
              <Image
                src={tokenAvatarPath ?? getErrorImage(tokenContract)}
                alt="Token preview"
                width={40}
                height={40}
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

      {/* 🛠️ inputSelectFlexDiv */}
      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0">
        {/* 🔵 validateInputDiv */}
        {inputState !== InputState.EMPTY_INPUT && inputState !== InputState.VALID_INPUT_PENDING && (
          <div id="validateInputDiv" className={`${styles.modalInputSelect} indent-5`}>
            {validateInputStatus(inputState)}
          </div>
        )}

        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>          <DataList
            onTokenSelect={(address: string) => {
              manualEntryRef.current = false;
              setInputValue(address);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InputSelect;
