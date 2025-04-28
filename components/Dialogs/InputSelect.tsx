'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getTokenAvatar } from '@/lib/network/utils';
import { isAddress } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { useIsDuplicateToken, useIsAddressInput, useValidateTokenAddress } from '@/lib/hooks/UseAddressSelectHooks';
import { InputState, TokenContract, CONTAINER_TYPE } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenContract,
  useSellTokenContract,
  useBuyTokenAddress,
  useSellTokenAddress,
} from '@/lib/context/contextHooks';
import { useChainId } from 'wagmi';
import DataList from './Resources/DataList';

const INPUT_PLACEHOLDER = 'Enter token address';
const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

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

  const chainId = useChainId();
  const isAddressValid = useIsAddressInput(debouncedAddress);
  const [validatedToken, isLoading] = useValidateTokenAddress(debouncedAddress, () => {});

  const tokenAvatarPath = tokenContract?.address ? getTokenAvatar(tokenContract) : undefined;
  const resolveImageSrc = (token?: TokenContract) =>
    token?.address && isAddress(token.address) ? defaultMissingImage : badTokenAddressImage;

  const clearFields = useCallback(() => {
    clearInput();
    setInputState(InputState.EMPTY_INPUT);
    setTokenContract(undefined);
  }, [clearInput]);

  const clearToken = (state: InputState) => {
    setInputState(state);
    if (
      state !== InputState.DUPLICATE_INPUT &&
      state !== InputState.INVALID_ADDRESS_INPUT &&
      state !== InputState.EMPTY_INPUT
    ) {
      setTokenContract(undefined);
    }
  };

  const setTokenContractInContext = useMemo(
    () =>
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? setSellTokenContract
        : setBuyTokenContract,
    [containerType, setSellTokenContract, setBuyTokenContract]
  );

  const validateAndMaybeClose = useCallback(
    (token: TokenContract) => {
      setTokenContract(token);
      setTokenContractInContext(token);
      setInputState(InputState.VALID_INPUT);
      clearFields();
      closeDialog();
    },
    [clearFields, closeDialog, setTokenContractInContext]
  );

  const emojiMap: Partial<Record<InputState, { emoji: string; text: string }>> = useMemo(() => ({
    [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid Token Address Required!' },
    [InputState.DUPLICATE_INPUT]: { emoji: '', text: '' },
    [InputState.CONTRACT_NOT_FOUND_LOCALLY]: { emoji: '⚠️', text: 'Blockchain token missing local image.' },
    [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Contract not found on blockchain!' },
  }), [containerType]);

  useEffect(() => {
    if (debouncedAddress === '') {
      clearToken(InputState.EMPTY_INPUT);
      return;
    }

    if (!isAddressValid) {
      clearToken(InputState.INVALID_ADDRESS_INPUT);
      return;
    }
  }, [debouncedAddress, isAddressValid, clearToken]);

  useEffect(() => {
    if (!debouncedAddress || isLoading) return;

    if (validatedToken) {
      const oppositeAddress = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? buyAddress?.toLowerCase()
        : sellAddress?.toLowerCase();
      const selectedAddress = validatedToken.address.toLowerCase();

      if (selectedAddress && oppositeAddress && selectedAddress === oppositeAddress) {
        clearToken(InputState.DUPLICATE_INPUT);
        return;
      }

      fetch(`/assets/blockchains/${chainId}/contracts/${selectedAddress}/avatar.png`)
        .then((res) => {
          if (res.ok) {
            if (manualEntryRef.current) {
              setTokenContract(validatedToken);
              setInputState(InputState.VALID_INPUT_PENDING);
            } else {
              validateAndMaybeClose(validatedToken);
            }
          } else {
            clearToken(InputState.CONTRACT_NOT_FOUND_LOCALLY);
          }
        })
        .catch(() => {
          clearToken(InputState.CONTRACT_NOT_FOUND_LOCALLY);
        });
    } else {
      clearToken(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
    }
  }, [debouncedAddress, validatedToken, isLoading, containerType, buyAddress, sellAddress, validateAndMaybeClose, chainId, clearToken]);

  const validateInputStatus = (state: InputState) => {
    if (state === InputState.DUPLICATE_INPUT && tokenContract) {
      return (
        <span style={{ color: 'orange' }}>
          <Image
            src={tokenAvatarPath ?? resolveImageSrc(tokenContract)}
            alt="Duplicate Token"
            width={36}
            height={36}
            style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}
            className={styles.tokenPreviewImg}
            onError={(e) => {
              const fallback = resolveImageSrc(tokenContract);
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
          <span style={{ fontSize: '15px', position: 'relative', top: -6 }}>
            {containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
              ? 'Sell Address Cannot Be the Same as Buy Address'
              : 'Buy Address Cannot Be the Same as Sell Address'}
          </span>
        </span>
      );
    }

    return emojiMap[state] && (
      <span
        style={{
          color: state === InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN ? 'red' : 'orange',
        }}
      >
        <span style={{ fontSize: 36, position: 'relative', marginRight: 3, top: -5 }}>
          {emojiMap[state]!.emoji}
        </span>
        <span style={{ fontSize: '15px', position: 'relative', top: -12 }}>
          {emojiMap[state]!.text}
        </span>
      </span>
    );
  };

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
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                onClick={() => {
                  if (tokenContract) {
                    validateAndMaybeClose(tokenContract);
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

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList
            onTokenSelect={(address) => {
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
