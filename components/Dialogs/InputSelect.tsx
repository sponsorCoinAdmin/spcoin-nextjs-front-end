'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import { useChainId } from 'wagmi';
import AvatarWithFallback from '@/components/common/AvatarWithFallback';

const INPUT_PLACEHOLDER = 'Enter token address';
const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

const InputSelect = ({ closeDialog, onClose }: { closeDialog: () => void; onClose: (contract: TokenContract | undefined, state: InputState) => void }) => {
  const { inputValue, validateHexInput, clearInput } = useHexInput();
  const [tokenContract, setTokenContract] = useState<TokenContract>();
  const manualEntryRef = useRef(false);
  const debouncedAddress = useDebounce(inputValue, 250);

  const [containerType] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const chainId = useChainId();

  const tokenAvatarPath = tokenContract?.address ? getTokenAvatar(tokenContract) : undefined;
  const setTokenContractInContext = useMemo(() =>
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? setSellTokenContract : setBuyTokenContract
  , [containerType, setSellTokenContract, setBuyTokenContract]);

  const { inputState, validatedToken, isLoading, reportMissingAvatar } = useInputValidationState(debouncedAddress);

  const clearFields = useCallback(() => {
    clearInput();
    setTokenContract(undefined);
  }, [clearInput]);

  const validateAndMaybeClose = useCallback((token: TokenContract) => {
    setTokenContract(token);
    setTokenContractInContext(token);
    clearFields();
    onClose(token, InputState.CLOSE_INPUT);
    closeDialog();
  }, [clearFields, closeDialog, setTokenContractInContext, onClose]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedToken) return;

    if (manualEntryRef.current) {
      setTokenContract(validatedToken);
    } else {
      validateAndMaybeClose(validatedToken);
    }
  }, [debouncedAddress, validatedToken, isLoading, validateAndMaybeClose]);

  const validateInputStatus = (state: InputState) => {
    const duplicateMessage = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Sell Address Cannot Be the Same as Buy Address'
      : 'Buy Address Cannot Be the Same as Sell Address';

    const emojiMap: Partial<Record<InputState, { emoji?: string; text: string; useAvatar?: boolean }>> = {
      [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid Token Address Required!' },
      [InputState.DUPLICATE_INPUT]: { text: duplicateMessage, useAvatar: true },
      [InputState.CONTRACT_NOT_FOUND_LOCALLY]: { emoji: '⚠️', text: 'Blockchain token missing local image.' },
      [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Contract not found on blockchain!' },
    };

    const item = emojiMap[state];
    if (!item) return null;

    const imageLogo = `/assets/blockchains/${chainId}/contracts/${debouncedAddress}/avatar.png`;

    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          color: state === InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN ? 'red' : 'orange',
          marginLeft: item.useAvatar ? '1.4rem' : 0
        }}
      >
        {item.useAvatar ? (
          <AvatarWithFallback
            src={imageLogo}
            fallbackSrc={defaultMissingImage}
            alt="duplicate avatar"
            width={40}
            height={40}
            style={{ marginRight: '6px', borderRadius: '50%' }}
            inputState={state}
          />
        ) : (
          item.emoji && (
            <span style={{ fontSize: 36, marginRight: 6 }}>{item.emoji}</span>
          )
        )}
        <span style={{ fontSize: '15px', marginLeft: '-18px' }}>{item.text}</span>
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
              <AvatarWithFallback
                src={tokenAvatarPath ?? defaultMissingImage}
                fallbackSrc={defaultMissingImage}
                alt="Token preview"
                width={40}
                height={40}
                className={styles.tokenPreviewImg}
                onClick={() => {
                  if (tokenContract) {
                    validateAndMaybeClose(tokenContract);
                  }
                }}
                inputState={inputState}
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
