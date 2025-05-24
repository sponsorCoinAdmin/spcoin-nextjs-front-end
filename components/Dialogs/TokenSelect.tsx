'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback, useMemo } from 'react';
import { getTokenLogoURL } from '@/lib/network/utils';
import { InputState, TokenContract, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure/types';
import {
  useContainerType,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import DataList from './Resources/DataList';
import { useChainId } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import HexAddressInput from '@/components/shared/HexAddressInput';
import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECTOR === 'true';
const debugLog = createDebugLogger('TokenSelector', DEBUG_ENABLED, LOG_TIME);

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
  } = useDebouncedAddressInput();

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

  const { inputState, validatedToken, isLoading, reportMissingAvatar } = useInputValidationState(
    debouncedAddress
  );

  const onSelect = useCallback((token: TokenContract) => {
    setTokenContractInContext(token);
    clearInput();
    onSelectProp(token, InputState.CLOSE_INPUT);
    closeDialog();
  }, [setTokenContractInContext, clearInput, onSelectProp, closeDialog]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedToken) return;
    if (!manualEntryRef.current) {
      onSelect(validatedToken);
    }
  }, [debouncedAddress, validatedToken, isLoading, manualEntryRef, onSelect]);

  const getInputStatusImage = () => {
    switch (inputState) {
      case InputState.INVALID_ADDRESS_INPUT:
        return '❓';
      case InputState.DUPLICATE_INPUT:
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return '❌';
      case InputState.CONTRACT_NOT_FOUND_LOCALLY:
        return '⚠️';
      case InputState.VALID_INPUT:
        return '✅';
      default:
        return '🔍';
    }
  };

  const validateInputStatus = (state: InputState) => {
    const duplicateMessage =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
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

    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          color: state === InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN ? 'red' : 'orange',
          marginLeft: item.useAvatar ? '1.4rem' : 0,
        }}
      >
        {item.emoji && <span style={{ fontSize: 36, marginRight: 6 }}>{item.emoji}</span>}
        <span style={{ fontSize: '15px', marginLeft: '-18px' }}>{item.text}</span>
      </span>
    );
  };

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={onChange}
        placeholder={INPUT_PLACE_HOLDER}
        statusEmoji={getInputStatusImage()}
      />

      {validatedToken && inputState === InputState.VALID_INPUT_PENDING && (
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
          {validateInputStatus(inputState)}
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
