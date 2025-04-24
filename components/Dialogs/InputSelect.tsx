'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';

import { getTokenAvatar } from '@/lib/network/utils';
import { Address, isAddress } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { CONTAINER_TYPE, TokenContract } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenAddress,
  useSellTokenAddress,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import { getInputStateString, InputState } from './TokenSelectDialog';
import { useIsAddressInput, useIsEmptyInput, useValidateTokenAddress } from '@/lib/hooks/UseAddressSelectHooks';

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const INPUT_PLACE_HOLDER = 'Type or paste token to select address';

type Props = {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  externalAddress?: string;
  externalPreview?: Partial<TokenContract>;
};

function InputSelect({ inputState, setInputState, externalAddress, externalPreview }: Props) {
  const [textInputField, setTextInputField] = useState<string>('');
  const [previewContract, setPreviewContract] = useState<Partial<TokenContract> | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [containerType] = useContainerType();
  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const [, setSellTokenContract] = useSellTokenContract();

  const debouncedInput = useDebounce(textInputField);
  const isEmptyInput = useIsEmptyInput(debouncedInput);
  const isAddressInput = useIsAddressInput(debouncedInput);
  const [tokenContract, isLoading] = useValidateTokenAddress(debouncedInput, () => {});
  const emojiStyle: React.CSSProperties = { fontSize: 36, lineHeight: 1, marginRight: 6 };


  useEffect(() => {
    if (externalAddress && externalAddress !== textInputField) {
      setTextInputField(externalAddress);
    }
  }, [externalAddress]);

  useEffect(() => {
    if (externalPreview) {
      setPreviewContract(externalPreview);
    }
  }, [externalPreview]);

  useEffect(() => {
    if (inputState === InputState.CLOSE_INPUT) {
      setTextInputField('');
    }
  }, [inputState]);

  useEffect(() => {
    if (isEmptyInput) {
      setInputState(InputState.EMPTY_INPUT);
      return;
    }

    if (!isAddressInput) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    const selectedAddress = debouncedInput.toLowerCase();
    const oppositeAddress = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? buyAddress?.toLowerCase()
      : sellAddress?.toLowerCase();

    if (selectedAddress && oppositeAddress && selectedAddress === oppositeAddress) {
      setInputState(InputState.DUPLICATE_INPUT);
      return;
    }

    if (isLoading) return;

    if (!tokenContract) {
      setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      return;
    }

    setInputState(InputState.VALID_INPUT_PENDING);
  }, [debouncedInput, isAddressInput, isLoading, tokenContract, isEmptyInput, buyAddress, sellAddress, containerType]);

  const getInputEmoji = (style?: React.CSSProperties): JSX.Element | string => {
    const emoji = (() => {
      switch (inputState) {
        case InputState.VALID_INPUT: return '✅';
        case InputState.INVALID_ADDRESS_INPUT: return '❓';
        case InputState.DUPLICATE_INPUT: return '❌';
        case InputState.EMPTY_INPUT: return '🔍';
        case InputState.IS_LOADING: return '⏳';
        case InputState.CONTRACT_NOT_FOUND_LOCALLY: return '⚠️';
        case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        default: return '⏳';
      }
    })();
    return style ? <span style={style}>{emoji}</span> : emoji;
  };

  const validateTextInput = (input: string) => {
    const trimmed = input.trim();
    if (trimmed === '') {
      setTextInputField(trimmed);
      return;
    }
    const isPartialHex = /^0x?[0-9a-fA-F]*$/.test(trimmed);
    if (isPartialHex) {
      setTextInputField(trimmed);
    }
  };

  const handleTokenSelect = () => {
    if (!tokenContract) return;
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellTokenContract(tokenContract);
    } else {
      setBuyTokenContract(tokenContract);
    }
    setInputState(InputState.VALID_INPUT);
  };

  const handleTokenPreviewKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleTokenSelect();
    }
  };

  const getErrorImage = (tokenContract?: any): string => {
    return tokenContract?.address && isAddress(tokenContract.address)
      ? defaultMissingImage
      : badTokenAddressImage;
  };

  const validateInputStatus = (state: InputState): JSX.Element => {
    const textStyle: React.CSSProperties = { fontSize: '15px', position: 'relative', top: -6 };

    switch (state) {
      case InputState.INVALID_ADDRESS_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            {getInputEmoji(emojiStyle)}
            <span style={textStyle}>Enter a Valid Token Hex Address !</span>
          </span>
        );

      case InputState.DUPLICATE_INPUT:
        const avatarToken = tokenContract ?? previewContract;
        if (!avatarToken) return <span></span>;
        return (
          <span style={{ color: 'orange' }} className="flex items-center">
            <Image
              src={avatarToken.logoURI ?? getTokenAvatar(avatarToken as TokenContract)}
              height={40}
              width={40}
              alt="Token Avatar"
              onError={(e) => {
                const fallback = getErrorImage(avatarToken);
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
              style={{ marginRight: -8, marginLeft: 25, verticalAlign: 'middle' }}
            />
            <span style={{ fontSize: '15px', position: 'relative', top: 0, marginLeft: -4 }}>
              {containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
                ? 'Sell Address Cannot Be the Same as Buy Address'
                : 'Buy Address Cannot Be the Same as Sell Address'}
            </span>
          </span>
        );

      case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>⚠️</span>
            <span style={textStyle}>BlockChain Token Missing Local Logo Image</span>
          </span>
        );

      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return (
          <span style={{ color: 'orange' }}>
            {getInputEmoji(emojiStyle)}
            <span style={textStyle}>Contract Not Found on BlockChain</span>
          </span>
        );

      default:
        return <span></span>;
    }
  };

  return (
    <div className={styles.inputSelectWrapper}>
      <div className={`${styles.modalElementSelectContainer} ${styles.leftH}`}>
        <div className={styles.searchImage} style={{ fontSize: '1.2rem' }}>
        {getInputEmoji(emojiStyle)}
        </div>
        <input
          className={`${styles.modalElementInput} w-full`}
          autoComplete="off"
          placeholder={INPUT_PLACE_HOLDER}
          value={textInputField}
          onChange={(e) => validateTextInput(e.target.value)}
          ref={inputRef}
          style={{ fontSize: '15px' }}
        />
      </div>

      {inputState !== InputState.EMPTY_INPUT && (
        <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
          {inputState === InputState.VALID_INPUT_PENDING || inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY ? (
            <div
              className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"
              role="button"
              tabIndex={0}
              onClick={handleTokenSelect}
              onKeyDown={handleTokenPreviewKeyDown}
            >
              <div className="cursor-pointer flex flex-row justify-between">
                <div className={styles.searchImage} style={{ fontSize: '1.2rem' }}>{getInputEmoji(emojiStyle)}</div>
                <div>
                  <div className={styles.elementName}>{tokenContract?.name}</div>
                  <div className={styles.elementSymbol}>{tokenContract?.symbol}</div>
                </div>
              </div>
              <div
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                onClick={() => alert(`Token Contract Address = ${stringifyBigInt(tokenContract?.address)}`)}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
              </div>
            </div>
          ) : (
            <h1 className="indent-5 my-[9px]">{validateInputStatus(inputState)}</h1>
          )}
        </div>
      )}
    </div>
  );
}

export default InputSelect;
