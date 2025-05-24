'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback, useMemo } from 'react';
import { getTokenLogoURL } from '@/lib/network/utils';
import { InputState, TokenContract, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure/types';
import { isValidTokenContract } from '@/lib/utils/isTokenContract';
import {
  useContainerType,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { useChainId } from 'wagmi';

import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import ValidationDisplay from '@/components/shared/ValidationDisplay';
import DataList from './Resources/DataList';

const INPUT_PLACE_HOLDER = 'Type or paste token address';

interface Props {
  closeDialog: () => void;
  onSelect: (contract: TokenContract | undefined, state: InputState) => void;
}

export default function TokenSelect({ closeDialog, onSelect: onSelectProp }: Props) {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput,
    getInputStatusEmoji,
  } = useBaseSelectShared();

  const [containerType] = useContainerType();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const chainId = useChainId();

  const setTokenContractInContext = useMemo(
    () =>
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? setSellTokenContract
        : setBuyTokenContract,
    [containerType, setSellTokenContract, setBuyTokenContract]
  );

  const {
    inputState,
    validatedToken,
    isLoading,
    reportMissingAvatar,
  } = useInputValidationState(debouncedAddress, FEED_TYPE.TOKEN_LIST);

  const onSelect = useCallback((token: TokenContract) => {
    setTokenContractInContext(token);
    clearInput();
    onSelectProp(token, InputState.CLOSE_INPUT);
    closeDialog();
  }, [setTokenContractInContext, clearInput, onSelectProp, closeDialog]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedToken || !isValidTokenContract(validatedToken)) return;
    if (!manualEntryRef.current) {
      onSelect(validatedToken);
    }
  }, [debouncedAddress, validatedToken, isLoading, manualEntryRef, onSelect]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={onChange}
        placeholder={INPUT_PLACE_HOLDER}
        statusEmoji={getInputStatusEmoji(inputState)}
      />

      {validatedToken &&
        inputState === InputState.VALID_INPUT_PENDING &&
        isValidTokenContract(validatedToken) && (
          <div id="pendingDiv" className={`${styles.modalInputSelect}`}>
            <BasePreviewCard
              name={validatedToken.name || ''}
              symbol={validatedToken.symbol || ''}
              avatarSrc={getTokenLogoURL(validatedToken)}
              onSelect={() => onSelect(validatedToken)}
              onError={() => reportMissingAvatar()}
            />
          </div>
        )}

      {inputState !== InputState.EMPTY_INPUT && inputState !== InputState.VALID_INPUT_PENDING && (
        <div id="validateInputDiv" className={`${styles.modalInputSelect} indent-5`}>
          <ValidationDisplay
            inputState={inputState}
            duplicateMessage={
              containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
                ? 'Sell Address Cannot Be the Same as Buy Address'
                : 'Buy Address Cannot Be the Same as Sell Address'
            }
          />
        </div>
      )}

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList<TokenContract>
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            onSelect={(token) => {
              manualEntryRef.current = false;
              validateHexInput(token.address);
            }}
          />
        </div>
      </div>
    </div>
  );
}
