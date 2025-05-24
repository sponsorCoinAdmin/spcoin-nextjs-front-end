'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback } from 'react';
import { getTokenLogoURL } from '@/lib/network/utils';
import { InputState, FEED_TYPE } from '@/lib/structure/types';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import ValidationDisplay from '@/components/shared/ValidationDisplay';
import DataList from './Resources/DataList';

interface AddressSelectProps<T> {
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  closeDialog: () => void;
  onSelect: (item: T, state: InputState) => void;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
}

export default function AddressSelect<T extends { address: string; name?: string; symbol?: string }>(
  {
    feedType,
    inputPlaceholder,
    closeDialog,
    onSelect: onSelectProp,
    duplicateMessage,
    showDuplicateCheck = false,
  }: AddressSelectProps<T>
) {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput,
    getInputStatusEmoji,
  } = useBaseSelectShared();

  const {
    inputState,
    validatedToken,
    isLoading,
    reportMissingAvatar,
  } = useInputValidationState<T>(debouncedAddress, feedType);

  const onSelect = useCallback((item: T) => {
    clearInput();
    onSelectProp(item, InputState.CLOSE_INPUT);
    closeDialog();
  }, [clearInput, closeDialog, onSelectProp]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedToken) return;
    if (!manualEntryRef.current) {
      onSelect(validatedToken);
    }
  }, [debouncedAddress, isLoading, validatedToken, manualEntryRef, onSelect]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={onChange}
        placeholder={inputPlaceholder}
        statusEmoji={getInputStatusEmoji(inputState)}
      />

      {validatedToken && inputState === InputState.VALID_INPUT_PENDING && (
        <div id="pendingDiv" className={styles.modalInputSelect}>
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
            duplicateMessage={showDuplicateCheck ? duplicateMessage : undefined}
          />
        </div>
      )}

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList<T>
            dataFeedType={feedType}
            onSelect={(item) => {
              manualEntryRef.current = false;
              validateHexInput(item.address);
            }}
          />
        </div>
      </div>
    </div>
  );
}
