'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getTokenAvatar } from '@/lib/network/utils';
import { isAddress } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { InputState, TokenContract, CONTAINER_TYPE } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenContract,
  useSellTokenContract,
  useBuyTokenAddress,
  useSellTokenAddress,
} from '@/lib/context/contextHooks';
import { useIsAddressInput, useValidateTokenAddress } from '@/lib/hooks/UseAddressSelectHooks';
import DataList from './Resources/DataList';

const INPUT_PLACEHOLDER = 'Enter token address';
const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

const emojiMap: Partial<Record<InputState, { emoji: string; text: string }>> = {
  [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid Token Address Required!' },
  [InputState.DUPLICATE_INPUT]: { emoji: '❌', text: 'Selected token already active on the other side.' },
  [InputState.CONTRACT_NOT_FOUND_LOCALLY]: { emoji: '⚠️', text: 'Blockchain token missing local image.' },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Contract not found on blockchain!' },
};

const InputSelect = ({ closeDialog }: { closeDialog: () => void }) => {
  const { inputValue, validateHexInput, clearInput } = useHexInput();
  const [tokenContract, setTokenContract] = useState<TokenContract>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const manualEntryRef = useRef(false);
  const debouncedAddress = useDebounce(inputValue, 250);

  const [containerType] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();

  const isAddressValid = useIsAddressInput(debouncedAddress);
  const [validatedToken, isLoading] = useValidateTokenAddress(debouncedAddress, () => {});

  const tokenAvatarPath = tokenContract?.address ? getTokenAvatar(tokenContract) : undefined;
  const resolveImageSrc = (token?: TokenContract) => token?.address && isAddress(token.address) ? defaultMissingImage : badTokenAddressImage;

  const clearFields = useCallback(() => {
    clearInput();
    setInputState(InputState.EMPTY_INPUT);
    setTokenContract(undefined);
  }, [clearInput]);

  const clearToken = (state: InputState) => {
    setInputState(state);
    setTokenContract(undefined);
  };

  const setTokenContractInContext = useMemo(
    () => containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? setSellTokenContract
      : setBuyTokenContract,
    [containerType, setSellTokenContract, setBuyTokenContract]
  );

  const validateAndMaybeClose = useCallback((token: TokenContract) => {
    setTokenContract(token);
    setTokenContractInContext(token);
    setInputState(InputState.VALID_INPUT);
    clearFields();
    closeDialog();
  }, [clearFields, closeDialog, setTokenContractInContext]);

  useEffect(() => {
    if (debouncedAddress === '' || !isAddressValid || isLoading) {
      clearToken(debouncedAddress === '' ? InputState.EMPTY_INPUT : InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    if (!validatedToken) {
      clearToken(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      return;
    }

    const selectedAddress = validatedToken.address.toLowerCase();
    const oppositeAddress = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? buyAddress?.toLowerCase()
      : sellAddress?.toLowerCase();

    if (selectedAddress && oppositeAddress && selectedAddress === oppositeAddress) {
      clearToken(InputState.DUPLICATE_INPUT);
      return;
    }

    setTokenContract(validatedToken);

    if (manualEntryRef.current) {
      setInputState(InputState.VALID_INPUT_PENDING);
      return;
    }

    fetch(`/assets/blockchains/1/contracts/${selectedAddress}/avatar.png`)
      .then(res => {
        if (res.ok) {
          validateAndMaybeClose(validatedToken);
        } else {
          clearToken(InputState.CONTRACT_NOT_FOUND_LOCALLY);
        }
      });
  }, [debouncedAddress, isAddressValid, isLoading, validatedToken, validateAndMaybeClose, buyAddress, sellAddress, containerType]);

  const validateInputStatus = (state: InputState) =>
    emojiMap[state] && (
      <span style={{ color: state === InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN ? 'red' : 'orange' }}>
        <span style={{ fontSize: 36, position: 'relative', marginRight: 3, top: -5 }}>{emojiMap[state]!.emoji}</span>
        <span style={{ fontSize: '15px', position: 'relative', top: -12 }}>{emojiMap[state]!.text}</span>
      </span>
    );

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <div className={`${styles.modalElementSelectContainer} ${styles.leftH} mb-[-0.25rem]`}>
        <div>🔍</div>
        <input
          className={`${styles.modalElementInput} w-full`}
          autoComplete="off"
          placeholder={INPUT_PLACEHOLDER}
          value={inputValue}
          onChange={(e) => {
            manualEntryRef.current = true;
            validateHexInput(e.target.value);
          }}
        />
      </div>

      {tokenContract && inputState === InputState.VALID_INPUT_PENDING && (
        <div id="pendingDiv" className={`${styles.modalInputSelect}`}>
          <div className="flex flex-row justify-between px-5 hover:bg-spCoin_Blue-900">
            <div className="cursor-pointer flex flex-row justify-between">
              <Image
                src={tokenAvatarPath ?? resolveImageSrc(tokenContract)}
                alt="Token preview"
                width={40}
                height={40}
                className={styles.tokenPreviewImg}
                onError={(e) => {
                  const fallback = resolveImageSrc(tokenContract);
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
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

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList
            onTokenSelect={address => {
              manualEntryRef.current = false;
              validateHexInput(address);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InputSelect;
