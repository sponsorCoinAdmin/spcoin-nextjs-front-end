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
import { Address, isAddress } from 'viem';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { CONTAINER_TYPE } from '@/lib/structure/types';
import { useContainerType } from '@/lib/context/contextHooks';
import { getInputStateString, InputState } from './TokenSelectDialog';
import {
  useIsAddressInput,
  useIsDuplicateToken,
  useIsEmptyInput,
  useResolvedTokenContractInfo,
  useSelectTokenAndClose
} from '@/lib/hooks/UseAddressSelectHooks';

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const INPUT_PLACE_HOLDER = 'Type or paste token to select address';

type Props = {
  inputState: InputState;
  setInputState: (state: InputState) => void;
};

function InputSelect({ inputState, setInputState }: Props) {
  const [textInputField, setTextInputField] = useState<string>('');
  const [containerType] = useContainerType();
  const debouncedInput = useDebounce(textInputField);
  const isEmptyInput = useIsEmptyInput(debouncedInput);
  const isAddressInput = useIsAddressInput(debouncedInput);
  const isDuplicate = useIsDuplicateToken(debouncedInput);
  const [validTokenAddress, setValidTokenAddress] = useState<Address | undefined>();
  const [tokenContract, isTokenContractResolved, tokenContractMessage, isLoading] =
    useResolvedTokenContractInfo(validTokenAddress);

  const selectTokenAndClose = useSelectTokenAndClose(setInputState);

  const dumpStateVars = () => {
    console.log(`=====================================================================================`);
    console.log(`[DEBUG] inputState: ${getInputStateString(inputState)}`);
    console.log(`[DEBUG] textInputField: ${textInputField}`);
    console.log(`[DEBUG] debouncedInput: ${debouncedInput}`);
    console.log(`[DEBUG] validTokenAddress: ${validTokenAddress}`);
    console.log(`[DEBUG] isEmptyInput: ${isEmptyInput}`);
    console.log(`[DEBUG] isAddressInput: ${isAddressInput}`);
    console.log(`[DEBUG] isDuplicate: ${isDuplicate}`);
    console.log(`[DEBUG] isTokenContractResolved: ${isTokenContractResolved}`);
    console.log(`[DEBUG] tokenContract: ${stringifyBigInt(tokenContract)}`);
    console.log(`[DEBUG] tokenContractMessage: ${tokenContractMessage}`);
    console.log(`[DEBUG] isLoading: ${isLoading}`);
    console.log(`-------------------------------------------------------------------------------------`);
  };

  useEffect(() => {
    dumpStateVars();
  }, [inputState]);

  useEffect(() => {
    setDebouncedState(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    if (!validTokenAddress) return;

    if (!isAddressInput) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    if (isDuplicate) {
      setInputState(InputState.DUPLICATE_INPUT);
      return;
    }

    if (isLoading) return;

    if (!isTokenContractResolved) {
      setInputState(InputState.CONTRACT_NOT_FOUND_INPUT);
      return;
    }

    setInputState(InputState.VALID_INPUT);
  }, [validTokenAddress, isAddressInput, isDuplicate, isTokenContractResolved, isLoading]);

  const setDebouncedState = (debouncedString: string) => {
    if (isEmptyInput) {
      setInputState(InputState.EMPTY_INPUT);
      return;
    }

    if (isAddress(debouncedString)) {
      setValidTokenAddress(debouncedString as Address);
    } else {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
    }
  };

  const getInputEmoji = (): string => {
    switch (inputState) {
      case InputState.VALID_INPUT: return '✅';
      case InputState.INVALID_ADDRESS_INPUT: return '⚠️';
      case InputState.DUPLICATE_INPUT: return '❌';
      case InputState.EMPTY_INPUT: return '🔍';
      case InputState.IS_LOADING: return '⏳';
      case InputState.CONTRACT_NOT_FOUND_INPUT:
      default: return '❓';
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

  const validateInputStatus = (state: InputState): JSX.Element => {
    console.log(`[DEBUG] validateInputStatus.inputState: ${getInputStateString(state)}`);

    const emojiStyle: React.CSSProperties = { fontSize: 36, lineHeight: 1, marginRight: 6 };
    const textStyle: React.CSSProperties = { fontSize: '15px', position: 'relative', top: -6 };

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
          value={textInputField}
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
                  onClick={() => selectTokenAndClose(tokenContract as TokenContract)} // ✅ Hook used here
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
            <h1 className="indent-5 my-[9px]">{validateInputStatus(inputState)}</h1>
          )}
        </div>
      )}
    </div>
  );
}

export default InputSelect;
