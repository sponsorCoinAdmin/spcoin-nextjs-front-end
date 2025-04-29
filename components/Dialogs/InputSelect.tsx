'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getTokenAvatar } from '@/lib/network/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { InputState, TokenContract, CONTAINER_TYPE } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import DataList from './Resources/DataList';

const INPUT_PLACEHOLDER = 'Enter token address';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

const InputSelect = ({ closeDialog }: { closeDialog: () => void }) => {
  const { inputValue, validateHexInput, clearInput } = useHexInput();
  const [tokenContract, setTokenContract] = useState<TokenContract>();
  const manualEntryRef = useRef(false);
  const debouncedAddress = useDebounce(inputValue, 250);

  const [containerType] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const tokenAvatarPath = tokenContract?.address ? getTokenAvatar(tokenContract) : undefined;
  const setTokenContractInContext = useMemo(() =>
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? setSellTokenContract : setBuyTokenContract
  , [containerType, setSellTokenContract, setBuyTokenContract]);

  const { inputState, validatedToken, isLoading } = useInputValidationState(debouncedAddress);

  const clearFields = useCallback(() => {
    clearInput();
    setTokenContract(undefined);
  }, [clearInput]);

  const validateAndMaybeClose = useCallback((token: TokenContract) => {
    setTokenContract(token);
    setTokenContractInContext(token);
    clearFields();
    closeDialog();
  }, [clearFields, closeDialog, setTokenContractInContext]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedToken) return;

    if (manualEntryRef.current) {
      setTokenContract(validatedToken);
    } else {
      validateAndMaybeClose(validatedToken);
    }
  }, [debouncedAddress, validatedToken, isLoading, validateAndMaybeClose]);

  const validateInputStatus = (state: InputState) => {
    const emojiMap: Partial<Record<InputState, { emoji: string; text: string }>> = {
      [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid Token Address Required!' },
      [InputState.DUPLICATE_INPUT]: { emoji: '⚠️', text: 'Duplicate Address Selected' },
      [InputState.CONTRACT_NOT_FOUND_LOCALLY]: { emoji: '⚠️', text: 'Blockchain token missing local image.' },
      [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Contract not found on blockchain!' },
    };
    const item = emojiMap[state];
    if (!item) return null;
    return (
      <span style={{ color: state === InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN ? 'red' : 'orange' }}>
        <span style={{ fontSize: 36, position: 'relative', marginRight: 3, top: -5 }}>{item.emoji}</span>
        <span style={{ fontSize: '15px', position: 'relative', top: -12 }}>{item.text}</span>
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
                src={tokenAvatarPath ?? defaultMissingImage}
                alt="Token preview"
                width={40}
                height={40}
                className={styles.tokenPreviewImg}
                onError={(e) => {
                  if (e.currentTarget.src !== defaultMissingImage) {
                    e.currentTarget.src = defaultMissingImage;
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
