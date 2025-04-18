'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';

import {
  TokenContract,
  useErc20NetworkContract,
  useErc20TokenContract,
} from '@/lib/wagmi/wagmiERC20ClientRead';
import { getTokenAvatar } from '@/lib/network/utils';
import { Address } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { isAddress } from 'viem';
import { useMappedTokenContract } from '@/lib/hooks/wagmiERC20hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { CONTAINER_TYPE } from '@/lib/structure/types';
import { useContainerType } from '@/lib/context/contextHooks';
import { InputState } from './TokenSelectDialog';
import { useIsAddressInput, useIsDuplicateToken, useIsEmptyInput, useResolvedTokenContractInfo } from '@/lib/hooks/UseAddressSelectHooks';

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const INPUT_PLACE_HOLDER = "Type or paste token to select address";

type Props = {
  inputState: InputState;
  setInputState: (state: InputState) => void;
};

function InputSelect({ inputState, setInputState}: Props) {
  const [textInputField, setTextInputField] = useState<any>();
  const [containerType] = useContainerType();
  const debouncedInput: string = useDebounce(textInputField);
  const isEmptyInput: boolean = useIsEmptyInput(debouncedInput);
  const isAddressInput: boolean = useIsAddressInput(debouncedInput); 
  const isDuplicate: boolean = useIsDuplicateToken(debouncedInput);
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>();
  const [tokenContract, isTokenContractResolved, tokenContractMessage] =
  useResolvedTokenContractInfo(tokenAddress);

    useEffect(() => {
    console.log(`=====================================================================================`);
    console.log(`[DEBUG] textInputField: ${textInputField}`);
    console.log(`[DEBUG] debouncedInput: ${debouncedInput}`);
    console.log(`[DEBUG] isEmptyInput: ${isEmptyInput}`);
    console.log(`[DEBUG] isAddressInput: ${isAddressInput}`);
    console.log(`[DEBUG] isDuplicate: ${isDuplicate}`);
    console.log(`[DEBUG] tokenAddress: ${tokenAddress}`);
    console.log(`[DEBUG] isTokenContractResolved: ${isTokenContractResolved}`);
    console.log(`[DEBUG] tokenContract: ${stringifyBigInt(tokenContract)}`);
    console.log(`[DEBUG] tokenContractMessage: ${tokenContractMessage}`);
    console.log(`-------------------------------------------------------------------------------------`);
  }, [
    textInputField,
    debouncedInput,
    isEmptyInput,
    isAddressInput,
    isDuplicate,
    tokenAddress,
    tokenContractMessage,
    tokenContract,
    tokenContractMessage
  ]);

  useEffect(() => {
    if (!tokenContract && tokenAddress) {
      setInputState(InputState.CONTRACT_NOT_FOUND_INPUT);
    }
  }, [tokenContract]);


  useEffect(() => {
    validateDebouncedInput(debouncedInput);
  }, [debouncedInput]);

  // useEffect(() => {
  //   if (tokenContract) {
  //     setTokenContractCallBack(tokenContract, inputState);
  //   }
  // }, [tokenContract, inputState]);

  const validateDebouncedInput = (debouncedString: string) => {

    if(!isEmptyInput && isAddressInput) {
      setTokenAddress(debouncedString as Address);
      setInputState(InputState.VALID_INPUT);
    }
  };

  // const isAddressInput = (input: string) => {
  //   return (isAddress(input))
  //     ? true
  //     : (setInputState(InputState.INVALID_ADDRESS_INPUT), false);
  // }

  // const isEmptyInput = (str: string) => {
  //   return (str == null || str.trim() === '')
  //     ? (setInputState(InputState.EMPTY_INPUT), true)
  //     : false;
  // }

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
          className={`${styles.modalElementInput} w-full`}
          autoComplete="off"
          placeholder={INPUT_PLACE_HOLDER}
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
                  onClick={() => setInputState(InputState.CLOSE_INPUT)}
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
                onClick={() =>
                  alert(`Token Contract Address = ${stringifyBigInt(tokenContract?.address)}`)
                }
              >
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
              </div>
            </div>
          ) : (
            <h1 className="indent-5 my-[9px]">
              {validateInputStatus(inputState)}
            </h1>
          )}
        </div>
      )}
    </div>
  );
}

export default InputSelect;
