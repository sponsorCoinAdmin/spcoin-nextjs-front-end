'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import { invalidTokenContract } from '@/lib/spCoin/coreUtils';
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png';
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

const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

export enum InputState {
  EMPTY_INPUT = 'EMPTY_INPUT',
  VALID_INPUT = 'VALID_INPUT',
  INVALID_ADDRESS_INPUT = 'INVALID_ADDRESS_INPUT',
  CONTRACT_NOT_FOUND_INPUT = 'CONTRACT_NOT_FOUND_INPUT',
  DUPLICATE_INPUT = 'DUPLICATE_INPUT'
}

type Props = {
  placeHolder: string;
  passedInputField: any;
  setTokenContractCallBack: (
    tokenContract: TokenContract | undefined,
    state: InputState
  ) => void;
  setInputState?: (state: InputState) => void;
  closeDialog: () => void;
};

function InputSelect({
  placeHolder,
  passedInputField,
  setTokenContractCallBack,
  setInputState: notifyParent,
  closeDialog
}: Props) {
  const chainId: number = useChainId();
  const [textInputField, setTextInputField] = useState<any>();
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>();
  const [inputState, setInputStateLocal] = useState<InputState>(InputState.EMPTY_INPUT);
  const tokenContract: TokenContract | undefined = useMappedTokenContract(tokenAddress);

  useEffect(() => {
    if (!tokenContract && tokenAddress) {
      updateInputState(InputState.CONTRACT_NOT_FOUND_INPUT);
    }
  }, [tokenContract]);

  const debouncedInput: string = useDebounce(textInputField);

  const updateInputState = (state: InputState) => {
    setInputStateLocal(state);
    if (notifyParent) notifyParent(state);
  };

  useEffect(() => {
    setTextInputField(passedInputField);
  }, [passedInputField]);

  useEffect(() => {
    validateDebouncedInput(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    if (tokenContract) {
      setTokenContractCallBack(tokenContract, inputState);
    }
  }, [tokenContract, inputState]);

  const validateDebouncedInput = (input: string) => {
    if (!input || typeof input !== 'string') {
      updateInputState(InputState.EMPTY_INPUT);
      return;
    }

    const trimmedInput: string = input.trim();

    if (!isAddress(trimmedInput)) {
      updateInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    setTokenAddress(trimmedInput);
    updateInputState(InputState.VALID_INPUT);
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

  return (
    <div className={styles.inputSelectWrapper}>
      <div className={`${styles.modalElementSelectContainer} ${styles.leftH}`}>
        <div className={styles.searchImage} style={{ fontSize: '1.2rem' }}>
          {getInputEmoji()}
        </div>
        <input
          className={`${styles.modalElementInput} w-full`}
          autoComplete="off"
          placeholder={placeHolder}
          value={textInputField || ''}
          onChange={(e) => validateTextInput(e.target.value)}
        />
      </div>
      {/* <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
          <div className="cursor-pointer flex flex-row justify-between">
            <Image
              id="tokenImage"
              src={getTokenAvatar(tokenContract)}
              height={40}
              width={40}
              alt="Token Image"
              onClick={() => { closeDialog(); }}
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
            onClick={() => alert(`Token Contract Address = ${stringifyBigInt(tokenContract?.address)}`)}
          >
            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default InputSelect;
