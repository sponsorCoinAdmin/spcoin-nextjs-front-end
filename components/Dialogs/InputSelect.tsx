'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import { invalidTokenContract } from '@/lib/spCoin/coreUtils';
import info_png from '@/public/assets/miscellaneous/info1.png';

import {
  TokenContract,
  useErc20NetworkContract,
  useErc20TokenContract,
} from '@/lib/wagmi/wagmiERC20ClientRead';
import { getTokenAvatar } from '@/lib/network/utils';
import { Address } from 'viem';
import { useChainId } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { isAddress } from 'viem';
import { useMappedTokenContract } from '@/lib/hooks/wagmiERC20hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { CONTAINER_TYPE, InputState } from '@/lib/structure/types';
import { useContainerType } from '@/lib/context/contextHooks';

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

type Props = {
  placeHolder: string;
  passedInputField: any;
  // updateTokenCallback: (
  //   tokenContract: TokenContract | undefined,
  //   state: InputState
  // ) => void;
  closeDialog: () => void;
};

function InputSelect({
  placeHolder,
  passedInputField,
  // updateTokenCallback,
  closeDialog
}: Props) {
  const [textInputField, setTextInputField] = useState<any>();
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const tokenContract: TokenContract | undefined = useMappedTokenContract(tokenAddress);
  const [containerType, setContainerType] = useContainerType();

  useEffect(() => {
    if (!tokenContract && tokenAddress) {
      setInputState(InputState.CONTRACT_NOT_FOUND_INPUT);
    }
  }, [tokenContract]);

  const debouncedInput: string = useDebounce(textInputField);

  useEffect(() => {
    setTextInputField(passedInputField);
  }, [passedInputField]);

  useEffect(() => {
    validateDebouncedInput(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    if (tokenContract) {
      alert(`InputSelect.updateTokenCallback(${tokenContract.name}, ${inputState});`);
    }
  }, [tokenContract, inputState]);

  const validateDebouncedInput = (input: string) => {
    if (!input || typeof input !== 'string') {
      setInputState(InputState.EMPTY_INPUT);
      return;
    }

    const trimmedInput: string = input.trim();

    if (!isAddress(trimmedInput)) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    setTokenAddress(trimmedInput);
    setInputState(InputState.VALID_INPUT);
  };

  const getInputEmoji = (): string => {
    switch (inputState) {
      case InputState.VALID_INPUT:
        return '✅';
      case InputState.INVALID_ADDRESS_INPUT:
        return '❌';
      case InputState.DUPLICATE_INPUT:
        return '⚠️';
      case InputState.EMPTY_INPUT:
        return '🔍';
      case InputState.CONTRACT_NOT_FOUND_INPUT:
      default:
        return '❓';
    }
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

  const getErrorImage = (tokenContract?: TokenContract): string => {
    return tokenContract?.address && isAddress(tokenContract.address)
      ? defaultMissingImage
      : badTokenAddressImage;
  };

  const validateInputStatus = (state: InputState): string | JSX.Element => {
    const emojiStyle: React.CSSProperties = {
      fontSize: 36,
      lineHeight: 1,
      marginRight: 6
    };    const textStyle: React.CSSProperties = {
      position: 'relative',
      top: -6 // ✅ number instead of string
    };  
    switch (state) {
      case InputState.INVALID_ADDRESS_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>❓</span>
            <span style={textStyle}>Enter a Valid Token Hex Address !</span>
          </span>
        );
  
      case InputState.DUPLICATE_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>❌</span>
            <span style={textStyle}>
              {containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
                ? 'Sell Address Cannot Be the Same as Buy Address'
                : 'Buy Address Cannot Be the Same as Sell Address'}
            </span>
          </span>
        );
  
      case InputState.CONTRACT_NOT_FOUND_INPUT:
        return (
          <span style={{ color: 'orange' }}>
            <span style={emojiStyle}>⚠️</span>
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
          {getInputEmoji()}
        </div>
        <input
          className={`${styles.modalElementInput} w-full text-[14.2px]`}
          autoComplete="off"
          placeholder={placeHolder}
          value={textInputField || ''}
          onChange={(e) => validateTextInput(e.target.value)}
        />
      </div>

      {inputState !== InputState.EMPTY_INPUT && (
        <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
          {inputState === InputState.VALID_INPUT ? (
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <div className="cursor-pointer flex flex-row justify-between">
                <Image
                  id="tokenImage"
                  src={getTokenAvatar(tokenContract)}
                  height={40}
                  width={40}
                  alt="Token Image"
                  onClick={closeDialog}
                  onError={(e) => {
                    const fallback = getErrorImage(tokenContract);
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
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
            <h1 className="indent-5 my-[9px]">{validateInputStatus(inputState)}</h1>)}
        </div>
      )}
    </div>
  );
}

export default InputSelect;
