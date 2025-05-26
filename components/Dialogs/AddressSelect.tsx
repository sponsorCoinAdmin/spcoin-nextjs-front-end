'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback } from 'react';
import {
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure/types';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import ValidationDisplay from '@/components/shared/ValidationDisplay';
import DataList from './Resources/DataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

interface AddressSelectProps<T extends TokenContract | WalletAccount> {
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  closeDialog: () => void;
  onSelect: (item: T, state: InputState) => void;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
}

export default function AddressSelect<T extends TokenContract | WalletAccount>({
  feedType,
  inputPlaceholder,
  closeDialog,
  onSelect: onSelectProp,
  duplicateMessage,
  showDuplicateCheck = false,
}: AddressSelectProps<T>) {
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
    validatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState<T>(debouncedAddress, feedType);

  const onSelect = useCallback(
    (item: T) => {
      debugLog.log(`🟢 onSelect() called with:`, item);
      clearInput();
      onSelectProp(item, InputState.CLOSE_INPUT);
      closeDialog();
    },
    [clearInput, closeDialog, onSelectProp]
  );

  useEffect(() => {
    debugLog.log(`📨 debouncedAddress:`, debouncedAddress);
  }, [debouncedAddress]);

  useEffect(() => {
    debugLog.log(`📌 inputState:`, inputState);
  }, [inputState]);

  useEffect(() => {
    if (validatedAsset) {
      debugLog.log(`✅ validatedAsset:`, validatedAsset);
    }
  }, [validatedAsset]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedAsset) return;
    if (!manualEntryRef.current) {
      debugLog.log(`🚀 Auto-selecting validatedAsset`);
      onSelect(validatedAsset);
    }
  }, [debouncedAddress, isLoading, validatedAsset, manualEntryRef, onSelect]);

  const renderPreview = () => {
    if (!validatedAsset || inputState !== InputState.VALID_INPUT_PENDING)
      return null;

    const name = 'name' in validatedAsset ? validatedAsset.name : '';
    const symbol = 'symbol' in validatedAsset ? validatedAsset.symbol : '';

    // Default fallback
    let logoURL = '/assets/miscellaneous/badTokenAddressImage.png';

    // Use asset-provided logo if available and not marked as broken
    if (
      'logoURL' in validatedAsset &&
      'address' in validatedAsset &&
      !hasBrokenLogoURL()
    ) {
    logoURL = validatedAsset.logoURL ?? '/assets/miscellaneous/badTokenAddressImage.png';
    }

    debugLog.log('🟦 Rendering VALID_INPUT_PENDING preview');

    return (
      <div id="pendingDiv"
        style={{
          padding: '8px', // from both
          backgroundColor: '#243056', // unified background
          color: '#5981F3', // modalInputSelect + state color
          borderRadius: '22px'
        }}
      >
        <BasePreviewCard
          name={name || ''}
          symbol={symbol || ''}
          avatarSrc={logoURL}
          onSelect={() => onSelect(validatedAsset)}
          onError={() => reportMissingLogoURL()}
        />
      </div>
    );
  };

  return (
    <div
      id="inputSelectDiv"
      className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}
    >
      <HexAddressInput
        inputValue={inputValue}
        onChange={(val) => {
          debugLog.log(`⌨️ onChange inputValue: ${val}`);
          onChange(val);
        }}
        placeholder={inputPlaceholder}
        statusEmoji={getInputStatusEmoji(inputState)}
      />

      {renderPreview()}

      {inputState !== InputState.VALID_INPUT_PENDING &&
        inputState !== InputState.EMPTY_INPUT && (
        <ValidationDisplay
          inputState={inputState}
          duplicateMessage={
            showDuplicateCheck ? duplicateMessage : undefined
          }
        />
      )}

      <div
        id="inputSelectFlexDiv"
        className="flex flex-col flex-grow min-h-0"
        style={{ gap: '0.2rem' }}
      >
        <div
          id="DataListDiv"
          className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}
        >
          <DataList<T>
            dataFeedType={feedType}
            onSelect={(item) => {
              debugLog.log(`🧾 DataList onSelect:`, item);
              manualEntryRef.current = false;
              validateHexInput(item.address);
            }}
          />
        </div>
      </div>
    </div>
  );
}
